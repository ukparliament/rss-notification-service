const aws = require('./helper.js'),
      crypto = require('crypto'),
      maxChunks = 25;

let params = { TableName: 'topics' };

const dynamodb = {
  tableExists() {
    return aws.describeTable(params).promise().catch((error) => { return false; });
  },
  /**
   * Delete the DynamoDB table
   * @return {Promise}
   */
  deleteTable() {
    const assigned = Object.assign({}, params);
    return aws.deleteTable(params).promise().then(() => aws.waitFor('tableNotExists', assigned));
  },
  /**
   * Creates and provisions the DynamoDB table with key schema
   * @return {Promise}
   */
  async setup() {
    const exists = await this.tableExists();
    if(exists) {
      return new Promise(resolve => { resolve(exists) });
    }

    const assigned = Object.assign({}, params);
    assigned.KeySchema = [
      {
        AttributeName: 'topic_id',
        KeyType: 'HASH'
      }
    ];
    assigned.AttributeDefinitions = [
      {
        AttributeName: 'topic_id',
        AttributeType: 'S'
      }
    ],
    assigned.StreamSpecification = {
      StreamEnabled: false
    },
    assigned.ProvisionedThroughput = {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1
    }

    return aws.createTable(assigned).promise().then(() => aws.waitFor('tableExists', assigned)).catch((error) => {
      console.log('Setup error', error);
    });
  },
  /**
   * Cleans up and formats array for DynamoDB population
   * @param  {array} feeds Array of feeds from the source ingesters
   * @return {array}       Array of feeds in the correct format for DynamoDB
   */
  formatArray(feeds) {
    return feeds.filter(item => item.rss_link).map(value => {
      const obj = {
        PutRequest: {
          Item: {
            topic_id: { S: crypto.createHash('md5').update(value.rss_link).digest('hex').substring(0, 8) }
          }
        }
      };

      for(const key in value) {
        obj.PutRequest.Item[key] = (value[key] ? { S: value[key].toString() } : { NULL: true });
      }

      return obj;
    });
  },
  /**
   * @param  {array} feeds An array of feeds to populate the DynamoDB table with
   * @return {Promise}
   */
  populate(feeds) {
    const params = { RequestItems: { topics: [] } };
    const promises = [];

    feeds = this.formatArray(feeds);

    const totalCalls = Math.ceil(feeds.length / maxChunks);

    for (let i = 0; i < totalCalls; i++) {
      const chunk = params;
      chunk.RequestItems.topics = feeds.slice(i * maxChunks, (i * maxChunks) + maxChunks);
      promises.push(aws.batchWriteItem(chunk).promise());
    }

    return Promise.all(promises);
  },
  topics: [],
  /**
   * @param  {object} lastScan An object returned by aws.scan - optional
   * @return {Promise} A Promise with result array of all of the items returned from DynamoDB
   */
  getAllTopics(lastScan) {
    this.topics = (lastScan && lastScan.Items) ? this.topics.concat(lastScan.Items) : [];

    const assigned = Object.assign({}, params);

    assigned.ExpressionAttributeValues = {
      ':a': {
        S: '0'
      }
    };
    assigned.FilterExpression = 'enabled <> :a';
    assigned.Limit = 100;

    if(lastScan !== undefined && lastScan.LastEvaluatedKey === undefined) {
      return new Promise((resolve) => {
        resolve(this.topics);
      });
    } else {
      assigned.ExclusiveStartKey = (lastScan && lastScan.LastEvaluatedKey) ? lastScan.LastEvaluatedKey : null;
      return aws.scan(assigned).promise().then((result) => this.getAllTopics(result));
    }
  },
  /**
   * Update topic based on topic_id
   * @param  {string} topic_id    topic_id from DynamoDB
   * @param  {string} updatedDate Date to update to
   * @return {Promise}
   */
  updateTopic(topic_id, updatedDate) {
    if(!topic_id) {
      throw new Error('No topicId present in updateTopic');
    }
    if(!updatedDate) {
      throw new Error('No updatedDate present in updateTopic');
    }

    const assigned = Object.assign({}, params);
    assigned.ExpressionAttributeNames = {
      '#LU': 'last_updated'
    };
    assigned.ExpressionAttributeValues = {
      ':lu': {
        S: updatedDate.toISOString()
      }
    };
    assigned.Key = {
      'topic_id': {
        S: topic_id
      }
    };
    assigned.ReturnValues = 'ALL_NEW';
    assigned.UpdateExpression = 'SET #LU = :lu';
    return aws.updateItem(assigned).promise();
  }
};

module.exports = dynamodb;

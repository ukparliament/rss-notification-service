const aws = require('./helper.js'),
      maxChunks = 25;

let params = { TableName: 'topics' };

const dynamodb = {
  /**
   * Delete the DynamoDB table
   * @return {Promise}
   */
  deleteTable() {
    return aws.deleteTable(params).promise();
  },
  /**
   * Creates and provisions the DynamoDB table with key schema
   * @return {Promise}
   */
  setup() {
    params.KeySchema = [
      {
        AttributeName: 'topic_id',
        KeyType: 'HASH'
      }
    ];
    params.AttributeDefinitions = [
      {
        AttributeName: 'topic_id',
        AttributeType: 'S'
      }
    ],
    params.StreamSpecification = {
      StreamEnabled: false
    },
    params.ProvisionedThroughput = {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1
    }

    return aws.createTable(params).promise();
  },
  /**
   * @param  {array} feeds An array of feeds to populate the DynamoDB table with
   * @return {Promise}
   */
  populate(feeds) {
    const params = { RequestItems: { topics: [] } };
    const promises = [];

    feeds = feeds.filter(item => item.rss_link).map(value => {
      const obj = {
        PutRequest: {
          Item: {
            topic_id: { S: value.rss_link }
          }
        }
      };

      for(const key in value) {
        obj.PutRequest.Item[key] = (value[key] ? { S: value[key].toString() } : { NULL: true });
      }

      return obj;
    });

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

    params.ExpressionAttributeValues = {
      ':a': {
        S: '0'
      }
    };
    params.FilterExpression = 'enabled <> :a';
    params.Limit = 100;

    if(typeof lastScan != 'undefined' && typeof lastScan.LastEvaluatedKey == 'undefined') {
      return new Promise((resolve) => {
        resolve(this.topics);
      });
    } else {
      params.ExclusiveStartKey = (lastScan && lastScan.LastEvaluatedKey) ? lastScan.LastEvaluatedKey : null;
      return aws.scan(params).promise().then((result) => this.getAllTopics(result));
    }
  }
};

module.exports = dynamodb;

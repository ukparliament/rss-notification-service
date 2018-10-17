const ddblocal = require('local-dynamo'),
      aws = require('./helper.js'),
      mockItems = require('../../mock/feeds.json');
      expected = require('./expected.json'),
      assert = require('chai').assert;

let dynamoInstance;
let db;

describe('DynamoDB', () => {

  const helper = {
    createTable() {
      let params = {
        TableName: 'Test',
        KeySchema: [ { AttributeName: 'TestAttr', KeyType: 'HASH' } ],
        AttributeDefinitions: [ { AttributeName: 'TestAttr', AttributeType: 'S' } ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1
        }
      };
      return db.createTable(params).promise().then(() => db.waitFor('tableExists', params));
    },
    deleteTable() {
      let params = {
        TableName: 'Test'
      };
      return db.deleteTable(params).promise().then(() => db.waitFor('tableNotExists', params));
    },
    addItems(items) {
      const params = {
        RequestItems: {
          Test: null
        }
      }

      params.RequestItems.Test = items.slice(0, 10).filter(item => item.rss_link).map(value => {
        const obj = {
          PutRequest: {
            Item: {
              TestAttr: { S: value.rss_link }
            }
          }
        };

        for(const key in value) {
          obj.PutRequest.Item[key] = (value[key] ? { S: value[key].toString() } : { NULL: true });
        }

        return obj;
      });

      return Promise.all([db.batchWriteItem(params).promise()]);
    },
    getItems() {
      const params = {
        TableName: 'Test',
        ExpressionAttributeValues: {
          ":a": {
            S: "0"
          }
        },
        FilterExpression: "enabled <> :a",
        Limit: 100
      };
      return db.scan(params).promise();
    }
  };

  before(() => {
    dynamoInstance = ddblocal.launch(null, 8000);
    db = aws;
  });

  after(() => {
    dynamoInstance.kill();
    db = null;
  });

  beforeEach(() => helper.createTable());

  afterEach(() => helper.deleteTable());

  describe('populates the DynamoDB table', () => {
    it('adds items from mock file', async () => {
      const result = await helper.addItems(mockItems);
      return assert.deepEqual(result, expected.addItems);
    });
  });

  describe('gets all topics', () => {
    it('returns items from the database', async () => {
      const add = await helper.addItems(mockItems);
      const result = await helper.getItems();
      return assert.deepEqual(result, expected.getItems);
    });
  });

});

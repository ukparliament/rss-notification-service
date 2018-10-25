const AWS = require('aws-sdk');
AWS.config.update({ region: 'local' });

module.exports = new AWS.DynamoDB({
  endpoint: new AWS.Endpoint('http://localhost:8000'),
  apiVersion: '2012-08-10',
  convertEmptyValues: true
});

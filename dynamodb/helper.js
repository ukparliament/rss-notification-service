const AWS = require('aws-sdk');
AWS.config.update({
  region: process.env.AWS_DYNAMODB_REGION || 'local'
});

module.exports = new AWS.DynamoDB({
  endpoint: new AWS.Endpoint(process.env.AWS_DYNAMODB_ENDPOINT || 'http://localhost:8000'),
  apiVersion: '2012-08-10',
  convertEmptyValues: true
});

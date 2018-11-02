const AWS = require('aws-sdk');
AWS.config.update({
  region: process.env.AWS_DYNAMODB_REGION || 'local',
  accessKeyId: process.env.AWS_ACCESS_ID || 'notARealAccessId',
  secretAccessKey: process.env.AWS_SECRET_KEY || 'notARealSecretKey'
});

module.exports = new AWS.DynamoDB({
  endpoint: new AWS.Endpoint(process.env.AWS_DYNAMODB_ENDPOINT || 'http://localhost:8000'),
  apiVersion: '2012-08-10',
  convertEmptyValues: true
});

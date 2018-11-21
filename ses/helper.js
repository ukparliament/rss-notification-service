const AWS = require('aws-sdk');
AWS.config.update({
  region: process.env.AWS_SES_REGION || 'local'
});

module.exports = new AWS.SES({
  endpoint: new AWS.Endpoint(process.env.AWS_SES_ENDPOINT || 'http://localhost:9001'),
  apiVersion: '2010-12-01'
});

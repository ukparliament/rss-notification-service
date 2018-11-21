const AWS = require('aws-sdk');
AWS.config.update({
  region: process.env.AWS_SES_REGION || 'local',
  accessKeyId: process.env.AWS_ACCESS_ID || 'notARealAccessId',
  secretAccessKey: process.env.AWS_SECRET_KEY || 'notARealSecretKey'
});

module.exports = new AWS.SES({
  endpoint: new AWS.Endpoint(process.env.AWS_SES_ENDPOINT || 'http://localhost:9001'),
  apiVersion: '2010-12-01'
});

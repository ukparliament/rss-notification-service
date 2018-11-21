const ddb = require('./dynamodb/dynamodb.js');
const poller = require('./poller/poller.js');
const bills = require('./sources/bills.js');
const committees = require('./sources/committees.js');
const healthcheck = require('./helpers/healthcheck.js');
const fs = require('fs');

function sleep() {
  return new Promise(resolve => {
    setTimeout(resolve, 300000);
  });
}

async function setup() {
  console.info('Setting up DynamoDB...');
  const setup = await ddb.setup();
  console.info('Retrieving all sources (public_bill, private_bill, committees)...');
  const sources = await Promise.all([
    bills.getAll('https://services.parliament.uk/Bills/AllPublicBills.rss', 'public_bill'),
    bills.getAll('https://services.parliament.uk/Bills/AllPrivateBills.rss', 'private_bill')
  ]);
  console.info('Populating DynamoDB...');
  await ddb.populate([].concat.apply([], sources));
}

async function start() {
  console.info('Retrieving all topics from DynamoDB...');
  const topics = await ddb.getAllTopics();
  console.info('Requesting feeds... this may take a few minutes');
  const request = await poller.requestFeeds(topics);
  console.info('Checking feeds... this may take a few minutes');
  const check = await poller.checkFeeds(request);
  console.info('Any changes?:', check);
  await sleep();
  return start();
}

setup().then(start);

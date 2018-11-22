const bills = require('./sources/bills.js'),
      committees = require('./sources/committees.js'),
      dynamodb = require('./dynamodb/dynamodb.js'),
      healthcheck = require('./helpers/healthcheck.js'),
      helpers = require('./helpers/helpers.js'),
      poller = require('./poller/poller.js');

async function setup() {
  console.info('Setting up DynamoDB...');
  await dynamodb.setup();
  console.info('Retrieving all sources (public_bill, private_bill, committees)...');
  const sources = await Promise.all([
    bills.getAll('https://services.parliament.uk/Bills/AllPublicBills.rss', 'public_bill'),
    bills.getAll('https://services.parliament.uk/Bills/AllPrivateBills.rss', 'private_bill'),
    committees.getBase('https://www.parliament.uk/business/committees/committees-a-z/').then((res) => committees.getRssFeeds(res)).then((res) => committees.getFeedInformation(res))
  ]);
  console.info('Populating DynamoDB...');
  await dynamodb.populate([].concat.apply([], sources));
  await helpers.sleep(1000); // Wait a second before continuing (connection cooldown)
}

async function start() {
  console.info('Retrieving all topics from DynamoDB...');
  const topics = await dynamodb.getAllTopics();
  console.info('Requesting feeds... this may take a few minutes');
  const request = await poller.requestFeeds(topics);
  console.info('Checking feeds... this may take a few minutes');
  const check = await poller.checkFeeds(request);
  console.info('Any changes?:', check);
  await helpers.sleep(600000);
  return start();
}

setup().then(start);

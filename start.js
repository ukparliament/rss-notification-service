const bills = require('./sources/bills.js'),
      committees = require('./sources/committees.js'),
      dynamodb = require('./dynamodb/dynamodb.js'),
      healthcheck = require('./helpers/healthcheck.js'),
      helpers = require('./helpers/helpers.js'),
      mailchimp = require('./mailchimp/mailchimp.js'),
      poller = require('./poller/poller.js'),
      ses = require('./ses/ses.js');

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
  const newTopics = await dynamodb.reconcile([].concat.apply([], sources));
  if(newTopics) {
    await dynamodb.populate(newTopics);
  }
  await helpers.sleep(1000); // Wait a second before continuing (connection cooldown)
}

function send(subscribers, changes) {
  const changed = ses.formatTemplateData(changes);

  for (let i = 0; i < changed.length; i++) {
    const recipients = mailchimp.filterUsers(subscribers, '12345678').map(r => r.email_address); // Todo after test: change to to changes[i].aeid
    ses.send({ changes: changed[i], recipients }).then(() => {
      dynamodb.updateTopic(changed[i].aeid, new Date());
    });
  }
}

async function start() {
  console.info('Retrieving all topics from DynamoDB...');
  const topics = await dynamodb.getAllTopics();
  console.info('Requesting feeds... this may take a few minutes');
  const request = await poller.requestFeeds(topics);
  console.info('Checking feeds... this may take a few minutes');
  const changes = await poller.checkFeeds(request);
  console.info('Any changes?:', changes);
  if(changes.length) {
    const subscribers = await mailchimp.getSubscribers();
    send(subscribers, changes);
  }
  await helpers.sleep(600000);
  return start();
}

setup().then(start);

const dynamodb    = require('./dynamodb/dynamodb.js'),
      healthcheck = require('./helpers/healthcheck.js'),
      helpers     = require('./helpers/helpers.js'),
      mailchimp   = require('./mailchimp/mailchimp.js'),
      poller      = require('./poller/poller.js'),
      ses         = require('./ses/ses.js'),
      sources     = require('./sources/sources.js');

async function setup() {
  console.info('Setting up DynamoDB...');
  await dynamodb.setup();
  const populate = await sources.getAll();
  console.info('Populating DynamoDB...');
  const newTopics = await dynamodb.reconcile([].concat.apply([], populate));
  if(newTopics) {
    await dynamodb.populate(newTopics);
  }
  await helpers.sleep(1000); // Wait a second before continuing (connection cooldown)
}

function send(subscribers, changes) {
  const changed = ses.formatTemplateData(changes);

  for (let i = 0; i < changed.length; i++) {
    const recipients = mailchimp.filterUsers(subscribers, changed[i].aeid).map(r => r.email_address);
    if(recipients.length) {
      ses.send({ changes: changed[i], recipients }).then((res) => {
        console.log('Result of email send:', JSON.stringify(res));
        dynamodb.updateTopic(changed[i].aeid, new Date());
      });
    }
  }
}

async function start() {
  console.info('Retrieving all topics from DynamoDB...');
  const topics = await dynamodb.getAllTopics();
  console.info('Requesting feeds... this may take a few minutes');
  const request = await poller.requestFeeds(topics);
  console.info('Checking feeds... this may take a few minutes');
  const changes = await poller.checkFeeds(request);
  if(changes.length) {
    console.log('Changes:');
    changes.forEach(val => {
      console.log(`${val.title} (${val.aeid}) has changed, with ${val.items.length} changes.`);
    });
    const subscribers = await mailchimp.getSubscribers();
    send(subscribers, changes);
  }
  await helpers.sleep(600000);
  return start();
}

setup().then(start);

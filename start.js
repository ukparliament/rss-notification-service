const dynamodb    = require('./dynamodb/dynamodb.js'),
      healthcheck = require('./helpers/healthcheck.js'),
      helpers     = require('./helpers/helpers.js'),
      mailchimp   = require('./mailchimp/mailchimp.js'),
      ses         = require('./ses/ses.js'),
      sources     = require('./sources/sources.js'),
      sesLimit    = 14;

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

async function send(subscribers, changes) {
  const changed = ses.formatTemplateData(changes);
  for (let i = 0; i < changed.length; i++) {
    const recipients = mailchimp.filterUsers(subscribers, changed[i].aeid).map(r => r.email_address);
    if(recipients.length) {
      ses.send({ changes: changed[i], recipients }).then(() => {
        console.log(`Result of email send: ${changed[i].title} updates successfully sent.`);
      });
    }
    dynamodb.updateTopic(changed[i].aeid, changed[i].last_updated);
    await helpers.sleep(Math.ceil((1/sesLimit)*1000));
  }
}

async function start() {
  console.info('Retrieving all topics from DynamoDB...');
  const topics = await dynamodb.getAllTopics();
  console.info('Checking feeds... this may take a few minutes');
  const request = await sources.checkFeeds(topics);
  const changes = request.filter(feed => feed ? feed.items.length : false);
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

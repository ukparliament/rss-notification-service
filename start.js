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
  await dynamodb.populate([].concat.apply([], sources));
  await helpers.sleep(1000); // Wait a second before continuing (connection cooldown)
}

function send(subscribers, changes) {
  for (let i = 0; i < changes.length; i++) {
    const recipients = mailchimp.filterUsers(subscribers, 'test'); // Todo after test: change to to changes[i].aeid
    const changeText = changes[i].items.map(r => {
      return `${r.title}\n${r.pubDate}\n${r.content}`;
    }).join('\n\n');

    const text = `
You are subscribed to ${changes[i].title} updates from Parliament.\n
${changeText}\n
Unsubscribe at https://email-subscriptions.parliament.uk\n
View our privacy policy at https://www.parliament.uk/site-information/data-protection/uk-parliament-email-privacy-policy/\n
Our address is: Houses of Parliament, Westminster, London, SW1A 0AA\n`

    return ses.send({
      html: text,
      text,
      subject: `There has been an updated to ${changes[i].title}`,
      recipients
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

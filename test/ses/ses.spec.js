const { assert } = require('chai'),
      sinon = require('sinon'),
      timekeeper = require('timekeeper'),
      aws = require('../../ses/ses.js'),
      expected = require('../fixtures/json/ses.json'),
      poller = require('../fixtures/json/poller.json'),
      helper = require('../../ses/helper.js'),
      mockItems = require('../fixtures/json/users.json');

describe('SES', () => {

  let sandbox;

  before(() => { timekeeper.freeze(new Date(2010, 0, 1)) });
  after(() => { timekeeper.reset() });

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    sandbox.stub(helper, 'sendMail').returns({
      resolve: async () => { return expected.messageId },
      catch: async () => { return expected.messageId }
    });
  })

  afterEach(async () => {
    sandbox = sandbox.restore();
  });

  describe('formats template data correctly', () => {
    it('returns a formatted object with keys title, aeid, items', () => {
      return assert.deepEqual(aws.formatTemplateData(poller.newArticles), expected.formattedTemplateData);
    });
  });

  describe('formats send options correctly', () => {
    it('returns a formatted object with keys html, text, subject', () => {
      return assert.deepEqual(aws.formatSendOptions(poller.newArticles[0]), expected.formattedSendOptions);
    });
  });

  describe('sends an email', () => {
    it('throws an error if no options are included', async () => {
      return assert.throws(() => aws.send(), 'Options missing');
    });

    it('throws an error if no recipients are included', async () => {
      return assert.throws(() => aws.send({}), 'recipients, changes missing from options');
    });

    it('sends an email correctly', async () => {
      const res = await aws.send({
        recipients: mockItems.users[0].members.map((val) => {
          return val.email_address;
        }),
        changes: [{
          title: 'test',
          items: [
            {
              'title': 'test'
            }
          ]
        }]
      });
      const hasAllKeys = res.every((item) => item.hasOwnProperty('MessageId'));

      // Want to check if it only includes a certain key regardless of value
      return assert.equal(hasAllKeys, true);
    });
  });

});

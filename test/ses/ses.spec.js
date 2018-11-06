const { assert } = require('chai'),
      sinon = require('sinon'),
      aws = require('../../ses/ses.js'),
      expected = require('../fixtures/json/ses.json'),
      helper = require('../../ses/helper.js'),
      mockItems = require('../fixtures/json/users.json');

describe('SES', () => {

  let sandbox;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    sandbox.stub(helper, 'sendEmail').returns({
      promise: () => { return expected.messageId }
    });
  })

  afterEach(async () => {
    sandbox = sandbox.restore();
  });

  describe('uses the correct config', () => {
    it('returns the correct API version', () => {
      return assert.equal(helper.config.apiVersion, '2010-12-01');
    });
  });

  describe('sends an email', () => {
    it('throws an error if no options are included', async () => {
      return assert.throws(() => aws.send(), 'Options missing');
    });

    it('throws an error if no recipients are included', async () => {
      return assert.throws(() => aws.send({}), 'html, text, subject, recipients missing from options');
    });

    it('sends an email correctly', async () => {
      const res = await aws.send({
        recipients: mockItems.users[0].members.map((val) => {
          return val.email_address;
        }),
        html: '<body>Hello</body>',
        text: 'Hello',
        subject: 'Test Email - SES'
      });
      const hasAllKeys = res.every((item) => item.hasOwnProperty('MessageId'));

      // Want to check if it only includes a certain key regardless of value
      return assert.equal(hasAllKeys, true);
    });
  });

});

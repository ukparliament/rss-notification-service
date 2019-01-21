const bills = require('../../sources/bills.js'),
      expected = require('../fixtures/json/sources.json'),
      fixtures = require('../utilities/fixtures.js'),
      rssParser = require('rss-parser'),
      parser = new rssParser({
        customFields: {
          item: [['a10:updated', 'updated']]
        }
      }),
      sinon = require('sinon'),
      { assert } = require('chai');

describe('Sources - Bills', () => {

  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(rssParser.prototype, 'parseURL').callsFake(args => {
      let fixture = fixtures.outputHtml('public_bills.rss');
      if(args.includes('AllPrivateBills')) {
        fixture = fixtures.outputHtml('private_bills.rss');
      }
      return parser.parseString(fixture);
    });
  });

  afterEach(() => {
    sandbox = sandbox.restore();
  });

  describe('getFeedsFromUrls', () => {
    it('returns an array of child nodes from master feeds in a flat array', async () => {
      const result = await bills.getFeedsFromUrls('public_bill');
      return assert.deepEqual(result, expected.public_bills);
    });
    it('returns an array of child nodes from master feeds in a flat array', async () => {
      const result = await bills.getFeedsFromUrls('private_bill');
      return assert.deepEqual(result, expected.private_bills);
    });
  });

  describe('getChildren', () => {
    it('returns an array of child nodes from the master public_bills feed, with correct type of "public_bill"', async () => {
      const result = await bills.getChildren('AllPublicBills', 'public_bill');
      return assert.deepEqual(result, expected.public_bills);
    });
    it('returns an array of child nodes from the master private_bills feed, with correct type of "private_bill"', async () => {
      const result = await bills.getChildren('AllPrivateBills', 'private_bill');
      return assert.deepEqual(result, expected.private_bills);
    });
  });

});

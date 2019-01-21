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
      let fixture = 'public_bills.rss';
      if(args.includes('AllPrivateBills')) {
        fixture = 'private_bills.rss';
      }
      if(args.includes('crimeoverseasproductionorders')) {
        fixture = 'single_bill_feed.rss';
      }
      if(args.includes('fail')) {
        return parser.parseString('fail');
      }
      return parser.parseString(fixtures.outputHtml(fixture));
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

  describe('checkForNewItems', () => {
    it('returns an object of a feed with >0 length in items (if there are new items)', async () => {
      const result = await bills.checkForNewItems(expected.single_feed);
      return assert.deepEqual(result, expected.bills_checkForNewItemsWithItems);
    });
    it('returns an object of a feed with 0 length in items (if there are no new items)', async () => {
      const feed = Object.assign({}, expected.single_feed);
      feed.last_updated = {
        S: new Date().toISOString()
      };
      const result = await bills.checkForNewItems(feed);
      return assert.deepEqual(result, expected.bills_checkForNewItemsWithoutItems);
    });
    it('returns an object of a feed with 0 length in items (if there is no last_updated date)', async () => {
      const feed = Object.assign({}, expected.single_feed);
      feed.last_updated = {};
      feed.rss_link = { S: 'crimeoverseasproductionorders' };
      const result = await bills.checkForNewItems(feed);
      return assert.deepEqual(result, expected.bills_checkForNewItemsWithoutItems);
    });
    it('returns nothing and console.logs an error if parseURL fails', async () => {
      const feed = Object.assign({}, expected.single_feed);
      feed.rss_link.S = 'fail';
      const spy = sandbox.spy(console, 'warn');
      await bills.checkForNewItems(feed);
      return sandbox.assert.calledOnce(spy);
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

  describe('isNewer', () => {
    it('correctly returns false if both dates are the same', () => {
      return assert.equal(bills.isNewer('2018-07-11T22:13:38Z', '2018-07-11T22:13:38Z'), false);
    });
    it('correctly returns false if both dates are the same, but the "master" date is in BST (as it\'s stripped)', () => {
      return assert.equal(bills.isNewer('2018-07-11T22:13:38+01:00', '2018-07-11T22:13:38Z'), false);
    });
    it('correctly returns false if both dates are the same, but the "singular" date is in BST (as it\'s stripped)', () => {
      return assert.equal(bills.isNewer('2018-07-11T22:13:38Z', '2018-07-11T22:13:38+01:00'), false);
    });
    it('correctly returns false if both dates are the same, in BST (as it\'s stripped)', () => {
      return assert.equal(bills.isNewer('2018-07-11T22:13:38+01:00', '2018-07-11T22:13:38+01:00'), false);
    });

    it('correctly returns false if master is newer than singular', () => {
      return assert.equal(bills.isNewer('2018-07-11T22:13:39Z', '2018-07-11T22:13:38Z'), false);
    });
    it('correctly returns false if master is newer than singular, even if master is BST', () => {
      return assert.equal(bills.isNewer('2018-07-11T22:13:39+01:00', '2018-07-11T22:13:38Z'), false);
    });
    it('correctly returns false if master is newer than singular, even if singular is BST', () => {
      return assert.equal(bills.isNewer('2018-07-11T22:13:39Z', '2018-07-11T22:13:38+01:00'), false);
    });
    it('correctly returns false if master is newer than singular, even if both are BST', () => {
      return assert.equal(bills.isNewer('2018-07-11T22:13:39+01:00', '2018-07-11T22:13:38+01:00'), false);
    });

    it('correctly returns true if singular is newer', () => {
      return assert.equal(bills.isNewer('2018-07-11T22:13:38Z', '2018-07-11T22:13:39Z'), true);
    });
    it('correctly returns true if singular is newer, but UTC, and master is in BST (as it\'s stripped)', () => {
      return assert.equal(bills.isNewer('2018-07-11T22:13:38+01:00', '2018-07-11T22:13:39Z'), true);
    });
    it('correctly returns true if singular is newer, if singular is in BST and master isn\'t (as it\'s stripped)', () => {
      return assert.equal(bills.isNewer('2018-07-11T22:13:38Z', '2018-07-11T22:13:39+01:00'), true);
    });
    it('correctly returns true if singular is newer, even if both dates are in BST (as it\'s stripped)', () => {
      return assert.equal(bills.isNewer('2018-07-11T22:13:38+01:00', '2018-07-11T22:13:39+01:00'), true);
    });

    it('correctly returns false if singular is in the future compared to new Date()', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return assert.equal(bills.isNewer('2018-07-11T22:13:38Z', tomorrow.toISOString()), false);
    });
  });

});

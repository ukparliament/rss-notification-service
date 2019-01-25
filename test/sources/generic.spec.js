const generic = require('../../sources/generic.js'),
      expected = require('../fixtures/json/sources.json'),
      fixtures = require('../utilities/fixtures.js'),
      rssParser = require('rss-parser'),
      parser = new rssParser({
        customFields: {
          item: [['a10:updated', 'updated']]
        }
      }),
      sinon = require('sinon'),
      timekeeper = require('timekeeper'),
      { assert } = require('chai');

describe('Sources - Generic', () => {

  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(rssParser.prototype, 'parseURL').callsFake((args) => {
      let fixture = fixtures.outputHtml('generic.rss');
      if(args.includes('fail')) {
        fixture = '';
      }
      return parser.parseString(fixture);
    });
  });

  afterEach(() => {
    sandbox = sandbox.restore();
  });

  describe('getFeedFromUrl', () => {
    it('returns an object of mapped key:values from a parsed feed', async () => {
      const result = await generic.getFeedFromUrl('test', 'debates');
      return assert.deepEqual(result, expected.generic_parsed);
    });
  });

  describe('checkForNewItems', () => {
    before(() => { timekeeper.freeze(new Date(2010, 0, 1)) });
    after(() => { timekeeper.reset() });

    it('returns an object of a feed with >0 length in items (if there are new items)', async () => {
      expected.single_feed.rss_link = { S: 'crimeoverseasproductionorders' };
      const result = await generic.checkForNewItems(expected.single_feed);
      return assert.deepEqual(result, expected.generic_checkForNewItemsWithItems);
    });
    it('returns an object of a feed with 0 length in items (if there are no new items)', async () => {
      const feed = Object.assign({}, expected.single_feed);
      feed.last_updated = { S: new Date(2099, 0, 1).toISOString() };
      feed.rss_link = { S: 'crimeoverseasproductionorders' };
      const result = await generic.checkForNewItems(feed);
      return assert.deepEqual(result, expected.generic_checkForNewItemsWithoutItems);
    });
    it('returns an object of a feed with 0 length in items (if there is no last_updated date)', async () => {
      const feed = Object.assign({}, expected.single_feed);
      feed.last_updated = {};
      feed.rss_link = { S: 'crimeoverseasproductionorders' };
      const result = await generic.checkForNewItems(feed);
      return assert.deepEqual(result, expected.generic_checkForNewItemsWithoutItems);
    });
    it('returns nothing and console.logs an error if parseURL fails', async () => {
      const feed = Object.assign({}, expected.single_feed);
      feed.rss_link.S = 'fail';
      const spy = sandbox.spy(console, 'warn');
      await generic.checkForNewItems(feed);
      return sandbox.assert.calledOnce(spy);
    });
  });

  describe('getFeedsFromUrls', () => {
    it('returns an array of child nodes from master feeds in a flat array', async () => {
      const result = await generic.getFeedsFromUrls('accountability');
      return assert.deepEqual(result, expected.generic_getFeedsFromUrls);
    });
  });

});

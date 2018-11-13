const { assert } = require('chai'),
      sinon = require('sinon'),
      rssParser = require('rss-parser'),
      poller = require('../../poller/poller.js'),
      fixtures = require('../helpers/fixtures.js'),
      expected = require('../fixtures/json/poller.json'),
      mockDdbItems = require('../fixtures/json/dynamodb.json'),
      helper = require('../helpers/static_feeds.js');

describe('Poller', () => {

  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(rssParser.prototype, 'parseURL').callsFake(rssParser.prototype.parseString);
    poller.cachedFeeds = mockDdbItems.getItemsTen;
  });

  afterEach(() => {
    sandbox = sandbox.restore();
    poller.cachedFeeds = [];
  });

  describe('cached feeds', () => {
    it('correctly returns a single feed matching a pathname', () => {
      const res = poller.getSingleCachedFeed('https://services.parliament.uk/Bills/RSS/crimeoverseasproductionorders.xml');
      return assert.deepEqual(res, expected.singleCachedFeed);
    });
    it('returns a single feed, case insensitive, matching a pathname', () => {
      const res = poller.getSingleCachedFeed('https://services.parliament.uk/Bills/RSS/crimeoverseasproductionorders.xml'.toUpperCase());
      return assert.deepEqual(res, expected.singleCachedFeed);
    });
    it('returns undefined if feed not found', () => {
      return assert.equal(poller.getSingleCachedFeed('http://notfound.com/'), undefined);
    });
    it('returns undefined if feed not found', () => {
      return assert.equal(poller.getSingleCachedFeed('http://notfound.com/boo.xml'), undefined);
    });
  });

  describe('parser', () => {
    it('correctly returns a parsed RSS feeds', async () => {
      const res = await poller.parse(fixtures.outputHtml('single_feed.rss'));
      return assert.deepEqual(res, expected.parsedFeed);
    });
    it('correctly outputs a non-blocking error (console.warn)', async () => {
      const spy = sandbox.spy(console, 'warn');
      const res = await poller.parse('');
      return sandbox.assert.calledOnce(spy);
    });
  });

  describe('requester', () => {
    it('correctly returns a Promise with all of the parsed feeds', async () => {
      const res = await poller.requestFeeds(helper.feeds);
      return assert.deepEqual(res, expected.requestedFeeds);
    });
    it('correctly skips feeds that don\'t have a suitable RSS link', async () => {
      const res = await poller.requestFeeds(helper.malformedFeeds);
      return assert.deepEqual(res, []);
    });
    it('correctly skips feeds that don\'t resolve', async () => {
      const spy = sandbox.spy(console, 'warn');
      const res = await poller.requestFeeds(helper.feedThatDoesntWork);
      return sandbox.assert.called(spy);
    })
  });

  describe('checker', () => {
    it('correctly returns an empty array if there are no new articles', async () => {
      sandbox.stub(poller, 'getSingleCachedFeed').callsFake(() => {
        expected.singleCachedFeed.last_updated.S = new Date();
        return expected.singleCachedFeed;
      });

      const requestFeeds = await poller.requestFeeds(helper.feeds);
      const res = await poller.checkFeeds(requestFeeds);
      return assert.deepEqual(res, []);
    });

    it('correctly returns an array with objects if there are new articles', async () => {
      sandbox.stub(poller, 'getSingleCachedFeed').callsFake(() => {
        expected.singleCachedFeed.last_updated.S = new Date().setFullYear(0);
        return expected.singleCachedFeed;
      });

      const requestFeeds = await poller.requestFeeds(helper.feeds);
      const res = await poller.checkFeeds(requestFeeds);
      return assert.deepEqual(res, expected.newArticles);
    });
  });

});

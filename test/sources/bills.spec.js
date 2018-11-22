const bills = require('../../sources/bills.js'),
      expected = require('../fixtures/json/sources.json'),
      fixtures = require('../utilities/fixtures.js'),
      rssParser = require('rss-parser'),
      sinon = require('sinon'),
      { assert } = require('chai');

describe('Sources - Bills', () => {

  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox = sandbox.restore();
  });

  describe('retrieves items from an RSS feed', () => {
    it('returns an array of bills with the correct type of "public_bill"', async () => {
      sandbox.stub(rssParser.prototype, 'parseURL').callsFake(rssParser.prototype.parseString);
      const result = await bills.getAll(fixtures.outputHtml('public_bills.rss'), 'public_bill');
      return assert.deepEqual(result, expected.public_bills);
    });

    it('returns an array of bills with the correct type of "private_bill"', async () => {
      sandbox.stub(rssParser.prototype, 'parseURL').callsFake(rssParser.prototype.parseString);
      const result = await bills.getAll(fixtures.outputHtml('private_bills.rss'), 'private_bill');
      return assert.deepEqual(result, expected.private_bills);
    });
  });

});

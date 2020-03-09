const sources = require('../../sources/sources.js'),
      expected = require('../fixtures/json/sources.json'),
      dynamodb = require('../fixtures/json/dynamodb.json'),
      fixtures = require('../utilities/fixtures.js'),
      rssParser = require('rss-parser'),
      parser = new rssParser({
        customFields: {
          item: [['a10:updated', 'updated']]
        }
      }),
      sinon = require('sinon'),
      { assert } = require('chai');

describe('Sources - Sources', () => {

  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(rssParser.prototype, 'parseURL').callsFake(args => {
      let fixture = fixtures.outputHtml('generic.rss');
      if(args.includes('AllPublicBills')) {
        fixture = fixtures.outputHtml('public_bills.rss');
      }
      if(args.includes('AllPrivateBills')) {
        fixture = fixtures.outputHtml('private_bills.rss');
      }
      return parser.parseString(fixture);
    });
  });

  afterEach(() => {
    sandbox = sandbox.restore();
  });

  // Committee screen scraping is broken. Disabled this prototype alert system.
  describe.skip('getAll', () => {
    it('returns a Promise of retrieved sources', async () => {
      delete sources.types.committees;
      const result = await sources.getAll();
      return assert.deepEqual(result, expected.sources_getAll);
    });
  });

  // Committee screen scraping is broken. Disabled this prototype alert system.
  describe.skip('checkFeeds', () => {
    it('returns a Promise of sources that have been checked', async () => {
      const result = await sources.checkFeeds(dynamodb.getItemsTen);
      return assert.deepEqual(result, expected.sources_checkFeeds);
    });
  });

});

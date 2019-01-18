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
      { assert } = require('chai');

describe('Sources - Generic', () => {

  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(rssParser.prototype, 'parseURL').callsFake(() => {
      let fixture = fixtures.outputHtml('generic.rss');
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

  describe('getFeedsFromUrls', () => {
    it('returns an array of child nodes from master feeds in a flat array', async () => {
      const result = await generic.getFeedsFromUrls('accountability');
      return assert.deepEqual(result, expected.generic_getFeedsFromUrls);
    });
    it('returns an array of child nodes from master feeds in a flat array', async () => {
      const result = await generic.getFeedsFromUrls('accountability');
      return assert.deepEqual(result, expected.generic_getFeedsFromUrls);
    });
  });

});

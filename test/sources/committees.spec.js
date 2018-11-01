const axios = require('axios'),
      committees = require('../../sources/committees.js'),
      expected = require('../fixtures/json/sources.json'),
      fixtures = require('../helpers/fixtures.js'),
      sinon = require('sinon'),
      { assert } = require('chai');

describe('Sources - Committees', () => {

  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox = sandbox.restore();
  });

  describe('retrieves correct committees from HTML page', () => {
    it('returns an array of committees', async () => {
      sandbox.stub(axios, 'get').returns(new Promise((resolve) => {
        resolve({ data: fixtures.outputHtml('committees-az.html') });
      }));

       const result = await committees.getBase();
       return assert.deepEqual(result, expected.committees);
    });
  });

  describe('retrieves cmsPageInstanceId from HTML page', () => {
    it('returns correct cmsPageInstanceId', async () => {
      sandbox.stub(axios, 'get').returns(new Promise((resolve) => {
        resolve({ data: fixtures.outputHtml('committee-with-cpi.html') });
      }));

      const result = await committees.getCmsPageInstanceId();
      return assert.equal(result, 25682);
    });

    it('returns an empty string if cmsPageInstanceId isn\'t present', async () => {
      sandbox.stub(axios, 'get').returns(new Promise((resolve) => {
        resolve({ data: fixtures.outputHtml('committee-without-cpi.html') });
      }));

      const result = await committees.getCmsPageInstanceId();
      return assert.equal(result, '');
    });

    it('returns empty string for if it fails to connect', async () => {
      const stub = sandbox.stub(axios, 'get');
      stub.returns(new Promise((resolve, reject) => {
        reject('reject');
      }));

      const result = await committees.getCmsPageInstanceId();
      return assert.equal(result, '');
    });
  });

  describe('retrieves RSS feeds', () => {
    it('returns RSS feeds for every item with a cmsPageInstanceId', async () => {
      const stub = sandbox.stub(axios, 'get');
      stub.onCall(10).returns(new Promise((resolve) => {
        resolve({ data: fixtures.outputHtml('committee-without-cpi.html') });
      }));
      stub.returns(new Promise((resolve) => {
        resolve({ data: fixtures.outputHtml('committee-with-cpi.html') });
      }));

      const result = await committees.getRssFeeds(expected.committees);
      return assert.deepEqual(result, expected.committees_with_rss);
    });
  });

});

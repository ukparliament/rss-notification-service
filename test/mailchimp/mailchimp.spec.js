const mailchimp = require('../../mailchimp/mailchimp.js'),
      expected = require('../fixtures/json/mailchimp.json'),
      mockItems = require('../fixtures/json/users.json'),
      mailchimpApi = require('mailchimp-api-v3'),
      { assert } = require('chai'),
      timekeeper = require('timekeeper'),
      sinon = require('sinon');

timekeeper.freeze(new Date());

describe('MailChimp', () => {

  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(mailchimpApi.prototype, 'get').callsFake(async (opt) => {
      if(opt === '/lists') {
        return expected.lists;
      }
      return expected.subscribers;
    });
    sandbox.stub(mailchimpApi.prototype, 'request').callsFake(async () => {
      return true;
    });
    sandbox.stub(mailchimpApi.prototype, 'batchWait').callsFake(async (opt) => {
      return expected.subscribers;
    });
  });

  afterEach(() => {
    sandbox = sandbox.restore();
  });

  describe('get subscribers', () => {
    it('gets subscribers from MailChimp if last_updated is null', async () => {
      const spy = sandbox.spy(mailchimp, 'getAllLists');
      const secondSpy = sandbox.spy(mailchimp, 'getAllSubscribers');
      const result = await mailchimp.getSubscribers();
      sandbox.assert.calledOnce(secondSpy);
      return sandbox.assert.calledOnce(spy);
    });
    it('gets subscribers from cache if last_updated is less than a day ago', async () => {
      mailchimp.setCachedUsers(['fake']);
      const spy = sandbox.spy(mailchimp, 'getAllLists');
      const result = await mailchimp.getSubscribers();
      return sandbox.assert.notCalled(spy);
    });
  });

  describe('gets all lists in an account', () => {
    it('returns an array of lists', async () => {
      const result = await mailchimp.getAllLists();
      return assert.deepEqual(result, expected.lists);
    });
  });

  describe('gets all subscribers in lists', () => {
    it('returns an array of subscribers', async () => {
      const result = await mailchimp.getAllSubscribers(expected.lists);
      return assert.deepEqual(result, expected.subscribers);
    });
  });

  describe('filters subscribers based on item ID', () => {
    it('returns an array of subscribers who are associated with an item ID', async () => {
      const result = await mailchimp.filterUsers(mockItems.users, '43');
      return assert.deepEqual(result, expected.filteredUsers);
    });

    it('throws an error if it can\'t find the "members" key', () => {
      return assert.throws(() => mailchimp.filterUsers(mockItems.malformedUsers, '43'), 'Malformed users in filterUsers');
    });

    it('throws an error if topicId is not present', () => {
      return assert.throws(() => mailchimp.filterUsers(mockItems.users), 'No topicId present');
    });
  });

  describe('correctly sets subscribers in cache', () => {
    it('sets subscribers in cache', () => {
      const result = mailchimp.setCachedUsers([ { email: 'fake@localhost' } ]);
      return assert.deepEqual(result, {'last_updated': new Date(), 'users': [{'email':'fake@localhost'}]} );
    });
  });

  describe('returns subscribers stored in cache', () => {
    it('returns subscribers from cache', () => {
      const cached = mailchimp.getCachedUsers();
      return assert.deepEqual(cached, {"last_updated": new Date() ,"users": [{"email":"fake@localhost"}]} );
    });
  });

});

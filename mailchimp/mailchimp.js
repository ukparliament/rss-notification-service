const MailChimp = require('mailchimp-api-v3'),
      MailInstance = new MailChimp(process.env.MC_API_KEY),
      limitPerRequest = 200;

const mailchimp = {
  cachedUsers: {
    last_updated: null,
    users: []
  },
  async getSubscribers() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    let subscribers = this.cachedUsers.users;

    if(this.cachedUsers.last_updated < yesterday) {
      const lists = await this.getAllLists();
      subscribers = await this.getAllSubscribers(lists);
      this.setCachedUsers(subscribers);
    }

    return subscribers;
  },
  getAllLists() {
    return MailInstance.get('/lists', { count: 50, fields: 'lists.id,lists.stats.member_count' });
  },
  getAllSubscribers(result) {
    const allLists = result.lists.filter(value => value.stats.member_count).map(value => ({
      path: `/lists/${value.id}/members`,
      total: value.stats.member_count
    }));
    const calls = [];

    for (let i = 0; i < allLists.length; i++) {
      const totalCalls = Math.ceil(allLists[i].total / limitPerRequest);
      for (let k = 0; k < totalCalls; k++) {
        calls.push({
          method: 'get',
          path: allLists[i].path,
          query: {
            count: limitPerRequest,
            offset: (k * limitPerRequest),
            status: 'subscribed',
            fields: 'members.email_address,members.merge_fields,members.email_type'
          }
        });
      }
    }

    return MailInstance.batch(calls, { interval: 5000, unpack: true });
  },
  filterUsers(users, topicId) {
    if(!topicId) {
      throw new Error('No topicId present in filterUsers');
    }
    if(topicId.length !== 8) {
      throw new Error('topicId not valid (required to be 8 characters)');
    }

    let masterList = [];

    for (let i = 0; i < users.length; i++) {
      if(users[i].members) {
        masterList = masterList.concat(users[i].members);
      } else {
        throw new Error('Malformed users in filterUsers');
      }
    }

    return masterList.filter(value => value.merge_fields && value.merge_fields.AEID).filter(value => value.merge_fields.AEID.split(',').includes(topicId.toString()));
  },
  setCachedUsers(users) {
    this.cachedUsers = {
      last_updated: new Date(),
      users
    };
    return this.cachedUsers;
  },
  getCachedUsers() {
    return this.cachedUsers;
  }
};

module.exports = mailchimp;

const path = require('path'),
      rssParser = require('rss-parser');

const parser = new rssParser({
  customFields: {
    item: [ ['a10:updated', 'updated'] ]
  }
});

const bills = {
  /**
   * Get all Bills from RSS feed
   * @param  {string} url  Can be either the AllPublicBills or AllPrivateBills feed URL
   * @param  {string} type Type of feed to label as
   * @return {Promise}
   */
  async getAll(url, type) {
    const parsed = await parser.parseURL(url);
    return parsed.items.map(val => ({
      description: val.content,
      enabled: 1,
      guid: val.guid,
      last_updated: val.updated,
      rss_link: `https://services.parliament.uk/Bills/RSS/${path.basename(val.guid, path.extname(val.guid))}.xml`,
      title: val.title,
      type
    }));
  }
};

module.exports = bills;

const path = require('path'),
      rssParser = require('rss-parser'),
      parser = new rssParser({
        customFields: {
          item: [['a10:updated', 'updated']]
        }
      });

const bills = {
  /**
   * Loop through an array of URLs and get child nodes as feeds
   * @param  {string} type Type label for feed
   * @return {array}       Flat array of feeds from getChildren
   */
  async getFeedsFromUrls(type) {
    const urls = require(`./urls/${type}.json`);
    const awaited = await Promise.all(
      urls.map(url => bills.getChildren(url, type))
    );
    return [].concat.apply([], awaited);
  },
  /**
   * Parse and map child nodes from a feed
   * @param  {string} url  Can be either the AllPublicBills or AllPrivateBills feed URL
   * @param  {string} type Type label for feed
   * @return {Promise}
   */
  async getChildren(url, type) {
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

const rssParser = require('rss-parser'),
      parser = new rssParser({
        customFields: {
          item: [['a10:updated', 'pubDate']]
        }
      });

const generic = {
  /**
   * Get feeds from an array of URLs
   * @param  {string}  type Type label for feed
   * @return {Promise}      Promise of resolved and mapped URLs
   */
  getFeedsFromUrls(type) {
    const urls = require(`./urls/${type}.json`);
    return Promise.all(
      urls.map(url => generic.getFeedFromUrl(url, type))
    );
  },
  /**
   * Parse and map feed from URL
   * @param  {string} url  Requestable URL of feed
   * @param  {type}   type Type label for feed
   * @return {object}      Mapped object of feed
   */
  async getFeedFromUrl(url, type) {
    const parsed = await parser.parseURL(url);
    return {
      description: parsed.description,
      enabled: 0,
      guid: parsed.link ? parsed.link : url,
      last_updated: generic.getNewestDate(parsed.items),
      rss_link: url,
      title: parsed.title,
      type
    };
  },
  /**
   * Returns newest date from a key of isoDate
   * @param  {array}  items Array of items with a key of isoDate
   * @return {string}       Returns date as a string
   */
  getNewestDate(items) {
    return items.map(item => item.isoDate).reduce((a, b) => (a > b) ? a : b) || null;
  }
};

module.exports = generic;

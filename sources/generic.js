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
   * Checks for new items in a feed
   * @param  {object} feed Feed object from DynamoDB
   * @return {object}      Parsed feed object, with items.length >0 if new items, or 0 if no new items
   */
  async checkForNewItems(feed) {
    try {
      const parsed = await parser.parseURL(feed.rss_link.S);

      if(Object.keys(feed.last_updated).includes('S')) {
        parsed.items = parsed.items.filter(item => item.isoDate > feed.last_updated.S);
      } else {
        parsed.items = [];
      }

      parsed.aeid = feed.topic_id.S;

      return parsed;
    }
    catch(e) {
      console.warn(`Failed to get feed: ${feed.rss_link.S} (${feed.topic_id.S})`);
    }
  },
  /**
   * Parse and map feed from URL
   * @param  {string} url  Requestable URL of feed
   * @param  {type}   type Type label for feed
   * @return {object}      Mapped object of feed
   */
  async getFeedFromUrl(url, type) {
    const parsed = await parser.parseURL(url);
    const last_updated = generic.getNewestDate(parsed.items);
    const enabled = last_updated ? 1 : 0;
    return {
      description: parsed.description,
      enabled,
      guid: parsed.link ? parsed.link : url,
      last_updated,
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

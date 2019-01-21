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
   * Checks for new items in a feed
   * @param  {object} feed Feed object from DynamoDB
   * @return {object}      Parsed feed object, with items.length >0 if new items, or 0 if no new items
   */
  async checkForNewItems(feed) {
    try {
      const parsed = await parser.parseURL(feed.rss_link.S);

      if(Object.keys(feed.last_updated).includes('S')) {
        parsed.items = parsed.items.filter(item => bills.isNewer(feed.last_updated.S, item.isoDate));
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
  },
  /**
   * Normalises dates due to inconsistencies in master and singular feeds, and returns whether there are newer articles
   * Caveat: If both Master and Singular dates hold timezone information (+01:00), then the inconsistency has been fixed
   *         hence the need to check if masterDate does, and singularDate doesn't, include +01:00 (and vice versa).
   *         At time of building, it is the Master feeds that hold timezone information, not Singular feeds.
   * @param  {string}  masterDate   Date string from the master feed
   * @param  {string}  singularDate Date string from the singular feed
   * @return {boolean}              True if singular date is newer, false if not or singularDate is in the future of current time
   */
  isNewer(masterDate, singularDate) {
    if(masterDate.includes('+01:00') && !singularDate.includes('+01:00')) {
      masterDate = masterDate.replace('+01:00', 'Z');
    }
    if(!masterDate.includes('+01:00') && singularDate.includes('+01:00')) {
      singularDate = singularDate.replace('+01:00', 'Z');
    }

    const singular = new Date(singularDate);
    const master = new Date(masterDate);

     // Return false if the singularDate is in the future (compared to new Date())
    if(singular > new Date()) {
      return false;
    }

    return (singular > master);
  }
};

module.exports = bills;

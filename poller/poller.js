const rssParser = require('rss-parser'),
      { URL } = require('url'),
      parser = new rssParser({ maxRedirects: 50 });

const poller = {
  cachedFeeds: [],
  /**
   * Gets a feed object from a list of feeds that are stored in this object
   * @param  {string} guid GUID to get information for
   * @return {object}      Object of feed information, or undefined if not found
   */
  getSingleCachedFeed(guid) {
    return this.cachedFeeds.find(val => val.guid.S.toLowerCase().endsWith(new URL(guid.toLowerCase()).pathname));
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
  },
  /**
   * Requests and parses feeds
   * @param  {string} feed URL for XML feed to parse
   * @return {Promise}
   */
  parse(feed) {
    return parser.parseURL(feed).catch(error => {
      console.warn(`Error for feed: ${feed}: "${error}", but carrying on...`);
      return error;
    });
  },
  /**
   * Sets object cache and filters out feeds without a rss_link, or are not enabled
   * @param  {array} feeds Array of feeds from DynamoDB
   * @return {Promise}
   */
  requestFeeds(feeds) {
    this.cachedFeeds = feeds;
    const mappedFeeds = feeds.filter(item => item.rss_link && item.rss_link.S && item.enabled && item.enabled.S).map((item) => this.parse(item.rss_link.S));
    return Promise.all(mappedFeeds);
  },
  /**
   * Checks feeds for new articles
   * @param  {array} feeds Array of parsed feeds
   * @return {array}       Array of parsed feeds, minus any that don't have new articles
   */
  checkFeeds(feeds) {
    return feeds.map(feed => {
      const cachedFeed = poller.getSingleCachedFeed(feed.link);
      feed.items = feed.items.filter(item => poller.isNewer(cachedFeed.last_updated.S, item.isoDate));
      feed.aeid = cachedFeed.topic_id.S;
      return feed;
    }).filter(feed => feed.items.length);
  }
};

module.exports = poller;

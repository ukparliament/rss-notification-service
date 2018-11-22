const rssParser = require('rss-parser'),
      { URL } = require('url'),
      parser = new rssParser({ maxRedirects: 50 }),
      interval = 600000; // 10 minutes in milliseconds

const poller = {
  cachedFeeds: [],
  /**
   * Gets a feed object from a list of feeds that are stored in this object
   * @param  {string} feedUrl feedURL to get information for
   * @return {object}         Object of feed information, or undefined if not found
   */
  getSingleCachedFeed(feedUrl) {
    return this.cachedFeeds.find(val => val.rss_link.S.toLowerCase().endsWith(new URL(feedUrl.toLowerCase()).pathname));
  },
  /**
   * Normalises dates due to inconsistencies in master and singular feeds, and returns whether there are newer articles
   * Caveat: If both Master and Singular dates hold timezone information (+01:00), then the inconsistency has been fixed
   *         hence the need to check if masterDate does, and singularDate doesn't, include +01:00 (and vice versa).
   * @param  {string}  masterDate   Date string from the master feed
   * @param  {string}  singularDate Date string from the singular feed
   * @return {boolean}              True if singular date is newer, false if not
   */
  isNewer(masterDate, singularDate) {
    if(masterDate.includes('+01:00') && !singularDate.includes('+01:00')) {
      masterDate = masterDate.replace('+01:00', 'Z');
    }
    if(!masterDate.includes('+01:00') && singularDate.includes('+01:00')) {
      singularDate = singularDate.replace('+01:00', 'Z');
    }

    return (new Date(singularDate) > new Date(masterDate));
  },
  /**
   * Requests and parses feeds
   * @param  {string} feed URL for XML feed to parse
   * @return {Promise}
   */
  parse(feed) {
    return parser.parseURL(feed).catch(error => {
      console.warn(`Error for feed: ${feed}: "${error}", but carrying on...`);
    });
  },
  /**
   * Sets object cache and filters out feeds without a rss_link, or are not enabled
   * @param  {array} feeds Array of feeds from DynamoDB
   * @return {Promise}
   */
  requestFeeds(feeds) {
    this.cachedFeeds = feeds;
    const mappedFeeds = feeds.filter(item => item.rss_link && item.rss_link.S && item.enabled && item.enabled.S).map((item) => {
      return this.parse(item.rss_link.S);
    });

    return Promise.all(mappedFeeds);
  },
  /**
   * Checks feeds for new articles
   * @param  {array} feeds Array of parsed feeds
   * @return {array}       Array of parsed feeds, minus any that don't have new articles
   */
  checkFeeds(feeds) {
    return feeds.map(feed => {
      const cachedDate = poller.getSingleCachedFeed(feed.feedUrl).last_updated.S;
      feed.items = feed.items.filter(item => poller.isNewer(cachedDate, item.isoDate));
      return feed;
    }).filter(feed => feed.items.length);
  }
};

module.exports = poller;

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
    const newArticles = feeds.map(feed => {
      const cachedDate = new Date(poller.getSingleCachedFeed(feed.feedUrl).last_updated.S);

      /*
        We have to normalise the cachedDate, as the singular feeds don't include timezones (i.e. outputs GMT for GMT+1), so we need to remove the extra difference from the cachedDate
       */
      const normalisedCachedDate = new Date(cachedDate.setMinutes(cachedDate.getMinutes() - cachedDate.getTimezoneOffset()));

      return {
        items: feed.items.filter(item => new Date(item.isoDate) > new Date(normalisedCachedDate)),
        title: `${feed.title} (${feed.feedUrl}) at ${feed.pubDate} (current server time: ${new Date()}`,
        feedUrl: feed.feedUrl,
        updated: feed.pubDate
      };
    }).filter(feed => feed.items.length);

    return newArticles;
  }
};

module.exports = poller;

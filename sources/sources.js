const bills      = require('./bills.js'),      
      committees = require('./committees.js'),
      generic    = require('./generic.js');

const sources = {
  types: {
    bills: ['private_bill', 'public_bill'],    
    generic: ['accountability', 'debates', 'news', 'research', 'generic_bill']
  },
  /**
   * Gets all sources from pre-defined types above
   * @return {Promise} Promise of all pre-defined source requests
   */
  async getAll() {
    console.info('Retrieving all sources (accountability, bills, committees, debates, news, research)...');
    const feeds = Object.keys(sources.types).map(type => sources.types[type].map(source => sources[type].getFeedsFromUrls(source)));
    return Promise.all([].concat.apply([], feeds));
  },
  /**
   * Requests feeds and returns a Promise with checked feeds
   * @param  {array}   feeds Array of feeds from DynamoDB
   * @return {Promise}
   */
  async checkFeeds(feeds) {
    return Promise.all(
      feeds.map(feed => {
        const type = Object.keys(sources.types).find(type => sources.types[type].includes(feed.type.S));
        return sources[type].checkForNewItems(feed);
      })
    );
  },
  generic,
  bills,
  committees
};

module.exports = sources;

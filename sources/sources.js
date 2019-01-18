const bills      = require('./bills.js'),
      committees = require('./committees.js'),
      generic    = require('./generic.js');

const sources = {
  types: {
    bills: ['private_bill', 'public_bill'],
    committees: ['committees'],
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
  generic,
  bills,
  committees
};

module.exports = sources;

const fixtures = require('./fixtures.js'),
      mockDdbItems = require('../fixtures/json/dynamodb.json').getItemsTen,
      sliced = mockDdbItems.slice(0, 2);

module.exports = {
  feeds: sliced.map(val => Object.assign({}, val, {
    rss_link: {
      S: fixtures.outputHtml('single_bill_feed.rss')
    }
  })),
  feedThatDoesntWork: sliced.map(val => Object.assign({}, val, {
    rss_link: {
      S: '<malformed>'
    }
  })),
  malformedFeeds: [
    {
      "rss_link": {
        "S": "http://"
      }
    },
    {
      "rss_link": {
        "S": null
      }
    },
    {
      "rss_link": null
    },
    {}
  ]
};

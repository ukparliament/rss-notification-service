const axios = require('axios'),
      cheerio = require('cheerio'),
      rssParser = require('rss-parser');

const parser = new rssParser({
  customFields: {
    item: [ ['a10:updated', 'updated'] ]
  }
});

const committees = {
  /**
   * Gets all feeds and supplementary required information for committees
   * @return {Promise}
   */
  getFeedsFromUrls() {
    return committees.getBase('https://www.parliament.uk/business/committees/committees-a-z/').then((res) => committees.getRssFeeds(res)).then((res) => committees.getFeedInformation(res));
  },
  /**
   * Get the base list of committees
   * @param  {string} url URL of the committees A-Z page
   * @return {Promise}
   */
  async getBase(url) {
    const response = await axios.get(url);

    const $ = cheerio.load(response.data);
    const committees = [];

    $('.a-to-z-listing .square-bullets-a-to-z li h3 a').each((item, element) => {
      const href = $(element).attr('href');
      const guid = href.includes('http') ? href : `https://www.parliament.uk${href}`;
      committees.push({
        description: null,
        enabled: 0,
        guid,
        last_updated: null,
        rss_link: null,
        title: $(element).text(),
        type: 'committee'
      });
    });

    return committees;
  },
  /**
   * Get RSS feeds for committees based on URLs
   * @param  {array}   committees Array of committees with key of `guid`
   * @return {Promise}
   */
  async getRssFeeds(committees) {
    for(const item in committees) {
      const rss_link = await this.getCmsPageInstanceId(committees[item].guid);
      committees[item].rss_link = rss_link ? `https://www.parliament.uk/g/rss/committee-feed/?type=Committee_Detail_Mixed&pageInstanceId=${rss_link}` : '';
    }

    return committees;
  },
  async getFeedInformation(committees) {
    for(const item in committees) {
      try {
        const rss_feed = await parser.parseURL(committees[item].rss_link);
        committees[item].description = rss_feed.description;
        committees[item].enabled = 1;
        committees[item].last_updated = rss_feed.items[0].isoDate;
      }
      catch(e) {
        console.warn(`Failed to get feed: ${committees[item].title} (${committees[item].rss_link}), (${e}), so it has been disabled, continuing...`);
        continue;
      }
    }
    return committees;
  },
  /**
   * Get CMS Page Instance ID (EpiServer) from URL
   * @param  {string} url URL string to get CMS Page Instance ID for
   * @return {Promise}
   */
  async getCmsPageInstanceId(url) {
    let cmsPageInstanceId = '';
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      cmsPageInstanceId = $('meta[name="search:cmsPageInstanceId"]').attr('content');
    }
    catch(e) {
      cmsPageInstanceId = '';
    }
    finally {
      cmsPageInstanceId = cmsPageInstanceId ? cmsPageInstanceId : '';
    }

    return cmsPageInstanceId;
  }
};

module.exports = committees;

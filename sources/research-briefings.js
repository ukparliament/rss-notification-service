const rssParser = require('rss-parser');

const parser = new rssParser();

const researchBriefings = {
  /**
   * Get feeds from researchbriefings domain
   * @param  {string} url Feed URL for Briefing papers
   * @return {Promise}
   */
  async get(url) {
    const parsed = await parser.parseURL(url);
    return {
      description: parsed.description,
      enabled: 1,
      guid: parsed.link,
      last_updated: parsed.lastBuildDate,
      rss_link: url,
      title: parsed.title,
      type: 'research_and_publications'
    }
  }
};

module.exports = researchBriefings;

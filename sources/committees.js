const axios = require('axios'),
      cheerio = require('cheerio');

const committees = {
  getBase() {
    return axios.get('https://www.parliament.uk/business/committees/committees-a-z/').then(async response => {
      const $ = cheerio.load(response.data);
      const allCommittees = [];

      $('.a-to-z-listing .square-bullets-a-to-z li h3 a').each((item, element) => {
        const href = $(element).attr('href');
        const guid = href.includes('http') ? href : `https://www.parliament.uk${href}`;
        allCommittees.push({
          description: null,
          enabled: 0,
          guid,
          last_updated: null,
          rss_link: null,
          title: $(element).text(),
          type: 'committee'
        });
      });

      for(let item in allCommittees) {
        let rss_link = await this.getCmsPageInstanceId(allCommittees[item].guid);
        if(rss_link) {
          rss_link = `https://www.parliament.uk/g/rss/committee-feed/?type=Committee_Detail_Mixed&pageInstanceId=${rss_link}`;
          allCommittees[item].rss_link = rss_link;
          allCommittees[item].enabled = 1;
        }
      }

      return allCommittees;
    });
  },
  getCmsPageInstanceId(url) {
    return new Promise((resolve, reject) => axios.get(url).then(response => {
      let $ = cheerio.load(response.data);
      resolve($('meta[name="search:cmsPageInstanceId"]').attr('content'));
    }).catch(error => {
      reject(error);
    }));
  },
  getAll() {
    return this.getBase();
  }
};

module.exports = committees;

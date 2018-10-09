const path = require('path'),
      rssParser = require('rss-parser');

const parser = new rssParser({
  customFields: {
    item: [ ['a10:updated', 'updated'] ]
  }
});

const privateBills = {
  getAll() {
    return parser.parseURL('https://services.parliament.uk/Bills/AllPrivateBills.rss').then(all => {
      let array = [];
      all.items.forEach(item => {
        array.push({
          description: item.content,
          enabled: 1,
          guid: item.guid,
          last_updated: item.updated,
          rss_link: `https://services.parliament.uk/Bills/RSS/${path.basename(item.guid, path.extname(item.guid))}.xml`,
          title: item.title,
          type: 'private_bill'
        });
      });
      return array;
    });
  }
};

module.exports = privateBills;

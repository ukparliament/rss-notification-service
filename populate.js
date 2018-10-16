const publicBills = require('./sources/public-bills.js');
const privateBills = require('./sources/private-bills.js');
const committees = require('./sources/committees.js');

const populate = {
  requestAll() {
    return Promise.all([publicBills.getAll(), privateBills.getAll(), committees.getAll()]);
  },
  getAll() {
    this.requestAll().then(function(feeds) {
      console.log('Feeds', feeds);
    }).catch(function(error) {
      console.log('error', error);
    });
  }
};

populate.getAll();

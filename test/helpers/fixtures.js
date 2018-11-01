const fs = require('fs');

module.exports = {
  outputHtml: function(fileName) {
    return fs.readFileSync(__dirname + '/../fixtures/html/' + fileName, 'utf8');
  }
};

const express = require('express'),
      app = express(),
      port = 119;

app.get('/', (req, res) => res.send('OK'));

module.exports = app.listen(port, () => console.log(`Healthcheck running on ${port}`));

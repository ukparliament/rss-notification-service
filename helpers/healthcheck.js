const express = require('express'),
      app = express(),
      port = 119;

app.get('/health-check', (req, res) => res.send('OK!'))
module.exports = app.listen(port, () => console.log(`Healthcheck listening on port ${port}!`))

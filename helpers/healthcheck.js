const express = require('express'),
      app = express(),
      port = 3000;

app.get('/', (req, res) => res.send('OK'))
app.listen(port, () => console.log(`Healthcheck running on ${port}`))

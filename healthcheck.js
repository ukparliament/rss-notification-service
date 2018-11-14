const fs = require('fs');

function healthcheck() {
  try {
    return process.kill(fs.readFileSync('healthcheck.txt', 'utf-8'), 0);
  }
  catch(e) {
    process.exitCode = 1;
    return e.code === 'EPERM';
  }
}

healthcheck();

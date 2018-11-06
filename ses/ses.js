const ses = require('./helper.js'),
      fromEmail = process.env.AWS_SES_FROM_EMAIL || 'noreply@localhost',
      maxChunks = (50 - 1), // This is 50 - 1, as all of the Destination k:v's are counted. Minus 1 for the 'to' address.
      sendingDefaults = {
        Source: fromEmail,
        Destination: {
          BccAddresses: [],
          ToAddresses: [fromEmail]
        },
        Message: {
          Body: {
            Html: {
              Charset: 'UTF-8',
              Data: null
            },
            Text: {
             Charset: 'UTF-8',
             Data: null
            }
          },
          Subject: {
            Charset: 'UTF-8',
            Data: null
          }
        }
      };

const emails = {
  /**
   * Send the email using SES
   * @param  {object} options Options for the email - including recipients, HTML, text, subject
   * @return {Promise}
   */
  send(options) {
    const required = ['html', 'text', 'subject', 'recipients'];

    if(!options) {
      throw new Error('Options missing');
    }

    for (let i = 0; i < required.length; i++) {
      if(options.hasOwnProperty(required[i]) && options[required[i]]) {
        required.splice(i);
      }
    }

    if(required.length) {
      throw new Error(`${required.join(', ').trim()} missing from options`);
    }

    const totalCalls = Math.ceil(options.recipients.length / maxChunks);
    const promises = [];

    for (let i = 0; i < totalCalls; i++) {
      const chunk = sendingDefaults;
      chunk.Destination.BccAddresses = options.recipients.slice(i * maxChunks, (i * maxChunks) + maxChunks);
      chunk.Message.Body.Html.Data = options.html;
      chunk.Message.Body.Text.Data = options.text;
      chunk.Message.Subject.Data = options.subject;
      promises.push(ses.sendEmail(chunk).promise());
    }

    return Promise.all(promises);
  }
};

module.exports = emails;

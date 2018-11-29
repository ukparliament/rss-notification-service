const fs = require('fs'),
      handlebars = require('handlebars'),
      ses = require('./helper.js'),
      templates = {
        html: handlebars.compile(fs.readFileSync('./ses/templates/template.html', 'utf-8')),
        text: handlebars.compile(fs.readFileSync('./ses/templates/template.txt', 'utf-8')),
        subject: handlebars.compile('There has been an update to {{ title }}')
      },
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
   * Format template data from an RSS feed for the SES template
   * @param  {object} rssFeed Object of an RSS feed
   * @return {object}         Formatted object for SES template
   */
  formatTemplateData(rssFeed) {
    return rssFeed.map(feed => ({
      title: feed.title,
      aeid: feed.aeid,
      items: feed.items.map(item => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        content: item.content
      }))
    }));
  },
  formatSendOptions(changes) {
    return {
      html: templates.html(changes),
      text: templates.text(changes),
      subject: templates.subject(changes)
    }
  },
  /**
   * Send the email using SES
   * @param  {object} options Options for the email - including recipients, HTML, text, subject
   * @return {Promise}
   */
  send(options) {
    const required = ['recipients', 'changes'];

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
      const sendingOptions = emails.formatSendOptions(options.changes);
      chunk.Destination.BccAddresses = options.recipients.slice(i * maxChunks, (i * maxChunks) + maxChunks);
      chunk.Message.Body.Html.Data = sendingOptions.html;
      chunk.Message.Body.Text.Data = sendingOptions.text;
      chunk.Message.Subject.Data = sendingOptions.subject;
      promises.push(ses.sendEmail(chunk).promise().catch((error) => { console.log('SES error', error) }));
    }

    return Promise.all(promises);
  }
};

module.exports = emails;

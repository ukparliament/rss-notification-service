const fs = require('fs'),
      handlebars = require('handlebars'),
      ses = require('./helper.js'),
      assetUrl = 'https://email-components.parliament.uk',
      templates = {
        html: handlebars.compile(fs.readFileSync('./ses/templates/template.html', 'utf-8')),
        text: handlebars.compile(fs.readFileSync('./ses/templates/template.txt', 'utf-8')),
        subject: handlebars.compile('There has been an update to {{ title }}')
      },
      fromEmail = process.env.AWS_SES_FROM_EMAIL || 'noreply@localhost',
      maxChunks = (50 - 1), // This is 50 - 1, as all of the Destination k:v's are counted. Minus 1 for the 'to' address.
      sendingDefaults = {
        from: fromEmail,
        to: [fromEmail],
        bcc: [],
        subject: '',
        text: '',
        html: ''
      };

const emails = {
  /**
   * Format an item date
   * @param  {string} date String from rssFeed item
   * @return {string}      Formatted string
   */
  formatTemplateDate(date) {
    date = new Date(date.replace('GMT', ''));
    const dayOpts = { weekday: 'long' };
    const dateOpts = { year: 'numeric', month: 'short', day: 'numeric' };
    const timeOpts = { hour: '2-digit', minute: '2-digit', hour12: true };
    return `${date.toLocaleString('en-GB', dayOpts)} ${date.toLocaleString('en-GB', dateOpts)} ${date.toLocaleString('en-GB', timeOpts).replace(' ', '').toLowerCase()}`;
  },
  /**
   * Format template data from an RSS feed for the SES template
   * @param  {object} rssFeed Object of an RSS feed
   * @return {object}         Formatted object for SES template
   */
  formatTemplateData(rssFeed) {
    return rssFeed.map(feed => ({
      title: feed.title,
      aeid: feed.aeid,
      last_updated: feed.last_updated || new Date().toISOString(),
      items: feed.items.map(item => ({
        title: item.title,
        link: item.link,
        pubDate: this.formatTemplateDate(item.pubDate),
        content: item.content,
        contentSnippet: item.contentSnippet
      }))
    }));
  },
  /**
   * Format options for SES to send the email
   * @param  {object} changes Object of a singular feeds changes
   * @return {object}         Formatted object
   */
  formatSendOptions(changes) {
    changes.assetUrl = assetUrl;
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

    const promises = [];
    const chunk = sendingDefaults;
    const sendingOptions = emails.formatSendOptions(options.changes);
    chunk.html = sendingOptions.html;
    chunk.subject = sendingOptions.subject;
    chunk.text = sendingOptions.text;

    while(options.recipients.length) {
      chunk.bcc = options.recipients.splice(0, maxChunks);
      promises.push(ses.sendMail(chunk).catch(error => {
        console.log(`Error with SES: ${error} for ${chunk.subject}`)
      }));
    }

    return Promise.all(promises);
  }
};

module.exports = emails;

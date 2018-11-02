# RSS Notification Service
The [RSS Notification Service][rns] is currently a prototype for polling data sets (RSS feeds), polling pre-defined web pages, and sending emails based on changes automatically.

[![License][shield-license]][info-license]

## Requirements
[RSS Notification Service][rns] requires the following:
* [NodeJS][node]
* [NPM][npm]
* [MailChimp][mailchimp] API key
* An [AWS][aws] account, specifically with [SES][ses] and [DynamoDB][ddb]

For local development, it is also useful to have:
* [DynamoDB local][ddbl]
* [DynamoDB admin][ddba]

## Setup
You will need to setup environment variables with your own details. The following are required:
```bash
export AWS_ACCESS_ID=
export AWS_SECRET_KEY=
export AWS_DYNAMODB_ENDPOINT=
export AWS_DYNAMODB_REGION=
export MC_API_KEY=
```

Defaults:
```AWS_ACCESS_ID: notARealAccessId
AWS_SECRET_KEY: notARealSecretKey
AWS_DYNAMODB_ENDPOINT: http://localhost:8000
AWS_DYNAMODB_REGION: local
```

`MC_API_KEY` does not have a default and the application will fail if it tries to connect to MailChimp without an API key present.

## Quick Start
```bash
git clone https://github.com/ukparliament/rss-notification-service.git
cd rss-notification-service
npm install && npm test
```

## Contributing
If you wish to submit a bug fix or feature, you can create a pull request and it will be merged pending a code review.

1. Fork the repository
1. Create your feature branch (`git checkout -b my-new-feature`)
1. Commit your changes (`git commit -am 'Add some feature'`)
1. Push to the branch (`git push origin my-new-feature`)
1. Ensure your changes are tested using [Mocha][mocha]
1. Create a new Pull Request

## License
[RSS Notification Service][rns] is licensed under the [MIT][info-license].

[rns]: https://github.com/ukparliament/rss-notification-service
[node]: https://nodejs.org/
[npm]: https://www.npmjs.com/
[aws]: https://aws.amazon.com/
[mailchimp]: https://mailchimp.com
[ses]: https://aws.amazon.com/ses/
[ddb]: https://aws.amazon.com/dynamodb/
[ddbl]: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html
[ddba]: https://github.com/aaronshaf/dynamodb-admin
[mocha]: https://mochajs.org/

[info-license]:   https://github.com/ukparliament/rss-notification-service/blob/master/LICENSE
[shield-license]: https://img.shields.io/badge/license-MIT-blue.svg

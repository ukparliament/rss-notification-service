# RSS Notification Service
The [RSS Notification Service][rns] is currently a prototype for polling data sets (RSS feeds), polling pre-defined web pages, and sending emails based on changes automatically.

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
export AWS_DYNAMODB_ENDPOINT=
export AWS_DYNAMODB_REGION=
export MC_API_KEY=
```

Defaults:
`AWS_DYNAMODB_ENDPOINT`: `http://localhost:8000`
`AWS_DYNAMODB_REGION`: `local`

`MC_API_KEY` does not have a default and the application will fail if it tries to connect to MailChimp without an API key present.

## Quick Start
```bash
git clone https://github.com/ukparliament/rss-notification-service.git
cd rss-notification-service
npm install && npm test
```

[rns]: https://github.com/ukparliament/rss-notification-service
[node]: https://nodejs.org/
[npm]: https://www.npmjs.com/
[aws]: https://aws.amazon.com/
[mailchimp]: https://mailchimp.com
[ses]: https://aws.amazon.com/ses/
[ddb]: https://aws.amazon.com/dynamodb/
[ddbl]: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html
[ddba]: https://github.com/aaronshaf/dynamodb-admin

FROM 12-jdk-alpine

ARG MC_API_KEY
ARG AWS_DYNAMODB_ENDPOINT
ARG AWS_DYNAMODB_REGION
ARG AWS_SES_ENDPOINT
ARG AWS_SES_REGION
ARG AWS_SES_FROM_EMAIL

WORKDIR /rss-notification-service

ADD . /rss-notification-service

ENV MC_API_KEY $MC_API_KEY
ENV AWS_DYNAMODB_ENDPOINT $AWS_DYNAMODB_ENDPOINT
ENV AWS_DYNAMODB_REGION $AWS_DYNAMODB_REGION
ENV AWS_SES_ENDPOINT $AWS_SES_ENDPOINT
ENV AWS_SES_REGION $AWS_SES_REGION
ENV AWS_SES_FROM_EMAIL $AWS_SES_FROM_EMAIL

RUN apk update && apk add nodejs

RUN npm install
RUN npm test

CMD [ "npm", "start" ]
# Stargazer

## Overview

Stargazer listens to Github webhooks for new star events on a repo and then sends a message to a slack channel with the repo with the following information:

1. The github username of the user that starred it
2. The repo that was starred
3. The total number of stars that the repo has

## Deployment

We've deployed Stargazer as a lamdba function on AWS behind an API gateway but you can use any hosting platform you'd like. Depending on where you'd like to deploy Stargazer you may need to mount it on a webserver such as Express.

## Flow

![stargazer-flow](https://assets.nucleuscloud.com/stargazer-flow.png)

1. Github sends a webhook with the event payload to an endpoint you specify when you configure the Github Webhook. Since we deployed Stargazer on AWS Lambda behind an API Gateway, we use the API gateway as our endpoint. You can listen for multiple events but this repo only listens for star events. Github has a whole list of events you can listen to [here](https://docs.github.com/en/webhooks/webhook-events-and-payloads).

2. The API gateway then routes the webhook to the AWS lambda where it verifies the signature and then conditionally makes a call to the slack API based on the eventType. If you want to listen to more event types, you'd probably want to add them here. _Note_: Github signs the payload using an HMAC SHA256 secret that you provide when you configure the Github webhook. This repo handles verifying the signature within the AWS Lambda function but depending on your deployment you may want to do that somewhere else.

3. The Slack API then calls the Stargazer bot in the channel and then posts the message to the channel.

## Environment Variables

There are just a few environment variables:

1. MY_SECRET_TOKEN -> this is the secret you create and give to Github the sign the payload and use to verifiy the signature. You can create a new secret using openssl, like so:

```bash
openssl rand -hex 20
```

2. SLACK_CHANNEL -> this is the Slack channel id that you want to post the message in
3. BEARER_TOKEN -> this is Slack bot user oauth token that you use to authenticate with the slack api.

import axios from "axios";
import crypto from "crypto";

export async function handler(event) {
  const MY_SECRET_TOKEN = process.env.MY_SECRET_TOKEN;

  const signature = event.headers["X-Hub-Signature-256"];
  const payload = JSON.stringify(event.body);

  if (!verifySignature(MY_SECRET_TOKEN, signature, payload)) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: "Invalid signature ",
      }),
    };
  }

  try {
    const githubEvent = JSON.parse(event.body);

    if (githubEvent.action === "created") {
      const slackMessage = {
        channel: process.env.SLACK_CHANNEL,
        text: `New star for the repository! 🌟 Total stars: ${githubEvent.repository.stargazers_count}`,
        blocks: [
          {
            type: "rich_text",
            elements: [
              {
                type: "rich_text_section",
                elements: [
                  {
                    type: "emoji",
                    name: "star",
                  },
                  {
                    type: "text",
                    text: "  Woohoo, we have a new star!  ",
                    style: {
                      bold: true,
                    },
                  },
                  {
                    type: "emoji",
                    name: "star",
                  },
                ],
              },
            ],
          },
          {
            type: "rich_text",
            elements: [
              {
                type: "rich_text_list",
                style: "bullet",
                elements: [
                  {
                    type: "rich_text_section",
                    elements: [
                      {
                        type: "text",
                        text: `repo:  ${githubEvent.repository.full_name}`,
                      },
                    ],
                  },
                  {
                    type: "rich_text_section",
                    elements: [
                      {
                        type: "text",
                        text: `user: ${githubEvent.sender.login}`,
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "rich_text",
            elements: [
              {
                type: "rich_text_section",
                elements: [
                  {
                    type: "text",
                    text: `Total stars: ${githubEvent.repository.stargazers_count}`,
                  },
                ],
              },
            ],
          },
        ],
      };

      const BEARER_TOKEN = process.env.BEARER_TOKEN;

      // Await the axios call to ensure it completes before the function returns
      const response = await axios.post(
        "https://slack.com/api/chat.postMessage",
        slackMessage,
        {
          headers: {
            Authorization: `Bearer ${BEARER_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Message posted successfully!", response.data);
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Event processed for repo: " + githubEvent.repository.name,
        }),
      };
    } else {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "No new star event" }),
      };
    }
  } catch (error) {
    console.log("Error making Slack call:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "An error occurred: " + error.message }),
    };
  }
}

let encoder = new TextEncoder();

async function verifySignature(secret, header, payload) {
  let parts = header.split("=");
  let sigHex = parts[1];

  let algorithm = { name: "HMAC", hash: { name: "SHA-256" } };

  let keyBytes = encoder.encode(secret);
  let extractable = false;
  let key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    algorithm,
    extractable,
    ["sign", "verify"]
  );

  let sigBytes = hexToBytes(sigHex);
  let dataBytes = encoder.encode(payload);
  let equal = await crypto.subtle.verify(
    algorithm.name,
    key,
    sigBytes,
    dataBytes
  );

  return equal;
}

function hexToBytes(hex) {
  let len = hex.length / 2;
  let bytes = new Uint8Array(len);

  let index = 0;
  for (let i = 0; i < hex.length; i += 2) {
    let c = hex.slice(i, i + 2);
    let b = parseInt(c, 16);
    bytes[index] = b;
    index += 1;
  }

  return bytes;
}

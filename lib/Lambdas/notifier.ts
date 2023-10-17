import type { Handler, Context, SNSEvent } from "aws-lambda";

const url = ""; // Paste your URL here
if (!url) throw new Error("No Slack URL present!");

export const handler: Handler = async (event: SNSEvent, _context: Context) => {
  console.log(JSON.stringify(event, null, 2));

  const record = JSON.parse(event.Records[0].Sns.Message);
  const functionName = record.Trigger.Dimensions[0].value;
  const alarmDescription = record.AlarmDescription;
  const time = record.StateChangeTime;

  const alarmArn = record.AlarmArn;
  const region = alarmArn.split(":")[3];

  const cloudwatchLink = `https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#logsV2:log-groups/log-group/$252Faws$252Flambda$252F${functionName}`;

  const data = {
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `:exclamation::exclamation::exclamation:*Lambda error*:exclamation::exclamation::exclamation:\n${functionName}`
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `${alarmDescription}`
        }
      },
      {
        "type": "section",
        "fields": [
          {
            "type": "mrkdwn",
            "text": `*Time*\n${time}`
          },
          {
            "type": "mrkdwn",
            "text": `*Region*\n${region}`
          }
        ]
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `<${cloudwatchLink}|CloudWatch logs>`
        },
      },
    ]
  }

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data)
  })

  return {
    result: "Done!",
  }
};

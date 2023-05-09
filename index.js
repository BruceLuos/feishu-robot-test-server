const express = require("express");
const bodyParser = require("body-parser");
const rp = require("request-promise");
require('dotenv').config();
const app = express();
const port = 8080;

// 飞书 Webhook URL
const feishuWebhookUrl =
  process.env.FESHU_WEHOOK_URL

app.use(bodyParser.json());

// 监听 GitLab Webhook 请求
app.post("/", async (req, res) => {
  try {
    const gitlabPayload = req.body;
    console.log(gitlabPayload);

    let feishuPayloadCard = {
      msg_type: "interactive",
      card: {
        elements: [
          {
            tag: "div",
            text: {
              content: `${gitlabPayload.user.name}提出了${gitlabPayload.repository.name}仓库下${gitlabPayload.object_attributes.source_branch}到${gitlabPayload.object_attributes.target_branch}下的合并请求(${gitlabPayload.object_attributes.title})`,
              tag: "lark_md",
            },
          },
          {
            actions: [
              {
                tag: "button",
                text: {
                  content: "点击查看",
                  tag: "lark_md",
                },
                url: gitlabPayload.object_attributes.url,
                type: "primary",
                value: {},
              },
            ],
            tag: "action",
          },
        ],
        header: {
          title: {
            content: "有一个新的合并请求",
            tag: "plain_text",
          },
        },
      },
    };
    // 当前合并请求已完成
    if(gitlabPayload.object_attributes.state === "merged") {
      feishuPayloadCard = {
        msg_type: "interactive",
        card: {
          elements: [
            {
              tag: "div",
              text: {
                content: `${gitlabPayload.user.name}提出的${gitlabPayload.repository.name}仓库下${gitlabPayload.object_attributes.source_branch}到${gitlabPayload.object_attributes.target_branch}下的合并请求(${gitlabPayload.object_attributes.title})已完成`,
                tag: "lark_md",
              },
            },
            {
              actions: [
                {
                  tag: "button",
                  text: {
                    content: "点击查看",
                    tag: "lark_md",
                  },
                  url: gitlabPayload.object_attributes.url,
                  type: "primary",
                  value: {},
                },
              ],
              tag: "action",
            },
          ],
          header: {
            title: {
              content: "合并已完成",
              tag: "plain_text",
            },
          },
        },
      };
    }

    const feishuRes = await sendRequest(feishuWebhookUrl, feishuPayloadCard);
    console.log(`statusCode: ${feishuRes.statusCode}`, feishuRes);

    res.sendStatus(200);
  } catch (error) {
    console.error("error", error);
    res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

async function sendRequest(feishuWebhookUrl, feishuPayload) {
  const options = {
    method: "POST",
    uri: feishuWebhookUrl,
    body: feishuPayload,
    json: true, // Automatically stringifies the body to JSON
  };

  const result = await rp(options);
  return result;
}

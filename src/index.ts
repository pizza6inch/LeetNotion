const axios = require("axios");
const { Client } = require("@notionhq/client");
const { Webhook, MessageBuilder } = require("discord-webhook-node");

import { resolve } from "path";
import { config } from "dotenv";

config({ path: resolve(__dirname, "../.env") });

const discordWebhook = new Webhook(process.env.DISCORD_WEBHOOK_URL);
const notion = new Client({ auth: process.env.NOTION_KEY });

type Problem = {
  questionTitle: string;
  questionLink: string;
  date: string;
  difficulty: string;
  questionFrontendId: string;
  question: string;
  exampleTestcases: string;
};

type Users = Array<{
  id: string;
  name: string;
  type: string;
  avatar_url: string;
}>;

async function sendNotification(problem: Problem, image: string, questionLine: string) {
  const message = `${questionLine}
  ${problem.date} - ${problem.questionLink}
  筆記: https://www.notion.so/19d4e41b35918080be99ead031517d6e?v=19d4e41b359180539c39000c92a594ff
  `;

  await discordWebhook.success(message);

  const embed = new MessageBuilder().setImage(image);
  // .addField(message);
  discordWebhook.send(embed);
}

async function createNotionPage(problem: Problem, users: Users) {
  const usersContent = users.flatMap((user) => [
    {
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [
          {
            type: "text",
            text: {
              content: `${user.name}的解法：`,
            },
          },
        ],
      },
    },
    {
      object: "block",
      type: "code",
      code: {
        language: "c++",
        rich_text: [
          {
            type: "text",
            text: {
              content: "put your code here",
            },
          },
        ],
      },
    },
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          {
            type: "text",
            text: {
              content: "筆記：",
            },
          },
        ],
      },
    },
  ]);

  const data = {
    parent: {
      type: "database_id",
      database_id: process.env.NOTION_DATABASE_ID,
    },
    properties: {
      Solution: {
        title: [
          {
            text: {
              content: problem.questionTitle,
            },
          },
        ],
      },
      "Problem URL": {
        type: "rich_text",
        rich_text: [
          {
            type: "text",
            text: {
              content: problem.questionFrontendId,
              link: {
                url: problem.questionLink,
              },
            },
          },
        ],
      },
      Difficulty: {
        select: {
          name: problem.difficulty,
        },
      },
      Date: {
        date: {
          start: problem.date,
        },
      },
    },
    children: [
      {
        object: "block",
        type: "heading_1",
        heading_1: {
          rich_text: [
            {
              type: "text",
              text: {
                content: problem.questionTitle,
              },
            },
          ],
        },
      },
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [
            {
              type: "text",
              text: {
                content: `NO.${problem.questionFrontendId} ${problem.difficulty}`,
              },
            },
          ],
        },
      },
      ...usersContent,
    ],
  };

  const result = await notion.pages.create(data);
  console.log(result);
}

async function fetchNotionUsers() {
  const response = await notion.users.list();
  const results: Users = response.results;

  return results.filter((user) => user.type === "person");
}

const fetchDailyProblem = async () => {
  try {
    const response = await axios.get("https://alfa-leetcode-api.onrender.com/daily");
    // const response = await axios.get("http://localhost:3000/daily");
    const problem = response.data as Problem;
    return problem;
  } catch (error) {
    console.error("error fetching leetcode problem:", error);
  }
};

const fetchMyGoPicture = async () => {
  const lines = ["來吧", "就讓", "收入實在是太少了", "幹嘛", "叫醒", "只會騙人", "不要!", "不要不要"];
  const questionLines = [
    "刷一下題OK吧",
    "阿是要刷了沒",
    "多刷題賺大錢!",
    "ㄟㄟ",
    "還敢睡ㄚ",
    "說好的要一起刷題呢?",
    "不刷題會變笨喔",
    "刷一下題OK吧",
  ];
  // random選取lines
  const randomIndex = Math.floor(Math.random() * lines.length);
  const randomLine = lines[randomIndex];
  console.log(encodeURIComponent(randomLine));

  try {
    const response = await axios.get(
      `https://lb-api.tomorin.cc/public-api/ave-search?keyword=${encodeURIComponent(randomLine)}`
    );
    const picture = response.data.data[0];
    console.log(picture);

    return {
      image: `https://lb-api.tomorin.cc/public-api/ave-frames?episode=${picture.episode}&frame_start=${picture.frame_start}&frame_end=${picture.frame_end}`,
      questionLine: questionLines[randomIndex],
    };
  } catch (error) {
    console.error("error fetching my go picture:", error);
    return {
      image: "https://lb-api.tomorin.cc/public-api/ave-frames?episode=1&frame_start=25108&frame_end=25108",
      questionLine: "圖片抓不到",
    };
  }
};

const main = async () => {
  const problem = await fetchDailyProblem();

  const users = await fetchNotionUsers();
  if (problem && users) {
    createNotionPage(problem, users);

    const { image, questionLine } = await fetchMyGoPicture();
    sendNotification(problem, image, questionLine);
  }
};

main();

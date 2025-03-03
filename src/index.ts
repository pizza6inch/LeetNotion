const axios = require("axios");
const { Client } = require("@notionhq/client");
const parseHtmlToNotionBlocks = require("html-to-notion");

import { resolve } from "path";
import { config } from "dotenv";

config({ path: resolve(__dirname, "../.env") });

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

type Users = {
  id: string;
  name: string;
  type: string;
  avatar_url: string;
};

async function createNotionPage(problem: Problem) {
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
                content: "hello world",
              },
            },
          ],
        },
      },
    ],
  };

  const result = await notion.pages.create(data);
  console.log(result);
}

async function fetchNotionUsers() {
  const response = await notion.users.list();
  const results = response.results;
  return results;
}

const fetchDailyProblem = async () => {
  try {
    // const response = await axios.get("https://alfa-leetcode-api.onrender.com/daily");
    const response = await axios.get("http://localhost:3000/daily");
    const problem = response.data as Problem;
    return problem;
  } catch (error) {
    console.error("error fetching leetcode problem:", error);
  }
};

const main = async () => {
  const problem = await fetchDailyProblem();

  // const text = parseHtmlToNotionBlocks.default(problem?.question);

  // const richText = text.map((item: { paragraph: { text: string[] | undefined; rich_text: string[] | undefined } }) => {
  //   item.paragraph.rich_text = item.paragraph.text;
  //   item.paragraph.text = undefined;
  //   return item;
  // });

  // console.log(JSON.stringify(richText));
  const users = fetchNotionUsers();
  // if (problem) createNotionPage(problem);
};

main();

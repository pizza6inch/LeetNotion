import axios from "axios";

const fetchDailyProblem = async () => {
  try {
    const response = await axios.get("https://alfa-leetcode-api.onrender.com/daily");
    console.log(response.data);
  } catch (error) {
    console.error("error fetching leetcode problem:", error);
  }
};

// fetchDailyProblem();

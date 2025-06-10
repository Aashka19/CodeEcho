const axios = require("axios");

async function fetchQuestions() {
  const response = await axios.get(
    "https://api.stackexchange.com/2.3/questions",
    {
      params: {
        order: "desc",
        sort: "activity",
        tagged: "microsoft-teams",
        site: "stackoverflow",
        pagesize: 10
      }
    }
  );

  return response.data.items.map(q => ({
    source: "stackoverflow",
    content: q.title,
    url: q.link
  }));
}

module.exports = { fetchQuestions };
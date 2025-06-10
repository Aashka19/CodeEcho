const axios = require("axios");

async function fetchIssues() {
  const response = await axios.get(
    "https://api.github.com/repos/MicrosoftDocs/msteams-docs/issues",
    {
      headers: { "User-Agent": "community-insights-app" },
      params: { per_page: 10 }
    }
  );

  return response.data.map(issue => ({
    source: "github",
    content: `${issue.title}\n${issue.body}`,
    url: issue.html_url
  }));
}

module.exports = { fetchIssues };
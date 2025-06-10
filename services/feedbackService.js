const githubService = require("./githubService");
const stackOverflowService = require("./stackOverflowService");
const aiService = require("./aiService");

let feedbackStorage = [];

async function ingestFeedback(source) {
  let data = [];
  if (source === "github") {
    data = await githubService.fetchIssues();
  } else if (source === "stackoverflow") {
    data = await stackOverflowService.fetchQuestions();
  } else {
    throw new Error("Invalid source. Use 'github' or 'stackoverflow'.");
  }
  feedbackStorage.push(...data);
  return { count: data.length, source };
}

async function analyzeFeedback() {
  for (let item of feedbackStorage) {
    if (!item.painPoints) {
      const analysis = await aiService.extractPainPoints(item.content);
      item.painPoints = analysis.painPoints;
      item.area = analysis.area;
    }
  }
  return feedbackStorage;
}

function getFeedback() {
  return feedbackStorage;
}

module.exports = { ingestFeedback, analyzeFeedback, getFeedback };
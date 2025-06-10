const express = require("express");
const router = express.Router();
const { ingestFeedback, analyzeFeedback, getFeedback } = require("../services/feedbackService");

router.get("/ingest", async (req, res) => {
  const { source } = req.query;
  try {
    const result = await ingestFeedback(source);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/analyze", async (req, res) => {
  try {
    const result = await analyzeFeedback();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", (req, res) => {
  const data = getFeedback();
  res.json(data);
});

module.exports = router;
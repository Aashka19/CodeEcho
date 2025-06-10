function promptTemplate(content) {
  return `Extract pain points and suggest a general area from the feedback below:\n\nFeedback: "${content}"\n\nOutput format:\n- Pain Point(s): ...\n- Area: ...`;
}

async function extractPainPoints(content) {
  // Mock AI response for local testing
  if (content.toLowerCase().includes("auth") || content.toLowerCase().includes("oauth")) {
    return {
      painPoints: ["Authentication failure", "OAuth complexity"],
      area: "Authentication"
    };
  } else if (content.toLowerCase().includes("bot")) {
    return {
      painPoints: ["Bot framework confusion"],
      area: "Bot SDK"
    };
  } else {
    return {
      painPoints: ["Unclear error message"],
      area: "General"
    };
  }
}

module.exports = { extractPainPoints };
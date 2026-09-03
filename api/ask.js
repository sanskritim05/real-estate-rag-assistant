const { answerWithGroq } = require("./ask-handler");

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ detail: "Method not allowed" });
    return;
  }

  const result = await answerWithGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL,
    question: req.body?.question,
    chunks: req.body?.chunks,
  });

  res.status(result.status).json(result.body);
};

module.exports.config = {
  maxDuration: 60,
};

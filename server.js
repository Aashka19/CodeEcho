const express = require("express");
const feedbackRoutes = require("./routes/feedback");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/feedback", feedbackRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
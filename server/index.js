const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const usersRouter = require("./routes/users");
const { requireAuth } = require("./routes/users");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const db = require("./config/database");

// Routes
app.use("/api/teams", require("./routes/teams"));
app.use("/api/users", usersRouter);
app.use("/api/skills", require("./routes/skills"));
app.use("/api/capabilities", require("./routes/capabilities"));
app.use("/api/team-members", require("./routes/teamMembers"));
app.use("/api/availability", require("./routes/availability"));
app.use("/api/hierarchy", require("./routes/hierarchy"));
app.use("/api/changes", require("./routes/changes"));
app.use("/api/audit", require("./routes/audit"));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;

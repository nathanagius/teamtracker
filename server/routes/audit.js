const express = require("express");
const router = express.Router();
const db = require("../config/database");

// Get all audit logs
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        al.*,
        u.first_name,
        u.last_name,
        u.email
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.timestamp DESC
      LIMIT 1000
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

// Get audit logs by table
router.get("/table/:tableName", async (req, res) => {
  try {
    const { tableName } = req.params;

    const result = await db.query(
      `
      SELECT 
        al.*,
        u.first_name,
        u.last_name,
        u.email
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.table_name = $1
      ORDER BY al.timestamp DESC
      LIMIT 500
    `,
      [tableName]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch audit logs by table" });
  }
});

// Get audit logs by record ID
router.get("/record/:tableName/:recordId", async (req, res) => {
  try {
    const { tableName, recordId } = req.params;

    const result = await db.query(
      `
      SELECT 
        al.*,
        u.first_name,
        u.last_name,
        u.email
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.table_name = $1 AND al.record_id = $2
      ORDER BY al.timestamp DESC
    `,
      [tableName, recordId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch audit logs by record" });
  }
});

// Get audit logs by user
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await db.query(
      `
      SELECT 
        al.*,
        u.first_name,
        u.last_name,
        u.email
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.user_id = $1
      ORDER BY al.timestamp DESC
      LIMIT 500
    `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch audit logs by user" });
  }
});

// Get audit logs by date range
router.get("/date-range", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start date and end date are required" });
    }

    const result = await db.query(
      `
      SELECT 
        al.*,
        u.first_name,
        u.last_name,
        u.email
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.timestamp >= $1 AND al.timestamp <= $2
      ORDER BY al.timestamp DESC
    `,
      [startDate, endDate]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch audit logs by date range" });
  }
});

// Get audit summary statistics
router.get("/summary", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        table_name,
        action,
        COUNT(*) as count,
        MIN(timestamp) as first_action,
        MAX(timestamp) as last_action
      FROM audit_log
      GROUP BY table_name, action
      ORDER BY table_name, action
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch audit summary" });
  }
});

// Get recent audit activity
router.get("/recent", async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const result = await db.query(
      `
      SELECT 
        al.*,
        u.first_name,
        u.last_name,
        u.email
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.timestamp DESC
      LIMIT $1
    `,
      [parseInt(limit)]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch recent audit activity" });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { body, validationResult } = require("express-validator");

// Get all availability records
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        ua.*,
        u.first_name,
        u.last_name,
        u.email,
        t.name as team_name
      FROM user_availability ua
      JOIN users u ON ua.user_id = u.id
      LEFT JOIN team_members tm ON u.id = tm.user_id AND tm.is_active = true
      LEFT JOIN teams t ON tm.team_id = t.id
      ORDER BY ua.start_date DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch availability records" });
  }
});

// Get availability by user ID
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await db.query(
      `
      SELECT * FROM user_availability 
      WHERE user_id = $1 
      ORDER BY start_date DESC
    `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user availability" });
  }
});

// Get current availability by user ID
router.get("/user/:userId/current", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await db.query(
      `
      SELECT * FROM user_availability 
      WHERE user_id = $1 
      ORDER BY start_date DESC 
      LIMIT 1
    `,
      [userId]
    );

    res.json(result.rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch current availability" });
  }
});

// Create availability record
router.post(
  "/",
  [
    body("user_id").isUUID(),
    body("status").isIn(["available", "busy", "unavailable", "on_leave"]),
    body("start_date").isISO8601(),
    body("end_date").optional().isISO8601(),
    body("notes").optional().trim().escape(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { user_id, status, start_date, end_date, notes } = req.body;

      const result = await db.query(
        `
      INSERT INTO user_availability (user_id, status, start_date, end_date, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
        [user_id, status, start_date, end_date, notes]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create availability record" });
    }
  }
);

// Update availability record
router.put(
  "/:id",
  [
    body("status")
      .optional()
      .isIn(["available", "busy", "unavailable", "on_leave"]),
    body("start_date").optional().isISO8601(),
    body("end_date").optional().isISO8601(),
    body("notes").optional().trim().escape(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { status, start_date, end_date, notes } = req.body;

      const result = await db.query(
        `
      UPDATE user_availability 
      SET status = COALESCE($1, status),
          start_date = COALESCE($2, start_date),
          end_date = COALESCE($3, end_date),
          notes = COALESCE($4, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `,
        [status, start_date, end_date, notes, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Availability record not found" });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update availability record" });
    }
  }
);

// Delete availability record
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `
      DELETE FROM user_availability WHERE id = $1 RETURNING *
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Availability record not found" });
    }

    res.json({ message: "Availability record deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete availability record" });
  }
});

// Get team availability summary
router.get("/team/:teamId/summary", async (req, res) => {
  try {
    const { teamId } = req.params;

    const result = await db.query(
      `
      SELECT 
        ua.status,
        COUNT(*) as count
      FROM user_availability ua
      JOIN team_members tm ON ua.user_id = tm.user_id
      WHERE tm.team_id = $1 
        AND tm.is_active = true
        AND (ua.end_date IS NULL OR ua.end_date >= CURRENT_DATE)
      GROUP BY ua.status
    `,
      [teamId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to fetch team availability summary" });
  }
});

module.exports = router;

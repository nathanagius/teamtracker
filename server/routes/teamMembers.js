const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { body, validationResult } = require("express-validator");

// Get all team members
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        tm.*,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        t.name as team_name
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      JOIN teams t ON tm.team_id = t.id
      WHERE tm.is_active = true
      ORDER BY t.name, u.last_name, u.first_name
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch team members" });
  }
});

// Get team members by team ID
router.get("/team/:teamId", async (req, res) => {
  try {
    const { teamId } = req.params;

    const result = await db.query(
      `
      SELECT 
        tm.*,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.workday_id,
        ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as skills
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      LEFT JOIN user_skills us ON u.id = us.user_id
      LEFT JOIN skills s ON us.skill_id = s.id
      WHERE tm.team_id = $1 AND tm.is_active = true
      GROUP BY tm.id, u.id
      ORDER BY u.last_name, u.first_name
    `,
      [teamId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch team members" });
  }
});

// Add member to team
router.post(
  "/",
  [
    body("team_id").isUUID(),
    body("user_id").isUUID(),
    body("start_date").isISO8601(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { team_id, user_id, start_date } = req.body;

      // Check if user is already active in another team
      const existingMembership = await db.query(
        `
      SELECT * FROM team_members 
      WHERE user_id = $1 AND is_active = true
    `,
        [user_id]
      );

      if (existingMembership.rows.length > 0) {
        return res.status(400).json({
          error: "User is already a member of another team",
        });
      }

      // Check if team and user exist
      const teamExists = await db.query("SELECT id FROM teams WHERE id = $1", [
        team_id,
      ]);
      const userExists = await db.query("SELECT id FROM users WHERE id = $1", [
        user_id,
      ]);

      if (teamExists.rows.length === 0) {
        return res.status(404).json({ error: "Team not found" });
      }

      if (userExists.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const result = await db.query(
        `
      INSERT INTO team_members (team_id, user_id, start_date)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
        [team_id, user_id, start_date]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      if (err.code === "23505") {
        // Unique violation
        res
          .status(400)
          .json({ error: "User is already a member of this team" });
      } else {
        res.status(500).json({ error: "Failed to add member to team" });
      }
    }
  }
);

// Remove member from team
router.put("/:id/remove", [body("end_date").isISO8601()], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { end_date } = req.body;

    const result = await db.query(
      `
      UPDATE team_members 
      SET end_date = $1, is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND is_active = true
      RETURNING *
    `,
      [end_date, id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Active team membership not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove member from team" });
  }
});

// Move member between teams
router.put(
  "/:id/move",
  [body("new_team_id").isUUID(), body("move_date").isISO8601()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { new_team_id, move_date } = req.body;

      // Start transaction
      await db.query("BEGIN");

      try {
        // End current team membership
        const endResult = await db.query(
          `
        UPDATE team_members 
        SET end_date = $1, is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND is_active = true
        RETURNING *
      `,
          [move_date, id]
        );

        if (endResult.rows.length === 0) {
          throw new Error("Active team membership not found");
        }

        const userId = endResult.rows[0].user_id;

        // Check if new team exists
        const teamExists = await db.query(
          "SELECT id FROM teams WHERE id = $1",
          [new_team_id]
        );
        if (teamExists.rows.length === 0) {
          throw new Error("New team not found");
        }

        // Create new team membership
        const newMembershipResult = await db.query(
          `
        INSERT INTO team_members (team_id, user_id, start_date)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
          [new_team_id, userId, move_date]
        );

        await db.query("COMMIT");

        res.json({
          message: "Member moved successfully",
          old_membership: endResult.rows[0],
          new_membership: newMembershipResult.rows[0],
        });
      } catch (err) {
        await db.query("ROLLBACK");
        throw err;
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message || "Failed to move member" });
    }
  }
);

// Get member history
router.get("/user/:userId/history", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await db.query(
      `
      SELECT 
        tm.*,
        t.name as team_name,
        t.description as team_description
      FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE tm.user_id = $1
      ORDER BY tm.start_date DESC
    `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch member history" });
  }
});

// Get team member statistics
router.get("/team/:teamId/stats", async (req, res) => {
  try {
    const { teamId } = req.params;

    const result = await db.query(
      `
      SELECT 
        COUNT(*) as total_members,
        COUNT(CASE WHEN u.role = 'Engineering Manager' THEN 1 END) as managers,
        COUNT(CASE WHEN u.role = 'Technical Product Owner' THEN 1 END) as product_owners,
        COUNT(CASE WHEN u.role = 'Engineer' THEN 1 END) as engineers,
        AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.hire_date))) as avg_tenure_years
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = $1 AND tm.is_active = true
    `,
      [teamId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch team statistics" });
  }
});

module.exports = router;

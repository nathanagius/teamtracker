const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { body, validationResult } = require("express-validator");
const axios = require('axios');

// Get all users
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        u.*,
        t.name as current_team,
        ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as skills
      FROM users u
      LEFT JOIN team_members tm ON u.id = tm.user_id AND tm.is_active = true
      LEFT JOIN teams t ON tm.team_id = t.id
      LEFT JOIN user_skills us ON u.id = us.user_id
      LEFT JOIN skills s ON us.skill_id = s.id
      GROUP BY u.id, t.name
      ORDER BY u.last_name, u.first_name
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get user by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const userResult = await db.query(
      `
      SELECT * FROM users WHERE id = $1
    `,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    // Get user's team history
    const teamHistoryResult = await db.query(
      `
      SELECT 
        t.name as team_name,
        tm.start_date,
        tm.end_date,
        tm.is_active
      FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE tm.user_id = $1
      ORDER BY tm.start_date DESC
    `,
      [id]
    );

    // Get user's skills
    const skillsResult = await db.query(
      `
      SELECT 
        s.*,
        us.proficiency_level,
        us.years_experience
      FROM user_skills us
      JOIN skills s ON us.skill_id = s.id
      WHERE us.user_id = $1
      ORDER BY s.name
    `,
      [id]
    );

    // Get user's availability
    const availabilityResult = await db.query(
      `
      SELECT * FROM user_availability 
      WHERE user_id = $1 
      ORDER BY start_date DESC 
      LIMIT 1
    `,
      [id]
    );

    res.json({
      ...user,
      team_history: teamHistoryResult.rows,
      skills: skillsResult.rows,
      availability: availabilityResult.rows[0] || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Create new user
router.post(
  "/",
  [
    body("first_name").notEmpty().trim().escape(),
    body("last_name").notEmpty().trim().escape(),
    body("email").isEmail().normalizeEmail(),
    body("role").isIn([
      "Engineering Manager",
      "Technical Product Owner",
      "Engineer",
    ]),
    body("workday_id").optional().trim(),
    body("hire_date").optional().isISO8601(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { first_name, last_name, email, role, workday_id, hire_date } =
        req.body;

      const result = await db.query(
        `
      INSERT INTO users (first_name, last_name, email, role, workday_id, hire_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
        [first_name, last_name, email, role, workday_id, hire_date]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      if (err.code === "23505") {
        // Unique violation
        res.status(400).json({ error: "Email or Workday ID already exists" });
      } else {
        res.status(500).json({ error: "Failed to create user" });
      }
    }
  }
);

// Update user
router.put(
  "/:id",
  [
    body("first_name").optional().trim().escape(),
    body("last_name").optional().trim().escape(),
    body("email").optional().isEmail().normalizeEmail(),
    body("role")
      .optional()
      .isIn(["Engineering Manager", "Technical Product Owner", "Engineer"]),
    body("workday_id").optional().trim(),
    body("hire_date").optional().isISO8601(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { first_name, last_name, email, role, workday_id, hire_date } =
        req.body;

      const result = await db.query(
        `
      UPDATE users 
      SET first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          email = COALESCE($3, email),
          role = COALESCE($4, role),
          workday_id = COALESCE($5, workday_id),
          hire_date = COALESCE($6, hire_date),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `,
        [first_name, last_name, email, role, workday_id, hire_date, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update user" });
    }
  }
);

// Delete user
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has active team memberships
    const teamMembershipResult = await db.query(
      `
      SELECT COUNT(*) FROM team_members 
      WHERE user_id = $1 AND is_active = true
    `,
      [id]
    );

    if (parseInt(teamMembershipResult.rows[0].count) > 0) {
      return res.status(400).json({
        error: "Cannot delete user with active team memberships",
      });
    }

    const result = await db.query(
      `
      DELETE FROM users WHERE id = $1 RETURNING *
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Get users by role
router.get("/role/:role", async (req, res) => {
  try {
    const { role } = req.params;

    const result = await db.query(
      `
      SELECT 
        u.*,
        t.name as current_team
      FROM users u
      LEFT JOIN team_members tm ON u.id = tm.user_id AND tm.is_active = true
      LEFT JOIN teams t ON tm.team_id = t.id
      WHERE u.role = $1
      ORDER BY u.last_name, u.first_name
    `,
      [role]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users by role" });
  }
});

// Search users
router.get("/search/:query", async (req, res) => {
  try {
    const { query } = req.params;
    const searchTerm = `%${query}%`;

    const result = await db.query(
      `
      SELECT 
        u.*,
        t.name as current_team
      FROM users u
      LEFT JOIN team_members tm ON u.id = tm.user_id AND tm.is_active = true
      LEFT JOIN teams t ON tm.team_id = t.id
      WHERE u.first_name ILIKE $1 
         OR u.last_name ILIKE $1 
         OR u.email ILIKE $1
         OR u.workday_id ILIKE $1
      ORDER BY u.last_name, u.first_name
    `,
      [searchTerm]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to search users" });
  }
});

module.exports = router;

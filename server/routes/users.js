const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// RBAC middleware
function requireRole(...roles) {
  return (req, res, next) => {
    // Assume req.user is set by auth middleware (to be implemented)
    if (!req.user || !roles.includes(req.user.app_role)) {
      return res
        .status(403)
        .json({ error: "Forbidden: insufficient permissions" });
    }
    next();
  };
}

// Auth middleware: set req.user from JWT
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
const axios = require("axios");

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
    body("hire_date").isISO8601(),
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

// Assign app_role to a user (super admin only)
router.put(
  "/:id/role",
  requireRole("super_admin"),
  [body("app_role").isIn(["super_admin", "team_lead", "member", "read_only"])],
  async (req, res) => {
    const { id } = req.params;
    const { app_role } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const result = await db.query(
        `UPDATE users SET app_role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
        [app_role, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update user role" });
    }
  }
);

// Assign a team lead to a team (super admin only)
router.put(
  "/assign-lead",
  requireRole("super_admin"),
  [body("team_id").notEmpty(), body("user_id").notEmpty()],
  async (req, res) => {
    const { team_id, user_id } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      // Set the lead_id on the team
      const result = await db.query(
        `UPDATE teams SET lead_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
        [user_id, team_id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Team not found" });
      }
      // Optionally, set the user's app_role to team_lead
      await db.query(`UPDATE users SET app_role = 'team_lead' WHERE id = $1`, [
        user_id,
      ]);
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to assign team lead" });
    }
  }
);

// Login endpoint
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }
  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const user = result.rows[0];

    // Allow any password - skip password verification
    // const valid = await bcrypt.compare(password, user.password_hash);
    // if (!valid) {
    //   return res.status(401).json({ error: "Invalid credentials" });
    // }

    // Issue JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        app_role: user.app_role,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      JWT_SECRET,
      { expiresIn: "12h" }
    );
    res.json({ token, user: { ...user, password_hash: undefined } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Register/set password endpoint (super admin only)
router.post(
  "/:id/set-password",
  requireAuth,
  requireRole("super_admin"),
  [body("password").isLength({ min: 6 })],
  async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const hash = await bcrypt.hash(password, 10);
      const result = await db.query(
        `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
        [hash, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ message: "Password set" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to set password" });
    }
  }
);

// Export RBAC middleware for use in other routes
module.exports = router;
module.exports.requireRole = requireRole;
module.exports.requireAuth = requireAuth;

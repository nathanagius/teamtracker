const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { body, validationResult } = require("express-validator");

// Get all skills
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        s.*,
        COUNT(us.user_id) as user_count
      FROM skills s
      LEFT JOIN user_skills us ON s.id = us.skill_id
      GROUP BY s.id
      ORDER BY s.name
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch skills" });
  }
});

// Get skill by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const skillResult = await db.query(
      `
      SELECT * FROM skills WHERE id = $1
    `,
      [id]
    );

    if (skillResult.rows.length === 0) {
      return res.status(404).json({ error: "Skill not found" });
    }

    const skill = skillResult.rows[0];

    // Get users with this skill
    const usersResult = await db.query(
      `
      SELECT 
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        us.proficiency_level,
        us.years_experience,
        t.name as team_name
      FROM user_skills us
      JOIN users u ON us.user_id = u.id
      LEFT JOIN team_members tm ON u.id = tm.user_id AND tm.is_active = true
      LEFT JOIN teams t ON tm.team_id = t.id
      WHERE us.skill_id = $1
      ORDER BY us.proficiency_level DESC, u.last_name
    `,
      [id]
    );

    res.json({
      ...skill,
      users: usersResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch skill" });
  }
});

// Create new skill
router.post(
  "/",
  [
    body("name").notEmpty().trim().escape(),
    body("category").optional().trim().escape(),
    body("description").optional().trim().escape(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, category, description } = req.body;

      const result = await db.query(
        `
      INSERT INTO skills (name, category, description)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
        [name, category, description]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      if (err.code === "23505") {
        // Unique violation
        res.status(400).json({ error: "Skill name already exists" });
      } else {
        res.status(500).json({ error: "Failed to create skill" });
      }
    }
  }
);

// Update skill
router.put(
  "/:id",
  [
    body("name").optional().trim().escape(),
    body("category").optional().trim().escape(),
    body("description").optional().trim().escape(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, category, description } = req.body;

      const result = await db.query(
        `
      UPDATE skills 
      SET name = COALESCE($1, name),
          category = COALESCE($2, category),
          description = COALESCE($3, description)
      WHERE id = $4
      RETURNING *
    `,
        [name, category, description, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Skill not found" });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update skill" });
    }
  }
);

// Delete skill
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if skill is used by any users
    const usageResult = await db.query(
      `
      SELECT COUNT(*) FROM user_skills WHERE skill_id = $1
    `,
      [id]
    );

    if (parseInt(usageResult.rows[0].count) > 0) {
      return res.status(400).json({
        error: "Cannot delete skill that is assigned to users",
      });
    }

    const result = await db.query(
      `
      DELETE FROM skills WHERE id = $1 RETURNING *
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Skill not found" });
    }

    res.json({ message: "Skill deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete skill" });
  }
});

// Add skill to user
router.post(
  "/user/:userId",
  [
    body("skill_id").isUUID(),
    body("proficiency_level").isInt({ min: 1, max: 5 }),
    body("years_experience").optional().isFloat({ min: 0 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId } = req.params;
      const { skill_id, proficiency_level, years_experience } = req.body;

      const result = await db.query(
        `
      INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_experience)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
        [userId, skill_id, proficiency_level, years_experience]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      if (err.code === "23505") {
        // Unique violation
        res.status(400).json({ error: "User already has this skill" });
      } else {
        res.status(500).json({ error: "Failed to add skill to user" });
      }
    }
  }
);

// Update user skill
router.put(
  "/user/:userId/:skillId",
  [
    body("proficiency_level").optional().isInt({ min: 1, max: 5 }),
    body("years_experience").optional().isFloat({ min: 0 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId, skillId } = req.params;
      const { proficiency_level, years_experience } = req.body;

      const result = await db.query(
        `
      UPDATE user_skills 
      SET proficiency_level = COALESCE($1, proficiency_level),
          years_experience = COALESCE($2, years_experience),
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $3 AND skill_id = $4
      RETURNING *
    `,
        [proficiency_level, years_experience, userId, skillId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User skill not found" });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update user skill" });
    }
  }
);

// Remove skill from user
router.delete("/user/:userId/:skillId", async (req, res) => {
  try {
    const { userId, skillId } = req.params;

    const result = await db.query(
      `
      DELETE FROM user_skills 
      WHERE user_id = $1 AND skill_id = $2
      RETURNING *
    `,
      [userId, skillId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User skill not found" });
    }

    res.json({ message: "Skill removed from user successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove skill from user" });
  }
});

// Get skills by category
router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;

    const result = await db.query(
      `
      SELECT 
        s.*,
        COUNT(us.user_id) as user_count
      FROM skills s
      LEFT JOIN user_skills us ON s.id = us.skill_id
      WHERE s.category = $1
      GROUP BY s.id
      ORDER BY s.name
    `,
      [category]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch skills by category" });
  }
});

module.exports = router;

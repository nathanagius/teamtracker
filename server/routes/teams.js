const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { body, validationResult } = require("express-validator");

// Get all teams
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        t.*,
        COUNT(tm.id) as member_count,
        ARRAY_AGG(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as capabilities
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.is_active = true
      LEFT JOIN team_capabilities tc ON t.id = tc.team_id
      LEFT JOIN capabilities c ON tc.capability_id = c.id
      GROUP BY t.id
      ORDER BY t.name
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

// Get team by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const teamResult = await db.query(
      `
      SELECT * FROM teams WHERE id = $1
    `,
      [id]
    );

    if (teamResult.rows.length === 0) {
      return res.status(404).json({ error: "Team not found" });
    }

    const team = teamResult.rows[0];

    // Get team members
    const membersResult = await db.query(
      `
      SELECT 
        u.*,
        tm.start_date,
        tm.end_date,
        tm.is_active
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = $1 AND tm.is_active = true
      ORDER BY u.last_name, u.first_name
    `,
      [id]
    );

    // Get team capabilities
    const capabilitiesResult = await db.query(
      `
      SELECT 
        c.*,
        tc.strength_level
      FROM team_capabilities tc
      JOIN capabilities c ON tc.capability_id = c.id
      WHERE tc.team_id = $1
      ORDER BY c.name
    `,
      [id]
    );

    // Get child teams
    const childTeamsResult = await db.query(
      `
      SELECT t.* FROM teams t
      JOIN team_hierarchy th ON t.id = th.child_team_id
      WHERE th.parent_team_id = $1
    `,
      [id]
    );

    // Get parent team
    const parentTeamResult = await db.query(
      `
      SELECT t.* FROM teams t
      JOIN team_hierarchy th ON t.id = th.parent_team_id
      WHERE th.child_team_id = $1
    `,
      [id]
    );

    res.json({
      ...team,
      members: membersResult.rows,
      capabilities: capabilitiesResult.rows,
      child_teams: childTeamsResult.rows,
      parent_team: parentTeamResult.rows[0] || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch team" });
  }
});

// Create new team
router.post(
  "/",
  [
    body("name").notEmpty().trim().escape(),
    body("description").optional().trim().escape(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description } = req.body;

      const result = await db.query(
        `
      INSERT INTO teams (name, description)
      VALUES ($1, $2)
      RETURNING *
    `,
        [name, description]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      if (err.code === "23505") {
        // Unique violation
        res.status(400).json({ error: "Team name already exists" });
      } else {
        res.status(500).json({ error: "Failed to create team" });
      }
    }
  }
);

// Update team
router.put(
  "/:id",
  [
    body("name").optional().trim().escape(),
    body("description").optional().trim().escape(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, description } = req.body;

      const result = await db.query(
        `
      UPDATE teams 
      SET name = COALESCE($1, name), 
          description = COALESCE($2, description),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `,
        [name, description, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Team not found" });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update team" });
    }
  }
);

// Delete team
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if team has active members
    const membersResult = await db.query(
      `
      SELECT COUNT(*) FROM team_members 
      WHERE team_id = $1 AND is_active = true
    `,
      [id]
    );

    if (parseInt(membersResult.rows[0].count) > 0) {
      return res.status(400).json({
        error: "Cannot delete team with active members",
      });
    }

    const result = await db.query(
      `
      DELETE FROM teams WHERE id = $1 RETURNING *
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Team not found" });
    }

    res.json({ message: "Team deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete team" });
  }
});

// Get team hierarchy
router.get("/:id/hierarchy", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `
      WITH RECURSIVE team_tree AS (
        SELECT t.id, t.name, t.description, th.parent_team_id, 0 as level
        FROM teams t
        LEFT JOIN team_hierarchy th ON t.id = th.child_team_id
        WHERE t.id = $1
        
        UNION ALL
        
        SELECT t.id, t.name, t.description, th.parent_team_id, tt.level + 1
        FROM teams t
        JOIN team_hierarchy th ON t.id = th.child_team_id
        JOIN team_tree tt ON th.parent_team_id = tt.id
      )
      SELECT * FROM team_tree ORDER BY level, name
    `,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch team hierarchy" });
  }
});

module.exports = router;

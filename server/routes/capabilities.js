const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { body, validationResult } = require("express-validator");

// Get all capabilities
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        c.*,
        COUNT(tc.team_id) as team_count
      FROM capabilities c
      LEFT JOIN team_capabilities tc ON c.id = tc.capability_id
      GROUP BY c.id
      ORDER BY c.name
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch capabilities" });
  }
});

// Get capability by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const capabilityResult = await db.query(
      `
      SELECT * FROM capabilities WHERE id = $1
    `,
      [id]
    );

    if (capabilityResult.rows.length === 0) {
      return res.status(404).json({ error: "Capability not found" });
    }

    const capability = capabilityResult.rows[0];

    // Get teams with this capability
    const teamsResult = await db.query(
      `
      SELECT 
        t.name,
        t.description,
        tc.strength_level,
        COUNT(tm.id) as member_count
      FROM team_capabilities tc
      JOIN teams t ON tc.team_id = t.id
      LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.is_active = true
      WHERE tc.capability_id = $1
      GROUP BY t.id, tc.strength_level
      ORDER BY tc.strength_level DESC, t.name
    `,
      [id]
    );

    res.json({
      ...capability,
      teams: teamsResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch capability" });
  }
});

// Create new capability
router.post(
  "/",
  [
    body("name").notEmpty().trim().escape(),
    body("description").optional().trim().escape(),
    body("category").optional().trim().escape(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, category } = req.body;

      const result = await db.query(
        `
      INSERT INTO capabilities (name, description, category)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
        [name, description, category]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      if (err.code === "23505") {
        // Unique violation
        res.status(400).json({ error: "Capability name already exists" });
      } else {
        res.status(500).json({ error: "Failed to create capability" });
      }
    }
  }
);

// Update capability
router.put(
  "/:id",
  [
    body("name").optional().trim().escape(),
    body("description").optional().trim().escape(),
    body("category").optional().trim().escape(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, description, category } = req.body;

      const result = await db.query(
        `
      UPDATE capabilities 
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          category = COALESCE($3, category)
      WHERE id = $4
      RETURNING *
    `,
        [name, description, category, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Capability not found" });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update capability" });
    }
  }
);

// Delete capability
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if capability is used by any teams
    const usageResult = await db.query(
      `
      SELECT COUNT(*) FROM team_capabilities WHERE capability_id = $1
    `,
      [id]
    );

    if (parseInt(usageResult.rows[0].count) > 0) {
      return res.status(400).json({
        error: "Cannot delete capability that is assigned to teams",
      });
    }

    const result = await db.query(
      `
      DELETE FROM capabilities WHERE id = $1 RETURNING *
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Capability not found" });
    }

    res.json({ message: "Capability deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete capability" });
  }
});

// Add capability to team
router.post(
  "/team/:teamId",
  [
    body("capability_id").isUUID(),
    body("strength_level").isInt({ min: 1, max: 5 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { teamId } = req.params;
      const { capability_id, strength_level } = req.body;

      const result = await db.query(
        `
      INSERT INTO team_capabilities (team_id, capability_id, strength_level)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
        [teamId, capability_id, strength_level]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      if (err.code === "23505") {
        // Unique violation
        res.status(400).json({ error: "Team already has this capability" });
      } else {
        res.status(500).json({ error: "Failed to add capability to team" });
      }
    }
  }
);

// Update team capability
router.put(
  "/team/:teamId/:capabilityId",
  [body("strength_level").isInt({ min: 1, max: 5 })],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { teamId, capabilityId } = req.params;
      const { strength_level } = req.body;

      const result = await db.query(
        `
      UPDATE team_capabilities 
      SET strength_level = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE team_id = $2 AND capability_id = $3
      RETURNING *
    `,
        [strength_level, teamId, capabilityId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Team capability not found" });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update team capability" });
    }
  }
);

// Remove capability from team
router.delete("/team/:teamId/:capabilityId", async (req, res) => {
  try {
    const { teamId, capabilityId } = req.params;

    const result = await db.query(
      `
      DELETE FROM team_capabilities 
      WHERE team_id = $1 AND capability_id = $2
      RETURNING *
    `,
      [teamId, capabilityId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Team capability not found" });
    }

    res.json({ message: "Capability removed from team successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove capability from team" });
  }
});

module.exports = router;

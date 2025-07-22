const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { body, validationResult } = require("express-validator");

// Get full hierarchy tree
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      WITH RECURSIVE team_tree AS (
        SELECT t.id, t.name, t.description, th.parent_team_id, 0 as level
        FROM teams t
        LEFT JOIN team_hierarchy th ON t.id = th.child_team_id
        WHERE th.parent_team_id IS NULL
        
        UNION ALL
        
        SELECT t.id, t.name, t.description, th.parent_team_id, tt.level + 1
        FROM teams t
        JOIN team_hierarchy th ON t.id = th.child_team_id
        JOIN team_tree tt ON th.parent_team_id = tt.id
      )
      SELECT * FROM team_tree ORDER BY level, name
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch hierarchy" });
  }
});

// Get hierarchy for specific team
router.get("/team/:teamId", async (req, res) => {
  try {
    const { teamId } = req.params;

    // Get parent teams
    const parentResult = await db.query(
      `
      WITH RECURSIVE parent_tree AS (
        SELECT t.id, t.name, t.description, th.parent_team_id, 0 as level
        FROM teams t
        JOIN team_hierarchy th ON t.id = th.parent_team_id
        WHERE th.child_team_id = $1
        
        UNION ALL
        
        SELECT t.id, t.name, t.description, th.parent_team_id, pt.level + 1
        FROM teams t
        JOIN team_hierarchy th ON t.id = th.parent_team_id
        JOIN parent_tree pt ON th.child_team_id = pt.id
      )
      SELECT * FROM parent_tree ORDER BY level DESC
    `,
      [teamId]
    );

    // Get child teams
    const childResult = await db.query(
      `
      WITH RECURSIVE child_tree AS (
        SELECT t.id, t.name, t.description, th.parent_team_id, 0 as level
        FROM teams t
        JOIN team_hierarchy th ON t.id = th.child_team_id
        WHERE th.parent_team_id = $1
        
        UNION ALL
        
        SELECT t.id, t.name, t.description, th.parent_team_id, ct.level + 1
        FROM teams t
        JOIN team_hierarchy th ON t.id = th.child_team_id
        JOIN child_tree ct ON th.parent_team_id = ct.id
      )
      SELECT * FROM child_tree ORDER BY level, name
    `,
      [teamId]
    );

    res.json({
      parents: parentResult.rows,
      children: childResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch team hierarchy" });
  }
});

// Create hierarchy relationship
router.post(
  "/",
  [body("parent_team_id").isUUID(), body("child_team_id").isUUID()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { parent_team_id, child_team_id } = req.body;

      // Check for circular references
      if (parent_team_id === child_team_id) {
        return res.status(400).json({ error: "Team cannot be its own parent" });
      }

      // Check if this would create a circular reference
      const circularCheck = await db.query(
        `
      WITH RECURSIVE team_tree AS (
        SELECT id FROM teams WHERE id = $1
        UNION ALL
        SELECT t.id FROM teams t
        JOIN team_hierarchy th ON t.id = th.child_team_id
        JOIN team_tree tt ON th.parent_team_id = tt.id
      )
      SELECT COUNT(*) FROM team_tree WHERE id = $2
    `,
        [child_team_id, parent_team_id]
      );

      if (parseInt(circularCheck.rows[0].count) > 0) {
        return res
          .status(400)
          .json({ error: "This would create a circular reference" });
      }

      const result = await db.query(
        `
      INSERT INTO team_hierarchy (parent_team_id, child_team_id)
      VALUES ($1, $2)
      RETURNING *
    `,
        [parent_team_id, child_team_id]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      if (err.code === "23505") {
        // Unique violation
        res
          .status(400)
          .json({ error: "Hierarchy relationship already exists" });
      } else {
        res
          .status(500)
          .json({ error: "Failed to create hierarchy relationship" });
      }
    }
  }
);

// Delete hierarchy relationship
router.delete("/:parentId/:childId", async (req, res) => {
  try {
    const { parentId, childId } = req.params;

    const result = await db.query(
      `
      DELETE FROM team_hierarchy 
      WHERE parent_team_id = $1 AND child_team_id = $2
      RETURNING *
    `,
      [parentId, childId]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Hierarchy relationship not found" });
    }

    res.json({ message: "Hierarchy relationship deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete hierarchy relationship" });
  }
});

// Get root teams (teams with no parents)
router.get("/roots", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT t.* FROM teams t
      LEFT JOIN team_hierarchy th ON t.id = th.child_team_id
      WHERE th.child_team_id IS NULL
      ORDER BY t.name
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch root teams" });
  }
});

// Get leaf teams (teams with no children)
router.get("/leaves", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT t.* FROM teams t
      LEFT JOIN team_hierarchy th ON t.id = th.parent_team_id
      WHERE th.parent_team_id IS NULL
      ORDER BY t.name
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch leaf teams" });
  }
});

module.exports = router;

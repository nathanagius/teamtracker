const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { body, validationResult } = require("express-validator");

// Get all change requests
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        cr.*,
        r.first_name as requester_first_name,
        r.last_name as requester_last_name,
        a.first_name as approver_first_name,
        a.last_name as approver_last_name,
        t.name as team_name,
        u.first_name as user_first_name,
        u.last_name as user_last_name
      FROM change_requests cr
      LEFT JOIN users r ON cr.requester_id = r.id
      LEFT JOIN users a ON cr.approved_by = a.id
      LEFT JOIN teams t ON cr.team_id = t.id
      LEFT JOIN users u ON cr.user_id = u.id
      ORDER BY cr.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch change requests" });
  }
});

// Get change requests by status
router.get("/status/:status", async (req, res) => {
  try {
    const { status } = req.params;

    const result = await db.query(
      `
      SELECT 
        cr.*,
        r.first_name as requester_first_name,
        r.last_name as requester_last_name,
        t.name as team_name,
        u.first_name as user_first_name,
        u.last_name as user_last_name
      FROM change_requests cr
      LEFT JOIN users r ON cr.requester_id = r.id
      LEFT JOIN teams t ON cr.team_id = t.id
      LEFT JOIN users u ON cr.user_id = u.id
      WHERE cr.status = $1
      ORDER BY cr.created_at DESC
    `,
      [status]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to fetch change requests by status" });
  }
});

// Get change request by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `
      SELECT 
        cr.*,
        r.first_name as requester_first_name,
        r.last_name as requester_last_name,
        a.first_name as approver_first_name,
        a.last_name as approver_last_name,
        t.name as team_name,
        u.first_name as user_first_name,
        u.last_name as user_last_name
      FROM change_requests cr
      LEFT JOIN users r ON cr.requester_id = r.id
      LEFT JOIN users a ON cr.approved_by = a.id
      LEFT JOIN teams t ON cr.team_id = t.id
      LEFT JOIN users u ON cr.user_id = u.id
      WHERE cr.id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Change request not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch change request" });
  }
});

// Create change request
router.post(
  "/",
  [
    body("request_type").isIn([
      "add_member",
      "remove_member",
      "move_member",
      "create_team",
      "update_team",
      "delete_team",
    ]),
    body("requester_id").isUUID(),
    body("team_id").optional().isUUID(),
    body("user_id").optional().isUUID(),
    body("details").isObject(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { request_type, requester_id, team_id, user_id, details } =
        req.body;

      const result = await db.query(
        `
      INSERT INTO change_requests (request_type, requester_id, team_id, user_id, details)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
        [request_type, requester_id, team_id, user_id, details]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create change request" });
    }
  }
);

// Approve change request
router.put(
  "/:id/approve",
  [body("approver_id").isUUID(), body("notes").optional().trim().escape()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { approver_id, notes } = req.body;

      // Start transaction
      await db.query("BEGIN");

      try {
        // Get the change request
        const changeRequest = await db.query(
          `
        SELECT * FROM change_requests WHERE id = $1 AND status = 'pending'
      `,
          [id]
        );

        if (changeRequest.rows.length === 0) {
          throw new Error("Change request not found or not pending");
        }

        const request = changeRequest.rows[0];

        // Execute the change based on request type
        switch (request.request_type) {
          case "add_member":
            await db.query(
              `
            INSERT INTO team_members (team_id, user_id, start_date)
            VALUES ($1, $2, $3)
          `,
              [
                request.team_id,
                request.user_id,
                new Date().toISOString().split("T")[0],
              ]
            );
            break;

          case "remove_member":
            await db.query(
              `
            UPDATE team_members 
            SET end_date = $1, is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE team_id = $2 AND user_id = $3 AND is_active = true
          `,
              [
                new Date().toISOString().split("T")[0],
                request.team_id,
                request.user_id,
              ]
            );
            break;

          case "move_member":
            const moveDetails = request.details;
            // End current membership
            await db.query(
              `
            UPDATE team_members 
            SET end_date = $1, is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE team_id = $2 AND user_id = $3 AND is_active = true
          `,
              [moveDetails.move_date, moveDetails.from_team_id, request.user_id]
            );

            // Start new membership
            await db.query(
              `
            INSERT INTO team_members (team_id, user_id, start_date)
            VALUES ($1, $2, $3)
          `,
              [moveDetails.to_team_id, request.user_id, moveDetails.move_date]
            );
            break;

          case "create_team":
            const teamDetails = request.details;
            await db.query(
              `
            INSERT INTO teams (name, description)
            VALUES ($1, $2)
          `,
              [teamDetails.name, teamDetails.description]
            );
            break;

          case "update_team":
            const updateDetails = request.details;
            await db.query(
              `
            UPDATE teams 
            SET name = COALESCE($1, name),
                description = COALESCE($2, description),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
          `,
              [updateDetails.name, updateDetails.description, request.team_id]
            );
            break;

          case "delete_team":
            await db.query(
              `
            DELETE FROM teams WHERE id = $1
          `,
              [request.team_id]
            );
            break;
        }

        // Update change request status
        const updateResult = await db.query(
          `
        UPDATE change_requests 
        SET status = 'approved',
            approved_by = $1,
            approved_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `,
          [approver_id, id]
        );

        await db.query("COMMIT");

        res.json(updateResult.rows[0]);
      } catch (err) {
        await db.query("ROLLBACK");
        throw err;
      }
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ error: err.message || "Failed to approve change request" });
    }
  }
);

// Reject change request
router.put(
  "/:id/reject",
  [body("approver_id").isUUID(), body("notes").optional().trim().escape()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { approver_id, notes } = req.body;

      const result = await db.query(
        `
      UPDATE change_requests 
      SET status = 'rejected',
          approved_by = $1,
          approved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND status = 'pending'
      RETURNING *
    `,
        [approver_id, id]
      );

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Change request not found or not pending" });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to reject change request" });
    }
  }
);

// Get pending change requests count
router.get("/pending/count", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT COUNT(*) as count FROM change_requests WHERE status = 'pending'
    `);

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch pending count" });
  }
});

module.exports = router;

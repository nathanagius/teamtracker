const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { body, validationResult } = require("express-validator");
const { requireAuth, requireRole } = require("./users");

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

// Approve a change request (only team lead of the team or super admin)
router.put("/:id/approve", requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    // Get the change request and team
    const crRes = await db.query(
      "SELECT * FROM change_requests WHERE id = $1",
      [id]
    );
    if (crRes.rows.length === 0) {
      return res.status(404).json({ error: "Change request not found" });
    }
    const change = crRes.rows[0];
    const teamRes = await db.query("SELECT * FROM teams WHERE id = $1", [
      change.team_id,
    ]);
    if (teamRes.rows.length === 0) {
      return res.status(404).json({ error: "Team not found" });
    }
    const team = teamRes.rows[0];
    // Only super admin or team lead of the team can approve
    if (
      req.user.app_role !== "super_admin" &&
      !(req.user.app_role === "team_lead" && req.user.id === team.lead_id)
    ) {
      return res
        .status(403)
        .json({
          error: "Forbidden: only team lead or super admin can approve",
        });
    }
    // Approve the request
    const result = await db.query(
      `UPDATE change_requests SET status = 'approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [req.user.id, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to approve change request" });
  }
});

// Reject a change request (only team lead of the team or super admin)
router.put("/:id/reject", requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    // Get the change request and team
    const crRes = await db.query(
      "SELECT * FROM change_requests WHERE id = $1",
      [id]
    );
    if (crRes.rows.length === 0) {
      return res.status(404).json({ error: "Change request not found" });
    }
    const change = crRes.rows[0];
    const teamRes = await db.query("SELECT * FROM teams WHERE id = $1", [
      change.team_id,
    ]);
    if (teamRes.rows.length === 0) {
      return res.status(404).json({ error: "Team not found" });
    }
    const team = teamRes.rows[0];
    // Only super admin or team lead of the team can reject
    if (
      req.user.app_role !== "super_admin" &&
      !(req.user.app_role === "team_lead" && req.user.id === team.lead_id)
    ) {
      return res
        .status(403)
        .json({ error: "Forbidden: only team lead or super admin can reject" });
    }
    // Reject the request
    const result = await db.query(
      `UPDATE change_requests SET status = 'rejected', approved_by = $1, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [req.user.id, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reject change request" });
  }
});

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

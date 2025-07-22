import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { teamsAPI } from "../services/api";

function TeamDetail() {
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await teamsAPI.getById(id);
      setTeam(res.data);
      setEditForm({ name: res.data.name, description: res.data.description || "" });
      setError("");
    } catch (err) {
      setError("Failed to load team");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTeam();
    // eslint-disable-next-line
  }, [id]);

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await teamsAPI.update(id, editForm);
      setEditMode(false);
      fetchTeam();
    } catch (err) {
      setError("Failed to update team");
    }
    setSaving(false);
  };

  if (loading) return <div>Loading team...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!team) return <div>Team not found.</div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Details</h1>
          <p className="text-gray-600">Team ID: {team.id}</p>
        </div>
        <button className="btn btn-outline" onClick={() => setEditMode((v) => !v)}>
          {editMode ? "Cancel" : "Edit"}
        </button>
      </div>
      {editMode ? (
        <form onSubmit={handleEditSubmit} className="bg-white p-4 rounded shadow space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              name="name"
              value={editForm.name}
              onChange={handleEditChange}
              className="input input-bordered flex-1"
              required
            />
            <input
              type="text"
              name="description"
              value={editForm.description}
              onChange={handleEditChange}
              className="input input-bordered flex-1"
              placeholder="Description"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            Save
          </button>
        </form>
      ) : (
        <div className="bg-white p-4 rounded shadow">
          <div><span className="font-semibold">Name:</span> {team.name}</div>
          <div><span className="font-semibold">Description:</span> {team.description}</div>
        </div>
      )}
      <div>
        <h2 className="text-xl font-semibold mb-2">Members</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Start Date</th>
              </tr>
            </thead>
            <tbody>
              {team.members && team.members.length > 0 ? (
                team.members.map((member) => (
                  <tr key={member.id} className="border-t">
                    <td className="px-4 py-2">{member.first_name} {member.last_name}</td>
                    <td className="px-4 py-2">{member.role}</td>
                    <td className="px-4 py-2">{member.start_date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center py-4 text-gray-500">
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Capabilities</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Capability</th>
                <th className="px-4 py-2 text-left">Strength Level</th>
              </tr>
            </thead>
            <tbody>
              {team.capabilities && team.capabilities.length > 0 ? (
                team.capabilities.map((cap) => (
                  <tr key={cap.id} className="border-t">
                    <td className="px-4 py-2">{cap.name}</td>
                    <td className="px-4 py-2">{cap.strength_level}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="text-center py-4 text-gray-500">
                    No capabilities found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TeamDetail;

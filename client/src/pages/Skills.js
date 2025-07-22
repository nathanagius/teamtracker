import React, { useEffect, useState } from "react";
import { skillsAPI } from "../services/api";

function Skills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", category: "", description: "" });
  const [editingId, setEditingId] = useState(null);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const res = await skillsAPI.getAll();
      setSkills(res.data);
      setError("");
    } catch (err) {
      setError("Failed to load skills");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await skillsAPI.update(editingId, form);
      } else {
        await skillsAPI.create(form);
      }
      setForm({ name: "", category: "", description: "" });
      setEditingId(null);
      fetchSkills();
    } catch (err) {
      setError("Failed to save skill");
    }
  };

  const handleEdit = (skill) => {
    setForm({ name: skill.name, category: skill.category || "", description: skill.description || "" });
    setEditingId(skill.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this skill?")) return;
    try {
      await skillsAPI.delete(id);
      fetchSkills();
    } catch (err) {
      setError("Failed to delete skill");
    }
  };

  const handleCancel = () => {
    setForm({ name: "", category: "", description: "" });
    setEditingId(null);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Skills Management</h1>
        <p className="text-gray-600">Manage skills and proficiency levels</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Skill Name"
            className="input input-bordered flex-1"
            required
          />
          <input
            type="text"
            name="category"
            value={form.category}
            onChange={handleChange}
            placeholder="Category"
            className="input input-bordered flex-1"
          />
          <input
            type="text"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
            className="input input-bordered flex-1"
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary">
            {editingId ? "Update Skill" : "Add Skill"}
          </button>
          {editingId && (
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
      {error && <div className="text-red-500">{error}</div>}
      {loading ? (
        <div>Loading skills...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill) => (
                <tr key={skill.id} className="border-t">
                  <td className="px-4 py-2">{skill.name}</td>
                  <td className="px-4 py-2">{skill.category}</td>
                  <td className="px-4 py-2">{skill.description}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button className="btn btn-xs btn-outline" onClick={() => handleEdit(skill)}>
                      Edit
                    </button>
                    <button className="btn btn-xs btn-error" onClick={() => handleDelete(skill.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {skills.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-gray-500">
                    No skills found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Skills;

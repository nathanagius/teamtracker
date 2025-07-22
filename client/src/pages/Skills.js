import React, { useEffect, useState } from "react";
import { skillsAPI } from "../services/api";

const SKILL_QUESTIONS = {
  "JavaScript": [
    "What is a closure?",
    "Explain event delegation.",
    "How does prototypal inheritance work?"
  ],
  "React": [
    "What is a React hook?",
    "How does the virtual DOM work?",
    "Explain the useEffect hook."
  ],
  "Node.js": [
    "What is the event loop?",
    "How do you handle async operations?",
    "Explain middleware in Express."
  ],
  // Add more skills and questions as needed
};

function Skills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", category: "", description: "" });
  const [editingId, setEditingId] = useState(null);
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentAnswers, setAssessmentAnswers] = useState([]);
  const [assessmentQuestions, setAssessmentQuestions] = useState([]);

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

  const handleAssessmentAnswer = (idx, value) => {
    setAssessmentAnswers((prev) => {
      const copy = [...prev];
      copy[idx] = value;
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingId) {
      // Only for adding new skill, show assessment if questions exist
      const questions = SKILL_QUESTIONS[form.name.trim()];
      if (questions && questions.length > 0) {
        setAssessmentQuestions(questions);
        setAssessmentAnswers(Array(questions.length).fill(""));
        setShowAssessment(true);
        return;
      }
    }
    await actuallySaveSkill();
  };

  const actuallySaveSkill = async () => {
    try {
      if (editingId) {
        await skillsAPI.update(editingId, form);
      } else {
        await skillsAPI.create(form);
      }
      setForm({ name: "", category: "", description: "" });
      setEditingId(null);
      setShowAssessment(false);
      setAssessmentAnswers([]);
      setAssessmentQuestions([]);
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
    setShowAssessment(false);
    setAssessmentAnswers([]);
    setAssessmentQuestions([]);
  };

  const handleAssessmentConfirm = async () => {
    // Optionally: validate answers (e.g., not empty)
    if (assessmentAnswers.some((a) => !a.trim())) {
      setError("Please answer all assessment questions.");
      return;
    }
    setError("");
    await actuallySaveSkill();
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-bbc-red">Skills Management</h1>
        <p className="text-bbc-black">Manage skills and proficiency levels</p>
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
            disabled={!!editingId}
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
          {(editingId || showAssessment) && (
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
      {showAssessment && (
        <div className="bg-white p-4 rounded shadow space-y-4">
          <h2 className="text-lg font-semibold">Skill Assessment for {form.name}</h2>
          <p className="text-bbc-black">Please answer the following questions before adding this skill:</p>
          <form onSubmit={e => { e.preventDefault(); handleAssessmentConfirm(); }}>
            {assessmentQuestions.map((q, idx) => (
              <div key={idx} className="mb-2">
                <label className="block font-medium mb-1">{q}</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={assessmentAnswers[idx] || ""}
                  onChange={e => handleAssessmentAnswer(idx, e.target.value)}
                  required
                />
              </div>
            ))}
            <button type="submit" className="btn btn-success mt-2">Confirm & Add Skill</button>
          </form>
        </div>
      )}
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
                  <td colSpan={4} className="text-center py-4 text-bbc-black">
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

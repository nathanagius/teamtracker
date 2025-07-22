import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { usersAPI, skillsAPI } from "../services/api";

const SKILL_QUESTIONS = {
  "JavaScript": {
    1: [{ q: "What is a variable?", a: "variable" }],
    2: [{ q: "What is a closure?", a: "closure" }],
    3: [{ q: "Explain event delegation.", a: "event" }],
    4: [{ q: "How does prototypal inheritance work?", a: "prototype" }],
    5: [{ q: "What is the event loop?", a: "event loop" }]
  },
  "React": {
    1: [{ q: "What is a component?", a: "component" }],
    2: [{ q: "What is a React hook?", a: "hook" }],
    3: [{ q: "How does the virtual DOM work?", a: "virtual dom" }],
    4: [{ q: "Explain the useEffect hook.", a: "useeffect" }],
    5: [{ q: "How do you optimize React performance?", a: "optimize" }]
  },
  "default": {
    1: [{ q: "What is this skill about?", a: "" }],
    2: [{ q: "Describe a basic use case for this skill.", a: "" }],
    3: [{ q: "Describe an intermediate use case for this skill.", a: "" }],
    4: [{ q: "Describe an advanced use case for this skill.", a: "" }],
    5: [{ q: "Describe an expert use case for this skill.", a: "" }]
  }
};

function getSkillQuestions(skillName, proficiency) {
  const skill = SKILL_QUESTIONS[skillName] || SKILL_QUESTIONS["default"];
  return skill[proficiency] || SKILL_QUESTIONS["default"][proficiency];
}

function UserDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allSkills, setAllSkills] = useState([]);
  const [addForm, setAddForm] = useState({ skill_id: "", proficiency_level: 1, years_experience: 0 });
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentQuestions, setAssessmentQuestions] = useState([]);
  const [assessmentAnswers, setAssessmentAnswers] = useState([]);
  const [adding, setAdding] = useState(false);
  const [currentProficiency, setCurrentProficiency] = useState(1);
  const [assessmentFailed, setAssessmentFailed] = useState(false);
  const [learningNeeds, setLearningNeeds] = useState([]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getById(id);
      setUser(res.data);
      setError("");
    } catch (err) {
      setError("Failed to load user");
    }
    setLoading(false);
  };

  const fetchSkills = async () => {
    try {
      const res = await skillsAPI.getAll();
      setAllSkills(res.data);
    } catch (err) {
      // ignore
    }
  };

  const fetchLearningNeeds = async () => {
    try {
      const res = await usersAPI.getUserLearningNeeds(id);
      setLearningNeeds(res.data);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchUser();
    fetchSkills();
    fetchLearningNeeds();
    // eslint-disable-next-line
  }, [id]);

  const handleAddFormChange = (e) => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value });
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const skill = allSkills.find(s => s.id === addForm.skill_id);
    const proficiency = Number(addForm.proficiency_level);
    setCurrentProficiency(proficiency);
    const questions = getSkillQuestions(skill ? skill.name : "", proficiency);
    setAssessmentQuestions(questions);
    setAssessmentAnswers(Array(questions.length).fill(""));
    setShowAssessment(true);
    setAssessmentFailed(false);
  };

  const actuallyAddSkill = async () => {
    setAdding(true);
    try {
      await skillsAPI.addToUser(id, {
        skill_id: addForm.skill_id,
        proficiency_level: Number(currentProficiency),
        years_experience: Number(addForm.years_experience),
      });
      setAddForm({ skill_id: "", proficiency_level: 1, years_experience: 0 });
      setShowAssessment(false);
      setAssessmentQuestions([]);
      setAssessmentAnswers([]);
      setAssessmentFailed(false);
      fetchUser();
    } catch (err) {
      setError("Failed to add skill");
    }
    setAdding(false);
  };

  const handleAssessmentAnswer = (idx, value) => {
    setAssessmentAnswers((prev) => {
      const copy = [...prev];
      copy[idx] = value;
      return copy;
    });
  };

  const validateAnswers = () => {
    for (let i = 0; i < assessmentQuestions.length; i++) {
      const expected = assessmentQuestions[i].a.trim().toLowerCase();
      const answer = (assessmentAnswers[i] || "").trim().toLowerCase();
      if (expected && !answer.includes(expected)) return false;
      if (!expected && !answer) return false;
    }
    return true;
  };

  const handleAssessmentConfirm = async (e) => {
    e.preventDefault();
    if (!validateAnswers()) {
      // If not proficiency 1, prompt for lower level
      if (currentProficiency > 1) {
        setCurrentProficiency(currentProficiency - 1);
        const skill = allSkills.find(s => s.id === addForm.skill_id);
        const questions = getSkillQuestions(skill ? skill.name : "", currentProficiency - 1);
        setAssessmentQuestions(questions);
        setAssessmentAnswers(Array(questions.length).fill(""));
        setAssessmentFailed(true);
      } else {
        setAssessmentFailed(true);
        setShowAssessment(false);
        setError("You need training for this skill before it can be added.");
        // Add to learning needs in backend
        const skill = allSkills.find(s => s.id === addForm.skill_id);
        if (skill) {
          await usersAPI.addUserLearningNeed(id, skill.id, "Failed assessment");
          fetchLearningNeeds();
        }
      }
      return;
    }
    setError("");
    actuallyAddSkill();
  };

  const handleRemoveSkill = async (skillId) => {
    if (!window.confirm("Remove this skill from user?")) return;
    try {
      await skillsAPI.removeFromUser(id, skillId);
      fetchUser();
    } catch (err) {
      setError("Failed to remove skill");
    }
  };

  if (loading) return <div>Loading user...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!user) return <div>User not found.</div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-bbc-red">User Details</h1>
        <p className="text-bbc-black">User ID: {user.id}</p>
        <div className="mt-2">
          <div><span className="font-semibold">Name:</span> {user.first_name} {user.last_name}</div>
          <div><span className="font-semibold">Email:</span> {user.email}</div>
          <div><span className="font-semibold">Role:</span> {user.role}</div>
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Skills</h2>
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Skill</th>
                <th className="px-4 py-2 text-left">Proficiency</th>
                <th className="px-4 py-2 text-left">Years Experience</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {user.skills && user.skills.length > 0 ? (
                user.skills.map((skill) => (
                  <tr key={skill.id} className="border-t">
                    <td className="px-4 py-2">{skill.name}</td>
                    <td className="px-4 py-2">{skill.proficiency_level}</td>
                    <td className="px-4 py-2">{skill.years_experience}</td>
                    <td className="px-4 py-2">
                      <button className="btn btn-xs btn-error" onClick={() => handleRemoveSkill(skill.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-gray-500">
                    No skills found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <form onSubmit={handleAddSkill} className="bg-white p-4 rounded shadow space-y-4">
          <h3 className="font-semibold">Add Skill</h3>
          <div className="flex flex-col md:flex-row gap-4">
            <select
              name="skill_id"
              value={addForm.skill_id}
              onChange={handleAddFormChange}
              className="input input-bordered flex-1"
              required
            >
              <option value="">Select Skill</option>
              {allSkills.map((skill) => (
                <option key={skill.id} value={skill.id}>{skill.name}</option>
              ))}
            </select>
            <input
              type="number"
              name="proficiency_level"
              value={addForm.proficiency_level}
              onChange={handleAddFormChange}
              min={1}
              max={5}
              className="input input-bordered flex-1"
              placeholder="Proficiency (1-5)"
              required
            />
            <input
              type="number"
              name="years_experience"
              value={addForm.years_experience}
              onChange={handleAddFormChange}
              min={0}
              max={50}
              step={0.1}
              className="input input-bordered flex-1"
              placeholder="Years Experience"
              required
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={adding}>
              Add Skill
            </button>
          </div>
        </form>
        {showAssessment && (
          <div className="bg-gray-100 p-4 rounded shadow space-y-4 mt-4">
            <h4 className="text-lg font-semibold">Skill Assessment (Level {currentProficiency})</h4>
            <p className="text-gray-600">Please answer the following questions before adding this skill:</p>
            {assessmentFailed && (
              <div className="text-red-500">Assessment failed for this level. {currentProficiency > 1 ? "Try a lower proficiency." : "You cannot add this skill."}</div>
            )}
            <form onSubmit={handleAssessmentConfirm}>
              {assessmentQuestions.map((q, idx) => (
                <div key={idx} className="mb-2">
                  <label className="block font-medium mb-1">{q.q}</label>
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
      </div>
      {learningNeeds.length > 0 && (
        <div className="bg-yellow-50 p-4 rounded shadow">
          <h3 className="font-semibold text-yellow-800 mb-2">Training Needed</h3>
          <ul className="list-disc pl-6">
            {learningNeeds.map((need, idx) => (
              <li key={need.skill_id}>{need.skill_name}</li>
            ))}
          </ul>
          <p className="text-yellow-700 mt-2 text-sm">You need training for these skills before you can add them.</p>
        </div>
      )}
    </div>
  );
}

export default UserDetail;

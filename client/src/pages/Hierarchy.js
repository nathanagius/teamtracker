import React, { useEffect, useState } from "react";
import { hierarchyAPI } from "../services/api";

function Hierarchy() {
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchHierarchy() {
      setLoading(true);
      try {
        const res = await hierarchyAPI.getAll();
        setHierarchy(res.data);
        setError("");
      } catch (err) {
        setError("Failed to load hierarchy");
        console.error("Error fetching hierarchy:", err);
      }
      setLoading(false);
    }
    fetchHierarchy();
  }, []);

  // Simple tree rendering function
  const renderTree = (items, parentId = null, depth = 0) => {
    const children = items.filter((item) => item.parent_team_id === parentId);

    return children.map((item) => (
      <div key={item.id} style={{ marginLeft: depth * 20 }}>
        <div className="flex items-center py-2 border-b border-gray-100">
          <span className="text-lg mr-2">{depth === 0 ? "🏢" : "👥"}</span>
          <div>
            <div className="font-medium text-gray-800">{item.name}</div>
            {item.description && (
              <div className="text-sm text-gray-500">{item.description}</div>
            )}
          </div>
        </div>
        {renderTree(items, item.id, depth + 1)}
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-bbc-red">Team Hierarchy</h1>
        <p className="text-bbc-black">
          View team reporting relationships and organizational structure
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bbc-red"></div>
        </div>
      ) : (
        <div className="card">
          {hierarchy.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No teams found. Create some teams to see the hierarchy.
            </div>
          ) : (
            <div className="p-4">{renderTree(hierarchy)}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default Hierarchy;

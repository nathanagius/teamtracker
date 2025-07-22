import React, { useEffect, useState } from "react";
import Tree from "react-d3-tree";
import { teamsAPI } from "../services/api";
import { X } from "lucide-react";

function Hierarchy() {
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // Fetch the root hierarchy (assuming root team has id 'root' or fetch all and build tree)
    async function fetchHierarchy() {
      setLoading(true);
      setError(null);
      try {
        // Try to get all teams and find the root
        const res = await teamsAPI.getAll();
        const teams = res.data;
        // Find root (no parent)
        const root = teams.find((t) => !t.parent_team_id);
        if (!root) throw new Error("No root team found");
        // Fetch hierarchy for root
        const treeRes = await teamsAPI.getHierarchy(root.id);
        setTreeData(treeRes.data);
      } catch (e) {
        setError(e.message || "Failed to load hierarchy");
      } finally {
        setLoading(false);
      }
    }
    fetchHierarchy();
  }, []);

  // Transform API data to react-d3-tree format
  function transformNode(node) {
    return {
      name: node.name,
      attributes: {
        Members: node.member_count,
        Capabilities: node.capabilities ? node.capabilities.join(", ") : "-",
      },
      children: node.children ? node.children.map(transformNode) : [],
      raw: node,
    };
  }

  // Click handler for nodes
  function handleNodeClick(nodeData) {
    setSelectedTeam(nodeData.raw);
    setModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Hierarchy</h1>
        <p className="text-gray-600">
          View and explore team reporting relationships
        </p>
      </div>
      <div className="card min-h-[500px] flex items-center justify-center relative overflow-auto">
        {loading && <div>Loading hierarchy...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {treeData && (
          <div style={{ width: "100%", height: "500px" }}>
            <Tree
              data={transformNode(treeData)}
              orientation="vertical"
              translate={{ x: 400, y: 60 }}
              zoomable={true}
              collapsible={true}
              separation={{ siblings: 1.5, nonSiblings: 2 }}
              pathFunc="elbow"
              onNodeClick={handleNodeClick}
              styles={{
                nodes: {
                  node: {
                    circle: {
                      fill: "#2563eb",
                      stroke: "#1e40af",
                      strokeWidth: 2,
                    },
                    name: { fontSize: 16, fill: "#111827", fontWeight: "bold" },
                    attributes: { fontSize: 12, fill: "#374151" },
                  },
                  leafNode: {
                    circle: { fill: "#22c55e" },
                  },
                },
                links: {
                  link: { stroke: "#d1d5db", strokeWidth: 2 },
                },
              }}
            />
          </div>
        )}
      </div>
      {/* Modal for team info */}
      {modalOpen && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedTeam.name}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Description:</span>{" "}
                {selectedTeam.description || "-"}
              </div>
              <div>
                <span className="font-medium">Members:</span>{" "}
                {selectedTeam.member_count}
              </div>
              <div>
                <span className="font-medium">Capabilities:</span>{" "}
                {selectedTeam.capabilities
                  ? selectedTeam.capabilities.join(", ")
                  : "-"}
              </div>
              <div>
                <span className="font-medium">Created:</span>{" "}
                {selectedTeam.created_at
                  ? new Date(selectedTeam.created_at).toLocaleDateString()
                  : "-"}
              </div>
              <div>
                <span className="font-medium">Updated:</span>{" "}
                {selectedTeam.updated_at
                  ? new Date(selectedTeam.updated_at).toLocaleDateString()
                  : "-"}
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="btn btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Hierarchy;

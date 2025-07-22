import React, { useEffect, useState } from "react";
import { hierarchyAPI } from "../services/api";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Tree, NodeModel } from "@minoru/react-dnd-treeview";

function Hierarchy() {
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  // Convert backend hierarchy to treeview format
  const mapHierarchyToTree = (hierarchy) => {
    // Each node: { id, parent, text, droppable }
    return hierarchy.map((item) => ({
      id: item.id,
      parent: item.parent_team_id || 0, // 0 is root
      text: item.name,
      droppable: true,
      data: item,
    }));
  };

  useEffect(() => {
    async function fetchHierarchy() {
      setLoading(true);
      try {
        const res = await hierarchyAPI.getAll();
        // The backend returns a flat list with parent_team_id
        setTreeData(mapHierarchyToTree(res.data));
        setError("");
      } catch (err) {
        setError("Failed to load hierarchy");
      }
      setLoading(false);
    }
    fetchHierarchy();
  }, [refresh]);

  const handleDrop = async (newTree, { dragSourceId, dropTargetId }) => {
    // Prevent self-parenting
    if (dragSourceId === dropTargetId) return;
    // Prevent circular reference (handled by backend, but check here too)
    // (Optional: implement a check for descendants)
    setTreeData(newTree);
    try {
      await hierarchyAPI.create({
        parent_team_id: dropTargetId === 0 ? null : dropTargetId,
        child_team_id: dragSourceId,
      });
      setRefresh((r) => r + 1);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to update hierarchy. Circular references are not allowed."
      );
      setRefresh((r) => r + 1); // Revert
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Hierarchy</h1>
        <p className="text-gray-600">View and manage team reporting relationships (drag and drop to rearrange)</p>
      </div>
      {error && <div className="text-red-500">{error}</div>}
      {loading ? (
        <div>Loading hierarchy...</div>
      ) : (
        <DndProvider backend={HTML5Backend}>
          <div className="bg-white p-4 rounded shadow">
            <Tree
              tree={treeData}
              rootId={0}
              render={(node, { depth, isOpen, onToggle }) => (
                <div
                  style={{ marginLeft: depth * 16 }}
                  className="flex items-center gap-2 py-1"
                >
                  {node.droppable && (
                    <button
                      onClick={onToggle}
                      className="text-gray-400 hover:text-gray-700"
                    >
                      {isOpen ? "▼" : "▶"}
                    </button>
                  )}
                  <span className="font-medium text-gray-800">{node.text}</span>
                  <span className="ml-2 text-xs text-gray-400">{node.data?.description}</span>
                </div>
              )}
              dragPreviewRender={(monitorProps) => (
                <div className="px-2 py-1 bg-gray-200 rounded shadow">
                  {monitorProps.item.text}
                </div>
              )}
              onDrop={handleDrop}
              canDrop={(tree, { dragSource, dropTarget }) => {
                // Prevent self-parenting
                if (!dropTarget || dragSource.id === dropTarget.id) return false;
                // Prevent circular: don't allow dropping on a descendant
                let parent = dropTarget;
                while (parent && parent.parent !== 0) {
                  if (parent.parent === dragSource.id) return false;
                  parent = tree.find((n) => n.id === parent.parent);
                }
                return true;
              }}
              classes={{
                root: "",
                dropTarget: "bg-blue-50",
                draggingSource: "opacity-50",
                placeholder: "bg-blue-100 border border-blue-400",
              }}
            />
          </div>
        </DndProvider>
      )}
    </div>
  );
}

export default Hierarchy;

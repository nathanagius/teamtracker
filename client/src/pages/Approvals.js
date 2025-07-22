import React, { useEffect, useState } from "react";
import { changesAPI } from "../services/api";

function Approvals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approving, setApproving] = useState({});
  const [rejecting, setRejecting] = useState({});

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await changesAPI.getAll();
      setRequests(res.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch change requests");
    }
    setLoading(false);
  };

  const handleApprove = async (id) => {
    setApproving((prev) => ({ ...prev, [id]: true }));
    try {
      // For demo, use the first user as approver
      const approverId = requests[0]?.requester_id;
      await changesAPI.approve(id, { approver_id: approverId });
      fetchRequests();
    } catch (err) {
      alert("Failed to approve request");
    }
    setApproving((prev) => ({ ...prev, [id]: false }));
  };

  const handleReject = async (id) => {
    setRejecting((prev) => ({ ...prev, [id]: true }));
    try {
      // For demo, use the first user as approver
      const approverId = requests[0]?.requester_id;
      await changesAPI.reject(id, { approver_id: approverId });
      fetchRequests();
    } catch (err) {
      alert("Failed to reject request");
    }
    setRejecting((prev) => ({ ...prev, [id]: false }));
  };

  const submitted = requests.filter((r) => r.status === "pending");
  const underReview = requests.filter((r) => r.status === "under_review"); // If you want to use this status
  const approved = requests.filter((r) => r.status === "approved");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-bbc-red">Approvals</h1>
        <p className="text-bbc-black">
          Review and approve pending change requests
        </p>
      </div>
      <div className="card shadow-none border-bbc-grey">
        {loading ? (
          <div>Loading approvals...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div className="space-y-8">
            {/* Submitted Section */}
            <div>
              <h2 className="text-xl font-bold text-bbc-red mb-2">Submitted</h2>
              {submitted.length === 0 ? (
                <div className="text-bbc-black">No submitted requests.</div>
              ) : (
                <table className="min-w-full bg-white rounded shadow mb-4">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-left">Requester</th>
                      <th className="px-4 py-2 text-left">Team</th>
                      <th className="px-4 py-2 text-left">User</th>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submitted.map((req) => (
                      <tr key={req.id} className="border-t">
                        <td className="px-4 py-2">{req.request_type}</td>
                        <td className="px-4 py-2">{req.requester_first_name} {req.requester_last_name}</td>
                        <td className="px-4 py-2">{req.team_name}</td>
                        <td className="px-4 py-2">{req.user_first_name} {req.user_last_name}</td>
                        <td className="px-4 py-2">{new Date(req.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-2">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleApprove(req.id)}
                            disabled={approving[req.id]}
                          >
                            {approving[req.id] ? "Approving..." : "Approve"}
                          </button>
                          <button
                            className="btn btn-danger btn-sm ml-2"
                            onClick={() => handleReject(req.id)}
                            disabled={rejecting[req.id]}
                          >
                            {rejecting[req.id] ? "Rejecting..." : "Reject"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {/* Under Review Section (if used) */}
            {underReview.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-bbc-red mb-2">Under Review</h2>
                <table className="min-w-full bg-white rounded shadow mb-4">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-left">Requester</th>
                      <th className="px-4 py-2 text-left">Team</th>
                      <th className="px-4 py-2 text-left">User</th>
                      <th className="px-4 py-2 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {underReview.map((req) => (
                      <tr key={req.id} className="border-t">
                        <td className="px-4 py-2">{req.request_type}</td>
                        <td className="px-4 py-2">{req.requester_first_name} {req.requester_last_name}</td>
                        <td className="px-4 py-2">{req.team_name}</td>
                        <td className="px-4 py-2">{req.user_first_name} {req.user_last_name}</td>
                        <td className="px-4 py-2">{new Date(req.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Approved Section */}
            <div>
              <h2 className="text-xl font-bold text-bbc-red mb-2">Approved</h2>
              {approved.length === 0 ? (
                <div className="text-bbc-black">No approved requests.</div>
              ) : (
                <table className="min-w-full bg-white rounded shadow mb-4">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-left">Requester</th>
                      <th className="px-4 py-2 text-left">Team</th>
                      <th className="px-4 py-2 text-left">User</th>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Approved By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approved.map((req) => (
                      <tr key={req.id} className="border-t">
                        <td className="px-4 py-2">{req.request_type}</td>
                        <td className="px-4 py-2">{req.requester_first_name} {req.requester_last_name}</td>
                        <td className="px-4 py-2">{req.team_name}</td>
                        <td className="px-4 py-2">{req.user_first_name} {req.user_last_name}</td>
                        <td className="px-4 py-2">{new Date(req.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-2">{req.approver_first_name} {req.approver_last_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Approvals;

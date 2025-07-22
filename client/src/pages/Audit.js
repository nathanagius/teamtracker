import React, { useEffect, useState } from "react";
import api from "../services/api";

function Audit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      try {
        const res = await api.get("/audit");
        setLogs(res.data);
        setError("");
      } catch (err) {
        setError("Failed to fetch audit logs");
      }
      setLoading(false);
    }
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-bbc-red">Audit Log</h1>
        <p className="text-bbc-black">
          View system audit trail and change history
        </p>
      </div>
      <div className="card shadow-none border-bbc-grey">
        {loading ? (
          <div>Loading audit logs...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">User</th>
                  <th className="px-4 py-2 text-left">Action</th>
                  <th className="px-4 py-2 text-left">Summary</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-bbc-black">
                      No audit logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const user = log.first_name
                      ? `${log.first_name} ${log.last_name}`
                      : "System";
                    const date = new Date(log.timestamp);
                    return (
                      <tr key={log.id} className="border-t">
                        <td className="px-4 py-2">{user}</td>
                        <td className="px-4 py-2">{log.action}</td>
                        <td className="px-4 py-2">{log.summary || '-'}</td>
                        <td className="px-4 py-2">{date.toLocaleDateString()}</td>
                        <td className="px-4 py-2">{date.toLocaleTimeString()}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Audit;

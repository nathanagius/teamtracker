import React from "react";
import { useParams } from "react-router-dom";

function TeamDetail() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Details</h1>
        <p className="text-gray-600">Team ID: {id}</p>
      </div>
      <div className="card">
        <p className="text-gray-600">Team detail page coming soon...</p>
      </div>
    </div>
  );
}

export default TeamDetail;

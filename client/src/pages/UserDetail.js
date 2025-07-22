import React from "react";
import { useParams } from "react-router-dom";

function UserDetail() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
        <p className="text-gray-600">User ID: {id}</p>
      </div>
      <div className="card">
        <p className="text-gray-600">User detail page coming soon...</p>
      </div>
    </div>
  );
}

export default UserDetail;

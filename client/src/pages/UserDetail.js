import React from "react";
import { useParams } from "react-router-dom";

function UserDetail() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-bbc-red">User Details</h1>
        <p className="text-bbc-black">User ID: {id}</p>
      </div>
      <div className="card shadow-none border-bbc-grey">
        <p className="text-bbc-black">User detail page coming soon...</p>
      </div>
    </div>
  );
}

export default UserDetail;

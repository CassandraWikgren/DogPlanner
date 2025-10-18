"use client";

import { useAuth } from "../context/AuthContext";

export default function AuthDebug() {
  const { user, profile, loading, currentOrgId, role } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Debug</h1>
      <div className="space-y-4">
        <div>
          <strong>Loading:</strong> {loading ? "Yes" : "No"}
        </div>
        <div>
          <strong>User:</strong>
          <pre className="bg-gray-100 p-2 mt-2 rounded">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
        <div>
          <strong>Profile:</strong>
          <pre className="bg-gray-100 p-2 mt-2 rounded">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>
        <div>
          <strong>Current Org ID:</strong> {currentOrgId || "Not set"}
        </div>
        <div>
          <strong>Role:</strong> {role || "Not set"}
        </div>
      </div>
    </div>
  );
}

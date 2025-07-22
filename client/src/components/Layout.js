import React from "react";
import { useAuth } from "./AuthContext";

function Layout({ children }) {
  const { user, logout } = useAuth();
  // Role-based nav
  const isSuperAdmin = user?.app_role === "super_admin";
  const isTeamLead = user?.app_role === "team_lead";
  const isReadOnly = user?.app_role === "read_only";

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <div className="font-bold text-lg">Team Tracker</div>
          <div className="mt-2 text-xs text-gray-500">{user?.email}</div>
          <div className="text-xs text-gray-400">
            {user?.app_role?.replace("_", " ")}
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="/" className="block nav-link">
            Dashboard
          </a>
          <a href="/teams" className="block nav-link">
            Teams
          </a>
          <a href="/users" className="block nav-link">
            Users
          </a>
          <a href="/skills" className="block nav-link">
            Skills
          </a>
          <a href="/capabilities" className="block nav-link">
            Capabilities
          </a>
          <a href="/hierarchy" className="block nav-link">
            Hierarchy
          </a>
          {!isReadOnly && (
            <a href="/changes" className="block nav-link">
              Team Changes
            </a>
          )}
          {(isSuperAdmin || isTeamLead) && (
            <a href="/approvals" className="block nav-link">
              Approvals
            </a>
          )}
          {isSuperAdmin && (
            <a href="/audit" className="block nav-link">
              Audit Log
            </a>
          )}
        </nav>
        <div className="p-4 border-t">
          <button onClick={logout} className="btn btn-secondary w-full">
            Logout
          </button>
        </div>
      </aside>
      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}

export default Layout;

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Users,
  Building2,
  Brain,
  Target,
  GitBranch,
  FileText,
  CheckCircle,
  Activity,
  Menu,
  X,
  BarChart3,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Teams", href: "/teams", icon: Building2 },
  { name: "Users", href: "/users", icon: Users },
  { name: "Skills", href: "/skills", icon: Brain },
  { name: "Capabilities", href: "/capabilities", icon: Target },
  { name: "Hierarchy", href: "/hierarchy", icon: GitBranch },
  { name: "Changes", href: "/changes", icon: FileText },
  { name: "Approvals", href: "/approvals", icon: CheckCircle },
  { name: "Audit", href: "/audit", icon: Activity },
];

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-bbc-grey-light">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? "block" : "hidden"
        }`}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-bbc-white border-bbc-grey">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-2xl font-bold text-bbc-red">Team Tracker</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-bbc-black hover:text-bbc-red"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-bbc-black text-sm font-medium rounded-md ${
                    isActive
                      ? "bg-bbc-red text-bbc-white"
                      : "hover:bg-bbc-grey-light hover:text-bbc-red"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-bbc-white border-bbc-grey">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-2xl font-bold text-bbc-red">Team Tracker</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-bbc-black text-sm font-medium rounded-md ${
                    isActive
                      ? "bg-bbc-red text-bbc-white"
                      : "hover:bg-bbc-grey-light hover:text-bbc-red"
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-bbc-grey bg-bbc-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-bbc-black lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;

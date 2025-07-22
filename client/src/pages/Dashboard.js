import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Building2,
  Brain,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { teamsAPI, usersAPI, changesAPI } from "../services/api";

function Dashboard() {
  const [stats, setStats] = useState({
    teams: 0,
    users: 0,
    pendingChanges: 0,
    activeMembers: 0,
  });
  const [recentTeams, setRecentTeams] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          teamsResponse,
          usersResponse,
          pendingChangesResponse,
          changesResponse,
        ] = await Promise.all([
          teamsAPI.getAll(),
          usersAPI.getAll(),
          changesAPI.getPendingCount(),
          changesAPI.getByStatus("pending"),
        ]);

        setStats({
          teams: teamsResponse.data.length,
          users: usersResponse.data.length,
          pendingChanges: pendingChangesResponse.data.count,
          activeMembers: usersResponse.data.filter((user) => user.current_team)
            .length,
        });

        setRecentTeams(teamsResponse.data.slice(0, 5));
        setRecentUsers(usersResponse.data.slice(0, 5));
        setPendingChanges(changesResponse.data.slice(0, 5));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      name: "Total Teams",
      value: stats.teams,
      icon: Building2,
      href: "/teams",
      color: "bg-blue-500",
    },
    {
      name: "Total Users",
      value: stats.users,
      icon: Users,
      href: "/users",
      color: "bg-green-500",
    },
    {
      name: "Active Members",
      value: stats.activeMembers,
      icon: CheckCircle,
      href: "/users",
      color: "bg-purple-500",
    },
    {
      name: "Pending Changes",
      value: stats.pendingChanges,
      icon: Clock,
      href: "/approvals",
      color: "bg-yellow-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* People Working Graphic */}
      <div className="flex justify-center">
        <<img src="https://www.freepik.com/free-photo/happy-colleagues-sitting-office-coworking_8078308.htm#fromView=keyword&page=1&position=0&uuid=6c7d5413-37c6-456d-9193-5c784eb100bb&query=People+Working
        " alt="Team Photo" style="max-width:100%; height:auto;" /
          </g>
        </svg>
      </div>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-bbc-red">Dashboard</h1>
        <p className="text-bbc-black">Overview of your team management system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="card hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-bbc-black">{stat.name}</p>
                <p className="text-2xl font-bold text-bbc-black">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Teams */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-bbc-black">
              Recent Teams
            </h2>
            <Link
              to="/teams"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentTeams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between p-3 bg-bbc-grey rounded-lg"
              >
                <div>
                  <h3 className="font-medium text-bbc-black">{team.name}</h3>
                  <p className="text-sm text-bbc-black">
                    {team.member_count} members
                  </p>
                </div>
                <Link
                  to={`/teams/${team.id}`}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-bbc-black">
              Recent Users
            </h2>
            <Link
              to="/users"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-bbc-grey rounded-lg"
              >
                <div>
                  <h3 className="font-medium text-bbc-black">
                    {user.first_name} {user.last_name}
                  </h3>
                  <p className="text-sm text-bbc-black">{user.role}</p>
                </div>
                <Link
                  to={`/users/${user.id}`}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Changes */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-bbc-black">
              Pending Changes
            </h2>
            <Link
              to="/approvals"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all
            </Link>
          </div>
          {pendingChanges.length > 0 ? (
            <div className="space-y-3">
              {pendingChanges.map((change) => (
                <div
                  key={change.id}
                  className="flex items-center justify-between p-3 bg-bbc-grey border border-bbc-grey rounded-lg"
                >
                  <div>
                    <h3 className="font-medium text-bbc-black">
                      {change.request_type.replace("_", " ").toUpperCase()}
                    </h3>
                    <p className="text-sm text-bbc-black">
                      Requested by {change.requester_first_name}{" "}
                      {change.requester_last_name}
                    </p>
                    <p className="text-xs text-bbc-black">
                      {new Date(change.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Link to={`/approvals`} className="btn btn-primary text-sm">
                    Review
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-2 text-sm font-medium text-bbc-black">
                No pending changes
              </h3>
              <p className="mt-1 text-sm text-bbc-black">
                All change requests have been processed.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-bbc-black mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/teams"
            className="flex items-center p-3 border border-bbc-grey rounded-lg hover:bg-bbc-grey transition-colors"
          >
            <Building2 className="h-5 w-5 text-primary-600 mr-3" />
            <span className="text-sm font-medium">Create Team</span>
          </Link>
          <Link
            to="/users"
            className="flex items-center p-3 border border-bbc-grey rounded-lg hover:bg-bbc-grey transition-colors"
          >
            <Users className="h-5 w-5 text-primary-600 mr-3" />
            <span className="text-sm font-medium">Add User</span>
          </Link>
          <Link
            to="/skills"
            className="flex items-center p-3 border border-bbc-grey rounded-lg hover:bg-bbc-grey transition-colors"
          >
            <Brain className="h-5 w-5 text-primary-600 mr-3" />
            <span className="text-sm font-medium">Manage Skills</span>
          </Link>
          <Link
            to="/hierarchy"
            className="flex items-center p-3 border border-bbc-grey rounded-lg hover:bg-bbc-grey transition-colors"
          >
            <TrendingUp className="h-5 w-5 text-primary-600 mr-3" />
            <span className="text-sm font-medium">View Hierarchy</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

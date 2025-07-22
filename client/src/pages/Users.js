import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Users as UsersIcon, X } from "lucide-react";
import { usersAPI } from "../services/api";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "Engineer",
    hire_date: "",
    manager_id: null,
    department: "",
    location: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await usersAPI.create(formData);
      setShowAddModal(false);
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        role: "Engineer",
        hire_date: "",
        manager_id: null,
        department: "",
        location: "",
      });
      fetchUsers(); // Refresh the users list
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Failed to create user. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLocationSearch = async (query) => {
    if (!query) {
      setLocationResults([]);
      return;
    }
    setLocationLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}`
      );
      const data = await res.json();
      setLocationResults(data);
    } catch (e) {
      setLocationResults([]);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleLocationSelect = (place) => {
    setFormData((prev) => ({ ...prev, location: place.display_name }));
    setLocationResults([]);
    setLocationQuery("");
  };

  const filteredUsers = users.filter(
    (user) =>
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (!locationQuery) {
      setLocationResults([]);
      return;
    }
    const handler = setTimeout(() => {
      handleLocationSearch(locationQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [locationQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">
            Manage team members and their profiles
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user) => (
          <div key={user.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {user.first_name} {user.last_name}
                </h3>
                <p className="text-gray-600 text-sm mb-2">{user.email}</p>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      user.role === "Engineering Manager"
                        ? "bg-blue-100 text-blue-800"
                        : user.role === "Technical Product Owner"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                {user.current_team && (
                  <p className="text-sm text-gray-600 mb-4">
                    Team: {user.current_team}
                  </p>
                )}
                {user.skills && user.skills.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      Skills:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {user.skills.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {user.skills.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{user.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <Link
                to={`/users/${user.id}`}
                className="btn btn-secondary text-sm"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No users found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? "Try adjusting your search terms."
              : "Get started by adding a new user."}
          </p>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Add New User
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                    className="input w-full"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                    className="input w-full"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="input w-full"
                  placeholder="john.doe@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                  className="input w-full"
                >
                  <option value="Engineer">Engineer</option>
                  <option value="Technical Product Owner">
                    Technical Product Owner
                  </option>
                  <option value="Engineering Manager">
                    Engineering Manager
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hire Date
                </label>
                <input
                  type="date"
                  name="hire_date"
                  value={formData.hire_date}
                  onChange={handleInputChange}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="Engineering"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={(e) => {
                    handleInputChange(e);
                    setLocationQuery(e.target.value);
                  }}
                  className="input w-full"
                  placeholder="San Francisco, CA"
                  autoComplete="off"
                />
                {/* Inline Location Finder Section */}
                {(locationQuery ||
                  locationResults.length > 0 ||
                  locationLoading) && (
                  <div className="mt-2 border border-gray-300 rounded-lg bg-white">
                    <div className="p-2">
                      {locationLoading && (
                        <div className="flex items-center justify-center py-2 text-gray-500 text-sm">
                          Loading...
                        </div>
                      )}
                      {!locationLoading &&
                        locationResults.length === 0 &&
                        locationQuery && (
                          <div className="text-gray-500 text-sm py-2 text-center">
                            No results found
                          </div>
                        )}
                      {!locationLoading &&
                        locationResults.map((place) => (
                          <div
                            key={place.place_id}
                            className="cursor-pointer px-3 py-2 hover:bg-primary-50 rounded-lg text-sm transition-colors"
                            onClick={() => {
                              handleLocationSelect(place);
                              setLocationQuery("");
                            }}
                          >
                            {place.display_name}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;

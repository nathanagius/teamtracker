import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Teams from "./pages/Teams";
import TeamDetail from "./pages/TeamDetail";
import Users from "./pages/Users";
import UserDetail from "./pages/UserDetail";
import Skills from "./pages/Skills";
import Capabilities from "./pages/Capabilities";
import Hierarchy from "./pages/Hierarchy";
import Changes from "./pages/Changes";
import Approvals from "./pages/Approvals";
import Audit from "./pages/Audit";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/teams/:id" element={<TeamDetail />} />
        <Route path="/users" element={<Users />} />
        <Route path="/users/:id" element={<UserDetail />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/capabilities" element={<Capabilities />} />
        <Route path="/hierarchy" element={<Hierarchy />} />
        <Route path="/changes" element={<Changes />} />
        <Route path="/approvals" element={<Approvals />} />
        <Route path="/audit" element={<Audit />} />
      </Routes>
    </Layout>
  );
}

export default App;

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import AdminDashboard from "./components/AdminDashboard";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        {/* Legacy paths mentioned in user guide */}
        <Route path="/landing-final.html" element={<LandingPage />} />
        <Route path="/admin-dashboard.html" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

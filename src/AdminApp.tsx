import React from "react";
import AdminLayout from "./layout/AdminLayout";

interface AdminAppProps {
  setIsAuthenticated: (val: boolean) => void;
}

/**
 * Main entry point for the entire Admin application
 * This component wraps AdminLayout which provides:
 * - Sidebar navigation with BUILDER and AUTOMAZIONI areas
 * - Main content area with proper switching between areas
 * - Logout functionality
 */
export default function AdminApp({ setIsAuthenticated }: AdminAppProps) {
  return (
    <AdminLayout setIsAuthenticated={setIsAuthenticated} />
  );
}

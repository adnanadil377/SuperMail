// src/routes/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuth from "./useAuth"; // Your custom auth hook
import Sidebar from "../components/Sidebar"; // Sidebar component

const ProtectedRoute = ({ redirectPath = "/login", children }) => {
  const { isAuthenticated, loading, logout } = useAuth();

  // Show loading UI while checking authentication
  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-screen text-white"
        role="status"
        aria-live="polite"
      >
        Loading...
      </div>
    );
  }

  // If not authenticated, redirect to login (or custom path)
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  // Authenticated: render children if passed, else default layout with Sidebar + nested route
  return children ? (
    children
  ) : (
    <div className="min-h-[100vh] bg-gray-950 flex flex-row p-1 text-white">
      <Sidebar onLogout={logout} />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedRoute;

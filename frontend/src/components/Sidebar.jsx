import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, MessageCircleMore, UserRoundPen, Mail, ChartArea } from "lucide-react";

const Sidebar = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if the path is active
  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const navItems = [
    { path: "/", label: "Chats", icon: <MessageCircleMore /> },
    { path: "/all-mails", label: "All Mails", icon: <Mail /> },
    { path: "/chat", label: "chat", icon: <ChartArea /> },
    { path: "/settings", label: "Profile", icon: <UserRoundPen /> },
  ];

  return (
    <aside className="hidden md:flex flex-col justify-between min-w-15 p-2">
      {/* Top Section */}
      <div>
        {/* Logo */}
        <div className="mb-2 rounded-2xl px-2 py-2 text-center text-3xl">
          🌀
        </div>

        {/* Navigation */}
        {navItems.map(({ path, label, icon }) => (
          <div
            key={path}
            onClick={() => navigate(path)}
            className={`mb-2 cursor-pointer rounded-2xl px-2 py-2 text-center transition-all ${
              isActive(path)
                ? "bg-blue-700 text-white"
                : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            <center>{icon}</center>
            <div>{label}</div>
          </div>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full rounded-lg bg-red-500 p-2 text-white transition-all hover:bg-red-600"
      >
        <center>
          <LogOut size={18} />
        </center>
      </button>
    </aside>
  );
};

export default Sidebar;

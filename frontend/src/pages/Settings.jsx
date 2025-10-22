import React, { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import SidebarMob from "../components/SidebarMob";
import useAuth from "../auth/useAuth";

const settings = [
  { name: "Contacts", path: "contacts" },
  { name: "Profile", path: "profile" },
  { name: "Connect Gmail", path: "connect" },
];

const Settings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();

  const handleLogout = () => {
    console.log("Logging out...");
    logout?.();
  };

  return (
    <div className="flex h-[98vh] flex-row bg-gray-950 p-1 text-white">
      {/* Sidebar */}
      <aside className="w-full overflow-y-auto rounded-3xl bg-[#212121] text-white md:w-1/6">
        <header className="my-2 flex px-3 md:block">
          {/* Mobile Menu Icon */}
          <div className="flex p-4 md:hidden">
            {!sidebarOpen && <Menu onClick={() => setSidebarOpen(true)} />}
          </div>

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-gray-900 bg-opacity-95"
              onClick={() => setSidebarOpen(false)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <SidebarMob
                  onLogout={handleLogout}
                  onClose={() => setSidebarOpen(false)}
                />
              </div>
            </div>
          )}

          <h1 className="p-2 text-4xl font-bold">Settings</h1>
        </header>

        {/* Navigation Links */}
        <ul>
          {settings.map(({ name, path }) => (
            <li key={path}>
              <NavLink
                to={path}
                end
                className={({ isActive }) =>
                  `block m-2 rounded-2xl p-3 transition-colors cursor-pointer ${
                    isActive
                      ? "bg-gray-700 font-semibold"
                      : "hover:bg-gray-700"
                  }`
                }
              >
                {name}
              </NavLink>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Content */}
      <main className="w-full p-4 md:w-9/12">
        <Outlet />
      </main>
    </div>
  );
};

export default Settings;

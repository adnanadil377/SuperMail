import React from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, MessageCircleMore, UserRoundPen } from 'lucide-react';

const Sidebar = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Helper to check if a path is currently active
  const isActive = (path) => location.pathname === path;

  return (
    <div className='hidden min-w-15 flex-col p-2 md:flex justify-between'>
      <div>
        {/* Logo / Header */}
        <div className='rounded-2xl px-2 py-2 mb-2 text-center'>
          <div className='text-3xl'>🌀</div>
        </div>

        {/* Chats */}
        <div
          className={`rounded-2xl px-2 py-2 mb-2 text-center cursor-pointer transition-all ${
            isActive('/') ? 'bg-blue-700 text-white' : 'text-gray-300 hover:bg-gray-700'
          }`}
          onClick={() => navigate("/")}
        >
          <center><MessageCircleMore /></center>
          <div>Chats</div>
        </div>

        {/* Profile */}
        <div
          className={`rounded-2xl px-2 py-2 mb-2 text-center cursor-pointer transition-all ${
            isActive('/contacts') ? 'bg-blue-700 text-white' : 'text-gray-300 hover:bg-gray-700'
          }`}
          onClick={() => navigate("/contacts")}
        >
          <center><UserRoundPen /></center>
          <div>Profile</div>
        </div>
      </div>

      {/* Logout Button */}
      <div>
        <button
          onClick={onLogout}
          className='bg-red-500 text-white p-2 rounded-lg w-full hover:bg-red-600 transition-all'
        >
          <center>
            <LogOut size={18} />
          </center>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

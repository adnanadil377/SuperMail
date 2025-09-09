import React from 'react';
import { LogOut } from 'lucide-react';

const Sidebar = ({ onLogout }) => {
  return (
    <div className='min-w-15 flex-col p-2 flex justify-between'>
      <div>
        <div className='bg-purple-700 rounded-2xl px-2 py-2 mb-2 text-center'>
          <div>💬</div>
          <div>Chats</div>
        </div>
        <div className='bg-purple-700 rounded-2xl px-2 py-2 mb-2 text-center'>
          <div>👤</div>
          <div>Profile</div>
        </div>
      </div>
      <div>
        <button onClick={onLogout} className='bg-red-500 text-white p-2 rounded-lg'>
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
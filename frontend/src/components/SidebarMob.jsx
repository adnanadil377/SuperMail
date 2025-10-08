import React from 'react'
import { LogOut, X } from 'lucide-react';
import { MessageCircleMore, UserRoundPen  } from 'lucide-react';

const SidebarMob = ({ onLogout, onClose }) => {
  return (
    <div className='fixed top-0 left-0 h-full w-64 bg-slate-800 text-white shadow-lg z-50 p-4 flex flex-col justify-between'>
      <div>
        <div className='flex justify-between items-center mb-4'>
          <div className='text-3xl'>🌀</div>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        <div className='bg-blue-900 rounded-2xl px-2 py-2 mb-2 text-center'>
          <center><MessageCircleMore /></center>
          <div>Chats</div>
        </div>
        <div className='rounded-2xl px-2 py-2 mb-2 text-center'>
          <center><UserRoundPen /></center>
          <div>Profile</div>
        </div>
      </div>
      <div>
        <button onClick={onLogout} className='bg-red-500 text-white p-2 rounded-lg w-full'>
          <center><LogOut size={18} /></center>
        </button>
      </div>
    </div>
  );
};

export default SidebarMob;

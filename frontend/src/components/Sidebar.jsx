import React from 'react';
import { LogOut } from 'lucide-react';
import { MessageCircleMore, UserRoundPen  } from 'lucide-react';

const Sidebar = ({ onLogout }) => {
  return (
    <div className='hidden min-w-15 flex-col p-2 md:flex justify-between'>
      <div>
        <div className='rounded-2xl px-2 py-2 mb-2 text-center'>
          <div className='text-3xl'>🌀</div>
          {/* <div>Chats</div> */}
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
            <center>
                <LogOut size={18} />
            </center>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
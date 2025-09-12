import React, { useState } from 'react';
import { Menu, Sidebar } from 'lucide-react';
import SidebarMob from './SidebarMob';

// A small, reusable component for a single contact
const ContactItem = ({ contact, isActive, onContactSelect }) => {
  return (
    <li
      onClick={() => onContactSelect(contact.email)}
      className={`p-3 m-2 rounded-2xl cursor-pointer transition-colors ${
        isActive ? 'bg-slate-600' : 'hover:bg-slate-700'
      }`}
    >
      <div className="font-bold">{contact.name}</div>
      <div className="text-sm text-gray-400">{contact.email}</div>
    </li>
  );
};


const ContactList = ({ contacts, activeContactEmail, onContactSelect, onLogout }) => {
  const [sidebar, setSidebar] = useState(false)
  return (
    <div className='w-full md:w-3/12 rounded-3xl bg-[#212121] text-white overflow-y-auto'>
      <div className='flex md:block px-3 my-2'>
        <div className='flex md:hidden p-4'>
          {!sidebar && <Menu onClick={() => setSidebar(true)} />}
        </div>

        {sidebar && (
          <div className="fixed inset-0 bg-gray-900 opacity-95 z-40" onClick={() => setSidebar(false)}>
            <SidebarMob onLogout={onLogout} onClose={() => setSidebar(false)} />
          </div>
        )}
        <input 
          type='text' 
          placeholder='Search' 
          className='flex mt-2 mx-auto p-3 shadow-2xs shadow-purple-300 w-full rounded-2xl bg-slate-700 outline-none'
        />
      </div>
      {contacts.length > 0 ? (
        <ul>
          {contacts.map(c => (
            <ContactItem 
              key={c.id} 
              contact={c} 
              onContactSelect={onContactSelect}
              isActive={c.email === activeContactEmail}
            />
          ))}
        </ul>
      ) : (
        <p className="text-center p-4">Loading contacts...</p>
      )}
    </div>
  );
};

export default ContactList;
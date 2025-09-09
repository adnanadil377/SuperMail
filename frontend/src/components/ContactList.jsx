import React from 'react';

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


const ContactList = ({ contacts, activeContactEmail, onContactSelect }) => {
  return (
    <div className='w-3/12 rounded-3xl bg-slate-800 text-white overflow-y-auto'>
      <div className='px-3 my-2'>
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
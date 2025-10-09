import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react';

const ContactItem = ({ contact, onContactSelect }) => {
  return (
    <li
      onClick={() => onContactSelect(contact.email)}
      className={'p-3 m-2 rounded-2xl cursor-pointer transition-colors hover:bg-slate-700'}
    >
      <div className="font-bold">{contact.name}</div>
      <div className="text-sm text-gray-400 overflow-clip">{contact.email}</div>
      <div className="text-sm text-gray-400 overflow-clip">{contact.tone}</div>
      <div className="text-sm text-gray-400 overflow-clip">{contact.relation}</div>
    </li>
  );
};
const Contacts = () => {
    const [error, setError] = useState(null)
    const [contacts, setContacts] = useState([])
    const [editingContact, setEditingContact] = useState(false)
    useEffect(() => {
        axios.get("http://127.0.0.1:8000/contactapi/contacts/")
        .then(response => {
            setContacts(response.data);
        })
        .catch(error => {
            console.error("Failed to fetch contacts:", error);
            setError(error)
        });

    }, []);

    const CreateModal = ({ setEditingContact, onCreated }) => {
        const [contactData, setContactData] = useState({
            name: "",
            email: "",
            relation: "",
            tone: "",
        });
        const handleChange = (e) => {
            const { name, value } = e.target;
            setContactData((prev) => ({ ...prev, [name]: value }));
        };

        const handleSubmit = async (e) => {
            e.preventDefault();
            try {
                await axios.post("http://127.0.0.1:8000/contactapi/contacts/", contactData);
                onCreated?.(); // refresh parent list if provided
                setEditingContact(false); // close modal
            } catch (err) {
                console.error("Failed to create contact:", err);
            }
        };

        return (
            <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-20">
            <div className="bg-slate-800 text-white p-4 rounded-3xl w-96">
                <div className="flex justify-between items-center mb-3">
                <div className="text-xl font-semibold">Create Contact</div>
                <X
                    size={20}
                    className="cursor-pointer hover:text-red-400"
                    onClick={() => setEditingContact(false)}
                />
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col">
                <input
                    name="name"
                    type="text"
                    placeholder="Name"
                    value={contactData.name}
                    onChange={handleChange}
                    className="w-full bg-gray-950 rounded-xl p-2 my-1"
                />
                <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={contactData.email}
                    onChange={handleChange}
                    className="w-full bg-gray-950 rounded-xl p-2 my-1"
                />
                <input
                    name="relation"
                    type="text"
                    placeholder="Relation"
                    value={contactData.relation}
                    onChange={handleChange}
                    className="w-full bg-gray-950 rounded-xl p-2 my-1"
                />
                <input
                    name="tone"
                    type="text"
                    placeholder="Tone"
                    value={contactData.tone}
                    onChange={handleChange}
                    className="w-full bg-gray-950 rounded-xl p-2 my-1"
                />

                <button
                    type="submit"
                    className="w-full bg-blue-700 hover:bg-blue-800 rounded-xl p-2 my-1 font-semibold"
                >
                    Create
                </button>
                </form>
            </div>
            </div>
        );
    };


  return (
    <div className='w-full md:ml-1 rounded-4xl bg-[#212121] text-white flex flex-col h-full p-5'>
        <h2 className="text-4xl font-bold mb-4">Contacts</h2>
        <button className='bg-blue-400 w-40 p-2 rounded-2xl cursor-pointer' onClick={()=>setEditingContact(true)}>Create New Contact</button>
        {error ? (
            <div>error</div>
         ) : (
         <div>
            {contacts.length > 0 ? (
        <ul>
          {contacts.map(c => (
            <ContactItem 
              key={c.id} 
              contact={c}
            />
                ))}
                </ul>
            ) : (
                <p className="text-center p-4">Loading contacts...</p>
            )}
         </div>
         )}
         {editingContact && (
            <CreateModal setEditingContact={setEditingContact}/>
         )}
    </div>
  )
}

export default Contacts
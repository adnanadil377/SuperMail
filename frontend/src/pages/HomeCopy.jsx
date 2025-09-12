import React, { useContext, useEffect, useState } from 'react';
import AuthContext from '../auth/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useAuth from '../auth/useAuth';
import Contact from '../components/Contact';
import { EllipsisVertical , ConstructionIcon, LogOut } from 'lucide-react';

const Home = () => {
  const { token, user, loading,logout, isAuthenticated } = useAuth();
  const [emails, setEmails] = useState([]);
  const [contact, setContact] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const navigate = useNavigate();
  const context = useContext(AuthContext)
  const [isActive, setIsActive] = useState("");
  console.log(context)

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    axios.get("http://127.0.0.1:8000/contactapi/contacts/")
      .then(response => {
        console.log("Contacts loaded:", response.data);
        setContact(response.data);
      })
      .catch(error => {
        console.error("Failed to fetch contacts:", error);
      });
  }, [loading, isAuthenticated, navigate]);

  const handleClick = async (email) => {
    console.log("clicked")
    setIsActive(email);
    try {
      const response = await axios.get(`http://127.0.0.1:8000/emails/?email=${email}`);
      const emailData = response.data.emails;
      setEmails(emailData); // Set array of emails
      setExpandedIndex(null); // Reset any open email
      console.log(emailData);
    } catch (error) {
      console.error("Failed to fetch email data:", error);
    }
  };

  const toggleExpand = (index) => {
    setExpandedIndex(prev => (prev === index ? null : index));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className='flex flex-row h-[99vh] pt-1 bg-gray-950'>
        {/* Left Sidebar */}
        <div className='min-w-15 flex-col p-2'>
          <div className='bg-purple-600 rounded-2xl px-2 mb-2'>
            <div>Img</div>
            <div>Chats</div>
          </div>
          <div className='bg-purple-600 rounded-2xl px-2 mb-2'>
            <div>Img</div>
            <div>Profile</div>
          </div>
          <div className='pb-0'><button onClick={()=>logout()} className='bg-red-500 text-white p-1 rounded-lg'><LogOut /></button></div>
        </div>

        {/* Contacts List */}
        <div className='w-3/12 rounded-3xl bg-slate-800 text-white overflow-y-auto'>
          <div className='px-3 my-2'>
            <input type='text' placeholder='search' className='flex mt-2 mx-auto p-3 shadow-2xs shadow-purple-300 w-full rounded-2xl'/>
          </div>
          {contact ? (
            <ul>
              {contact.map(c => (
                <Contact key={c.id} c={c} handleClick={handleClick} isActive={c.email==isActive}/>
              ))}
            </ul>
          ) : (
            <p>Loading contacts...</p>
          )}
        </div>

        {/* Main Email Display Area */}
        <div className='w-8/12 ml-1 rounded-4xl bg-gray-800 text-white flex flex-col'>
          {emails.length !== 0 ? (
            // This container now uses flexbox to manage its children's layout
            <div className='h-full flex flex-col'>
              
              {/* Header */}
              <div className='flex flex-row justify-between px-5 bg-slate-700 rounded-4xl m-2 shadow-xs'>
                <div className='text-3xl font-bold p-3'>{isActive}</div>
                <div className='p-4'><EllipsisVertical /></div>
              </div>
              
              {/* Scrollable Email List */}
              {/* 'flex-grow' makes this div take up all available vertical space */}
              <div className='flex-grow overflow-y-auto p-2'>
                {emails.map((email, index) => {
                  const isIncoming = email.from !== user?.email;
                  return (
                    <div
                      key={email.message_id}
                      className={`flex ${isIncoming ? 'justify-start' : 'justify-end'} mb-4`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-2xl shadow-md ${
                          isIncoming
                            ? 'bg-slate-600 text-white rounded-bl-sm'
                            : 'bg-purple-600 text-white rounded-br-sm'
                        }`}
                      >
                        <p className="font-semibold">{email.subject}</p>
                        
                        {expandedIndex === index ? (
                          <p className="mt-2 text-sm whitespace-pre-wrap">{email.body}</p>
                        ) : (
                          <p className="mt-2 text-sm text-gray-200 line-clamp-2">
                            {email.body}
                          </p>
                        )}
                        
                        <button
                          onClick={() => toggleExpand(index)}
                          className="mt-2 text-xs text-blue-300 hover:underline"
                        >
                          {expandedIndex === index ? 'Hide Body' : 'Read More'}
                        </button>

                        <div className="text-[10px] text-gray-300 mt-2 flex justify-between">
                          <span>{email.from}</span>
                          <span>{new Date(email.date).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input Box - No longer needs absolute positioning */}
              <div className='flex flex-row items-center px-5 bg-slate-700 rounded-3xl m-3 shadow-xs shadow-purple-300'>
                <input 
                  type='text' 
                  placeholder='Type something...' 
                  className='flex-1 bg-transparent outline-none text-base p-3 text-white'
                />
              </div>

            </div>
          ) : (
            <p className="flex items-center justify-center h-full">Select a contact to view emails.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { EllipsisVertical } from 'lucide-react';
import EmailMessage from './EmailMessage'; // Import the new component
import useAuth from '../auth/useAuth';

const EmailDisplay = ({ activeContactEmail }) => {
  const [emails, setEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null); // Add error state
  const { user } = useAuth();

  useEffect(() => {
    // Don't fetch if no contact is selected
    if (!activeContactEmail) {
      setEmails([]);
      setError(null); // Clear error when no contact is selected
      return;
    }

    const fetchEmails = async () => {
      setIsLoading(true);
      setError(null); // Reset error before fetching
      try {
        const response = await axios.get(`http://127.0.0.1:8000/emails/?email=${activeContactEmail}`);
        setEmails(response.data.emails);
      } catch (error) {
        console.error("Failed to fetch email data:", error);
        setError(
          error.response?.status === 401
            ? "You are not authorized. Please log in again."
            : "Failed to fetch emails. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmails();
  }, [activeContactEmail]); // Re-run this effect ONLY when the active contact changes

  if (!activeContactEmail) {
    return (
      <div className="hidden md:w-8/12 md:ml-1 rounded-4xl bg-[#212121] text-white md:flex items-center justify-center h-full">
        <p>Select a contact to view emails.</p>
      </div>
    );
  }

  return (
    <div className='w-full md:ml-1 rounded-4xl bg-[#212121] text-white flex flex-col h-full'>
      {/* Header */}
      <div className='flex flex-row justify-between px-5 bg-[#212121] rounded-4xl m-2 shadow-xs'>
        <div className='text-xl font-bold p-3'>{activeContactEmail}</div>
        <div className='p-4'><EllipsisVertical /></div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-600 text-white p-2 m-2 rounded text-center">
          {error}
        </div>
      )}

      {/* Scrollable Email List */}
      <div className='flex-grow overflow-y-auto p-2'>
        {isLoading ? (
            <p>Loading emails...</p>
        ) : (
            emails.slice().reverse().map((email) => (
                <EmailMessage key={email.message_id} email={email} currentUserEmail={user?.email} />
            ))
        )}
      </div>

      {/* Input Box */}
      <div className='flex flex-row items-center px-5 bg-slate-700 rounded-3xl m-3 shadow-xs shadow-purple-300'>
        <input 
          type='text' 
          placeholder='Type something...' 
          className='flex-1 bg-transparent outline-none text-base p-3 text-white'
        />
      </div>
    </div>
  );
};

export default EmailDisplay;
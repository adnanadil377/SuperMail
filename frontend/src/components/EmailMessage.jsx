import React, { useState } from 'react';

const EmailMessage = ({ email, currentUserEmail }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isIncoming = email.from !== currentUserEmail;

  const toggleExpand = () => setIsExpanded(prev => !prev);

  return (
    <div className={`flex ${isIncoming ? 'justify-start' : 'justify-end'} mb-4`}>
      <div
        className={`max-w-[70%] p-3 rounded-2xl shadow-md ${
          isIncoming
            ? 'bg-slate-600 text-white rounded-bl-sm'
            : 'bg-purple-600 text-white rounded-br-sm'
        }`}
      >
        <p className="font-semibold">{email.subject}</p>
        
        <p className={`mt-2 text-sm ${!isExpanded ? 'line-clamp-2 text-gray-200' : 'whitespace-pre-wrap'}`}>
          {email.body}
        </p>
        
        <button
          onClick={toggleExpand}
          className="mt-2 text-xs text-blue-300 hover:underline"
        >
          {isExpanded ? 'Hide Body' : 'Read More'}
        </button>

        <div className="text-[10px] text-gray-300 mt-2 flex justify-between">
          <span>{email.from}</span>
          <span>{new Date(email.date).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default EmailMessage;
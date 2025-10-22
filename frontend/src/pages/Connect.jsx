import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const Connect = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const location = useLocation(); // ✅ Correct way to access query params

  const handleClick = () => {
    axios
      .get('http://127.0.0.1:8000/auth')
      .then((response) => {
        window.open(response.data.auth_url, '_self'); // ✅ open in same tab
      })
      .catch((err) => {
        console.error('Failed to connect', err);
        setError('Failed to start Google Auth.');
      });
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const googleAuthStatus = queryParams.get('google_auth');

    if (googleAuthStatus === 'success') {
      setSuccess('Successfully connected your Gmail account.');
    } else if (googleAuthStatus === 'error') {
      setError('Failed to connect Gmail account.');
    }
  }, [location.search]);

  return (
    <div className="w-full md:ml-1 rounded-4xl bg-[#212121] text-white flex flex-col h-full p-5">
      <div className="text-4xl font-bold mb-4">Connect</div>

      {success && <div className="text-green-400 mb-3">{success}</div>}
      {error && <div className="text-red-400 mb-3">{error}</div>}

      <button
        onClick={handleClick}
        className="p-2 bg-blue-600 rounded-2xl cursor-pointer"
      >
        Click here to connect Gmail
      </button>
    </div>
  );
};

export default Connect;

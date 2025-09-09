import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useAuth from '../auth/useAuth';

// Import the new components
import Sidebar from '../components/Sidebar';
import ContactList from '../components/ContactList';
import EmailDisplay from '../components/EmailDisplay';

const Home = () => {
  const { loading, logout, isAuthenticated } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [activeContactEmail, setActiveContactEmail] = useState(null);
  const navigate = useNavigate();

  // Effect for auth check and fetching the initial contact list
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    axios.get("http://127.0.0.1:8000/contactapi/contacts/")
      .then(response => {
        setContacts(response.data);
      })
      .catch(error => {
        console.error("Failed to fetch contacts:", error);
      });
  }, [loading, isAuthenticated, navigate]);

  const handleContactSelect = (email) => {
    setActiveContactEmail(email);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className='flex flex-row h-screen p-1 bg-gray-950 text-white'>
      <Sidebar onLogout={logout} />
      <ContactList 
        contacts={contacts} 
        activeContactEmail={activeContactEmail}
        onContactSelect={handleContactSelect}
      />
      <EmailDisplay activeContactEmail={activeContactEmail} />
    </div>
  );
};

export default Home;
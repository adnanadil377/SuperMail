import React from 'react'
import useAuth from '../auth/useAuth'
import AIEmailAgent from '../components/AIEmailAgent';

const AIChatPage = () => {
    const{user} = useAuth();
  return (
    <div>
        <AIEmailAgent
            user={user} 
            onSuccess={() => fetchEmails()} 
        />
    </div>
  )
}

export default AIChatPage
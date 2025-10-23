import React, { useEffect, useState } from 'react'
import axios from 'axios'

const Profile = () => {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/user/profile/")
      .then(res => {
        setProfile(res.data);
        setError("");
      })
      .catch(error => {
        console.error("Failed to fetch profile:", error);
        setError("Failed to fetch profile");
      });
  }, [])

  return (
    <div className='w-full md:ml-1 rounded-4xl bg-[#212121] text-white flex flex-col h-full p-5'>
      <div className='text-4xl font-bold mb-4'>Profile</div>
      {error && <div className="text-red-400 mb-3">{error}</div>}
      {profile ? (
        <div>
          <ul><strong>Username:</strong> {profile.username}</ul>
          <ul><strong>Email:</strong> {profile.email}</ul>
        </div>
      ) : (
        !error && <div>Loading...</div>
      )}
    </div>
  )
}

export default Profile
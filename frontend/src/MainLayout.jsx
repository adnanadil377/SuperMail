import React from 'react'
import { Link, Links, Outlet } from 'react-router-dom'
import NavBar from './components/NavBar'
const MainLayout = () => {
  return (
    <div className='min-h-[100vh] bg-gray-800'>
        {/* <NavBar /> */}
        <main>
            <Outlet />
        </main>
    </div>
  )
}

export default MainLayout
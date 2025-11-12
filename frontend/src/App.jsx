import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import MainLayout from './MainLayout';
import LoginPage from './auth/LoginPage';
import Settings from './pages/Settings';
import ProtectedRoute from './auth/ProtectedRoute';
import Connect from './pages/Connect';
import Contacts from './pages/Contacts';
import Profile from './pages/Profile';
import Signup from './auth/Signup';
import AllMails from './pages/AllMails';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<Signup />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home/>} />
            <Route path="/all-mails" element={<AllMails />} />
            <Route path="/settings" element={<Settings />}>
              <Route path="connect" element={<Connect />} />
              <Route path="contacts" element={<Contacts />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
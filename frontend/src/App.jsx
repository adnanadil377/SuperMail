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

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home/>} />
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
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const BASE_URL = "http://127.0.0.1:8000"; // Change if needed

const Signup = () => {
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 1. Check if passwords match
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // 2. Check for password length
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/user/register/`, {
        username: form.username,
        password: form.password
      });
      setSuccess('Signup successful! You can now log in.');
      setForm({ username: '', password: '', confirmPassword: '' });
      setTimeout(() => navigate('/login'), 1500); // Redirect after 1.5s
    } catch (err) {
      setError(
        err.response?.data?.username?.[0] ||
        err.response?.data?.password?.[0] ||
        'Signup failed'
      );
    }
    setLoading(false);
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    navigate('/login');
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen font-sans bg-black text-white">
      {/* Left Image Panel */}
      <div className="relative w-full md:w-1/2 flex items-center justify-center bg-black">
        <div
          className="absolute inset-0 bg-cover bg-center rounded-br-[40px] md:rounded-br-[80px]"
          style={{ zIndex: 0, opacity: 0.7 }}
        >
          <img
            src="./login-bg.webp"
            alt="Login background"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] min-h-[100vh] md:min-h-auto">
        <div className="w-full max-w-md space-y-8 p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl">
          {/* Logo */}
          <div className="text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              🌀 SuperMail
            </div>
          </div>

          {/* Welcome Text */}
          <div>
            <h2 className="text-3xl font-bold text-center text-white">
              Create Account
            </h2>
            <p className="text-center text-sm text-gray-400 mt-2">
              Enter your username and password to sign up
            </p>
          </div>

          {/* Error/Success */}
          {error && <div className="text-red-400 mb-3">{error}</div>}
          {success && <div className="text-green-400 mb-3">{success}</div>}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Enter your username"
                className="w-full px-4 py-3 border border-gray-700 rounded-xl bg-black text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-300 mb-1"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-700 rounded-xl bg-black text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-gray-300 mb-1"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your password"
                className="w-full px-4 py-3 border border-gray-700 rounded-xl bg-black text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl bg-blue-800 text-white font-medium hover:scale-[1.01] shadow-sm hover:shadow-blue-500/40 transition ${
                loading ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Signing up..." : "Sign Up"}
            </button>
          </form>

          {/* Login Prompt */}
          <p className="text-sm text-center text-gray-400">
            Already have an account?{" "}
            <a
              href="#"
              className="text-blue-400 font-medium hover:underline"
              onClick={handleLoginClick}
            >
              Log In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
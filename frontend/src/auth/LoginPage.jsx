import React, { memo, useEffect, useState } from "react";
import useAuth from "./useAuth";
import { useNavigate } from "react-router-dom";

const LoginPage = memo(() => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login(username, password);
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

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
              Welcome Back
            </h2>
            <p className="text-center text-sm text-gray-400 mt-2">
              Enter your email and password to access your account
            </p>
          </div>

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
                placeholder="Enter your username"
                className="w-full px-4 py-3 border border-gray-700 rounded-xl bg-black text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-300"
                >
                  Password
                </label>
                <a href="#" className="text-sm text-blue-400 hover:underline">
                  Forgot Password?
                </a>
              </div>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-700 rounded-xl bg-black text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                className="accent-blue-500 bg-black border-gray-600"
              />
              <label htmlFor="remember" className="text-sm text-gray-400">
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl bg-blue-800 text-white font-medium hover:scale-[1.01] shadow-sm hover:shadow-blue-500/40 transition ${
                loading ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Sign Up Prompt */}
          <p className="text-sm text-center text-gray-400">
            Don’t have an account?{" "}
            <a href="#" className="text-blue-400 font-medium hover:underline">
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
});

export default LoginPage;

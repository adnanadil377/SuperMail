import React, { useEffect, useState, useMemo, useCallback } from "react";
import AuthContext from "./AuthContext";
import axios from "axios";

// --- Helper: Safe JWT decoder (handles URL-safe base64) ---
const decodeJwt = (token) => {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch (e) {
    console.error("Failed to decode JWT:", e);
    return null;
  }
};

const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [refresh, setRefresh] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Helper: save token + refresh + axios header ---
  const saveTokens = useCallback((access, refreshToken) => {
    setToken(access);
    setRefresh(refreshToken);
    localStorage.setItem("authToken", access);
    localStorage.setItem("authRefresh", refreshToken);
    axios.defaults.headers.common["Authorization"] = `Bearer ${access}`;
  }, []);

  // --- Login function ---
  const login = useCallback(async (username, password) => {
    try {
      const response = await axios.post("http://127.0.0.1:8000/user/login/", {
        username,
        password,
      });

      console.log("Login success:", response.data);
      const { access, refresh } = response.data;
      saveTokens(access, refresh);
      const decoded = decodeJwt(access);
      setUser(decoded);
    } catch (error) {
      console.error("Login failed:", error);
    }
  }, [saveTokens]);

  // --- Refresh token function ---
  const refreshAccess = useCallback(async (refreshToken) => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/user/refresh/",
        { refresh: refreshToken }
      );
      axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.access}`
      const newAccess = response.data.access;
      saveTokens(newAccess, refreshToken);
      return newAccess;
    } catch (error) {
      console.error("Token refresh failed:", error);
      throw new Error("Unable to refresh token");
    }
  }, [saveTokens]);

  // --- Logout function ---
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setRefresh(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("authRefresh");
    delete axios.defaults.headers.common["Authorization"];
  }, []);

  // --- Watch token changes to update axios header automatically ---
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);
useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        // If 401 and not already retried
        if (
          error.response &&
          error.response.status === 401 &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;
          const refreshToken = localStorage.getItem("authRefresh");
          if (refreshToken) {
            try {
              const response = await axios.post(
                "http://127.0.0.1:8000/user/refresh/",
                { refresh: refreshToken }
              );
              const newAccess = response.data.access;
              // Save new token
              localStorage.setItem("authToken", newAccess);
              axios.defaults.headers.common["Authorization"] = `Bearer ${newAccess}`;
              originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;
              return axios(originalRequest); // Retry original request
            } catch (refreshError) {
              // Refresh failed, logout
              logout();
            }
          } else {
            logout();
          }
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [logout]);
  // --- On mount: check stored token or refresh if expired ---
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem("authToken");
        const storedRefresh = localStorage.getItem("authRefresh");

        if (!storedToken && !storedRefresh) {
          logout();
          return;
        }

        if (storedToken) {
          const decodedUser = decodeJwt(storedToken);

          if (decodedUser && decodedUser.exp * 1000 > Date.now()) {
            saveTokens(storedToken, storedRefresh);
            setUser(decodedUser);
            return;
          }

          if (storedRefresh) {
            try {
              const newAccess = await refreshAccess(storedRefresh);
              const newDecodedUser = decodeJwt(newAccess);
              setUser(newDecodedUser);
            } catch (err) {
              console.error("Refresh failed:", err);
              logout();
            }
          } else {
            logout();
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [logout, refreshAccess, saveTokens]);

  // --- Memoized context value ---
  const contextValue = useMemo(
    () => ({
      token,
      refresh,
      user,
      login,
      logout,
      loading,
      isAuthenticated: !!token,
    }),
    [token, refresh, user, login, logout, loading]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

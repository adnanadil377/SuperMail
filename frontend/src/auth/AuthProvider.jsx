import React, { useEffect, useState } from 'react'
import AuthContext from './AuthContext'
import axios from 'axios'

const decodeJwt = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        console.error("Failed to decode JWT:", e);
        return null;
    }
};


const AuthProvider = ({children}) => {
    const [token, setToken] = useState("")
    const [refresh, setRefresh] = useState("")
    const [user, setUser] = useState('')
    const [role, setRole] = useState("")
    const [loading, setLoading]= useState(true);

    console.log("auth mounted");
    const login = async(email,password) => {
        axios.post("http://127.0.0.1:8000/user/login/",{
            username:email,
            password:password
        })
        .then(response=>{
            console.log('Login success:',response.data)
            setToken(response.data.access)
            localStorage.setItem('authToken', response.data.access);
            setRefresh(response.data.refresh)
            localStorage.setItem('authRefresh', response.data.refresh);
            axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        })
        .catch(error => {
            console.log("login failed: ", error)
        })
    }
    const refreshAccess = async (refreshToken) => {
        try {
            const response = await axios.post("http://127.0.0.1:8000/user/refresh/", {
                refresh: refreshToken,
            });
            const newAccess = response.data.access;
            localStorage.setItem('authToken', newAccess);
            setToken(newAccess);
            return newAccess;
        } catch (error) {
            throw new Error("Unable to refresh token");
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setRefresh('');
        localStorage.removeItem('authToken');
        localStorage.removeItem('authRefresh');
        delete axios.defaults.headers.common['Authorization'];
    };

    useEffect(() => {
        const initializeAuth = async () => {
            const storedToken = localStorage.getItem('authToken');
            const storedRefresh = localStorage.getItem('authRefresh');
            
            if (storedToken) {
                const decodedUser = decodeJwt(storedToken);
                
                if (decodedUser && decodedUser.exp * 1000 > Date.now()) {
                    // Token is valid
                    setToken(storedToken);
                    setUser(decodedUser);
                    axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                } else if (storedRefresh) {
                    // Token expired — try refreshing
                    try {
                        const newAccess = await refreshAccess(storedRefresh);
                        const newDecodedUser = decodeJwt(newAccess);
                        setToken(newAccess);
                        setUser(newDecodedUser);
                        axios.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
                    } catch (error) {
                        console.error("Refresh token failed", error);
                        logout(); // Clear everything
                    }
                } else {
                    logout();
                }
            }    
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const context = {
        token,
        refresh,
        user,
        login,
        logout,
        loading,
        isAuthenticated: !!token,
    };
  return (
    <AuthContext.Provider value={context}>
        {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Token ${token}`;
            axios.get('http://127.0.0.1:8000/api/me/')
                .then(res => setUser(res.data))
                .catch(() => {
                    logout();
                });
        } else {
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
        }
    }, [token]);

    const login = async (username, password) => {
        const res = await axios.post('http://127.0.0.1:8000/api/login/', { username, password });
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        navigate('/');
    };

    const register = async (username, password) => {
        await axios.post('http://127.0.0.1:8000/api/register/', { username, password });
        await login(username, password);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

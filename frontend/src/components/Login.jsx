import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Login = () => {
    const { login } = useContext(AuthContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(username, password);
        } catch (err) {
            setError('Invalid username or password');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#1a73e8' }}>Log in to Docs</h2>
                {error && <div style={{ color: '#d93025', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <input 
                        type="text" 
                        placeholder="Username" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        style={{ padding: '12px', borderRadius: '4px', border: '1px solid #dadce0', fontSize: '16px' }}
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        style={{ padding: '12px', borderRadius: '4px', border: '1px solid #dadce0', fontSize: '16px' }}
                        required 
                    />
                    <button type="submit" style={{ padding: '12px', backgroundColor: '#1a73e8', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: '500', cursor: 'pointer', marginTop: '8px' }}>
                        Log In
                    </button>
                </form>
                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
                    Don't have an account? <Link to="/register" style={{ color: '#1a73e8', textDecoration: 'none' }}>Register</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;

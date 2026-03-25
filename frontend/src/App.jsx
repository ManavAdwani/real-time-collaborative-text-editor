import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DocumentList from './components/DocumentList';
import Editor from './components/Editor';
import Login from './components/Login';
import Register from './components/Register';
import { AuthProvider, AuthContext } from './context/AuthContext';

const PrivateRoute = ({ children }) => {
    const { token } = useContext(AuthContext);
    return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<PrivateRoute><DocumentList /></PrivateRoute>} />
            <Route path="/document/:id" element={<PrivateRoute><Editor /></PrivateRoute>} />
          </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

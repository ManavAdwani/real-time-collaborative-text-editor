import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const DocumentList = () => {
    const [documents, setDocuments] = useState([]);
    const [newTitle, setNewTitle] = useState('');
    const navigate = useNavigate();
    const { user, logout, token } = useContext(AuthContext);

    useEffect(() => {
        if (!token) return;
        axios.get('http://127.0.0.1:8000/api/documents/', {
            headers: { Authorization: `Token ${token}` }
        })
            .then(res => setDocuments(res.data))
            .catch(err => console.error(err));
    }, [token]);

    const createDocument = (titleToUse) => {
        const title = titleToUse || newTitle.trim() || 'Untitled document';
        if (!token) return;
        axios.post('http://127.0.0.1:8000/api/documents/', { title: title }, {
            headers: { Authorization: `Token ${token}` }
        })
            .then(res => {
                navigate(`/document/${res.data.id}`);
            })
            .catch(err => console.error(err));
    };

    return (
        <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', fontFamily: 'Inter, Roboto, sans-serif' }}>
            {/* Minimalist Top Navigation Header */}
            <header style={{ 
                backgroundColor: '#ffffff', 
                padding: '12px 24px', 
                display: 'flex', 
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                borderBottom: '1px solid #f0f0f0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '24px', color: '#1a73e8' }}>📃</div>
                    <span style={{ fontSize: '20px', color: '#1f2937', fontWeight: '600', letterSpacing: '-0.3px' }}>Docs</span>
                </div>
                
                {/* Visual Search Bar Placeholder */}
                <div style={{
                    flex: 1,
                    maxWidth: '680px',
                    margin: '0 40px',
                    backgroundColor: '#f1f3f4',
                    borderRadius: '8px',
                    height: '46px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 16px',
                    color: '#5f6368',
                    gap: '12px'
                }}>
                    <span>🔍</span>
                    <input 
                        placeholder="Search" 
                        style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '15px', color: '#202124', width: '100%' }}
                    />
                </div>

                <div style={{ flex: 1 }} />
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ cursor: 'pointer', fontSize: '20px', color: '#5f6368' }}>⋮</div>
                    <button 
                        onClick={logout} 
                        style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', fontWeight: '500', transition: 'background-color 0.2s', color: '#374151' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
                    >
                        Log Out
                    </button>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#6366f1', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '15px', textTransform: 'uppercase', cursor: 'pointer'
                    }} title={user?.username}>{user?.username?.[0] || 'U'}</div>
                </div>
            </header>

            {/* Template Gallery Banner */}
            <section style={{ backgroundColor: '#f8f9fa', padding: '30px 0 45px 0' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#202124', marginBottom: '20px' }}>Start a new document</h2>
                    
                    <div style={{ display: 'flex', gap: '24px' }}>
                        {/* Blank Auto-Create Card */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '150px' }}>
                            <div 
                                onClick={() => createDocument('Untitled document')}
                                style={{
                                    height: '200px',
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
                            >
                                <img src="https://ssl.gstatic.com/docs/templates/thumbnails/docs-blank-googlecolors.png" alt="Blank" style={{ width: '96%', height: '96%', objectFit: 'cover' }} />
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Blank document</span>
                        </div>
                        
                        {/* Title Input Custom Card */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '320px' }}>
                            <div style={{
                                height: '200px',
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '24px',
                                boxSizing: 'border-box'
                            }}>
                                <span style={{fontSize:'13px', color:'#6b7280', marginBottom:'16px', fontWeight: '500'}}>Create with a specific name</span>
                                <input 
                                    type="text" 
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="Enter document title..." 
                                    style={{ 
                                        padding: '12px 16px', 
                                        width: '100%', 
                                        marginBottom: '20px', 
                                        borderRadius: '6px', 
                                        border: '1px solid #d1d5db',
                                        boxSizing: 'border-box',
                                        fontSize: '14px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                                    onBlur={e => e.target.style.borderColor = '#d1d5db'}
                                    onKeyDown={e => { if (e.key === 'Enter') createDocument(newTitle) }}
                                />
                                <button 
                                    onClick={() => createDocument(newTitle)}
                                    style={{ 
                                        padding: '10px 24px', 
                                        backgroundColor: '#1a73e8', 
                                        color: '#fff', 
                                        border: 'none', 
                                        borderRadius: '6px', 
                                        cursor: 'pointer', 
                                        fontWeight: '600', 
                                        width: '100%',
                                        fontSize: '14px',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1557b0'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1a73e8'}
                                >
                                    Create Document
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Recent Documents Table List */}
            <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#202124' }}>Recent documents</h2>
                    <div style={{ display: 'flex', gap: '16px', color: '#5f6368', fontSize: '20px', cursor: 'pointer' }}>
                        <span>🗂️</span>
                        <span>🔃</span>
                        <span>🔠</span>
                        <span>📁</span>
                    </div>
                </div>
                
                {documents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                        <h3 style={{ margin: '0 0 8px 0', color: '#111827', fontWeight: '600' }}>No documents yet</h3>
                        <p style={{ color: '#6b7280', margin: 0, fontSize: '15px' }}>Create a blank document above to get started.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {/* Table Header */}
                        <div style={{ display: 'flex', padding: '12px 16px', color: '#5f6368', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #dadce0', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>Title</div>
                            <div style={{ width: '220px' }}>Owner</div>
                            <div style={{ width: '220px' }}>Last opened by me</div>
                            <div style={{ width: '60px', textAlign: 'center' }}>⋮</div>
                        </div>
                        
                        {/* Table Rows */}
                        {documents.map(doc => (
                            <div 
                                key={doc.id} 
                                onClick={() => navigate(`/document/${doc.id}`)}
                                style={{ 
                                    display: 'flex', 
                                    padding: '16px 16px', 
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    backgroundColor: '#fff',
                                    borderBottom: '1px solid #f0f0f0',
                                    transition: 'background-color 0.1s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                            >
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ color: '#1a73e8', fontSize: '22px' }}>📃</div>
                                    <span style={{ fontWeight: '500', color: '#1f2937', fontSize: '15px' }}>{doc.title || 'Untitled document'}</span>
                                </div>
                                <div style={{ width: '220px', color: '#4b5563', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {doc.owner?.username !== user?.username && (
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e5e7eb', color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                                            {doc.owner?.username?.[0]?.toUpperCase()}
                                        </div>
                                    )}
                                    {doc.owner?.username === user?.username ? 'me' : doc.owner?.username || 'Unknown'}
                                </div>
                                <div style={{ width: '220px', color: '#6b7280', fontSize: '14px' }}>
                                    {new Date(doc.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                                <div style={{ width: '60px', color: '#9ca3af', fontSize: '18px', textAlign: 'center', fontWeight: 'bold' }} onClick={e => e.stopPropagation()}>
                                    ⋮
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default DocumentList;

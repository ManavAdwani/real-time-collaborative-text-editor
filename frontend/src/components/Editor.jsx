import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import QuillCursors from 'quill-cursors';
import 'react-quill-new/dist/quill.snow.css';
import axios from 'axios';
import useWebSocket from '../hooks/useWebSocket';
import { AuthContext } from '../context/AuthContext';
import DiffMatchPatch from 'diff-match-patch';

ReactQuill.Quill.register('modules/cursors', QuillCursors);
const dmp = new DiffMatchPatch();

// Toolbar options for Google-Docs-like feel
const modules = {
  cursors: true,
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'font': [] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'align': [] }],
    ['link', 'image'],
    ['clean']
  ],
};

const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
};

const Editor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, user } = useContext(AuthContext);
    const [title, setTitle] = useState('Untitled Document');
    const [content, setContent] = useState('');
    const [version, setVersion] = useState(0);
    
    // Sharing State
    const [shareUsername, setShareUsername] = useState('');
    const [showShare, setShowShare] = useState(false);
    const [shareMessage, setShareMessage] = useState('');
    
    // History State
    const [showHistory, setShowHistory] = useState(false);
    const [historyLogs, setHistoryLogs] = useState([]);
    const [previewVersion, setPreviewVersion] = useState(null);
    const [actualContent, setActualContent] = useState('');

    const quillRef = useRef(null);
    const { isConnected, presence, incomingPatch, incomingCursor, sendPatch, sendCursor } = useWebSocket(id, token);
    const contentRef = useRef('');

    useEffect(() => {
        if (!token) return;
        axios.get(`http://127.0.0.1:8000/api/documents/${id}/`, {
            headers: { Authorization: `Token ${token}` }
        })
            .then(res => {
                setTitle(res.data.title || 'Untitled Document');
                setContent(res.data.content);
                contentRef.current = res.data.content;
                setActualContent(res.data.content);
                setVersion(res.data.version);
            })
            .catch(err => {
                console.error("Could not fetch document:", err);
                if (err.response?.status === 403 || err.response?.status === 404 || err.response?.status === 401) {
                    navigate('/'); // Send back to home if unauthorized
                }
            });
    }, [id, navigate, token]);

    useEffect(() => {
        if (incomingPatch) {
            // If the server sends a hard RESTORE broadcast, it might not cleanly patch.
            // But actually, DMP is super resilient. However, to explicitly handle restores:
            // The Patch itself handles it via fuzzy logic, or we just rely on standard application.
            const patches = dmp.patch_fromText(incomingPatch.patch);
            const [newText, results] = dmp.patch_apply(patches, contentRef.current);
            
            // If we are previewing history, DO NOT update the live screen immediately, 
            // just update the background reality!
            contentRef.current = newText;
            setActualContent(newText);
            setVersion(incomingPatch.version);
            
            if (!previewVersion) {
                setContent(newText);
            }
        }
    }, [incomingPatch, previewVersion]);

    useEffect(() => {
        if (incomingCursor && quillRef.current && !previewVersion) {
            const cursorsModule = quillRef.current.getEditor().getModule('cursors');
            const username = incomingCursor.username;
            const color = stringToColor(username);
            try {
                cursorsModule.createCursor(username, username, color);
            } catch(e) {}
            if (incomingCursor.range) {
                cursorsModule.moveCursor(username, incomingCursor.range);
            }
        }
    }, [incomingCursor, previewVersion]);

    const handleChange = (newContent, delta, source, editor) => {
        if (previewVersion) return; // Prevent local edits during preview
        if (source === 'user') {
            const currentHTML = contentRef.current;
            const patches = dmp.patch_make(currentHTML, newContent);
            const patchText = dmp.patch_toText(patches);
            
            setContent(newContent);
            contentRef.current = newContent;
            setActualContent(newContent);
            
            sendPatch(patchText, version);
        }
    };

    const handleSelectionChange = (range, source, editor) => {
        if (source === 'user' && range && !previewVersion) {
            sendCursor(range);
        }
    };

    const handleShare = async () => {
        try {
            setShareMessage('');
            const res = await axios.post(`http://127.0.0.1:8000/api/documents/${id}/share/`, { username: shareUsername }, {
                headers: { Authorization: `Token ${token}` }
            });
            setShareMessage(res.data.status || 'Shared successfully!');
            setShareUsername('');
            setTimeout(() => setShowShare(false), 2000);
        } catch(err) {
            setShareMessage(err.response?.data?.error || 'Failed to share');
        }
    }

    const fetchHistory = async () => {
        if (showHistory) {
            setShowHistory(false);
            if (previewVersion) cancelPreview();
            return;
        }
        try {
            const res = await axios.get(`http://127.0.0.1:8000/api/documents/${id}/history/`, {
                headers: { Authorization: `Token ${token}` }
            });
            setHistoryLogs(res.data);
            setShowHistory(true);
        } catch (e) {
            console.error(e);
        }
    };

    const previewHistoryItem = (log) => {
        if (!previewVersion) setActualContent(contentRef.current);
        setPreviewVersion(log.version);
        setContent(log.content_snapshot || '');
    };

    const cancelPreview = () => {
        setPreviewVersion(null);
        setContent(actualContent);
    };

    const restoreVersion = async () => {
        try {
            await axios.post(`http://127.0.0.1:8000/api/documents/${id}/restore/`, { version: previewVersion }, {
                headers: { Authorization: `Token ${token}` }
            });
            setPreviewVersion(null);
            setShowHistory(false);
            // WebSocket patch will arrive and synchronize us seamlessly
        } catch(e) {
            alert("Failed to restore version.");
        }
    };

    return (
        <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, Roboto, sans-serif' }}>
            {/* Header / Navbar */}
            <div style={{ 
                height: '64px', 
                backgroundColor: '#ffffff', 
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                padding: '0 24px',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
            }}>
                <div 
                    onClick={() => navigate('/')} 
                    style={{ fontSize: '24px', cursor: 'pointer', marginRight: '24px', color: '#111', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <span style={{ fontSize: '20px' }}>📄</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <input 
                        value={title} 
                        readOnly
                        style={{ 
                            fontSize: '18px', 
                            border: 'none', 
                            outline: 'none', 
                            padding: '0',
                            fontWeight: '600',
                            color: '#111',
                            width: '300px',
                            backgroundColor: 'transparent',
                            fontFamily: 'Inter, sans-serif'
                        }}
                    />
                    <div style={{ fontSize: '13px', color: '#666', display: 'flex', alignItems: 'center', gap: '16px', fontWeight: '400' }}>
                        <span style={{cursor:'pointer'}}>File</span>
                        <span style={{cursor:'pointer'}}>Edit</span>
                        <span style={{cursor:'pointer'}}>View</span>
                        <span style={{cursor:'pointer'}}>Tools</span>
                    </div>
                </div>

                <div style={{ flex: 1 }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ fontSize: '13px', color: '#888', fontStyle: 'normal' }}>
                        {presence.length > 0 ? `Activity: ${presence[presence.length - 1]}` : 'All changes saved'}
                    </div>
                    <div style={{ 
                        padding: '6px 14px', 
                        borderRadius: '6px', 
                        fontSize: '13px', 
                        fontWeight: '600',
                        backgroundColor: isConnected ? '#f0fdf4' : '#fef2f2',
                        color: isConnected ? '#166534' : '#991b1b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: isConnected ? '1px solid #dcfce7' : '1px solid #fee2e2'
                    }}>
                        <div style={{ 
                            width: '6px', 
                            height: '6px', 
                            borderRadius: '50%', 
                            backgroundColor: isConnected ? '#16a34a' : '#ef4444' 
                        }} />
                        {isConnected ? 'Online' : 'Offline'}
                    </div>

                    <button onClick={fetchHistory} style={{
                        backgroundColor: showHistory ? '#f0f0f0' : '#ffffff',
                        color: '#333',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background-color 0.2s'
                    }}>
                        🕒 History
                    </button>
                    
                    <button onClick={() => setShowShare(!showShare)} style={{
                        backgroundColor: '#111',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 20px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor='#333'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor='#111'}
                    >
                        Share
                    </button>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f3f4f6', color: '#111',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '14px', textTransform: 'uppercase',
                        border: '1px solid #e5e7eb'
                    }}>{user?.username?.[0] || 'U'}</div>
                </div>
            </div>

            {/* Preview Mode Banner */}
            {previewVersion && (
                <div style={{
                    backgroundColor: '#fffbeb',
                    borderBottom: '1px solid #fde68a',
                    padding: '12px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    zIndex: 999
                }}>
                    <div style={{ fontWeight: '500', color: '#92400e' }}>
                        👀 Previewing Historical Version {previewVersion}
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={cancelPreview} style={{ padding: '6px 16px', borderRadius: '4px', border: '1px solid #d97706', backgroundColor: '#fff', color: '#d97706', cursor: 'pointer', fontWeight: '500' }}>
                            Cancel
                        </button>
                        <button onClick={restoreVersion} style={{ padding: '6px 16px', borderRadius: '4px', border: 'none', backgroundColor: '#d97706', color: '#fff', cursor: 'pointer', fontWeight: '500' }}>
                            Restore This Version
                        </button>
                    </div>
                </div>
            )}

            {/* Share Dialog */}
            {showShare && (
                <div style={{
                    position: 'absolute', top: '70px', right: '80px', width: '300px', backgroundColor: '#fff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderRadius: '8px', padding: '20px', zIndex: 1001,
                    border: '1px solid #dadce0'
                }}>
                    <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#202124' }}>Share with a user</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                            value={shareUsername}
                            onChange={e => setShareUsername(e.target.value)}
                            placeholder="Enter exact username"
                            style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                        <button 
                            onClick={handleShare}
                            style={{ padding: '8px 16px', backgroundColor: '#111', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >Share</button>
                    </div>
                    {shareMessage && <div style={{ marginTop: '10px', fontSize: '13px', color: shareMessage.includes('error') || shareMessage.includes('Failed') ? 'red' : 'green' }}>{shareMessage}</div>}
                </div>
            )}

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Document Editor Area */}
                <div style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    overflowY: 'auto',
                    backgroundColor: '#f8f9fa'
                }}>
                    <ReactQuill 
                        ref={quillRef}
                        theme="snow" 
                        value={content} 
                        onChange={handleChange} 
                        onChangeSelection={handleSelectionChange}
                        modules={modules}
                        readOnly={!!previewVersion}
                        style={{ minHeight: '100%', border: 'none', display: 'flex', flexDirection: 'column' }}
                        placeholder="Start typing your minimalist masterpiece..."
                    />
                </div>

                {/* History Drawer */}
                {showHistory && (
                    <div style={{
                        width: '320px',
                        backgroundColor: '#ffffff',
                        borderLeft: '1px solid #e5e7eb',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '-4px 0 16px rgba(0,0,0,0.02)',
                        zIndex: 100,
                        overflowY: 'auto'
                    }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f0', fontWeight: '600', fontSize: '15px' }}>
                            Version History
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {historyLogs.map(log => (
                                <div 
                                    key={log.version}
                                    onClick={() => previewHistoryItem(log)}
                                    style={{
                                        padding: '16px 20px',
                                        borderBottom: '1px solid #f3f4f6',
                                        cursor: 'pointer',
                                        backgroundColor: previewVersion === log.version ? '#f0fdf4' : '#fff',
                                        transition: 'background-color 0.1s'
                                    }}
                                    onMouseEnter={e => { if (previewVersion !== log.version) e.currentTarget.style.backgroundColor='#f9fafb' }}
                                    onMouseLeave={e => { if (previewVersion !== log.version) e.currentTarget.style.backgroundColor='#fff' }}
                                >
                                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#111', marginBottom: '4px' }}>
                                        Version {log.version}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                        {new Date(log.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                            {historyLogs.length === 0 && (
                                <div style={{ padding: '20px', color: '#6b7280', fontSize: '13px', textAlign: 'center' }}>
                                    No history available yet.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Inject Global Styles for Minimalist Quill Editor */}
            <style dangerouslySetInnerHTML={{__html: `
                .ql-toolbar.ql-snow {
                    border: none !important;
                    background-color: #ffffff !important;
                    border-bottom: 1px solid #f0f0f0 !important;
                    padding: 8px 24px !important;
                    margin: 0 !important;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    justify-content: flex-start;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }
                .ql-container.ql-snow {
                    border: 1px solid #e0e0e0 !important;
                    font-family: 'Inter', sans-serif !important;
                    font-size: 16px !important;
                    line-height: 1.6 !important;
                    color: #333 !important;
                    width: 100% !important;
                    max-width: 850px !important;
                    min-height: 1056px !important;
                    margin: 40px auto !important;
                    background-color: #ffffff !important;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
                    border-radius: 4px !important;
                }
                .ql-editor {
                    padding: 60px 80px !important;
                    min-height: 1000px;
                }
                .ql-editor p {
                    margin-bottom: 1em;
                }
                .ql-editor.ql-blank::before {
                    color: #adb5bd;
                    font-style: normal;
                }
                /* Quill Cursors custom styling */
                .ql-cursor { align-items: center; justify-content: center; z-index: 5; }
                .ql-cursor-caret { border-width: 2px !important; }
                .ql-cursor-flag { font-family: Inter, sans-serif !important; font-size: 12px !important; border-radius: 4px !important; padding: 3px 8px !important; top: -20px !important; font-weight: 500; letter-spacing: 0.3px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            `}} />
        </div>
    );
};

export default Editor;

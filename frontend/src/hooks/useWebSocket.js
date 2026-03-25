import { useState, useEffect, useCallback, useRef } from 'react';

const useWebSocket = (documentId, token) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [presence, setPresence] = useState([]);
    const [incomingPatch, setIncomingPatch] = useState(null);
    const [incomingCursor, setIncomingCursor] = useState(null);
    const wsRef = useRef(null);

    useEffect(() => {
        if (!documentId || !token) return;

        // Ensure to match the backend WS URL
        const wsUrl = `ws://127.0.0.1:8000/ws/document/${documentId}/?token=${token}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
            console.log('Connected to WebSocket');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'sync') {
                // Receive incoming patch from others
                setIncomingPatch({
                    patch: data.patch,
                    version: data.version
                });
            } else if (data.type === 'cursor') {
                setIncomingCursor({
                    username: data.username,
                    range: data.range
                });
            } else if (data.type === 'presence') {
                setPresence((prev) => [...prev, data.username + ' ' + data.action]);
                // Clear presence message after 3 seconds
                setTimeout(() => setPresence((prev) => prev.slice(1)), 3000);
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
            console.log('Disconnected from WebSocket');
        };

        setSocket(ws);

        return () => {
            ws.close();
        };
    }, [documentId, token]);

    const sendPatch = useCallback((patchText, baseVersion) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                action: 'edit',
                patch: patchText,
                base_version: baseVersion
            }));
        }
    }, []);

    const sendCursor = useCallback((range) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                action: 'cursor',
                range: range
            }));
        }
    }, []);

    return { isConnected, presence, incomingPatch, incomingCursor, sendPatch, sendCursor };
};

export default useWebSocket;

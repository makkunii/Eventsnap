import { useEffect, useState, useRef } from 'react';
import Peer from 'peerjs';

export const usePeer = (isHost, id, isLocked) => {
  const [peerId, setPeerId] = useState(null);
  const [connections, setConnections] = useState([]);
  const [incomingData, setIncomingData] = useState(null);

  const peerRef = useRef(null);
  const connMapRef = useRef({});
  const isLockedRef = useRef(isLocked);

  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  useEffect(() => {
    // Prevent double initialization
    if (peerRef.current) return;

    const peer = new Peer(id, {
      debug: 2, // Helps catch connection errors in console
      config: {
        'iceServers': [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
        // Force TURN if STUN fails (optional but recommended for production)
        iceTransportPolicy: 'all', 
      }
    });

    peerRef.current = peer;

    peer.on('open', (newId) => {
      console.log('Peer open with ID:', newId);
      setPeerId(newId);
    });

    peer.on('error', (err) => {
      console.error('PeerJS Error:', err.type, err);
      // If ID is taken, you might need to handle it here
    });

    peer.on('connection', (conn) => {
      // CRITICAL: Setup listeners immediately upon receiving connection
      setupConnectionListeners(conn);
    });

    const setupConnectionListeners = (conn) => {
      conn.on('open', () => {
        connMapRef.current[conn.peer] = conn;
        if (isHost) {
          setConnections(prev => {
            if (prev.find(c => c.peer === conn.peer)) return prev;
            return [...prev, conn];
          });
        }
      });

      conn.on('data', (data) => {
        if (isHost && isLockedRef.current) {
          conn.send({ type: 'EVENT_LOCKED' });
          return;
        }
        setIncomingData({ ...data, __peer: conn.peer });
        if (isHost) conn.send({ type: 'MEDIA_RECEIVED' });
      });

      conn.on('close', () => {
        delete connMapRef.current[conn.peer];
        setConnections(prev => prev.filter(c => c.peer !== conn.peer));
      });
      
      conn.on('error', () => {
        delete connMapRef.current[conn.peer];
      });
    };

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, [isHost, id]);

  const sendData = (targetId, data) => {
    return new Promise((resolve, reject) => {
      const existingConn = connMapRef.current[targetId];

      if (existingConn && existingConn.open) {
        existingConn.send(data);
        return resolve(existingConn);
      }

      // Start new connection with reliable: true for Blobs/Images
      const conn = peerRef.current.connect(targetId, {
        reliable: true 
      });

      // Use a longer timeout for mobile networks
      const timeout = setTimeout(() => {
        if (!conn.open) {
          conn.close();
          reject(new Error("Connection timeout - device might be offline"));
        }
      }, 8000);

      conn.on('open', () => {
        clearTimeout(timeout);
        connMapRef.current[targetId] = conn;
        conn.send(data);
        resolve(conn);
      });

      // Receiver side of data for the guest
      conn.on('data', (incoming) => setIncomingData(incoming));
      
      conn.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  };

  return { peerId, incomingData, connections, sendData };
};
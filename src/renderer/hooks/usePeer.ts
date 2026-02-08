// ============================================
// PrepHQ — usePeer Hook
// Manages PeerJS WebRTC connections for
// multiplayer mock interviews
// ============================================

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PeerConnectionState } from '../../shared/types';

interface UsePeerOptions {
  onRemoteStream?: (stream: MediaStream) => void;
  onData?: (data: any) => void;
  onDisconnect?: () => void;
}

interface UsePeerReturn {
  peerId: string | null;
  connectionState: PeerConnectionState;
  remotePeerName: string | null;
  error: string | null;
  // Actions
  createRoom: () => string;
  joinRoom: (roomCode: string) => void;
  leaveRoom: () => void;
  sendData: (data: any) => void;
  sendStream: (stream: MediaStream) => void;
}

export function usePeer({
  onRemoteStream,
  onData,
  onDisconnect,
}: UsePeerOptions = {}): UsePeerReturn {
  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);
  const callRef = useRef<any>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<PeerConnectionState>('disconnected');
  const [remotePeerName, setRemotePeerName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize PeerJS
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const PeerModule = await import('peerjs');
        const Peer = PeerModule.default || PeerModule.Peer;

        // Generate a short room-friendly ID
        const id = `prephq-${Math.random().toString(36).substring(2, 8)}`;

        const peer = new Peer(id, {
          debug: 0,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
            ],
          },
        });

        peer.on('open', (assignedId: string) => {
          if (!mounted) return;
          setPeerId(assignedId);
        });

        peer.on('connection', (conn: any) => {
          if (!mounted) return;
          handleConnection(conn);
        });

        peer.on('call', (call: any) => {
          if (!mounted) return;
          handleCall(call);
        });

        peer.on('error', (err: any) => {
          if (!mounted) return;
          setError(err.message || 'Peer connection error');
          setConnectionState('error');
        });

        peer.on('disconnected', () => {
          if (!mounted) return;
          setConnectionState('disconnected');
        });

        peerRef.current = peer;
      } catch (err: any) {
        if (mounted) {
          setError(`PeerJS init failed: ${err.message}`);
        }
      }
    })();

    return () => {
      mounted = false;
      if (connRef.current) connRef.current.close();
      if (callRef.current) callRef.current.close();
      if (peerRef.current) peerRef.current.destroy();
    };
  }, []);

  const handleConnection = useCallback((conn: any) => {
    connRef.current = conn;
    setConnectionState('connecting');

    conn.on('open', () => {
      setConnectionState('connected');
      // Exchange names
      conn.send({ type: 'name', name: 'PrepHQ User' });
    });

    conn.on('data', (data: any) => {
      if (data?.type === 'name') {
        setRemotePeerName(data.name);
      } else {
        onData?.(data);
      }
    });

    conn.on('close', () => {
      setConnectionState('disconnected');
      setRemotePeerName(null);
      connRef.current = null;
      onDisconnect?.();
    });

    conn.on('error', (err: any) => {
      setError(err.message);
      setConnectionState('error');
    });
  }, [onData, onDisconnect]);

  const handleCall = useCallback((call: any) => {
    callRef.current = call;

    // Auto-answer with local stream if available
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        call.answer(stream);
        call.on('stream', (remoteStream: MediaStream) => {
          onRemoteStream?.(remoteStream);
        });
      })
      .catch(() => {
        call.answer(); // Answer without stream
        call.on('stream', (remoteStream: MediaStream) => {
          onRemoteStream?.(remoteStream);
        });
      });
  }, [onRemoteStream]);

  const createRoom = useCallback((): string => {
    if (!peerId) return '';
    // Room code is just our peer ID
    return peerId;
  }, [peerId]);

  const joinRoom = useCallback((roomCode: string) => {
    if (!peerRef.current) return;

    setConnectionState('connecting');

    const conn = peerRef.current.connect(roomCode, {
      reliable: true,
    });

    handleConnection(conn);
  }, [handleConnection]);

  const leaveRoom = useCallback(() => {
    if (connRef.current) {
      connRef.current.close();
      connRef.current = null;
    }
    if (callRef.current) {
      callRef.current.close();
      callRef.current = null;
    }
    setConnectionState('disconnected');
    setRemotePeerName(null);
  }, []);

  const sendData = useCallback((data: any) => {
    if (connRef.current && connRef.current.open) {
      connRef.current.send(data);
    }
  }, []);

  const sendStream = useCallback((stream: MediaStream) => {
    if (!peerRef.current || !connRef.current) return;

    const remotePeerId = connRef.current.peer;
    const call = peerRef.current.call(remotePeerId, stream);

    call.on('stream', (remoteStream: MediaStream) => {
      onRemoteStream?.(remoteStream);
    });

    callRef.current = call;
  }, [onRemoteStream]);

  return {
    peerId,
    connectionState,
    remotePeerName,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    sendData,
    sendStream,
  };
}

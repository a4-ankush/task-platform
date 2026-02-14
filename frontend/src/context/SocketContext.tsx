'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getEnv } from '@/lib/env';
import { useAuth } from '@/context/AuthContext';

type SocketContextValue = {
  socket: Socket | null;
};

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { wsUrl } = getEnv();
  const { accessToken } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      return;
    }

    const socket = io(wsUrl, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    socketRef.current = socket;
    setSocket(socket);

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [accessToken, wsUrl]);

  const value = useMemo(() => ({ socket }), [socket]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}

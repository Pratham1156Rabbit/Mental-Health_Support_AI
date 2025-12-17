import React from 'react';
import { useAuth } from '../context/AuthContext';
import Chat from '../components/Chat';
import PublicChat from '../components/PublicChat';

export default function ChatHome() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '70vh',
        color: 'white',
        fontSize: '1.1rem'
      }}>
        Loading…
      </div>
    );
  }

  return isAuthenticated ? <Chat /> : <PublicChat />;
}



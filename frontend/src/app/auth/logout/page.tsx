'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';

export default function LogoutPage() {
  const router = useRouter();
  const logout = useAppStore((state) => state.logout);

  useEffect(() => {
    // Clear all auth data from Zustand store
    logout();

    // Clear auth cookie (server can also handle via middleware)
    document.cookie = 'auth_token=; Max-Age=0; path=/; SameSite=Strict';

    // Small delay to ensure state is cleared before redirect
    const timeout = setTimeout(() => {
      router.push('/');
    }, 500);

    return () => clearTimeout(timeout);
  }, [router, logout]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #F9F6F1 0%, #F5F1EB 100%)',
    }}>
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}>
        <h2 style={{ color: '#2D5A3D', marginBottom: '1rem' }}>
          Logging you out...
        </h2>
        <p style={{ color: '#B8A48F' }}>
          You'll be redirected to the home page shortly.
        </p>
        <div style={{
          marginTop: '1.5rem',
          width: '40px',
          height: '40px',
          border: '4px solid #E8DFD7',
          borderTop: '4px solid #2D5A3D',
          borderRadius: '50%',
          animation: 'spin 0.6s linear infinite',
          margin: '0 auto',
        }}>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}

import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from '../lib/firebase';
import { getUser } from '../lib/db';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const profile = await getUser(firebaseUser.uid);
          setUserProfile(profile);
        } catch (err) {
          console.error('Failed to fetch user profile:', err);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  /** Refresh the Firestore profile (call after updating user doc) */
  const refreshProfile = async () => {
    if (user) {
      const profile = await getUser(user.uid);
      setUserProfile(profile);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth intentionally lives with the context it reads; the provider is
// the only component here, so fast refresh is unaffected.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail, 
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { AdminUser } from '../types';

interface AuthContextType {
  currentUser: AdminUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateAdminProfile: (displayName: string) => Promise<void>;
  updateAdminPassword: (currentPass: string, newPass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const admin: AdminUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Class Administrator',
          photoURL: user.photoURL,
        };
        setCurrentUser(admin);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      // If user does not exist yet in Firebase Auth, auto-create initial admin account for smooth demo/first setup
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, email, pass);
          return;
        } catch (createErr) {
          throw err;
        }
      }
      throw err;
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateAdminProfile = async (displayName: string) => {
    if (!auth.currentUser) throw new Error('No user is currently logged in');
    await updateProfile(auth.currentUser, { displayName });
    setCurrentUser((prev) => (prev ? { ...prev, displayName } : null));
  };

  const updateAdminPassword = async (currentPass: string, newPass: string) => {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('No user is currently logged in');

    // Re-authenticate first to ensure current password is correct and session is fresh
    const credential = EmailAuthProvider.credential(user.email, currentPass);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPass);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        login,
        logout,
        resetPassword,
        updateAdminProfile,
        updateAdminPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


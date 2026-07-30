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
import { AdminUser, SUPER_ADMIN_EMAIL } from '../types';
import { requestOrCheckAdminAccess } from '../services/dbService';

interface AuthContextType {
  currentUser: AdminUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateAdminProfile: (displayName: string) => Promise<void>;
  updateAdminPassword: (currentPass: string, newPass: string) => Promise<void>;
  refreshAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkUserStatus = async (user: any) => {
    if (!user || !user.email) {
      setCurrentUser(null);
      return;
    }

    const email = user.email.toLowerCase().trim();
    const isSuper = email === SUPER_ADMIN_EMAIL.toLowerCase().trim();

    try {
      const approvalStatus = await requestOrCheckAdminAccess(
        email,
        user.uid,
        user.displayName || undefined
      );

      setCurrentUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Pitch Administrator',
        photoURL: user.photoURL,
        isSuperAdmin: isSuper,
        approvalStatus: isSuper ? 'approved' : approvalStatus,
      });
    } catch (err) {
      console.error('Failed to check admin access status:', err);
      // Fallback
      setCurrentUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Pitch Administrator',
        photoURL: user.photoURL,
        isSuperAdmin: isSuper,
        approvalStatus: isSuper ? 'approved' : 'pending',
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      await checkUserStatus(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshAuthStatus = async () => {
    if (auth.currentUser) {
      await checkUserStatus(auth.currentUser);
    }
  };

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
        refreshAuthStatus,
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


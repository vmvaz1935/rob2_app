import { 
  signInWithPopup, 
  signOut, 
  GoogleAuthProvider, 
  User,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from './config';

const provider = new GoogleAuthProvider();

// Configurar o provedor do Google
provider.setCustomParameters({
  prompt: 'select_account'
});

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export const signInWithGoogle = async (): Promise<string> => {
  try {
    const result = await signInWithPopup(auth, provider);
    const token = await result.user.getIdToken();
    return token;
  } catch (error: any) {
    console.error('Erro no login:', error);
    throw new Error(`Erro no login: ${error.message}`);
  }
};

export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Erro no logout:', error);
    throw new Error(`Erro no logout: ${error.message}`);
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const getAuthToken = async (): Promise<string | null> => {
  const user = getCurrentUser();
  if (user) {
    return await user.getIdToken();
  }
  return null;
};

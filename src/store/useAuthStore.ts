import { create } from 'zustand';
import { firebaseAuth, FirebaseUser } from '../services/firebase';

interface AuthState {
  user: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  registerUser: (email: string, password: string, role: 'farmer' | 'admin') => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const fbUser = await firebaseAuth.login(email, password);
      set({ user: fbUser, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Login failed', isLoading: false });
      throw err;
    }
  },

  registerUser: async (email, password, role) => {
    set({ isLoading: true, error: null });
    try {
      const fbUser = await firebaseAuth.register(email, password, role);
      set({ user: fbUser, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Registration failed', isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await firebaseAuth.logout();
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Logout failed', isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  checkSession: async () => {
    set({ isLoading: true });
    try {
      const fbUser = await firebaseAuth.getCurrentUser();
      if (fbUser) {
        set({ user: fbUser, isAuthenticated: true });
      }
      set({ isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

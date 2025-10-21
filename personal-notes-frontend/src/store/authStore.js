import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  signInWithGoogle,
  signInWithFacebook,
  signInWithEmail,
  createAccount,
  logout as firebaseLogout,
  onAuthChange
} from '../config/firebase';
import { verifyAuth, logoutAPI } from '../services/api';
import socketService from '../services/socket';

// Flag para evitar múltiplas inicializações
let authListenerInitialized = false;

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      firebaseUser: null,
      loading: true,
      error: null,
      isAuthenticated: false,
      _initializing: false,

      // Actions

      /**
       * Initialize auth listener
       */
      initAuthListener: () => {
        // Evita múltiplas inicializações
        if (authListenerInitialized) {
          return;
        }
        authListenerInitialized = true;

        // Reset auth state and set loading
        set({
          loading: true,
          isAuthenticated: false,
          _initializing: false
        });

        onAuthChange(async (firebaseUser) => {
          // Evita processar se já está inicializando
          if (get()._initializing) {
            return;
          }

          set({ _initializing: true, loading: true });

          if (firebaseUser) {
            try {
              // Get ID token
              const token = await firebaseUser.getIdToken();

              // Verify with backend
              const userData = await verifyAuth(token);

              set({
                firebaseUser,
                user: userData.user,
                isAuthenticated: true,
                loading: false,
                error: null,
                _initializing: false
              });

              // Connect to Socket.IO
              try {
                await socketService.connect();
              } catch (socketError) {
                console.error('Socket connection error:', socketError);
              }

            } catch (error) {
              console.error('Error verifying auth:', error);
              set({
                error: 'Erro ao verificar autenticação',
                isAuthenticated: false,
                loading: false,
                _initializing: false
              });
            }
          } else {
            set({
              firebaseUser: null,
              user: null,
              isAuthenticated: false,
              loading: false,
              _initializing: false
            });

            // Disconnect socket
            socketService.disconnect();
          }
        });
      },

      /**
       * Login with Google
       */
      loginWithGoogle: async () => {
        set({ loading: true, error: null });
        try {
          const result = await signInWithGoogle();
          const token = await result.user.getIdToken();
          const userData = await verifyAuth(token);

          set({
            firebaseUser: result.user,
            user: userData.user,
            isAuthenticated: true,
            loading: false
          });

          // Connect socket
          await socketService.connect();

          return result;
        } catch (error) {
          console.error('Login error:', error);
          set({
            error: error.message || 'Erro ao fazer login',
            loading: false
          });
          throw error;
        }
      },

      /**
       * Login with Facebook
       */
      loginWithFacebook: async () => {
        set({ loading: true, error: null });
        try {
          const result = await signInWithFacebook();
          const token = await result.user.getIdToken();
          const userData = await verifyAuth(token);

          set({
            firebaseUser: result.user,
            user: userData.user,
            isAuthenticated: true,
            loading: false
          });

          // Connect socket
          await socketService.connect();

          return result;
        } catch (error) {
          console.error('Login error:', error);
          set({
            error: error.message || 'Erro ao fazer login',
            loading: false
          });
          throw error;
        }
      },

      /**
       * Login with email and password
       */
      loginWithEmail: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const result = await signInWithEmail(email, password);
          const token = await result.user.getIdToken();
          const userData = await verifyAuth(token);

          set({
            firebaseUser: result.user,
            user: userData.user,
            isAuthenticated: true,
            loading: false
          });

          // Connect socket
          await socketService.connect();

          return result;
        } catch (error) {
          console.error('Login error:', error);
          let errorMessage = 'Erro ao fazer login';

          if (error.code === 'auth/user-not-found') {
            errorMessage = 'Usuário não encontrado';
          } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Senha incorreta';
          } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Email inválido';
          }

          set({
            error: errorMessage,
            loading: false
          });
          throw error;
        }
      },

      /**
       * Create account with email
       */
      signup: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const result = await createAccount(email, password);
          const token = await result.user.getIdToken();
          const userData = await verifyAuth(token);

          set({
            firebaseUser: result.user,
            user: userData.user,
            isAuthenticated: true,
            loading: false
          });

          // Connect socket
          await socketService.connect();

          return result;
        } catch (error) {
          console.error('Signup error:', error);
          let errorMessage = 'Erro ao criar conta';

          if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Este email já está em uso';
          } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Senha muito fraca (mínimo 6 caracteres)';
          } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Email inválido';
          }

          set({
            error: errorMessage,
            loading: false
          });
          throw error;
        }
      },

      /**
       * Logout
       */
      logout: async () => {
        set({ loading: true, error: null });
        try {
          // Disconnect socket
          socketService.disconnect();

          // Logout from backend
          await logoutAPI();

          // Logout from Firebase
          await firebaseLogout();

          set({
            firebaseUser: null,
            user: null,
            isAuthenticated: false,
            loading: false
          });

        } catch (error) {
          console.error('Logout error:', error);
          set({
            error: 'Erro ao fazer logout',
            loading: false
          });
          throw error;
        }
      },

      /**
       * Clear error
       */
      clearError: () => {
        set({ error: null });
      }

    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore;

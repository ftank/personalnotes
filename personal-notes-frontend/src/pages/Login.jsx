import { useState } from 'react';
import useAuthStore from '../store/authStore';

function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { loginWithGoogle, loginWithEmail, signup, loading, error, clearError } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    try {
      if (isSignup) {
        await signup(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err) {
      // Error is handled by store
      console.error('Login error:', err);
    }
  };

  const handleGoogleLogin = async () => {
    clearError();
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Google login error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-notion-dark-bg dark:to-notion-dark-sidebar py-12 px-6 sm:px-8 lg:px-10">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-notion-dark-sidebar px-10 py-12 sm:px-12 sm:py-14 rounded-2xl shadow-2xl dark:shadow-none dark:border dark:border-white/10">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white/90 mb-2">
            📝 Personal Notes
          </h1>
          <p className="text-gray-600 dark:text-white/60">
            {isSignup ? 'Crie sua conta' : 'Bem-vindo de volta'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-danger-50 dark:bg-danger-500/20 border border-danger-200 dark:border-danger-500/30 text-danger-700 dark:text-danger-300 px-5 py-4 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Google Login Button */}
        <div>
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-5 py-4 border border-gray-300 dark:border-white/20 rounded-lg shadow-sm bg-white dark:bg-notion-dark-bg hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-medium text-gray-700 dark:text-white/70">
              Continuar com Google
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-white/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-notion-dark-sidebar text-gray-500 dark:text-white/50">Ou</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="seu@email.com"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder={isSignup ? "Mínimo 6 caracteres" : "••••••••"}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {isSignup ? 'Criando conta...' : 'Entrando...'}
              </span>
            ) : (
              isSignup ? 'Criar conta' : 'Entrar'
            )}
          </button>
        </form>

        {/* Toggle Signup/Login */}
        <div className="text-center">
          <button
            onClick={() => {
              setIsSignup(!isSignup);
              clearError();
            }}
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            {isSignup
              ? 'Já tem uma conta? Fazer login'
              : 'Não tem uma conta? Criar agora'}
          </button>
        </div>

        {/* Privacy Notice */}
        <div className="text-center pt-4 border-t border-gray-200 dark:border-white/20">
          <p className="text-xs text-gray-500 dark:text-white/50">
            Suas conversas são criptografadas e privadas. <br />
            Nós não compartilhamos seus dados.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

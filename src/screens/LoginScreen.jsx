import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, displayName);
        setEmailSent(true);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    setError(null);
    try {
      if (provider === 'google') await signInWithGoogle();
      if (provider === 'apple') await signInWithApple();
    } catch (err) {
      setError(err.message);
    }
  };

  if (emailSent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <div className="text-4xl mb-4">📧</div>
        <h2 className="text-xl font-bold mb-2">Check your email</h2>
        <p className="text-gray-400 text-sm text-center mb-6">
          We sent a confirmation link to <span className="text-white">{email}</span>
        </p>
        <button
          onClick={() => { setEmailSent(false); setMode('login'); }}
          className="text-blue-400 text-sm"
        >
          Back to login
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tight mb-1">Cut</h1>
          <p className="text-gray-500 text-sm">Track your cut. Hit your goals.</p>
        </div>

        {/* Social login buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleOAuth('google')}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white text-black rounded-xl font-semibold text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <button
            onClick={() => handleOAuth('apple')}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white text-black rounded-xl font-semibold text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 18 18"><path d="M13.766 9.524c-.022-2.27 1.852-3.36 1.937-3.413-1.054-1.54-2.694-1.751-3.279-1.776-1.396-.141-2.727.822-3.437.822-.71 0-1.808-.801-2.972-.78-1.529.022-2.94.89-3.728 2.261-1.59 2.757-.407 6.843 1.143 9.081.757 1.094 1.66 2.324 2.847 2.28 1.142-.044 1.573-.739 2.953-.739 1.38 0 1.767.74 2.974.717 1.229-.022 2.009-1.116 2.762-2.213.87-1.269 1.228-2.497 1.25-2.561-.027-.012-2.398-.92-2.422-3.651l.072.172z" fill="#000"/><path d="M11.483 2.85c.629-.763 1.053-1.824.937-2.88-.906.037-2.003.603-2.653 1.363-.583.675-1.093 1.753-.956 2.788.012.09 1.043.04 1.043.04.422.007 1-0.548 1.629-1.311z" fill="#000"/></svg>
            Continue with Apple
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-[#333]" />
          <span className="text-gray-500 text-xs">or</span>
          <div className="flex-1 h-px bg-[#333]" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Display name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
          />

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold text-white transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-xs mt-4">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button onClick={() => { setMode('signup'); setError(null); }} className="text-blue-400">Sign up</button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError(null); }} className="text-blue-400">Sign in</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

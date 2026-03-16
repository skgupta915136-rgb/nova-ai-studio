
import React, { useState } from 'react';
import { User } from '../types';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const GuestIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
);

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [guestName, setGuestName] = useState('');

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Simulate API delay for realism
    setTimeout(() => {
      const mockUser: User = {
        id: '101',
        name: 'Nova User',
        email: 'user@gmail.com',
        avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
      };
      onLogin(mockUser);
    }, 1500);
  };

  const handleGuestLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
        const name = guestName.trim() || 'Guest User';
        const guestUser: User = {
            id: `guest-${Date.now()}`,
            name: name,
            email: `${name.replace(/\s+/g, '.').toLowerCase()}@guest.nova.ai`,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`,
        };
        onLogin(guestUser);
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#080c18] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-sky-500/10 rounded-full blur-[120px]"></div>

      <div className="relative z-10 w-full max-w-md p-8">
        <div className="bg-[#131b2c]/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
               <div className="absolute inset-0 bg-sky-500/20 rounded-full animate-ping"></div>
               <div className="relative w-20 h-20 bg-gradient-to-tr from-sky-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-sky-500/20">
                  <span className="text-3xl font-bold text-white">N</span>
               </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to NOVA</h1>
            <p className="text-slate-400 text-center">
              Your personal AI studio for voice, video, and imagination.
            </p>
          </div>

          <div className="space-y-4">
            <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white hover:bg-gray-50 text-gray-900 font-medium py-3.5 px-4 rounded-xl flex items-center justify-center transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-70 disabled:cursor-wait"
            >
                {isLoading ? (
                <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                ) : (
                <>
                    <GoogleIcon />
                    <span>Continue with Gmail</span>
                </>
                )}
            </button>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-700"></div>
                <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase tracking-wider">or</span>
                <div className="flex-grow border-t border-slate-700"></div>
            </div>

            <form onSubmit={handleGuestLogin} className="space-y-3">
                 <input 
                    type="text" 
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Enter your name (Optional)"
                    disabled={isLoading}
                    className="w-full bg-slate-800/50 border border-slate-600 focus:border-sky-500 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-slate-700/50 hover:bg-slate-700 text-white font-medium py-3.5 px-4 rounded-xl flex items-center justify-center transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-70 disabled:cursor-wait border border-slate-600/50"
                >
                    {isLoading ? (
                        <div className="w-6 h-6 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <GuestIcon />
                            <span>Continue as Guest</span>
                        </>
                    )}
                </button>
            </form>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;

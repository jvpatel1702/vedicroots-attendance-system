
import React, { useState } from 'react';
import { Profile } from '../types';
import { MOCK_DATA } from '../mockData';

interface LoginProps {
  onLogin: (profile: Profile) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate Auth Delay
    setTimeout(() => {
      const user = MOCK_DATA.profiles.find(p => p.email === email.toLowerCase());
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid credentials. Hint: use admin@vedicroots.edu or teacher@vedicroots.edu');
        setIsLoading(false);
      }
    }, 800);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Simulate Google Auth
    setTimeout(() => {
      // Default to teacher for Google demo
      onLogin(MOCK_DATA.profiles[1]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#fcfdfb] flex flex-col md:flex-row">
      {/* Left side: Branding */}
      <div className="md:w-1/2 bg-[#1b4332] flex flex-col justify-center items-center p-12 text-white">
        <div className="mb-8">
           <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md mb-6 rotate-3">
             <i className="fas fa-leaf text-4xl text-[#95d5b2]"></i>
           </div>
           <h1 className="text-5xl font-bold tracking-tight">VedicRoots</h1>
           <p className="text-[#d8f3dc] mt-2 text-xl font-medium">Nurturing Growth, Honoring Traditions.</p>
        </div>
        <div className="hidden md:block max-w-sm text-[#95d5b2] text-sm italic">
          "The root of all health is in the brain. The trunk of it is in the emotion. The branches and leaves are the body."
        </div>
      </div>

      {/* Right side: Form */}
      <div className="md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-500 mt-2">Please enter your details to sign in.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-sm rounded-r-lg">
              <div className="flex items-center">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Work Email</label>
              <input
                type="email"
                required
                placeholder="e.g. name@vedicroots.edu"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#1b4332] focus:border-transparent transition-all outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
                <a href="#" className="text-sm font-bold text-[#2d6a4f] hover:underline">Forgot?</a>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#1b4332] focus:border-transparent transition-all outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              disabled={isLoading}
              type="submit"
              className="w-full bg-[#1b4332] text-white font-bold py-4 rounded-xl hover:bg-[#081c15] transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
            >
              {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : null}
              Sign In
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#fcfdfb] text-gray-400">or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-50 transition-all"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/pwa_static_assets/google.svg" className="w-5 h-5" alt="Google" />
            Sign in with Google
          </button>

          <p className="mt-10 text-center text-gray-500 text-sm">
            Don't have an account? <a href="#" className="text-[#2d6a4f] font-bold hover:underline">Contact Office</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Shield,
  CheckCircle2,
  AlertCircle,
  Headphones,
  UserPlus,
  ArrowRight,
} from 'lucide-react';
import { CptLogo } from '../components/CptLogo';

export const UserLoginView: React.FC = () => {
  const { loginUser, registerUser, setActiveTab, setIsSupportOpen } = useApp();

  const [mode, setMode] = useState<'signin' | 'register'>(() => window.location.pathname === '/register' ? 'register' : 'signin');

  // Sign In fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Feedback messages
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const res = loginUser(loginIdentifier, loginPassword);
    if (!res.success) {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (regPassword && regConfirmPassword && regPassword !== regConfirmPassword) {
      setFeedback({ type: 'error', message: 'Passwords do not match. Please re-enter.' });
      return;
    }

    const res = registerUser({
      name: regName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
    });

    if (!res.success) {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4 relative overflow-hidden bg-[#070b14] select-none">
      {/* Radial soft blue glow matching Screenshot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[#0c1f44]/40 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-[420px] relative z-10 text-center space-y-7">
        {/* Large Circular Glow with Center CPT Badge Logo matching Screenshot */}
        <div className="relative inline-block mx-auto">
          <div className="w-40 h-40 rounded-full bg-gradient-to-b from-[#132242]/70 to-[#0b1325]/80 border border-[#213560]/60 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(30,58,138,0.35)] ring-1 ring-blue-500/30">
            <CptLogo size={56} />
          </div>
        </div>

        {/* Brand Title matching Screenshot */}
        <div className="-mt-3">
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center justify-center gap-1.5">
            <span className="text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)]">Cpt</span>
            <span className="text-[#f5a623] drop-shadow-[0_2px_15px_rgba(245,166,35,0.4)]">Markets</span>
          </h1>
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <span className="h-[1px] w-8 bg-gradient-to-r from-transparent to-amber-400/60"></span>
            <span className="text-[11px] tracking-[0.25em] uppercase font-bold text-amber-400/90">
              GIFTP
            </span>
            <span className="h-[1px] w-8 bg-gradient-to-l from-transparent to-amber-400/60"></span>
          </div>
        </div>

        {/* Feedback message banner */}
        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 text-left ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* MODE 1: SIGN IN (Matches Screenshot exactly) */}
        {mode === 'signin' && (
          <form onSubmit={handleSignInSubmit} className="space-y-4 text-left text-xs">
            {/* Username / Email */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block text-[13px]">
                Username / Email
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Username / Email"
                  className="w-full bg-[#0c1426]/90 border border-[#1e2f52] focus:border-amber-400 text-white rounded-xl pl-10 pr-4 py-3 outline-none transition-all placeholder:text-slate-500 text-xs shadow-inner"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block text-[13px]">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-[#0c1426]/90 border border-[#1e2f52] focus:border-amber-400 text-white rounded-xl pl-10 pr-10 py-3 outline-none transition-all placeholder:text-slate-500 text-xs shadow-inner font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Big Golden Button matching Screenshot */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#f5a623] via-[#ffb938] to-[#e69818] hover:from-[#e69818] hover:to-[#d8890e] text-black font-extrabold py-3.5 rounded-xl transition-all shadow-[0_4px_25px_rgba(245,166,35,0.35)] active:scale-[0.98] cursor-pointer text-sm tracking-wide mt-2"
            >
              Go to Sign In
            </button>

            {/* Links matching Screenshot */}
            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  window.history.pushState({}, '', '/register');
                  setFeedback(null);
                }}
                className="text-[#f5a623] hover:underline flex items-center gap-1.5 font-semibold cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSupportOpen(true)}
                className="text-[#f5a623] hover:underline flex items-center gap-1.5 font-semibold cursor-pointer"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Forgot Password / Help</span>
              </button>
            </div>
          </form>
        )}

        {/* MODE 2: CREATE ACCOUNT (REGISTRATION) */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-left text-xs">
            <div className="text-center pb-1">
              <h3 className="text-base font-bold text-white">Create New Trader Account</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Instant registration. An exclusive UID will be assigned to you.
              </p>
            </div>

            {/* Name / Username */}
            <div className="space-y-1">
              <label className="text-slate-300 font-medium block">Username / Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. john_trader"
                  className="w-full bg-[#0c1426]/90 border border-[#1e2f52] focus:border-amber-400 text-white rounded-xl pl-10 pr-4 py-2.5 outline-none text-xs"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-slate-300 font-medium block">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. john@example.com"
                  className="w-full bg-[#0c1426]/90 border border-[#1e2f52] focus:border-amber-400 text-white rounded-xl pl-10 pr-4 py-2.5 outline-none text-xs"
                />
              </div>
            </div>

            {/* Phone (optional) */}
            <div className="space-y-1">
              <label className="text-slate-300 font-medium block">Phone Number (Optional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+44 7911 123456"
                  className="w-full bg-[#0c1426]/90 border border-[#1e2f52] focus:border-amber-400 text-white rounded-xl pl-10 pr-4 py-2.5 outline-none text-xs"
                />
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium block">Password</label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min. 6 chars"
                    className="w-full bg-[#0c1426]/90 border border-[#1e2f52] focus:border-amber-400 text-white rounded-xl px-3 py-2.5 outline-none text-xs font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 font-medium block">Confirm</label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter"
                    className="w-full bg-[#0c1426]/90 border border-[#1e2f52] focus:border-amber-400 text-white rounded-xl px-3 py-2.5 outline-none text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Submit Registration Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#f5a623] to-[#e69818] hover:from-[#e69818] hover:to-[#d8890e] text-black font-extrabold py-3.5 rounded-xl transition-all shadow-[0_4px_25px_rgba(245,166,35,0.35)] active:scale-[0.98] cursor-pointer text-sm tracking-wide mt-2"
            >
              Create Account & Start Trading
            </button>

            {/* Back to Sign In */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setFeedback(null);
                }}
                className="text-[#f5a623] hover:underline font-semibold cursor-pointer text-xs"
              >
                ← Already have an account? Go to Sign In
              </button>
            </div>
          </form>
        )}


      </div>
    </div>
  );
};

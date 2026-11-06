import React, { useState, useEffect } from 'react';
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
  Gift,
} from 'lucide-react';
import { CptLogo } from '../components/CptLogo';

export const UserLoginView: React.FC = () => {
  const { loginUser, registerUser, validateReferralCode, setActiveTab, setIsSupportOpen } = useApp();

  const [mode, setMode] = useState<'signin' | 'register'>('signin');

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
  const [regReferralCode, setRegReferralCode] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Read ?ref= query parameter automatically
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const ref = searchParams.get('ref');
      if (ref) {
        setRegReferralCode(ref.trim());
        setMode('register');
      }
    }
  }, []);

  // Referral codes are looked up through a restricted Supabase RPC, not a client-side user list.
  const [matchedInviter, setMatchedInviter] = useState<{ uid: string; name: string } | null>(null);
  const [checkingReferral, setCheckingReferral] = useState(false);
  useEffect(() => {
    let active = true;
    const code = regReferralCode.trim();
    if (!code) { setMatchedInviter(null); setCheckingReferral(false); return; }
    setCheckingReferral(true);
    validateReferralCode(code).then((result) => {
      if (!active) return;
      setMatchedInviter(result.valid && result.uid ? { uid: result.uid, name: result.name || 'Trader' } : null);
      setCheckingReferral(false);
    }).catch(() => {
      if (active) { setMatchedInviter(null); setCheckingReferral(false); }
    });
    return () => { active = false; };
  }, [regReferralCode]);

  // Feedback messages
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const res = await loginUser(loginIdentifier, loginPassword);
    if (!res.success) {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (regPassword && regConfirmPassword && regPassword !== regConfirmPassword) {
      setFeedback({ type: 'error', message: 'Passwords do not match. Please re-enter.' });
      return;
    }

    const trimmedRef = regReferralCode.trim();
    if (!trimmedRef) {
      setFeedback({
        type: 'error',
        message: 'Referral Code is required to register. Please enter a valid inviter UID.',
      });
      return;
    }

    const referralCheck = await validateReferralCode(trimmedRef);
    if (!referralCheck.valid) {
      setFeedback({ type: 'error', message: referralCheck.message || 'Invalid Referral Code. Please enter a valid inviter UID.' });
      return;
    }

    const res = await registerUser({
      name: regName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      referralCode: trimmedRef,
    });

    if (!res.success) {
      setFeedback({ type: 'error', message: res.message });
    } else {
      setFeedback({ type: 'success', message: res.message });
      setMode('signin');
      setLoginIdentifier(regEmail.trim().toLowerCase());
      setLoginPassword('');
      setRegPassword('');
      setRegConfirmPassword('');
      if (typeof window !== 'undefined') window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4 relative overflow-hidden bg-[#070b14] select-none">
      {/* Radial soft blue glow matching Screenshot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[#0c1f44]/40 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-[420px] relative z-10 text-center space-y-6">
        {/* Clean Logo Header */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <CptLogo size={42} showText={true} />
          <p className="text-xs text-slate-400">
            {mode === 'signin' ? 'Sign in to access your trading account' : 'Join CPT Markets for global trading'}
          </p>
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
            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block text-[13px]">
                Email Address
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Email Address"
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
                    placeholder="Min. 8 chars"
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

            {/* Referral Code (Mandatory Requirement) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-medium block">
                  Referral Code <span className="text-rose-400 font-bold">*</span>
                </label>
                <span className="text-[10px] text-amber-400/90 font-medium">Inviter UID required</span>
              </div>
              <div className="relative">
                <Gift className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={regReferralCode}
                  onChange={(e) => setRegReferralCode(e.target.value)}
                  placeholder="Enter Inviter UID (e.g. 100001)"
                  className={`w-full bg-[#0c1426]/90 border rounded-xl pl-10 pr-4 py-2.5 outline-none text-xs font-mono transition-colors ${
                    matchedInviter
                      ? 'border-emerald-500/80 text-emerald-300 focus:border-emerald-400'
                      : regReferralCode.trim()
                      ? 'border-rose-500/80 text-rose-300 focus:border-rose-400'
                      : 'border-[#1e2f52] focus:border-amber-400 text-white'
                  }`}
                />
              </div>

              {/* Dynamic Inviter Verification Feedback */}
              {regReferralCode.trim() && (
                <div className="pt-1">
                  {checkingReferral ? (
                    <div className="text-[11px] text-slate-400">Checking referral code…</div>
                  ) : matchedInviter ? (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      <span>
                        Verified Inviter: <strong className="text-white">{matchedInviter.name}</strong> · UID <strong className="text-white font-mono">{matchedInviter.uid}</strong>
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[11px] text-rose-400 font-medium bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                      <span>Invalid Referral Code. No registered trader found with this UID.</span>
                    </div>
                  )}
                </div>
              )}
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

        {/* Platform Compliance & Security Footer */}
        <div className="pt-4 border-t border-[#182647] text-center space-y-2 text-xs text-slate-500">
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <Shield className="w-3.5 h-3.5 text-amber-400/80" />
            <span>Regulated Margin Brokerage & 256-Bit SSL Encrypted</span>
          </div>
          <p className="text-[10px] text-slate-600">
            CPT Markets UK is authorized and regulated by the Financial Conduct Authority (FCA).
          </p>
        </div>
      </div>
    </div>
  );
};

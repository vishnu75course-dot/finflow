
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Mail, ArrowRight, Phone, Check, X, Shield, User as UserIcon, ChevronDown } from 'lucide-react';
import { InputField } from '../components/ui/InputField';
import { PasswordField } from '../components/ui/PasswordField';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { useData } from '../DataContext';
import { login as apiLogin } from '../services/api';

const MOCK_ACCOUNTS = [
  { 
    name: 'Vishnu Prasath', 
    email: 's.vishnuprasath1705@gmail.com', 
    avatarLetter: 'V', 
    avatarBg: 'bg-[#7B1FA2]', // Purple
  },
  { 
    name: 'VishnuPrasath.S -2023', 
    email: 'vishnuprasath.s@care.ac.in', 
    avatarLetter: 'V', 
    avatarBg: 'bg-[#1565C0]', // Blue
    status: 'Signed out'
  },
  { 
    name: 'vishnu prasath', 
    email: 'vishnu75course@gmail.com', 
    avatarLetter: 'v', 
    avatarBg: 'bg-[#00838F]', // Teal
  },
];

export default function Login() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulation States
  const [showGoogleDialog, setShowGoogleDialog] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [selectedGoogleAccount, setSelectedGoogleAccount] = useState<typeof MOCK_ACCOUNTS[0] | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (emailRef.current) {
      emailRef.current.focus();
    }
  }, []);
  const { login } = useData();

  const validate = () => {
    if (!email) {
      setError('Enter a valid email');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email format');
      return false;
    }
    if (!password) {
      setError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await apiLogin({ email, password, remember_me: rememberMe });

      if (response.status === 'success') {
        login(response.data.user, response.data.access_token);
        navigate('/');
      } else {
        setError(response.message || 'Authentication failed.');
      }
    } catch (err) {
      setError('Terminal connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    setError(null);
    if (provider === 'google') {
      setShowGoogleDialog(true);
    } else if (provider === 'phone') {
      setShowPhoneDialog(true);
    }
  };

  const handleGoogleAccountClick = (acc: typeof MOCK_ACCOUNTS[0]) => {
    if (isVerifying) return;
    setSelectedGoogleAccount(acc);
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setShowGoogleDialog(false);
      login({ id: 'mock-google', name: acc.name, email: acc.email }, 'mock-jwt-google');
      navigate('/');
    }, 1500);
  };

  const handleUseAnotherAccount = () => {
    setShowGoogleDialog(false);
    if (emailRef.current) {
      emailRef.current.focus();
    }
  };

  const confirmPhoneLogin = () => {
    if (mobileNumber.length < 10) return;
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setShowPhoneDialog(false);
      login({ id: 'mock-phone', name: 'Phone User', email: `${mobileNumber}@phone.com` }, 'mock-jwt-phone');
      navigate('/');
    }, 1500);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-50 font-sans">
      <AnimatePresence>
        {/* Google Account Picker Simulation */}
        {showGoogleDialog && (
          <div className="fixed inset-0 z-[100] flex flex-col justify-between p-6 bg-[#1f1f1f] text-neutral-300 overflow-y-auto">
            {/* Close button at the top right of the screen */}
            <button 
              onClick={() => setShowGoogleDialog(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Empty space for centering */}
            <div className="flex-1 flex items-center justify-center py-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-[760px] bg-[#0b0b0b] rounded-[28px] border border-[#282828] shadow-2xl overflow-hidden"
              >
                {/* Simulated Google progress bar during verification */}
                {isVerifying && (
                  <div className="absolute top-[55px] left-0 right-0 h-[3px] overflow-hidden bg-neutral-900 z-10">
                    <div className="h-full bg-[#8ab4f8] animate-google-progress absolute" style={{ width: '30%' }} />
                  </div>
                )}

                {/* Top Google Header */}
                <div className="flex items-center gap-2.5 px-8 py-4 border-b border-[#282828]">
                  <GoogleIcon size={18} />
                  <span className="text-xs font-normal text-neutral-300 uppercase tracking-wider">Sign in with Google</span>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1.4fr] gap-8 p-8 md:p-10">
                  {/* Left Column: App Branding */}
                  <div className="flex flex-col items-start text-left">
                    <div className="bg-white w-[54px] h-[54px] rounded-[12px] flex items-center justify-center text-slate-950 font-black shadow-lg shadow-black/40">
                      <Wallet size={26} />
                    </div>
                    <h4 className="text-[28px] font-normal text-neutral-100 mt-6 leading-tight tracking-wide">
                      Choose an account
                    </h4>
                    <p className="text-[14px] text-neutral-400 mt-2">
                      to continue to <span className="text-[#8ab4f8] hover:underline cursor-pointer font-medium">FinFlow</span>
                    </p>
                  </div>

                  {/* Right Column: Account list */}
                  <div className="flex flex-col text-left justify-between min-h-[300px]">
                    <div className="divide-y divide-[#282828] border-b border-[#282828]">
                      {MOCK_ACCOUNTS.map((acc) => {
                        const isSelected = selectedGoogleAccount?.email === acc.email;
                        return (
                          <button
                            key={acc.email}
                            disabled={isVerifying}
                            onClick={() => handleGoogleAccountClick(acc)}
                            className="w-full flex items-center gap-3.5 py-3.5 px-2 hover:bg-neutral-900/60 active:bg-neutral-800/60 transition-colors text-left disabled:opacity-75 disabled:cursor-not-allowed group relative cursor-pointer"
                          >
                            {/* Circular Letter Avatar */}
                            <div className={`w-8 h-8 rounded-full ${acc.avatarBg} flex items-center justify-center text-white text-sm font-semibold shrink-0`}>
                              {acc.avatarLetter}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-neutral-200 leading-tight group-hover:text-white transition-colors">
                                {acc.name}
                              </p>
                              <p className="text-xs text-neutral-400 leading-tight mt-0.5 truncate">
                                {acc.email}
                              </p>
                            </div>

                            {/* Status or Indicator */}
                            {acc.status ? (
                              <span className="text-[11px] text-neutral-400 bg-neutral-900/80 px-2 py-0.5 rounded border border-[#282828] ml-auto shrink-0 font-normal">
                                {acc.status}
                              </span>
                            ) : isSelected && isVerifying ? (
                              <div className="w-4 h-4 border-2 border-[#8ab4f8]/30 border-t-[#8ab4f8] rounded-full animate-spin ml-auto shrink-0" />
                            ) : null}
                          </button>
                        );
                      })}

                      {/* Use another account option */}
                      <button
                        disabled={isVerifying}
                        onClick={handleUseAnotherAccount}
                        className="w-full flex items-center gap-3.5 py-4 px-2 hover:bg-neutral-900/60 active:bg-neutral-800/60 transition-colors text-left disabled:opacity-75 cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full border border-[#282828] flex items-center justify-center text-neutral-400 shrink-0">
                          <UserIcon size={15} />
                        </div>
                        <span className="text-[13px] font-medium text-neutral-200">
                          Use another account
                        </span>
                      </button>
                    </div>

                    {/* Disclaimer Policy Terms */}
                    <p className="text-[11px] text-neutral-400 leading-relaxed mt-6">
                      Before using this app, you can review FinFlow's{' '}
                      <span className="text-[#8ab4f8] hover:underline cursor-pointer">Privacy Policy</span>{' '}
                      and{' '}
                      <span className="text-[#8ab4f8] hover:underline cursor-pointer">Terms of Service</span>.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Bottom Footer links */}
            <div className="w-full max-w-[760px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-neutral-500 px-2 select-none">
              <div className="flex items-center gap-1 cursor-pointer hover:text-neutral-400 transition-colors">
                <span>English (United Kingdom)</span>
                <ChevronDown size={14} />
              </div>
              <div className="flex gap-5">
                <span className="cursor-pointer hover:text-neutral-400 transition-colors">Help</span>
                <span className="cursor-pointer hover:text-neutral-400 transition-colors">Privacy</span>
                <span className="cursor-pointer hover:text-neutral-400 transition-colors">Terms</span>
              </div>
            </div>
          </div>
        )}

        {/* Phone Verification Simulation */}
        {showPhoneDialog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowPhoneDialog(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-[360px] bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="w-16 h-16 bg-brand-accent/10 rounded-2xl flex items-center justify-center text-brand-accent mx-auto mb-6">
                  <Phone size={32} />
                </div>
                <h4 className="text-2xl font-black text-slate-900 text-center mb-2 uppercase tracking-tight">Phone Access</h4>
                <p className="text-slate-500 text-sm text-center mb-6">Enter your node identifier (mobile) to synchronize terminal.</p>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mobile Number</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">+91</span>
                        <div className="w-px h-4 bg-slate-100" />
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="00000 00000"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-16 pr-6 text-sm font-bold focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition-all placeholder:text-slate-300"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowPhoneDialog(false)}
                      className="flex-1 py-4 px-4 rounded-2xl text-[10px] font-black text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={mobileNumber.length < 10 || isVerifying}
                      onClick={confirmPhoneLogin}
                      className="flex-[2] py-4 px-4 rounded-2xl text-[10px] font-black text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      {isVerifying ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Verify Identification</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-2 text-slate-400">
                  <Shield size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">End-to-end Encrypted</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <div className="hidden lg:flex bg-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 text-indigo-50 font-black">
            <Wallet size={28} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">FinFlow</h1>
        </div>

        <div className="relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl font-black text-white leading-[0.9] uppercase tracking-tighter"
          >
            Sovereign <br /> <span className="text-emerald-400 italic serif normal-case tracking-normal">Wealth</span> <br /> Monitoring.
          </motion.h2>
          <p className="text-slate-400 mt-6 max-w-sm font-medium leading-relaxed">
            The intelligent layer for your personal economy. Precise telemetry, autonomous insights, and absolute control over your financial trajectory.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6">
          <div className="flex -space-x-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-12 h-12 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white shadow-lg overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="user" className="w-full h-full" />
              </div>
            ))}
          </div>
          <p className="text-xs font-black text-white/50 uppercase tracking-widest">+12K OPERATORS ACTIVE</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-white lg:bg-transparent overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md bg-white p-10 rounded-[32px] shadow-2xl shadow-slate-200 border border-slate-100"
        >
          <div className="mb-8">
            <h3 className="text-3xl font-black text-slate-900 mb-1 uppercase tracking-tight">Login page</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enter your credentials to synchronize data</p>
          </div>

          <AnimatePresence>
            {error && <Alert message={error} onClose={() => setError(null)} />}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-5">
            <InputField
              label="Authentication Mail"
              type="email"
              icon={Mail}
              placeholder="name@nexus.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              ref={emailRef}
              required
            />

            <PasswordField
              label="Access Key"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative w-4 h-4">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <div className="w-4 h-4 border border-slate-300 rounded peer-checked:bg-brand-accent peer-checked:border-brand-accent transition-all duration-200" />
                  <div className="absolute inset-0 flex items-center justify-center text-white scale-0 peer-checked:scale-100 transition-transform duration-200">
                    <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z" /></svg>
                  </div>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors cursor-pointer">Remember Me</span>
              </label>

              <button
                type="button"
                onClick={() => setError("Password recovery system is currently offline.")}
                className="ml-auto text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            <Button isLoading={isLoading} icon={ArrowRight}>
              Sign In
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
              <span className="bg-white px-4 text-slate-300">Third Party Auth</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleSocialLogin('google')}
              className="flex items-center justify-center gap-2 bg-white border border-slate-100 p-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98] shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <GoogleIcon />
              <span>Google</span>
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleSocialLogin('phone')}
              className="flex items-center justify-center gap-2 bg-white border border-slate-100 p-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98] shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Phone size={16} className="text-slate-400" />
              <span>Phone</span>
            </button>
          </div>

          <p className="mt-10 text-center text-xs font-bold text-slate-500 uppercase tracking-tight">
            New operator? <Link to="/register" className="text-emerald-600 hover:underline">Sign Up</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function GoogleIcon({ size = 16, className = "" }: { size?: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}



import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Mail, User as UserIcon, ArrowRight, IndianRupee, ShieldCheck, Globe, Clock, Phone } from 'lucide-react';
import { InputField } from '../components/ui/InputField';
import { PasswordField } from '../components/ui/PasswordField';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { register as apiRegister } from '../services/api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (nameRef.current) {
      nameRef.current.focus();
    }
  }, []);

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  const validate = () => {
    if (name.length < 3) {
      setError('Full Name must be at least 3 characters.');
      return false;
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid identification mail.');
      return false;
    }
    if (passwordStrength < 4) {
      setError('Password must be 8+ chars with uppercase, number, and special character.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Confirm password does not match.');
      return false;
    }
    if (!acceptTerms) {
      setError('You must accept the Node Protocols.');
      return false;
    }
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;
    setIsLoading(true);

    try {
      const response = await apiRegister({
        name,
        email,
        password
      });

      if (response.status === 'success') {
        navigate('/login');
      } else {
        setError(response.message || 'Registration failed.');
      }
    } catch (err) {
      setError('Connection failure. Terminal could not established.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    setError(null);
    setIsLoading(true);
    // Simulate social authentication
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1200);
    }, 1000);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-50 font-sans">
      <div className="hidden lg:flex bg-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-accent rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-brand-accent rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 font-black">
            <Wallet size={28} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">FinFlow</h1>
        </div>

        <div className="relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl font-black text-white leading-[0.9] uppercase tracking-tighter"
          >
            Establish <br /> New <span className="text-brand-accent italic serif normal-case tracking-normal">Fiscal</span> <br /> Node.
          </motion.h2>
          <p className="text-slate-400 mt-6 max-w-sm font-medium leading-relaxed">
            Join the ecosystem of precision-driven capital managers. Scale your trajectory with total transparency and zero guesswork.
          </p>
        </div>

        <div className="relative z-10">
          <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl max-w-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-brand-accent/20 rounded-lg flex items-center justify-center text-brand-accent">
                <ShieldCheck size={20} />
              </div>
              <p className="text-xs font-black text-white uppercase tracking-widest">Protocol Insight</p>
            </div>
            <p className="text-sm font-bold text-slate-300 leading-relaxed">
              Your monthly telemetry flow will be calibrated based on your initial income parameters. This ensures optimal savings rate analysis.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-white lg:bg-transparent overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md bg-white p-8 sm:p-10 rounded-[32px] shadow-2xl shadow-slate-200 border border-slate-100 my-8"
        >
          <div className="mb-8">
            <h3 className="text-3xl font-black text-slate-900 mb-1 uppercase tracking-tight">Register Page</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connect to the FinFlow fiscal ecosystem</p>
          </div>

          <AnimatePresence>
            {error && <Alert message={error} onClose={() => setError(null)} />}
            {success && <Alert type="success" message="Node initialized. Redirecting to terminal..." />}
          </AnimatePresence>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-1 gap-4">
              <InputField
                label="Full Name"
                icon={UserIcon}
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                ref={nameRef}
                required
              />
              <InputField
                label="Identification Mail"
                type="email"
                icon={Mail}
                placeholder="john@nexus.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PasswordField
                label="Security Key"
                placeholder="••••••••"
                strength={passwordStrength}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <PasswordField
                label="Confirm Key"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="px-1 pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative w-5 h-5 flex-shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    required
                  />
                  <div className="w-5 h-5 border border-slate-300 rounded-lg peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all duration-200" />
                  <div className="absolute inset-0 flex items-center justify-center text-white scale-0 peer-checked:scale-100 transition-transform duration-200">
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z" /></svg>
                  </div>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed group-hover:text-slate-600 transition-colors">
                  I accept the <Link to="#" className="text-emerald-600 hover:underline">Node Protocols</Link>
                </span>
              </label>
            </div>

            <Button isLoading={isLoading} icon={ArrowRight}>
              Sign Up
            </Button>
          </form>

          <p className="mt-10 text-center text-xs font-bold text-slate-500 uppercase tracking-tight">
            Existing operator? <Link to="/login" className="text-emerald-600 hover:underline tracking-widest">Sign In</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

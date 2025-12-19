import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [view, setView] = useState<'login' | 'forgot'>('login');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/home');
    } catch (err: any) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset link sent to your email!");
    } catch (err: any) {
      setError("Could not send reset email. Check if the address is correct.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#F8FAF8] to-emerald-50 dark:from-slate-950 dark:to-slate-900 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-[40px] p-10 shadow-2xl animate-slide-up border border-slate-100 dark:border-slate-700 transition-colors">
        <div className="text-center mb-10">
          <div className="w-16 h-16 brand-bg-green rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#2D4F32]/20">
            <i className={`fas ${view === 'login' ? 'fa-briefcase' : 'fa-key'} text-white text-2xl`}></i>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 transition-colors tracking-tight">
            {view === 'login' ? 'Welcome Back' : 'Reset Password'}
          </h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm font-medium transition-colors">
            {view === 'login' ? 'Sign in to find your dream job' : 'We will send a recovery link to your email'}
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 p-4 rounded-2xl mb-6 text-xs font-black uppercase tracking-widest flex items-center gap-2 border border-rose-100 dark:border-rose-900/30 transition-colors">
            <i className="fas fa-exclamation-circle text-sm"></i>
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl mb-6 text-xs font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-100 dark:border-emerald-900/30 transition-colors">
            <i className="fas fa-check-circle text-sm"></i>
            {success}
          </div>
        )}

        <form onSubmit={view === 'login' ? handleLogin : handleResetPassword} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1 transition-colors">Email Address</label>
            <div className="relative">
              <i className="far fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600"></i>
              <input 
                required
                type="email" 
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-500 dark:text-white rounded-2xl py-4 pl-12 pr-5 outline-none font-bold text-sm transition-all"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {view === 'login' && (
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1 transition-colors">Password</label>
              <div className="relative">
                <i className="fas fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600"></i>
                <input 
                  required
                  type="password" 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-500 dark:text-white rounded-2xl py-4 pl-12 pr-5 outline-none font-bold text-sm transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="text-right">
            <button 
              type="button"
              onClick={() => {
                setView(view === 'login' ? 'forgot' : 'login');
                setError('');
                setSuccess('');
              }}
              className="text-xs font-black uppercase tracking-widest brand-text-green dark:text-emerald-400 hover:opacity-80 transition-colors"
            >
              {view === 'login' ? 'Forgot Password?' : 'Back to Login'}
            </button>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full brand-bg-green text-white py-5 rounded-[24px] font-bold text-lg shadow-xl shadow-[#2D4F32]/20 hover:opacity-95 transition transform active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : view === 'login' ? 'Sign In' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-700 text-center transition-colors">
          <p className="text-slate-400 dark:text-slate-500 text-sm font-medium transition-colors">
            Don't have an account? <Link to="/register" className="brand-text-green dark:text-emerald-400 font-bold hover:underline transition-colors ml-1">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
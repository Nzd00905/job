
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, firestoreService } from '../services/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: name });
      await firestoreService.saveUserProfile(user.uid, { 
        fullName: name, 
        email,
        createdAt: new Date()
      });
      navigate('/home');
    } catch (err: any) {
      alert(err.message || "Error creating account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-950 dark:to-slate-900 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-10 shadow-2xl animate-slide-up border border-transparent dark:border-slate-700 transition-colors">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200 dark:shadow-none">
            <i className="fas fa-user-plus text-white text-2xl"></i>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 transition-colors">Get Started</h1>
          <p className="text-gray-500 dark:text-slate-400 transition-colors">Join thousands of job seekers today</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1 transition-colors">Full Name</label>
            <div className="relative">
              <i className="far fa-user absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"></i>
              <input 
                required
                type="text" 
                className="w-full bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 dark:focus:border-emerald-500 dark:text-white rounded-2xl py-4 pl-12 pr-5 outline-none transition"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1 transition-colors">Email Address</label>
            <div className="relative">
              <i className="far fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"></i>
              <input 
                required
                type="email" 
                className="w-full bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 dark:focus:border-emerald-500 dark:text-white rounded-2xl py-4 pl-12 pr-5 outline-none transition"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1 transition-colors">Password</label>
            <div className="relative">
              <i className="fas fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"></i>
              <input 
                required
                type="password" 
                className="w-full bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 dark:focus:border-emerald-500 dark:text-white rounded-2xl py-4 pl-12 pr-5 outline-none transition"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            disabled={isSubmitting}
            type="submit" 
            className={`w-full bg-indigo-600 dark:bg-emerald-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-100 dark:shadow-none transition transform active:scale-95 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700 dark:hover:bg-emerald-700'}`}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-gray-100 dark:border-slate-700 text-center transition-colors">
          <p className="text-gray-500 dark:text-slate-400 transition-colors">
            Already have an account? <Link to="/login" className="text-indigo-600 dark:text-emerald-400 font-bold hover:underline transition-colors">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

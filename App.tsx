
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import JobDetails from './pages/JobDetails';
import Apply from './pages/Apply';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import Success from './pages/Success';
import ApplicationDetails from './pages/ApplicationDetails';
import ChatAdmin from './pages/ChatAdmin';
import Search from './pages/Search';
import HowToWork from './pages/HowToWork';
import AdminDashboard from './admin/Dashboard';
import { auth, firestoreService } from './services/firebase';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const ProtectedRoute = ({ children, user }: { children?: React.ReactNode, user: any }) => {
  const [status, setStatus] = useState<'loading' | 'approved' | 'unauthorized' | 'banned'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) {
        setStatus('unauthorized');
        return;
      }
      try {
        const profile = await firestoreService.getUserProfile(user.uid);
        if (!profile) {
          setStatus('approved'); 
          return;
        }
        
        if (profile.status === 'banned') {
          setStatus('banned');
          setErrorMsg("Your account has been banned. Contact support for more info.");
        } else if (profile.status === 'pending') {
          setStatus('unauthorized');
          setErrorMsg("Your account is pending admin approval.");
        } else {
          setStatus('approved');
        }
      } catch (e) {
        setStatus('approved');
      }
    };
    checkStatus();
  }, [user]);

  if (!user) return <Navigate to="/login" />;
  
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Verifying account...</div>;
  }

  if (status === 'banned' || (status === 'unauthorized' && errorMsg)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center space-y-6">
        <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 text-3xl">
          <i className="fas fa-user-lock"></i>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900">Access Denied</h2>
          <p className="text-slate-400 text-sm">{errorMsg}</p>
        </div>
        <button 
          onClick={() => signOut(auth)}
          className="brand-bg-green text-white px-8 py-3 rounded-2xl font-bold"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAF8] dark:bg-[#0F172A]">
        <div className="w-12 h-12 border-4 border-[#2D4F32] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#F8FAF8] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 transition-colors selection:bg-emerald-100 selection:text-emerald-900">
        <div className="max-w-md mx-auto px-4 pt-6 pb-24 min-h-screen">
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/home" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/home" />} />
            <Route path="/admin" element={<AdminDashboard />} />
            
            <Route path="/" element={<Navigate to="/home" />} />
            
            <Route path="/home" element={<ProtectedRoute user={user}><Home /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute user={user}><Search /></ProtectedRoute>} />
            <Route path="/job/:id" element={<ProtectedRoute user={user}><JobDetails /></ProtectedRoute>} />
            <Route path="/apply/:id" element={<ProtectedRoute user={user}><Apply /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute user={user}><Profile /></ProtectedRoute>} />
            <Route path="/success" element={<ProtectedRoute user={user}><Success /></ProtectedRoute>} />
            <Route path="/application/:id" element={<ProtectedRoute user={user}><ApplicationDetails /></ProtectedRoute>} />
            <Route path="/chat-admin/:id" element={<ProtectedRoute user={user}><ChatAdmin /></ProtectedRoute>} />
            <Route path="/how-to-work" element={<ProtectedRoute user={user}><HowToWork /></ProtectedRoute>} />
            
            <Route path="*" element={<Navigate to="/home" />} />
          </Routes>
        </div>

        {user && (
          <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-100 dark:border-slate-800 py-3 px-6 flex justify-between items-center z-50 transition-colors max-w-md mx-auto rounded-t-[32px] shadow-2xl shadow-black/5">
            <Link to="/home" className="flex flex-col items-center gap-1.5 text-slate-300 dark:text-slate-600 hover:text-[#2D4F32] dark:hover:text-emerald-400 transition-all active:scale-90">
              <i className="fas fa-home text-xl"></i>
              <span className="text-[7px] font-black uppercase tracking-widest">Home</span>
            </Link>
            <Link to="/search" className="flex flex-col items-center gap-1.5 text-slate-300 dark:text-slate-600 hover:text-[#2D4F32] dark:hover:text-emerald-400 transition-all active:scale-90">
              <i className="fas fa-search text-xl"></i>
              <span className="text-[7px] font-black uppercase tracking-widest">Search</span>
            </Link>
            <Link to={`/chat-admin/${user.uid}`} className="w-16 h-16 brand-bg-green rounded-full flex items-center justify-center text-white -mt-12 shadow-2xl shadow-[#2D4F32]/40 border-[6px] border-[#F8FAF8] dark:border-[#0F172A] transition-all hover:scale-110 active:scale-95 group">
              <i className="fas fa-comments-alt text-2xl group-hover:rotate-12 transition-transform"></i>
            </Link>
            <Link to="/profile" className="flex flex-col items-center gap-1.5 text-slate-300 dark:text-slate-600 hover:text-[#2D4F32] dark:hover:text-emerald-400 transition-all active:scale-90">
              <i className="fas fa-user text-xl"></i>
              <span className="text-[7px] font-black uppercase tracking-widest">Profile</span>
            </Link>
            <Link to="/how-to-work" className="flex flex-col items-center gap-1.5 text-slate-300 dark:text-slate-600 hover:text-[#2D4F32] dark:hover:text-emerald-400 transition-all active:scale-90">
              <i className="fas fa-book-open text-xl"></i>
              <span className="text-[7px] font-black uppercase tracking-widest">Policies</span>
            </Link>
          </nav>
        )}
      </div>
    </HashRouter>
  );
};

export default App;

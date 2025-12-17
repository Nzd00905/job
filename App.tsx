
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Withdraw from './pages/Withdraw';
import JobDetails from './pages/JobDetails';
import Apply from './pages/Apply';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import Success from './pages/Success';
import ApplicationDetails from './pages/ApplicationDetails';
import ChatAdmin from './pages/ChatAdmin';
import Search from './pages/Search';
import AdminDashboard from './admin/Dashboard';
import { auth, firestoreService } from './services/firebase';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const ProtectedRoute = ({ children, user }: { children: React.ReactNode, user: any }) => {
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
          setStatus('approved'); // Fallback if record not yet created
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

const Navigation = () => {
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/success', '/admin'].includes(location.pathname);
  if (isAuthPage) return null;

  return (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-[32px] px-8 py-5 flex justify-between items-center shadow-2xl z-50 transition-colors">
      <Link to="/home" className={`text-xl ${location.pathname === '/home' ? 'brand-text-green dark:text-emerald-400 scale-110' : 'text-slate-300 dark:text-slate-600'} transition-all`}>
        <i className="fas fa-home"></i>
      </Link>
      <Link to="/withdraw" className={`text-xl ${location.pathname === '/withdraw' ? 'brand-text-green dark:text-emerald-400 scale-110' : 'text-slate-300 dark:text-slate-600'} transition-all`}>
        <i className="fas fa-wallet"></i>
      </Link>
      <Link to="/profile" className={`text-xl ${location.pathname === '/profile' || location.pathname.startsWith('/application') ? 'brand-text-green dark:text-emerald-400 scale-110' : 'text-slate-300 dark:text-slate-600'} transition-all`}>
        <i className="fas fa-user"></i>
      </Link>
    </nav>
  );
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
      <div className="flex flex-col items-center justify-center min-h-screen brand-bg-green px-6">
        <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/20 animate-pulse">
          <i className="fas fa-briefcase text-white text-3xl"></i>
        </div>
        <h1 className="text-white text-2xl font-extrabold tracking-tight">Jobs Center</h1>
      </div>
    );
  }

  return (
    <HashRouter>
      <AppContent user={user} />
    </HashRouter>
  );
};

const AppContent = ({ user }: { user: any }) => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF8] dark:bg-[#0F172A] relative overflow-x-hidden transition-colors">
      <main className={`flex-1 w-full ${isAdminPage ? '' : 'max-w-2xl mx-auto px-4 pt-6'} ${user ? 'pb-40' : 'pb-6'}`}>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/home" /> : <Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<ProtectedRoute user={user}><Home /></ProtectedRoute>} />
          <Route path="/withdraw" element={<ProtectedRoute user={user}><Withdraw /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute user={user}><Search /></ProtectedRoute>} />
          <Route path="/job/:id" element={<ProtectedRoute user={user}><JobDetails /></ProtectedRoute>} />
          <Route path="/apply/:id" element={<ProtectedRoute user={user}><Apply /></ProtectedRoute>} />
          <Route path="/success" element={<ProtectedRoute user={user}><Success /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute user={user}><Profile /></ProtectedRoute>} />
          <Route path="/application/:id" element={<ProtectedRoute user={user}><ApplicationDetails /></ProtectedRoute>} />
          <Route path="/chat-admin/:id" element={<ProtectedRoute user={user}><ChatAdmin /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>
      {user && <Navigation />}
    </div>
  );
};

export default App;

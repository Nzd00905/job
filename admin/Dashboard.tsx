
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { firestoreService, auth } from '../services/firebase';

type TabType = 'overview' | 'applications' | 'jobs' | 'users' | 'withdrawals' | 'inbox' | 'settings';

const AdminDashboard: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [chatThreads, setChatThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search states
  const [jobSearch, setJobSearch] = useState('');
  const [appSearch, setAppSearch] = useState('');
  
  // Form states
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [jobFormData, setJobFormData] = useState({ 
    title: '', 
    company: '', 
    logo: '', 
    salary: '', 
    amount: '',
    description: '', 
    type: 'Full Time' 
  });

  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [siteSettings, setSiteSettings] = useState({ siteName: '', supportEmail: '' });
  const [stats, setStats] = useState({ totalApps: 0, pendingApps: 0, totalJobs: 0, totalUsers: 0, pendingUsers: 0, pendingWithdrawals: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const authSession = sessionStorage.getItem('admin_auth');
    if (authSession === 'true') {
      setIsAuthorized(true);
    } else {
      firestoreService.initializeAdmin().then(created => {
        if (created) console.log("Default admin account created: admin@gmail.com / admin");
      });
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) fetchData();
  }, [isAuthorized]);

  useEffect(() => {
    if (activeChat) {
      const unsubscribe = firestoreService.subscribeToMessages(activeChat, (msgs) => setChatMessages(msgs));
      return () => unsubscribe();
    }
  }, [activeChat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allApps, allJobs, allUsers, allWithdraws, threads, settings] = await Promise.all([
        firestoreService.getAllApplications(),
        firestoreService.getJobs(),
        firestoreService.getAllUsers(),
        firestoreService.getAllWithdrawals(),
        firestoreService.getChatThreads(),
        firestoreService.getSettings()
      ]);

      setApplications(allApps);
      setJobs(allJobs);
      setUsers(allUsers);
      setWithdrawals(allWithdraws);
      setChatThreads(threads);
      setSiteSettings(settings);

      setStats({
        totalApps: allApps.length,
        pendingApps: allApps.filter(a => a.status === 'pending').length,
        totalJobs: allJobs.length,
        totalUsers: allUsers.length,
        pendingUsers: allUsers.filter(u => u.status === 'pending').length,
        pendingWithdrawals: allWithdraws.filter(w => w.status === 'pending').length
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const isValid = await firestoreService.verifyAdmin(adminEmail, adminPass);
      if (isValid) {
        setIsAuthorized(true);
        sessionStorage.setItem('admin_auth', 'true');
      } else {
        setLoginError('Invalid Credentials. Default is admin@gmail.com / admin');
      }
    } catch (err) {
      setLoginError('Connection error. Please check Firestore permissions.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingJob) {
        await firestoreService.updateJob(editingJob.id, jobFormData);
      } else {
        await firestoreService.addJob(jobFormData);
      }
      setShowJobForm(false);
      setEditingJob(null);
      fetchData();
    } catch (err) {
      alert("Failed to save job");
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this job listing?")) {
      await firestoreService.deleteJob(id);
      fetchData();
    }
  };

  const handleCompleteApp = async (id: string) => {
    if (window.confirm("Mark this application as COMPLETED and PAY the user? This action will transfer balance and cannot be undone.")) {
      try {
        await firestoreService.completeApplication(id);
        await fetchData();
        alert("Success! User has been paid and task closed.");
      } catch (err: any) {
        console.error("Complete error:", err);
        alert("Completion failed: " + err.message);
      }
    }
  };

  const handleUpdateAppStatus = async (id: string, status: string) => {
    try {
      await firestoreService.updateApplicationStatus(id, status);
      fetchData();
    } catch (err: any) {
      alert("Status update failed: " + err.message);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChat) return;
    await firestoreService.sendMessage(activeChat, chatInput, 'admin', 'admin');
    setChatInput('');
  };

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(jobSearch.toLowerCase()) || 
    j.company.toLowerCase().includes(jobSearch.toLowerCase())
  );

  const filteredApps = applications.filter(a => 
    a.fullName.toLowerCase().includes(appSearch.toLowerCase()) ||
    a.jobTitle.toLowerCase().includes(appSearch.toLowerCase())
  );

  const menuItems = [
    { id: 'overview', icon: 'fa-chart-line', label: 'Dashboard' },
    { id: 'users', icon: 'fa-user-group', label: 'User Directory' },
    { id: 'jobs', icon: 'fa-briefcase', label: 'Job Listings' },
    { id: 'applications', icon: 'fa-file-signature', label: 'Applications' },
    { id: 'withdrawals', icon: 'fa-wallet', label: 'Payout Requests' },
    { id: 'inbox', icon: 'fa-comments', label: 'Support Inbox' },
    { id: 'settings', icon: 'fa-sliders', label: 'Settings' }
  ];

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-[40px] p-10 shadow-2xl animate-slide-up border border-slate-100 dark:border-slate-700">
          <div className="text-center mb-10">
            <div className="w-20 h-20 brand-bg-green rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#2D4F32]/20 text-white">
              <i className="fas fa-shield-halved text-3xl"></i>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Admin OS</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Access Portal</p>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Admin Email</label>
              <input required type="email" placeholder="e.g. admin@gmail.com" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl outline-none dark:text-white" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Passkey</label>
              <input required type="password" placeholder="••••••••" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl outline-none dark:text-white" value={adminPass} onChange={e => setAdminPass(e.target.value)} />
            </div>
            {loginError && <p className="text-rose-500 text-[10px] font-black uppercase text-center bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl">{loginError}</p>}
            <button disabled={isLoggingIn} type="submit" className="w-full brand-bg-green text-white py-5 rounded-3xl font-bold text-lg shadow-xl shadow-[#2D4F32]/10 transition-all hover:scale-[1.02] flex items-center justify-center gap-3">
              {isLoggingIn ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-unlock-alt text-sm"></i>}
              {isLoggingIn ? 'Decrypting...' : 'Login to System'}
            </button>
            <button type="button" onClick={() => navigate('/login')} className="w-full text-slate-400 text-xs font-black uppercase tracking-widest hover:text-slate-600 transition-colors">Exit to Public Site</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0F172A] transition-colors relative">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col p-6 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between mb-12 px-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 brand-bg-green rounded-lg flex items-center justify-center text-white"><i className="fas fa-terminal text-sm"></i></div>
            <span className="font-black text-slate-900 dark:text-white text-lg tracking-tight">Admin OS</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400"><i className="fas fa-times"></i></button>
        </div>
        
        <nav className="flex-1 space-y-1">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id as TabType); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === item.id ? 'brand-bg-green text-white shadow-xl shadow-[#2D4F32]/10' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
              <i className={`fas ${item.icon} w-5 text-sm`}></i>
              {item.label}
              {(item.id === 'applications' && stats.pendingApps > 0) && (
                <span className="ml-auto bg-rose-500 text-white px-2 py-0.5 rounded-full text-[8px]">{stats.pendingApps}</span>
              )}
            </button>
          ))}
        </nav>

        <button onClick={() => { sessionStorage.removeItem('admin_auth'); setIsAuthorized(false); }} className="mt-8 flex items-center gap-4 px-5 py-4 text-rose-500 font-black uppercase text-[10px] tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-2xl transition-all">
          <i className="fas fa-power-off"></i> Logout System
        </button>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl">
            <i className="fas fa-bars text-slate-900 dark:text-white"></i>
          </button>
          <span className="font-black text-sm uppercase tracking-widest text-slate-900 dark:text-white">{activeTab}</span>
          <div className="w-10"></div>
        </header>

        <div className="p-6 lg:p-10 flex-1">
          {activeTab === 'overview' && (
            <div className="animate-slide-up space-y-8">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">Executive Control</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {[
                  { label: 'Total Users', value: stats.totalUsers, sub: 'Registered Accounts', color: 'indigo' },
                  { label: 'Waitlist', value: stats.pendingUsers, sub: 'Needs Verification', color: 'rose' },
                  { label: 'Open Positions', value: stats.totalJobs, sub: 'Live Marketplace', color: 'emerald' },
                  { label: 'Pending Payouts', value: stats.pendingWithdrawals, sub: 'Action Required', color: 'amber' }
                ].map((s, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{s.label}</p>
                    <h3 className={`text-4xl font-black text-${s.color}-500`}>{s.value}</h3>
                    <p className="text-[9px] font-bold text-slate-400 mt-2">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="animate-slide-up space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Inventory Control</h2>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input 
                      type="text" 
                      placeholder="Search jobs..." 
                      className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold outline-none focus:border-[#2D4F32] w-64"
                      value={jobSearch}
                      onChange={(e) => setJobSearch(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => { setEditingJob(null); setJobFormData({ title: '', company: '', logo: '', salary: '', amount: '', description: '', type: 'Full Time' }); setShowJobForm(true); }}
                    className="brand-bg-green text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#2D4F32]/10 transition-all hover:scale-105"
                  >
                    Deploy New Listing
                  </button>
                </div>
              </div>

              {showJobForm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                  <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-[40px] p-8 md:p-10 shadow-2xl animate-slide-up overflow-y-auto max-h-[90vh]">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">{editingJob ? 'Refine Listing' : 'Deploy New Listing'}</h3>
                      <button onClick={() => setShowJobForm(false)} className="text-slate-300 hover:text-rose-500 transition-colors"><i className="fas fa-times-circle text-2xl"></i></button>
                    </div>
                    <form onSubmit={handleJobSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Job Title</label>
                          <input required className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl font-bold dark:text-white outline-none" value={jobFormData.title} onChange={e => setJobFormData({...jobFormData, title: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Company</label>
                          <input required className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl font-bold dark:text-white outline-none" value={jobFormData.company} onChange={e => setJobFormData({...jobFormData, company: e.target.value})} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Salary Range Display</label>
                          <input required className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl font-bold dark:text-white outline-none" value={jobFormData.salary} onChange={e => setJobFormData({...jobFormData, salary: e.target.value})} placeholder="e.g. $500 - $1k" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Actual Amount ($)</label>
                          <input required type="number" className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl font-bold dark:text-white outline-none" value={jobFormData.amount} onChange={e => setJobFormData({...jobFormData, amount: e.target.value})} placeholder="e.g. 500" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Logo URL</label>
                        <input className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl font-bold dark:text-white outline-none" value={jobFormData.logo} onChange={e => setJobFormData({...jobFormData, logo: e.target.value})} placeholder="https://..." />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Job Description</label>
                        <textarea required rows={5} className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl font-bold dark:text-white outline-none resize-none" value={jobFormData.description} onChange={e => setJobFormData({...jobFormData, description: e.target.value})} />
                      </div>
                      <button type="submit" className="w-full brand-bg-green text-white py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl active:scale-95 transition-all">
                        {editingJob ? 'Update Deployment' : 'Launch Listing'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredJobs.map(job => (
                  <div key={job.id} className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm group hover:border-[#2D4F32] transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center p-2">
                        <img src={job.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${job.company}`} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingJob(job); setJobFormData(job); setShowJobForm(true); }} className="w-8 h-8 flex items-center justify-center bg-indigo-50 text-indigo-500 rounded-lg hover:bg-indigo-500 hover:text-white transition-all"><i className="fas fa-edit text-xs"></i></button>
                        <button onClick={() => handleDeleteJob(job.id)} className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><i className="fas fa-trash text-xs"></i></button>
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white truncate">{job.title}</h4>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">{job.company}</p>
                    <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-700 flex justify-between items-center">
                      <span className="text-sm font-black text-[#2D4F32] dark:text-emerald-400">${job.amount} ({job.salary})</span>
                      <span className="text-[9px] font-bold text-slate-400">{(job.applicants || 0)} APPS</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="animate-slide-up space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Submission Pipeline</h2>
                <div className="relative">
                  <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input 
                    type="text" 
                    placeholder="Search candidates..." 
                    className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold outline-none focus:border-[#2D4F32] w-64"
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4">
                {filteredApps.map(app => (
                  <div key={app.id} className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 group transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center p-3">
                        <img src={app.logo} className="w-10 h-10 object-contain" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{app.fullName}</h4>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{app.jobTitle} • {app.company}</p>
                        <p className="text-[9px] text-indigo-500 font-bold mt-1">Reward: ${app.jobAmount || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end md:self-center">
                      <span className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
                        app.status === 'pending' ? 'bg-amber-50 text-amber-600' : 
                        app.status === 'accepted' ? 'bg-indigo-50 text-indigo-600' : 
                        app.status === 'completed' ? 'brand-bg-green text-white shadow-lg shadow-[#2D4F32]/20' : 
                        'bg-rose-50 text-rose-600'}`}>
                        {app.status === 'pending' ? 'Delivered' : app.status}
                      </span>
                      
                      <div className="flex gap-1">
                        {/* ACCEPT BUTTON (VISIBLE FOR PENDING) */}
                        {app.status === 'pending' && (
                          <button onClick={() => handleUpdateAppStatus(app.id, 'accepted')} className="w-10 h-10 flex items-center justify-center bg-indigo-500 text-white rounded-xl shadow-lg active:scale-90 transition-all" title="Accept Candidate">
                            <i className="fas fa-check text-xs"></i>
                          </button>
                        )}
                        
                        {/* COMPLETE BUTTON (VISIBLE FOR ACCEPTED) */}
                        {app.status === 'accepted' && (
                          <button onClick={() => handleCompleteApp(app.id)} className="w-10 h-10 flex items-center justify-center bg-emerald-500 text-white rounded-xl shadow-lg active:scale-90 transition-all hover:scale-110" title="Complete & Pay User">
                            <i className="fas fa-trophy text-xs"></i>
                          </button>
                        )}

                        {/* REJECT BUTTON (VISIBLE UNLESS ALREADY REJECTED OR COMPLETED) */}
                        {(app.status !== 'rejected' && app.status !== 'completed') && (
                          <button onClick={() => handleUpdateAppStatus(app.id, 'rejected')} className="w-10 h-10 flex items-center justify-center bg-rose-500 text-white rounded-xl shadow-lg active:scale-90 transition-all" title="Reject Candidate">
                            <i className="fas fa-ban text-xs"></i>
                          </button>
                        )}

                        {/* UNREJECT / UNDO BUTTON (VISIBLE FOR REJECTED) */}
                        {app.status === 'rejected' && (
                          <button onClick={() => handleUpdateAppStatus(app.id, 'pending')} className="w-10 h-10 flex items-center justify-center bg-slate-500 text-white rounded-xl shadow-lg active:scale-90 transition-all" title="Undo Rejection">
                            <i className="fas fa-rotate-left text-xs"></i>
                          </button>
                        )}

                        {/* UNDO ACCEPT (VISIBLE FOR ACCEPTED) */}
                        {app.status === 'accepted' && (
                          <button onClick={() => handleUpdateAppStatus(app.id, 'pending')} className="w-10 h-10 flex items-center justify-center bg-slate-400 text-white rounded-xl shadow-lg active:scale-90 transition-all" title="Undo Acceptance">
                            <i className="fas fa-undo text-xs"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredApps.length === 0 && (
                  <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-[40px] border border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold">No applications found.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="animate-slide-up space-y-6">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">User Directory</h2>
              <div className="bg-white dark:bg-slate-800 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr className="text-[9px] font-black uppercase text-slate-400">
                      <th className="px-6 py-4">User Details</th>
                      <th className="px-6 py-4">Wallet</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {users.map(u => (
                      <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`} className="w-10 h-10 rounded-full bg-slate-50" />
                            <div>
                              <p className="font-bold text-sm text-slate-900 dark:text-white">{u.fullName}</p>
                              <p className="text-xs text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-black text-emerald-600">
                          ${u.walletBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${u.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : u.status === 'banned' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                            {u.status || 'pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => firestoreService.updateUserStatus(u.uid, u.status === 'approved' ? 'banned' : 'approved').then(fetchData)}
                            className={`p-2 rounded-xl text-xs font-black uppercase transition-all ${u.status === 'approved' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}
                          >
                            {u.status === 'approved' ? 'Ban' : 'Approve'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'withdrawals' && (
            <div className="animate-slide-up space-y-6">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Payout Requests</h2>
              <div className="grid gap-4">
                {withdrawals.map(tx => (
                  <div key={tx.id} className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-xl text-indigo-500">
                        <i className={`fas ${tx.method === 'PayPal' ? 'fa-paypal' : 'fa-university'}`}></i>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{tx.userName}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{tx.method} • {tx.details}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-black text-lg text-slate-900 dark:text-white">${tx.amount}</p>
                        <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${tx.status === 'pending' ? 'bg-amber-50 text-amber-600' : tx.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {tx.status}
                        </span>
                      </div>
                      {tx.status === 'pending' && (
                        <div className="flex gap-1">
                          <button onClick={() => firestoreService.updateWithdrawalStatus(tx.id, 'completed').then(fetchData)} className="w-10 h-10 flex items-center justify-center bg-emerald-500 text-white rounded-xl shadow-lg active:scale-90 transition-all">
                            <i className="fas fa-check-double text-xs"></i>
                          </button>
                          <button onClick={() => firestoreService.updateWithdrawalStatus(tx.id, 'rejected').then(fetchData)} className="w-10 h-10 flex items-center justify-center bg-rose-500 text-white rounded-xl shadow-lg active:scale-90 transition-all">
                            <i className="fas fa-ban text-xs"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'inbox' && (
            <div className="animate-slide-up h-[calc(100vh-14rem)] lg:h-[calc(100vh-10rem)] flex gap-6 overflow-hidden">
              <div className="w-full md:w-80 bg-white dark:bg-slate-800 rounded-[40px] border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col shadow-sm">
                <div className="p-6 border-b border-slate-50 dark:border-slate-700 bg-slate-50/30">
                  <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Conversations</h3>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  {chatThreads.map(thread => (
                    <button key={thread.id} onClick={() => setActiveChat(thread.id)} className={`w-full p-6 text-left hover:bg-slate-50 dark:hover:bg-slate-900 border-b border-slate-50 dark:border-slate-700 transition-all ${activeChat === thread.id ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center font-black">U</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">User {thread.id.substring(0,8)}</p>
                          <p className="text-[10px] text-slate-400 truncate font-medium">{thread.lastMessage}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="hidden md:flex flex-1 bg-white dark:bg-slate-800 rounded-[40px] border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden shadow-sm">
                {activeChat ? (
                  <>
                    <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full brand-bg-green text-white flex items-center justify-center"><i className="fas fa-headset text-sm"></i></div>
                        <h3 className="font-black text-sm uppercase tracking-widest text-slate-900 dark:text-white">Active Session: {activeChat.substring(0,10)}</h3>
                      </div>
                      <button onClick={() => setActiveChat(null)} className="text-slate-300 hover:text-rose-500 transition-colors"><i className="fas fa-times-circle text-2xl"></i></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 space-y-4 no-scrollbar">
                      {chatMessages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] p-4 rounded-3xl ${msg.senderRole === 'admin' ? 'brand-bg-green text-white rounded-tr-none' : 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white rounded-tl-none'}`}>
                            <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                            <p className={`text-[8px] mt-2 font-black uppercase tracking-widest opacity-50 text-right`}>
                              {msg.timestamp?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={handleSendChat} className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-50 dark:border-slate-700 flex gap-4">
                      <input className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-2xl text-sm outline-none border border-slate-200 dark:border-slate-700 dark:text-white focus:border-[#2D4F32]" placeholder="Compose response..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
                      <button type="submit" className="w-14 h-14 brand-bg-green text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
                        <i className="fas fa-paper-plane"></i>
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                    <i className="fas fa-comments text-5xl mb-4 opacity-20"></i>
                    <p className="font-black uppercase text-[10px] tracking-widest opacity-40">Select a thread to engage</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-slide-up max-w-2xl space-y-8">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Platform Settings</h2>
              <div className="bg-white dark:bg-slate-800 p-10 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-sm">
                <form onSubmit={async (e) => { e.preventDefault(); await firestoreService.updateSettings(siteSettings); alert("Global settings updated!"); }} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Instance Name</label>
                    <input className="w-full bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl font-bold dark:text-white outline-none focus:border-[#2D4F32] border border-transparent" value={siteSettings.siteName} onChange={e => setSiteSettings({...siteSettings, siteName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Gateway Contact</label>
                    <input className="w-full bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl font-bold dark:text-white outline-none focus:border-[#2D4F32] border border-transparent" value={siteSettings.supportEmail} onChange={e => setSiteSettings({...siteSettings, supportEmail: e.target.value})} />
                  </div>
                  <div className="pt-4">
                    <button type="submit" className="w-full brand-bg-green text-white py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-[#2D4F32]/10 transition-all hover:scale-[1.02]">Update Production Env</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

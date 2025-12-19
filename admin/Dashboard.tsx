
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { firestoreService, auth } from '../services/firebase';

type TabType = 'overview' | 'applications' | 'jobs' | 'users' | 'inbox' | 'settings';

const AdminDashboard: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [chatThreads, setChatThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [jobSearch, setJobSearch] = useState('');
  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('All');
  
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [jobFormData, setJobFormData] = useState({ 
    title: '', company: '', logo: '', salary: '', amount: '', description: '', type: 'Full Time' 
  });

  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [siteSettings, setSiteSettings] = useState({ siteName: '', supportEmail: '' });
  const [stats, setStats] = useState({ totalApps: 0, pendingApps: 0, totalJobs: 0, totalUsers: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const authSession = sessionStorage.getItem('admin_auth');
    if (authSession === 'true') {
      setIsAuthorized(true);
    } else {
      firestoreService.initializeAdmin();
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      // Real-time listener for Applications
      const unsubscribeApps = firestoreService.subscribeToApplications((apps) => {
        setApplications(apps);
        setStats(prev => ({
          ...prev,
          totalApps: apps.length,
          pendingApps: apps.filter(a => a.status === 'pending').length
        }));
        setLoading(false);
      });

      fetchStaticData();

      const unsubscribeChat = firestoreService.subscribeToThreads((threads) => {
        setChatThreads(threads);
      });

      return () => {
        unsubscribeApps();
        unsubscribeChat();
      };
    }
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

  const fetchStaticData = async () => {
    try {
      const [allJobs, allUsers, settings] = await Promise.all([
        firestoreService.getJobs(),
        firestoreService.getAllUsers(),
        firestoreService.getSettings()
      ]);
      setJobs(allJobs);
      setUsers(allUsers);
      setSiteSettings(settings);
      setStats(prev => ({
        ...prev,
        totalJobs: allJobs.length,
        totalUsers: allUsers.length
      }));
    } catch (err) {
      console.error("Static data fetch error:", err);
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
        setLoginError('Invalid credentials. Access denied.');
      }
    } catch (err) {
      setLoginError('Connection failed.');
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
      setJobFormData({ title: '', company: '', logo: '', salary: '', amount: '', description: '', type: 'Full Time' });
      fetchStaticData();
    } catch (err) {
      alert("Error saving job. Please check your inputs.");
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this job?")) {
      try {
        await firestoreService.deleteJob(id);
        setJobs(prev => prev.filter(j => j.id !== id));
        fetchStaticData();
      } catch (err) {
        console.error("Delete job error:", err);
      }
    }
  };

  const handleUpdateAppStatus = async (id: string, status: string) => {
    if (!id) return;
    
    // Check if we are already updating something to avoid double triggers
    if (isUpdating) {
       console.log("Update in progress, ignoring click.");
       return;
    }
    
    console.log(`[DASHBOARD] Triggering status update for ${id} to ${status}`);
    
    // START UPDATE
    setIsUpdating(true);
    setUpdatingId(id);
    
    try {
      // Directly call service without confirmation prompts to prevent environmental blocks
      await firestoreService.updateApplicationStatus(id, status);
      console.log(`[DASHBOARD SUCCESS] ${id} moved to ${status}`);
    } catch (err: any) {
      console.error("[DASHBOARD ERROR] Status update failed:", err);
      alert("Failed to update status. Check console for details.");
    } finally {
      setIsUpdating(false);
      setUpdatingId(null);
    }
  };

  const handleSelectChat = (id: string) => {
    setActiveChat(id);
    setIsMobileChatOpen(true);
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChat) return;
    await firestoreService.sendMessage(activeChat, chatInput, 'admin', 'admin');
    setChatInput('');
  };

  const menuItems = [
    { id: 'overview', icon: 'fa-chart-line', label: 'Overview' },
    { id: 'users', icon: 'fa-user-group', label: 'Accounts' },
    { id: 'jobs', icon: 'fa-briefcase', label: 'Inventory' },
    { id: 'applications', icon: 'fa-file-signature', label: 'Pipeline' },
    { id: 'inbox', icon: 'fa-comments', label: 'Support' },
    { id: 'settings', icon: 'fa-sliders', label: 'Config' }
  ];

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(jobSearch.toLowerCase()) || 
    j.company.toLowerCase().includes(jobSearch.toLowerCase())
  );

  const filteredApps = applications.filter(a => {
    const matchesSearch = a.fullName.toLowerCase().includes(appSearch.toLowerCase()) ||
                         a.jobTitle.toLowerCase().includes(appSearch.toLowerCase());
    const matchesFilter = appStatusFilter === 'All' || a.status === appStatusFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-[40px] p-10 shadow-2xl border border-slate-100 dark:border-slate-700">
          <div className="text-center mb-10">
            <div className="w-16 h-16 brand-bg-green rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl text-white">
              <i className="fas fa-shield-halved text-2xl"></i>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Admin System</h1>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-6">
            <input required type="email" placeholder="Admin Email" className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl outline-none border border-slate-100 dark:border-slate-700 dark:text-white font-bold" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} />
            <input required type="password" placeholder="Passkey" className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl outline-none border border-slate-100 dark:border-slate-700 dark:text-white font-bold" value={adminPass} onChange={e => setAdminPass(e.target.value)} />
            {loginError && <p className="text-rose-500 text-[10px] font-black uppercase text-center">{loginError}</p>}
            <button disabled={isLoggingIn} type="submit" className="w-full brand-bg-green text-white py-5 rounded-3xl font-bold text-lg active:scale-95 transition-all">
              {isLoggingIn ? 'Decrypting...' : 'Authorize Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0F172A] transition-colors overflow-hidden">
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
        
        <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id as TabType); setIsSidebarOpen(false); setIsMobileChatOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === item.id ? 'brand-bg-green text-white shadow-xl shadow-[#2D4F32]/10' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
              <i className={`fas ${item.icon} w-5 text-sm`}></i>
              {item.label}
            </button>
          ))}
        </nav>

        <button onClick={() => { sessionStorage.removeItem('admin_auth'); setIsAuthorized(false); }} className="mt-8 flex items-center gap-4 px-5 py-4 text-rose-500 font-black uppercase text-[10px] tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-2xl transition-all flex-shrink-0">
          <i className="fas fa-power-off"></i> Logout
        </button>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen w-full relative">
        <header className="lg:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-30 flex items-center justify-between">
          <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl">
            <i className="fas fa-bars text-slate-600 dark:text-slate-300"></i>
          </button>
          <span className="font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white">
            {menuItems.find(i => i.id === activeTab)?.label}
          </span>
          <div className="w-10"></div>
        </header>

        <div className="flex-1 w-full overflow-hidden">
          {activeTab === 'overview' && (
            <div className="p-6 lg:p-10 space-y-8 animate-slide-up overflow-y-auto h-full pb-32">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">Platform Health</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Apps', value: stats.totalApps, color: 'slate' },
                  { label: 'Pending Review', value: stats.pendingApps, color: 'amber' },
                  { label: 'Active Pipeline', value: applications.filter(a => a.status === 'accepted').length, color: 'emerald' },
                  { label: 'User Base', value: stats.totalUsers, color: 'indigo' }
                ].map((s, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">{s.label}</p>
                    <h3 className={`text-3xl font-black text-${s.color}-500`}>{s.value}</h3>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="p-6 lg:p-10 space-y-8 animate-slide-up overflow-y-auto h-full pb-32">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white">User Directory</h2>
                  <p className="text-[10px] font-black uppercase text-slate-400 mt-1 tracking-widest">Manage platform accounts</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {users.map(u => (
                  <div key={u.uid} className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col group transition-all hover:border-emerald-500">
                    <div className="flex items-center gap-5 mb-6">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`} className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-900" alt="avatar" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-slate-900 dark:text-white text-lg truncate leading-tight">{u.fullName}</h4>
                        <p className="text-slate-400 text-[10px] font-bold truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl mb-6">
                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Status</p>
                      <p className={`text-[10px] font-black uppercase ${u.status === 'banned' ? 'text-rose-500' : 'text-emerald-500'}`}>{u.status || 'Active'}</p>
                    </div>
                    <button 
                      onClick={() => firestoreService.updateUserStatus(u.uid, u.status === 'banned' ? 'approved' : 'banned')}
                      className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${u.status === 'banned' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-rose-50 text-rose-500'}`}
                    >
                      {u.status === 'banned' ? 'Unban User' : 'Ban User'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="p-6 lg:p-10 space-y-6 animate-slide-up overflow-y-auto h-full pb-32 no-scrollbar">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black">Jobs Inventory</h2>
                <button onClick={() => { setEditingJob(null); setJobFormData({ title: '', company: '', logo: '', salary: '', amount: '', description: '', type: 'Full Time' }); setShowJobForm(true); }} className="brand-bg-green text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                  New Job
                </button>
              </div>
              {showJobForm && (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-xl mb-8">
                  <form onSubmit={handleJobSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Job Title</label>
                      <input required className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-xl font-bold dark:text-white border-2 border-transparent focus:border-brand-green outline-none" placeholder="e.g. Content Writer" value={jobFormData.title} onChange={e => setJobFormData({...jobFormData, title: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Company Name</label>
                      <input required className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-xl font-bold dark:text-white border-2 border-transparent focus:border-brand-green outline-none" placeholder="e.g. Acme Corp" value={jobFormData.company} onChange={e => setJobFormData({...jobFormData, company: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Company Logo URL</label>
                      <input className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-xl font-bold dark:text-white border-2 border-transparent focus:border-brand-green outline-none" placeholder="https://logo-url.com/img.png" value={jobFormData.logo} onChange={e => setJobFormData({...jobFormData, logo: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Salary Label</label>
                      <input required className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-xl font-bold dark:text-white border-2 border-transparent focus:border-brand-green outline-none" placeholder="e.g. $10 - $15" value={jobFormData.salary} onChange={e => setJobFormData({...jobFormData, salary: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Numeric Reward Amount</label>
                      <input required type="number" className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-xl font-bold dark:text-white border-2 border-transparent focus:border-brand-green outline-none" placeholder="e.g. 10" value={jobFormData.amount} onChange={e => setJobFormData({...jobFormData, amount: e.target.value})} />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Job Description</label>
                      <textarea required className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-xl font-bold dark:text-white border-2 border-transparent focus:border-brand-green outline-none h-32" placeholder="Describe the tasks required..." value={jobFormData.description} onChange={e => setJobFormData({...jobFormData, description: e.target.value})} />
                    </div>
                    <div className="md:col-span-2 flex gap-4">
                      <button type="submit" className="flex-1 brand-bg-green text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg">Save Job</button>
                      <button type="button" onClick={() => setShowJobForm(false)} className="px-8 py-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest">Cancel</button>
                    </div>
                  </form>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map(job => (
                  <div key={job.id} className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:border-brand-green group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center p-2 shadow-inner overflow-hidden">
                        <img src={job.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${job.company}`} className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all" alt="logo" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingJob(job); setJobFormData({ title: job.title, company: job.company, logo: job.logo || '', salary: job.salary, amount: job.amount, description: job.description, type: job.type || 'Full Time' }); setShowJobForm(true); }} className="text-slate-400 hover:text-brand-green transition-colors"><i className="fas fa-edit"></i></button>
                        <button onClick={() => handleDeleteJob(job.id)} className="text-slate-400 hover:text-rose-600 transition-colors"><i className="fas fa-trash-alt"></i></button>
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-lg leading-tight mb-1">{job.title}</h4>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{job.company}</p>
                    <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-700 flex justify-between items-center">
                      <span className="font-black text-emerald-500 text-lg">${job.amount || job.salary || 0}</span>
                      <span className="text-[9px] font-black uppercase text-slate-300">{(job.applicants || 0)} Applied</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="p-6 lg:p-10 space-y-8 animate-slide-up overflow-y-auto h-full pb-32 no-scrollbar">
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white">Submission Pipeline</h2>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {['All', 'Pending', 'Accepted', 'Completed', 'Rejected'].map(filter => (
                      <button key={filter} onClick={() => setAppStatusFilter(filter)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${appStatusFilter === filter ? 'brand-bg-green text-white border-brand-green' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}>
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>
                <input type="text" placeholder="Filter by candidate..." className="w-full bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs font-bold outline-none" value={appSearch} onChange={e => setAppSearch(e.target.value)} />
              </div>

              <div className="grid gap-6">
                {filteredApps.map(app => (
                  <div key={app.id} className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-6">
                    <div className="flex flex-col lg:flex-row justify-between gap-6">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl p-3 border border-slate-100 dark:border-slate-700 flex-shrink-0">
                          <img src={app.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${app.company}`} className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all" alt="logo" />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 dark:text-white text-xl leading-tight mb-1">{app.jobTitle}</h4>
                          <p className="text-slate-400 text-xs font-bold">{app.company} • <span className="text-emerald-500">${app.jobAmount || 0}</span></p>
                        </div>
                      </div>
                      <div className="lg:w-64">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Candidate</p>
                         <div className="flex items-center gap-3">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${app.userId}`} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900" alt="avatar" />
                            <div>
                              <p className="text-sm font-black text-slate-900 dark:text-white truncate">{app.fullName}</p>
                              <p className="text-[10px] text-slate-400 font-bold">TG: {app.telegramId || 'N/A'}</p>
                            </div>
                         </div>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700">
                       <p className="text-xs font-mono text-slate-600 dark:text-slate-400 italic">
                         {app.coverLetter || 'No plaintext response provided.'}
                       </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-50 dark:border-slate-700">
                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                          app.status === 'pending' ? 'bg-amber-50 text-amber-600' : 
                          app.status === 'completed' ? 'brand-bg-green text-white shadow-md' : 
                          app.status === 'accepted' ? 'bg-indigo-50 text-indigo-600' : 
                          'bg-rose-50 text-rose-500'}`}>
                          {app.status === 'accepted' ? 'Running' : app.status === 'completed' ? 'Success' : app.status === 'pending' ? 'Pending Review' : 'Rejected'}
                        </span>
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            {app.status === 'pending' && (
                              <>
                                <button disabled={isUpdating} onClick={() => handleUpdateAppStatus(app.id, 'accepted')} className="flex-1 sm:flex-none px-6 py-3 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                                  {isUpdating && updatingId === app.id ? '...' : 'Accept'}
                                </button>
                                <button disabled={isUpdating} onClick={() => handleUpdateAppStatus(app.id, 'rejected')} className="flex-1 sm:flex-none px-6 py-3 bg-rose-50 text-rose-500 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                                  {isUpdating && updatingId === app.id ? '...' : 'Reject'}
                                </button>
                              </>
                            )}
                            
                            {app.status === 'accepted' && (
                              <>
                                <button disabled={isUpdating} onClick={() => handleUpdateAppStatus(app.id, 'completed')} className="flex-1 sm:flex-none px-6 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg">
                                  {isUpdating && updatingId === app.id ? '...' : 'Complete'}
                                </button>
                                <button disabled={isUpdating} onClick={() => handleUpdateAppStatus(app.id, 'rejected')} className="flex-1 sm:flex-none px-6 py-3 bg-rose-50 text-rose-500 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                                  {isUpdating && updatingId === app.id ? '...' : 'Reject'}
                                </button>
                              </>
                            )}

                            {app.status === 'completed' && (
                               <button disabled={isUpdating} onClick={() => handleUpdateAppStatus(app.id, 'accepted')} className="flex-1 sm:flex-none px-6 py-3 bg-slate-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md">
                                 {isUpdating && updatingId === app.id ? '...' : 'Uncomplete'}
                               </button>
                            )}

                            {app.status === 'rejected' && (
                               <button disabled={isUpdating} onClick={() => handleUpdateAppStatus(app.id, 'pending')} className="flex-1 sm:flex-none px-6 py-3 bg-slate-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                                 {isUpdating && updatingId === app.id ? '...' : 'Recover'}
                               </button>
                            )}
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'inbox' && (
            <div className="animate-slide-up h-full flex flex-col md:flex-row gap-0 overflow-hidden relative w-full bg-slate-50 dark:bg-[#0F172A]">
              <div className={`w-full md:w-80 flex flex-col h-full bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 transition-all ${isMobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="font-black text-sm uppercase tracking-widest text-slate-900 dark:text-white">Support Feed</h3>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  {chatThreads.map(thread => (
                    <button key={thread.id} onClick={() => handleSelectChat(thread.id)} className={`w-full px-6 py-5 text-left border-b border-slate-50 dark:border-slate-700 flex items-center gap-4 ${activeChat === thread.id ? 'bg-emerald-50 dark:bg-emerald-500/5 border-l-4 border-l-brand-green' : ''}`}>
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${thread.id}`} className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900" alt="avatar" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 dark:text-white truncate">{thread.id.substring(0,8)}...</p>
                        <p className="text-[10px] text-slate-400 truncate">{thread.lastMessage}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className={`flex-1 h-full flex flex-col bg-slate-50 dark:bg-slate-950 ${isMobileChatOpen ? 'flex' : 'hidden md:flex'}`}>
                {activeChat ? (
                  <>
                    <div className="px-6 py-5 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex items-center gap-4">
                      <button onClick={() => setIsMobileChatOpen(false)} className="md:hidden text-slate-600"><i className="fas fa-chevron-left"></i></button>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white">Admin Terminal</h4>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`p-4 font-mono text-xs max-w-[80%] rounded-2xl ${msg.senderRole === 'admin' ? 'bg-emerald-500 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700'}`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                      <form onSubmit={handleSendChat} className="flex gap-4">
                        <input className="flex-1 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl text-sm outline-none border border-slate-200 dark:border-slate-700 font-bold" placeholder="Type response..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
                        <button type="submit" className="w-14 h-14 brand-bg-green text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
                          <i className="fas fa-paper-plane"></i>
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-12 text-center text-slate-400 font-black uppercase text-xs tracking-widest">
                    Select a conversation to begin
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-6 lg:p-10 animate-slide-up max-w-2xl space-y-8 overflow-y-auto h-full pb-32 no-scrollbar">
              <h2 className="text-2xl font-black">Platform Config</h2>
              <div className="bg-white dark:bg-slate-800 p-10 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-sm">
                <form onSubmit={async (e) => { e.preventDefault(); await firestoreService.updateSettings(siteSettings); alert("Settings saved!"); }} className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Platform Name</label>
                    <input className="w-full bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl font-bold dark:text-white border-2 border-transparent outline-none focus:border-brand-green transition-all" value={siteSettings.siteName} onChange={e => setSiteSettings({...siteSettings, siteName: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Support Email</label>
                    <input className="w-full bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl font-bold dark:text-white border-2 border-transparent outline-none focus:border-brand-green transition-all" value={siteSettings.supportEmail} onChange={e => setSiteSettings({...siteSettings, supportEmail: e.target.value})} />
                  </div>
                  <button type="submit" className="w-full brand-bg-green text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.3em] shadow-xl active:scale-[0.98] transition-all">Deploy Updates</button>
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

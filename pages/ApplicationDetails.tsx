
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { firestoreService, auth } from '../services/firebase';

const ApplicationDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;
  
  useEffect(() => {
    const fetchApp = async () => {
      if (id) {
        const data = await firestoreService.getApplicationById(id);
        setApplication(data);
        setLoading(false);
      }
    };
    fetchApp();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:text-white font-bold">Verifying details...</div>;
  if (!application) return <div className="min-h-screen flex flex-col items-center justify-center dark:text-white space-y-4">
    <p className="font-bold">Application not found.</p>
    <button onClick={() => navigate('/profile')} className="brand-bg-green text-white px-8 py-3 rounded-2xl">Return to Profile</button>
  </div>;

  const getTimeline = () => {
    const base = [
      { title: 'Application submitted', status: 'done', date: application.appliedAt?.toDate().toLocaleDateString() || 'Recently' },
      { title: 'Admin Verification', status: application.status !== 'pending' ? 'done' : 'current', date: application.status !== 'pending' ? 'Completed' : 'Pending' },
    ];

    if (application.status === 'accepted') {
      base.push({ title: 'Task in Progress (Running)', status: 'done', date: 'Authorized' });
      base.push({ title: 'Awaiting Final Review', status: 'current', date: 'Ongoing' });
    } else if (application.status === 'completed') {
      base.push({ title: 'Task Validated', status: 'done', date: 'Success' });
      base.push({ title: 'Milestone Finalized', status: 'done', date: 'Archived' });
    } else if (application.status === 'rejected') {
      base.push({ title: 'Application Rejected', status: 'done', date: 'Closed' });
    } else {
      base.push({ title: 'Next Stage', status: 'not-yet', date: 'Queued' });
    }

    return base.reverse();
  };

  const statusLabel = application.status === 'pending' ? 'Pending' : application.status === 'accepted' ? 'Running' : application.status === 'completed' ? 'Success' : 'Rejected';

  const handleOpenChat = () => {
    if (!user) return;
    const contextMessage = `I am inquiring about my application for "${application.jobTitle}". Status: ${statusLabel}.`;
    
    navigate(`/chat-admin/${user.uid}`, { 
      state: { autoMessage: contextMessage } 
    });
  };

  return (
    <div className="animate-slide-up max-w-2xl mx-auto space-y-6 pb-12 transition-colors">
      <header className="sticky top-0 z-50 bg-[#F8FAF8]/95 dark:bg-[#0F172A]/95 backdrop-blur-md flex items-center justify-between py-4 -mx-4 px-4 mb-2">
        <button onClick={() => navigate('/profile')} className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-all">
          <i className="fas fa-chevron-left"></i>
        </button>
        <h1 className="text-lg font-black uppercase tracking-tight">Tracking</h1>
        <div className="w-12"></div>
      </header>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center gap-6 transition-all">
        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
          <img src={application.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${application.company}`} className="w-12 h-12 object-contain" alt="logo" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="font-black text-xl text-slate-900 dark:text-white">{application.jobTitle}</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">{application.company}</p>
        </div>
        <div className="text-center md:text-right pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-50 dark:border-slate-700 pl-0 md:pl-6">
          <p className={`font-black text-lg capitalize ${application.status === 'completed' ? 'text-emerald-600' : application.status === 'rejected' ? 'text-rose-500' : 'text-indigo-600'}`}>{statusLabel}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Status</p>
        </div>
      </div>

      {/* Conditional Chat / Workspace Button */}
      {application.status === 'accepted' || application.status === 'completed' ? (
        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-[32px] border border-emerald-100 dark:border-emerald-900/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100/50 dark:border-emerald-800/30">
              <i className="fas fa-comments-alt text-xl"></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-0.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Workspace Chat Active
              </p>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Application approved. You can now chat with the admin.</p>
            </div>
          </div>
          <button 
            onClick={handleOpenChat}
            className="w-full sm:w-auto px-8 py-4 brand-bg-green text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-2"
          >
            <i className="fas fa-headset text-sm"></i>
            Open Chat
          </button>
        </div>
      ) : application.status === 'pending' ? (
        <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-[32px] border border-slate-200 dark:border-slate-700 flex items-center gap-5 opacity-80">
          <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 shadow-sm">
            <i className="fas fa-lock text-sm"></i>
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Chat Locked</p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">Admin is reviewing your proof. Chat will open automatically once approved.</p>
          </div>
        </div>
      ) : null}

      <div className="bg-white dark:bg-slate-800 p-10 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-sm transition-all">
        <div className="flex justify-between items-center mb-12">
           <h3 className="text-xl font-black text-slate-900 dark:text-white">Pipeline History</h3>
           <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-xl">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Live Update</span>
           </div>
        </div>
        
        <div className="relative pl-12">
          <div className="absolute left-5 top-2 bottom-2 w-0.5 border-l-2 border-dashed border-slate-100 dark:border-slate-700"></div>
          <div className="space-y-12">
            {getTimeline().map((step, idx) => (
              <div key={idx} className="relative">
                <div className={`absolute -left-12 w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                  step.status === 'done' ? 'brand-bg-green text-white shadow-lg shadow-[#2D4F32]/10' : 
                  step.status === 'current' ? 'bg-white dark:bg-slate-800 border-4 border-[#2D4F32] dark:border-emerald-500 text-[#2D4F32]' : 
                  'bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 text-slate-200'
                }`}>
                  {step.status === 'done' ? <i className="fas fa-check text-xs"></i> : step.status === 'current' ? <div className="w-2.5 h-2.5 brand-bg-green rounded-full"></div> : <i className="fas fa-circle text-[8px]"></i>}
                </div>
                <div>
                  <h4 className={`text-base font-black leading-tight ${step.status === 'not-yet' ? 'text-slate-300' : 'text-slate-900 dark:text-white'}`}>{step.title}</h4>
                  <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{step.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetails;

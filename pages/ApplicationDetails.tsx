
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { firestoreService } from '../services/firebase';

const ApplicationDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading status...</div>;
  if (!application) return <div className="min-h-screen flex items-center justify-center">Application not found.</div>;

  const getTimeline = () => {
    const base = [
      { title: 'Application submitted', status: 'done', date: application.appliedAt?.toDate().toLocaleDateString() || 'Recently' },
      { title: 'Reviewed by Admin', status: application.status !== 'pending' ? 'done' : 'current', date: application.status !== 'pending' ? 'Completed' : 'Processing' },
    ];

    if (application.status === 'accepted') {
      base.push({ title: 'Application Approved', status: 'done', date: 'Success' });
      base.push({ title: 'Next Steps / Contact', status: 'current', date: 'Awaiting Action' });
    } else if (application.status === 'rejected') {
      base.push({ title: 'Application Rejected', status: 'done', date: 'Closed' });
    } else {
      base.push({ title: 'Awaiting Final Decision', status: 'not-yet', date: 'Pending' });
    }

    return base.reverse();
  };

  return (
    <div className="animate-slide-up max-w-2xl mx-auto space-y-8 pb-12 transition-colors">
      <header className="sticky top-0 z-50 bg-[#F8FAF8]/95 dark:bg-[#0F172A]/95 backdrop-blur-md flex items-center justify-between py-4 -mx-4 px-4 mb-2">
        <button onClick={() => navigate('/profile')} className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white shadow-sm border border-slate-50 dark:border-slate-700">
          <i className="fas fa-chevron-left"></i>
        </button>
        <h1 className="text-xl font-extrabold">Tracking Status</h1>
        <div className="w-12"></div>
      </header>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-slate-50 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
          <img src={application.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${application.company}`} className="w-10 h-10 object-contain" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="font-extrabold text-xl">{application.jobTitle}</h2>
          <p className="text-slate-400 font-bold">{application.company}</p>
        </div>
        <div className="text-center md:text-right pt-4 md:pt-0">
          <p className="font-black text-lg text-emerald-600 capitalize">{application.status}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Status</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-10 rounded-[40px] border border-slate-50 dark:border-slate-700 shadow-sm">
        <h3 className="text-2xl font-black mb-12">Pipeline History</h3>
        <div className="relative pl-12">
          <div className="absolute left-5 top-2 bottom-2 w-0.5 border-l-2 border-dashed border-slate-100 dark:border-slate-700"></div>
          <div className="space-y-12">
            {getTimeline().map((step, idx) => (
              <div key={idx} className="relative">
                <div className={`absolute -left-12 w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                  step.status === 'done' ? 'brand-bg-green text-white shadow-lg shadow-[#2D4F32]/10' : 
                  step.status === 'current' ? 'bg-white dark:bg-slate-800 border-4 border-[#2D4F32] dark:border-emerald-500 text-[#2D4F32]' : 
                  'bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 text-slate-200'
                }`}>
                  {step.status === 'done' ? <i className="fas fa-check text-xs"></i> : step.status === 'current' ? <div className="w-3 h-3 brand-bg-green rounded-full"></div> : <i className="fas fa-circle text-xs"></i>}
                </div>
                <div>
                  <h4 className={`text-lg font-extrabold leading-tight ${step.status === 'not-yet' ? 'text-slate-300' : 'text-slate-900 dark:text-white'}`}>{step.title}</h4>
                  <p className="text-sm text-slate-400 font-bold mt-1">{step.date}</p>
                  {step.title === 'Next Steps / Contact' && step.status === 'current' && (
                    <button onClick={() => navigate(`/chat-admin/${application.userId}`)} className="mt-4 brand-bg-green text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                      <i className="fas fa-comments mr-2"></i> Contact Admin
                    </button>
                  )}
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

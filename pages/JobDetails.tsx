
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { firestoreService, auth } from '../services/firebase';

const JobDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchJobData = async () => {
      if (id) {
        const data = await firestoreService.getJobById(id);
        setJob(data);
        
        if (user) {
          const applied = await firestoreService.checkIfApplied(id, user.uid);
          setAlreadyApplied(applied);
        }
        
        setLoading(false);
      }
    };
    fetchJobData();
  }, [id, user]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center dark:text-white">Loading job details...</div>;
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center dark:text-white space-y-4">
        <p>Job not found</p>
        <button onClick={() => navigate('/home')} className="brand-bg-green text-white px-6 py-2 rounded-xl">Go Home</button>
      </div>
    );
  }

  return (
    <div className="animate-slide-up bg-white dark:bg-slate-900 min-h-screen -m-4 md:m-0 md:rounded-[40px] overflow-hidden transition-colors">
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-6 flex justify-between items-center border-b border-slate-50 dark:border-slate-800">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 rounded-xl active:scale-95 transition-all">
          <i className="fas fa-chevron-left"></i>
        </button>
        <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{job.company}</span>
        <div className="w-10"></div>
      </div>

      <div className="px-6 pb-12">
        <div className="flex flex-col items-center text-center mt-8 mb-8">
          <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[32px] p-5 flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
             <img src={job.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${job.company}`} className="w-full h-full object-contain dark:brightness-90" alt="company" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-2">{job.title}</h1>
        </div>

        <div className="space-y-4 mb-10">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Job Details</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium transition-colors whitespace-pre-wrap">
            {job.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-12">
           <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-[32px] flex items-center gap-4 border border-slate-100 dark:border-slate-700 transition-colors">
              <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center text-amber-500 shadow-sm transition-colors">
                <i className="fas fa-dollar-sign"></i>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Price</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white transition-colors">{job.salary}</p>
              </div>
           </div>
           <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-[32px] flex items-center gap-4 border border-slate-100 dark:border-slate-700 transition-colors">
              <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center text-emerald-500 shadow-sm transition-colors">
                <i className="fas fa-briefcase text-xs"></i>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Job Type</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white transition-colors">{job.type || 'Full Time'}</p>
              </div>
           </div>
        </div>

        <div className="sticky bottom-24 z-30 pt-4">
          {alreadyApplied ? (
            <div className="w-full bg-slate-100 dark:bg-slate-800 text-slate-400 py-5 rounded-[24px] text-center font-bold text-lg border border-slate-200 dark:border-slate-700">
              Already Applied
            </div>
          ) : (
            <Link to={`/apply/${id}`} className="block w-full brand-bg-green text-white py-5 rounded-[24px] text-center font-bold text-lg shadow-2xl shadow-[#2D4F32]/30 hover:opacity-95 active:scale-[0.98] transition-all">
              Apply Now
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetails;


import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, firestoreService } from '../services/firebase';

const Home: React.FC = () => {
  const user = auth.currentUser;
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      const data = await firestoreService.getJobs();
      setJobs(data);
      setLoading(false);
    };
    fetchJobs();
  }, []);

  const toggleSave = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSavedJobs(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  return (
    <div className="animate-slide-up space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Jobs Center</h1>
          <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.1em] mt-1">Your Next Career Move</p>
        </div>
        <Link to="/profile" className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-slate-700 shadow-md transition-colors">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} className="w-full h-full bg-slate-100 dark:bg-slate-800" alt="avatar" />
        </Link>
      </header>

      <div 
        onClick={() => navigate('/search')}
        className="relative group cursor-pointer"
      >
        <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600"></i>
        <div className="w-full bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl py-5 pl-14 pr-6 text-sm font-semibold border border-slate-100 dark:border-slate-700 shadow-sm transition-all">
          Search for jobs...
        </div>
      </div>

      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Postings</h2>
        </div>
        
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white dark:bg-slate-800 rounded-3xl animate-pulse"></div>)}
          </div>
        ) : jobs.length > 0 ? (
          <div className="space-y-4">
            {jobs.map(job => (
              <Link to={`/job/${job.id}`} key={job.id} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-50 dark:border-slate-700 job-card-shadow block group hover:border-[#2D4F32] dark:hover:border-emerald-500 transition-all relative">
                <button 
                  onClick={(e) => toggleSave(e, job.id)}
                  className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 text-slate-300 dark:text-slate-600 hover:text-[#2D4F32] dark:hover:text-emerald-400 transition-colors z-10"
                >
                  <i className={`${savedJobs.includes(job.id) ? 'fas' : 'far'} fa-bookmark ${savedJobs.includes(job.id) ? 'brand-text-green dark:text-emerald-400' : ''}`}></i>
                </button>

                <div className="flex items-start justify-between mb-4 pr-10">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center p-3 border border-slate-100 dark:border-slate-700">
                      <img src={job.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${job.company}`} className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all" alt="logo" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight mb-1">{job.title}</h3>
                      <p className="text-slate-400 dark:text-slate-500 text-xs font-bold">{job.company}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Price</p>
                    <p className="text-slate-900 dark:text-white font-bold text-base">{job.salary}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Applicant</p>
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded-full applicant-bg dark:bg-amber-900/30 flex items-center justify-center text-[10px] applicant-text dark:text-amber-400">
                         <i className="fas fa-user text-[8px]"></i>
                      </div>
                      <span className="text-slate-900 dark:text-white font-bold text-sm">{(job.applicants || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl text-center border border-slate-100 dark:border-slate-700 transition-colors">
            <p className="text-slate-400 font-bold">No jobs posted yet.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;

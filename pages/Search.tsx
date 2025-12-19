
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { firestoreService } from '../services/firebase';

const Search: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const jobs = await firestoreService.getJobs();
        setAllJobs(jobs);
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    if (!searchTerm.trim()) return allJobs;
    const lower = searchTerm.toLowerCase();
    return allJobs.filter(job => 
      job.title.toLowerCase().includes(lower) || 
      job.company.toLowerCase().includes(lower)
    );
  }, [searchTerm, allJobs]);

  return (
    <div className="animate-slide-up space-y-6">
      <header className="flex items-center gap-4 sticky top-0 z-50 bg-[#F8FAF8]/95 dark:bg-[#0F172A]/95 backdrop-blur-md py-2 -mx-4 px-4 transition-colors">
        <button 
          onClick={() => navigate(-1)}
          className="w-11 h-11 flex items-center justify-center text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm active:scale-90 transition-all"
        >
           <i className="fas fa-chevron-left"></i>
        </button>
        <div className="flex-1 relative">
           <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 text-sm"></i>
           <input 
             type="text" 
             autoFocus
             placeholder="Search title or company..."
             className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 pl-12 pr-6 font-bold text-sm outline-none focus:border-[#2D4F32] dark:focus:border-emerald-500 shadow-sm transition-all dark:text-white"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </header>

      <div className="pt-2">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {searchTerm ? `Results for "${searchTerm}"` : 'All Available Jobs'}
          </h2>
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {filteredJobs.length} Positions
          </span>
        </div>

        <div className="space-y-4 pb-32">
          {loading ? (
             <div className="space-y-4">
               {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white dark:bg-slate-800 rounded-[32px] animate-pulse"></div>)}
             </div>
          ) : filteredJobs.length > 0 ? (
            filteredJobs.map(job => (
              <Link to={`/job/${job.id}`} key={job.id} className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-50 dark:border-slate-700 job-card-shadow block group hover:border-[#2D4F32] dark:hover:border-emerald-500 transition-all active:scale-[0.98]">
                <div className="flex items-start justify-between mb-5">
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

                <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-700 pt-5">
                  <div>
                    <p className="text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-wider mb-1">Price</p>
                    <p className="text-slate-900 dark:text-white font-black text-base">${job.amount || job.salary}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-wider mb-1">Applicant</p>
                    <div className="flex items-center gap-1 justify-end">
                      <div className="w-5 h-5 rounded-full applicant-bg dark:bg-amber-900/30 flex items-center justify-center text-[10px] applicant-text dark:text-amber-400">
                         <i className="fas fa-user text-[8px]"></i>
                      </div>
                      <span className="text-slate-900 dark:text-white font-black text-sm">{(job.applicants || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-[40px] border border-slate-50 dark:border-slate-700">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-search text-slate-200 dark:text-slate-700 text-3xl"></i>
              </div>
              <h3 className="text-slate-900 dark:text-white font-bold mb-1">No results found</h3>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-medium px-10">We couldn't find any jobs matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;

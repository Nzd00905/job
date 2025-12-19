
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, firestoreService, db } from '../services/firebase';
import { signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const Profile: React.FC = () => {
  const [apps, setApps] = useState<any[]>([]);
  const [savedJobsData, setSavedJobsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [filter, setFilter] = useState('All');
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        setLoading(true);
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          let profile = null;
          if (userSnap.exists()) {
            profile = userSnap.data();
            setUserData(profile);
          }

          const [userApps, allJobs] = await Promise.all([
            firestoreService.getUserApplications(user.uid),
            firestoreService.getJobs()
          ]);

          if (profile?.savedJobIds?.length > 0) {
            const saved = allJobs.filter(j => profile.savedJobIds.includes(j.id));
            setSavedJobsData(saved);
          } else {
            setSavedJobsData([]);
          }

          setApps(userApps);
        } catch (err) {
          console.error("Error fetching profile data:", err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [user]);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const filteredItems = (() => {
    if (filter === 'Saved') return savedJobsData.map(j => ({ ...j, type: 'job' }));
    
    return apps.filter(app => {
      if (filter === 'All') return true;
      if (filter === 'Running') return app.status === 'accepted';
      if (filter === 'Pending') return app.status === 'pending';
      if (filter === 'Completed') return app.status === 'completed';
      if (filter === 'Reject') return app.status === 'rejected';
      return false;
    }).map(a => ({ ...a, type: 'application' }));
  })();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="animate-slide-up max-w-2xl mx-auto space-y-8">
      <header className="sticky top-0 z-40 bg-[#F8FAF8]/90 dark:bg-[#0F172A]/90 backdrop-blur-md flex justify-between items-center py-4 px-1 -mt-6 transition-colors">
        <button onClick={() => navigate(-1)} className="w-11 h-11 flex items-center justify-center text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm active:scale-95 transition-all">
          <i className="fas fa-chevron-left text-sm"></i>
        </button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Profile</h1>
        <button onClick={toggleTheme} className="w-11 h-11 flex items-center justify-center text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm active:scale-95 transition-all">
          <i className={`fas ${isDark ? 'fa-sun text-amber-400' : 'fa-moon text-slate-600'} text-sm`}></i>
        </button>
      </header>

      <section className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-slate-50 dark:border-slate-700 shadow-sm text-center transition-colors">
        <div className="relative inline-block mb-4">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} className="w-24 h-24 rounded-full shadow-md bg-slate-50 dark:bg-slate-900 border-4 border-white dark:border-slate-700 mx-auto" alt="profile" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">{user?.displayName || 'User'}</h2>
        <p className="text-slate-400 dark:text-slate-500 font-bold text-sm mb-6">{user?.email}</p>
        
        <div className="border-t border-slate-50 dark:border-slate-700 pt-6">
          <p className="text-3xl font-black text-[#2D4F32] dark:text-emerald-500">{apps.length}</p>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Submissions</p>
        </div>
      </section>

      <section className="relative">
        <div className="sticky top-[84px] z-30 bg-[#F8FAF8]/95 dark:bg-[#0F172A]/95 backdrop-blur-md pt-2 pb-5 -mx-4 px-4 transition-colors">
          <div className="flex justify-between items-center mb-5 px-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Activity</h2>
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">{filteredItems.length} Items</span>
          </div>
          <div className="overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex flex-nowrap gap-3 pb-2 min-w-full">
              {['All', 'Saved', 'Running', 'Pending', 'Completed', 'Reject'].map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-7 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 whitespace-nowrap flex-shrink-0 ${filter === f ? 'brand-bg-green text-white border-[#2D4F32] shadow-xl scale-105' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 shadow-sm active:scale-95'}`}>{f}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="min-h-[300px]">
          {loading ? (
            <div className="space-y-4 mt-2">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white dark:bg-slate-800 rounded-[32px] animate-pulse"></div>)}
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="space-y-4 mt-2">
              {filteredItems.map((item: any) => (
                <Link to={item.type === 'job' ? `/job/${item.id}` : `/application/${item.id}`} key={item.id} className="bg-white dark:bg-slate-800 p-5 rounded-[32px] border border-slate-50 dark:border-slate-700 shadow-sm block hover:border-[#2D4F32] transition-all group active:scale-[0.98]">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center p-3 border border-slate-100 dark:border-slate-700">
                      {item.type === 'job' ? (
                        <i className="fas fa-bookmark brand-text-green dark:text-emerald-400 text-xl"></i>
                      ) : (
                        <img src={item.logo || 'https://api.dicebear.com/7.x/initials/svg?seed=' + (item.company || 'Comp')} className="w-full h-full object-contain grayscale group-hover:grayscale-0" alt="logo" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate leading-tight mb-1">{item.title || item.jobTitle || 'Position'}</h3>
                      <p className="text-slate-400 text-[9px] font-black uppercase tracking-wider">
                        {item.type === 'job' ? 'Saved Listing' : `Applied on ${item.appliedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}`}
                      </p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest flex-shrink-0 ${
                      item.type === 'job' ? 'bg-amber-50 text-amber-600' :
                      item.status === 'pending' ? 'bg-indigo-50 text-indigo-600' : 
                      item.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' : 
                      item.status === 'completed' ? 'brand-bg-green text-white' :
                      'bg-rose-50 text-rose-600'
                    }`}>
                      {item.type === 'job' ? 'Saved' : item.status === 'accepted' ? 'Running' : item.status === 'pending' ? 'Pending' : item.status === 'completed' ? 'Success' : 'Reject'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 p-16 rounded-[40px] text-center border border-slate-100 dark:border-slate-700 mt-2 shadow-sm transition-colors">
              <i className="fas fa-folder-open text-slate-300 dark:text-slate-700 text-2xl mb-6"></i>
              <h3 className="text-slate-900 dark:text-white font-bold mb-1">Empty list</h3>
              <p className="text-slate-400 dark:text-slate-500 font-medium text-xs">No items found in this category.</p>
            </div>
          )}
        </div>
      </section>

      <div className="pt-6 pb-4">
        <button onClick={handleLogout} className="w-full py-5 text-rose-500 dark:text-rose-400 font-black text-sm uppercase tracking-widest bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-3xl active:scale-[0.98] transition-all">
          <i className="fas fa-sign-out-alt mr-2"></i> Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;


import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, firestoreService, db } from '../services/firebase';
import { signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const Profile: React.FC = () => {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [filter, setFilter] = useState('All');
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const navigate = useNavigate();
  const user = auth.currentUser;

  // Mocking some saved jobs for the UI
  const savedJobs = [
    { id: '1', title: 'Junior Front End Developer', company: 'Dribbble', status: 'saved', logo: 'https://logo.clearbit.com/dribbble.com', date: '2 days ago' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        setLoading(true);
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUserData(userSnap.data());
          }

          const userApps = await firestoreService.getUserApplications(user.uid);
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

  const filteredItems = filter === 'Saved' 
    ? savedJobs 
    : apps.filter(app => {
        if (filter === 'All') return true;
        if (filter === 'Delivered') return app.status === 'pending';
        return app.status.toLowerCase() === filter.toLowerCase();
      });

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
      {/* Page Header - Sticky */}
      <header className="sticky top-0 z-40 bg-[#F8FAF8]/90 dark:bg-[#0F172A]/90 backdrop-blur-md flex justify-between items-center py-4 px-1 -mt-6 transition-colors">
        <button onClick={() => navigate(-1)} className="w-11 h-11 flex items-center justify-center text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm active:scale-95 transition-all">
          <i className="fas fa-chevron-left text-sm"></i>
        </button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Profile</h1>
        <button 
          onClick={toggleTheme}
          className="w-11 h-11 flex items-center justify-center text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm active:scale-95 transition-all"
        >
          <i className={`fas ${isDark ? 'fa-sun text-amber-400' : 'fa-moon text-slate-600'} text-sm`}></i>
        </button>
      </header>

      {/* User Info Card */}
      <section className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-slate-50 dark:border-slate-700 shadow-sm text-center transition-colors">
        <div className="relative inline-block mb-4">
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} 
            className="w-24 h-24 rounded-full shadow-md bg-slate-50 dark:bg-slate-900 border-4 border-white dark:border-slate-700 mx-auto" 
            alt="profile" 
          />
          <div className="absolute bottom-1 right-1 w-6 h-6 brand-bg-green border-2 border-white dark:border-slate-700 rounded-full flex items-center justify-center">
            <i className="fas fa-pencil-alt text-[8px] text-white"></i>
          </div>
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">{user?.displayName || 'User'}</h2>
        <p className="text-slate-400 dark:text-slate-500 font-bold text-sm mb-6">{user?.email}</p>
        
        <div className="grid grid-cols-2 gap-4 border-t border-slate-50 dark:border-slate-700 pt-6">
          <div className="border-r border-slate-50 dark:border-slate-700">
            <p className="text-xl font-black text-slate-900 dark:text-white">{apps.length}</p>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Applied</p>
          </div>
          <div>
            <p className="text-xl font-black text-slate-900 dark:text-white">{savedJobs.length}</p>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Saved</p>
          </div>
        </div>
      </section>

      {/* Activity Section */}
      <section className="relative">
        {/* Sticky Header for Filters */}
        <div className="sticky top-[84px] z-30 bg-[#F8FAF8]/95 dark:bg-[#0F172A]/95 backdrop-blur-md pt-2 pb-5 -mx-4 px-4 transition-colors">
          <div className="flex justify-between items-center mb-5 px-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Activity</h2>
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">
              {filter === 'Saved' ? savedJobs.length : apps.length} Items
            </span>
          </div>

          {/* Sliding Topics Container */}
          <div className="overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex flex-nowrap gap-3 pb-2 min-w-full">
              {['All', 'Saved', 'Delivered', 'Reviewing', 'Cancelled'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-7 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 whitespace-nowrap flex-shrink-0 ${
                    filter === f 
                    ? 'brand-bg-green text-white border-[#2D4F32] shadow-xl shadow-[#2D4F32]/20 scale-105' 
                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm active:scale-95'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content List */}
        <div className="min-h-[300px]">
          {loading ? (
            <div className="space-y-4 mt-2">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white dark:bg-slate-800 rounded-[32px] animate-pulse"></div>)}
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="space-y-4 mt-2">
              {filteredItems.map((item: any) => (
                <Link 
                  to={item.status === 'saved' ? `/job/${item.id}` : `/application/${item.id}`} 
                  key={item.id} 
                  className="bg-white dark:bg-slate-800 p-5 rounded-[32px] border border-slate-50 dark:border-slate-700 shadow-sm block hover:border-[#2D4F32] dark:hover:border-emerald-500 transition-all group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center p-3 border border-slate-100 dark:border-slate-700 group-hover:scale-105 transition-transform">
                       {item.status === 'saved' ? (
                         <i className={`fas fa-bookmark ${isDark ? 'text-emerald-400' : 'brand-text-green'} text-xl`}></i>
                       ) : (
                         <img src={item.logo || 'https://api.dicebear.com/7.x/initials/svg?seed=' + item.company} className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all" alt="logo" />
                       )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate leading-tight mb-1">{item.title || 'Senior Frontend Engineer'}</h3>
                      <p className="text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-wider">
                        {item.status === 'saved' ? `Saved on ${item.date}` : `Applied on ${item.appliedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}`}
                      </p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest flex-shrink-0 ${
                      item.status === 'saved' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50' :
                      item.status === 'pending' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50' : 
                      item.status === 'reviewing' ? 'applicant-bg dark:bg-amber-900/30 applicant-text dark:text-amber-400 border border-amber-200 dark:border-amber-900/50' : 
                      'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50'
                    }`}>
                      {item.status === 'pending' ? 'Delivered' : item.status}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 p-16 rounded-[40px] text-center border border-slate-100 dark:border-slate-700 mt-2 shadow-sm transition-colors">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                 <i className="fas fa-folder-open text-slate-300 dark:text-slate-700 text-2xl"></i>
              </div>
              <h3 className="text-slate-900 dark:text-white font-bold mb-1">Empty list</h3>
              <p className="text-slate-400 dark:text-slate-500 font-medium text-xs">No items found in this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* Logout Action */}
      <div className="pt-6 pb-4">
        <button 
          onClick={handleLogout} 
          className="w-full py-5 text-rose-500 dark:text-rose-400 font-black text-sm uppercase tracking-widest bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-3xl hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-colors shadow-sm active:scale-[0.98]"
        >
          <i className="fas fa-sign-out-alt mr-2"></i> Logout Account
        </button>
      </div>
    </div>
  );
};

export default Profile;

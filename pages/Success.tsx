
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Success: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAF8] dark:bg-[#0F172A] flex flex-col items-center justify-center p-10 text-center animate-slide-up transition-colors">
      <div className="mb-16">
        <div className="relative mb-12 flex justify-center">
            {/* Soft Glow Background */}
            <div className="absolute inset-0 bg-emerald-200/30 dark:bg-emerald-500/10 blur-3xl rounded-full scale-150 transition-colors"></div>
            
            {/* Success Icon Container */}
            <div className="w-48 h-48 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center relative shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/50 dark:border-slate-700 transition-colors">
                <div className="w-24 h-24 brand-bg-green rounded-full flex items-center justify-center shadow-xl shadow-[#2D4F32]/20">
                    <i className="fas fa-check text-white text-4xl"></i>
                </div>
            </div>
        </div>
        
        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight transition-colors">Application Sent!</h1>
      </div>

      <div className="w-full max-sm space-y-4">
        <button 
          onClick={() => navigate('/profile')} 
          className="w-full brand-bg-green text-white py-6 rounded-3xl font-black text-lg shadow-2xl shadow-[#2D4F32]/20 active:scale-95 transition-all transform hover:opacity-95"
        >
          Track Application
        </button>
        <button 
          onClick={() => navigate('/home')} 
          className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 py-6 rounded-3xl font-black text-lg active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-white shadow-sm"
        >
          Discover More Jobs
        </button>
      </div>
    </div>
  );
};

export default Success;


import React from 'react';
import { useNavigate } from 'react-router-dom';

const HowToWork: React.FC = () => {
  const navigate = useNavigate();

  const steps = [
    {
      icon: 'fa-search',
      title: 'Find Opportunities',
      desc: 'Browse through our curated list of micro-tasks and jobs. Each listing shows the specific requirements and details.'
    },
    {
      icon: 'fa-paper-plane',
      title: 'Submit Application',
      desc: 'Apply for jobs by providing your details and a brief message about why you are a good fit. Include your Telegram handle for quick contact.'
    },
    {
      icon: 'fa-user-shield',
      title: 'Admin Review',
      desc: 'Our administrative team reviews every submission. Once verified and approved, your application status will change to "Running".'
    },
    {
      icon: 'fa-headset',
      title: 'Direct Support',
      desc: 'Access the central Support Chat anytime to talk directly with an administrator regarding your submissions or any platform issues.'
    },
    {
      icon: 'fa-check-double',
      title: 'Task Completion',
      desc: 'Follow through with your authorized tasks. Once finalized by the admin, your application history will be updated to reflect success.'
    }
  ];

  return (
    <div className="animate-slide-up space-y-8 pb-12 transition-colors">
      <header className="sticky top-0 z-50 bg-[#F8FAF8]/95 dark:bg-[#0F172A]/95 backdrop-blur-md flex items-center gap-4 py-4 -mx-4 px-4 transition-colors">
        <button 
          onClick={() => navigate(-1)}
          className="w-11 h-11 flex items-center justify-center text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm active:scale-95 transition-all"
        >
          <i className="fas fa-chevron-left text-sm"></i>
        </button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">How it Works</h1>
      </header>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-slate-50 dark:border-slate-700 shadow-sm transition-colors text-center">
        <div className="w-16 h-16 brand-bg-green rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-[#2D4F32]/20">
          <i className="fas fa-circle-info text-2xl"></i>
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Platform Policies</h2>
        <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">Follow these guidelines to ensure a smooth experience and successful task verification.</p>
      </div>

      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-50 dark:border-slate-700 shadow-sm flex items-start gap-5 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-brand-green dark:text-emerald-400 flex-shrink-0 border border-slate-100 dark:border-slate-700">
              <i className={`fas ${step.icon} text-lg`}></i>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">{step.title}</h3>
              <p className="text-slate-400 dark:text-slate-500 text-xs leading-relaxed font-medium">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="bg-amber-50 dark:bg-amber-900/10 p-8 rounded-[40px] border border-amber-100 dark:border-amber-900/30 transition-colors">
        <h4 className="text-amber-700 dark:text-amber-400 font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
          <i className="fas fa-triangle-exclamation"></i>
          Important Note
        </h4>
        <p className="text-amber-800/70 dark:text-amber-400/70 text-xs leading-relaxed font-medium italic">
          Multiple accounts or fraudulent proof submissions will result in an immediate and permanent ban from the platform.
        </p>
      </section>
    </div>
  );
};

export default HowToWork;

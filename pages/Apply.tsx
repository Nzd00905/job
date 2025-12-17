
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, firestoreService } from '../services/firebase';

const Apply: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: auth.currentUser?.displayName || '',
    email: auth.currentUser?.email || '',
    phone: '',
    telegramId: '',
    coverLetter: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      const user = auth.currentUser;
      if (user && id) {
        const applied = await firestoreService.checkIfApplied(id, user.uid);
        if (applied) {
          setSubmitError("You have already applied for this job.");
        }
      }
      setIsChecking(false);
    };
    checkStatus();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitError) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setSubmitError("You must be logged in to apply.");
        setIsSubmitting(false);
        return;
      }
      await firestoreService.submitApplication(id!, userId, formData);
      navigate('/success');
    } catch (err: any) {
      if (err.message === "ALREADY_APPLIED") {
        setSubmitError("You have already applied for this job.");
      } else {
        setSubmitError("Failed to submit. Please check your connection.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isChecking) {
    return <div className="min-h-screen flex items-center justify-center dark:text-white">Verifying...</div>;
  }

  return (
    <div className="animate-slide-up bg-white dark:bg-slate-900 min-h-screen -m-4 md:m-0 md:rounded-[40px] p-6 pb-12 transition-colors">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 rounded-xl active:scale-95 transition-all">
          <i className="fas fa-chevron-left"></i>
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex-1 text-center pr-10">Application</h1>
      </header>

      {submitError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-2xl text-xs font-bold border border-red-100 dark:border-red-900/50 flex items-center gap-2">
          <i className="fas fa-exclamation-circle"></i>
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className={`space-y-6 ${submitError && submitError.includes("already applied") ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="space-y-2">
          <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1 transition-colors">Full Name</label>
          <input 
            required
            type="text" 
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 dark:text-white rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-[#2D4F32] dark:focus:border-emerald-500 transition-all"
            placeholder="Your name"
            value={formData.fullName}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1 transition-colors">Email</label>
          <input 
            required
            type="email" 
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 dark:text-white rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-[#2D4F32] dark:focus:border-emerald-500 transition-all"
            placeholder="Your email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1 transition-colors">Telegram Handle</label>
          <input 
            required
            type="text" 
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 dark:text-white rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-[#2D4F32] dark:focus:border-emerald-500 transition-all"
            placeholder="@handle"
            value={formData.telegramId}
            onChange={(e) => setFormData({...formData, telegramId: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1 transition-colors">Message</label>
          <textarea 
            required
            rows={5}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 dark:text-white rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-[#2D4F32] dark:focus:border-emerald-500 transition-all"
            placeholder="Why are you a good fit?"
            value={formData.coverLetter}
            onChange={(e) => setFormData({...formData, coverLetter: e.target.value})}
          />
        </div>

        <div className="sticky bottom-24 pt-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm transition-colors">
          <button 
            disabled={isSubmitting || !!(submitError && submitError.includes("already applied"))}
            type="submit" 
            className={`w-full brand-bg-green text-white py-5 rounded-[24px] font-bold text-lg shadow-2xl shadow-[#2D4F32]/30 active:scale-[0.98] transition-all ${isSubmitting || (submitError && submitError.includes("already applied")) ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-95'}`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <i className="fas fa-circle-notch animate-spin"></i>
                Submitting...
              </span>
            ) : submitError && submitError.includes("already applied") ? 'Already Applied' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Apply;

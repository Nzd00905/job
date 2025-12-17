
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, firestoreService } from '../services/firebase';

const Withdraw: React.FC = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('PayPal');
  const [methodDetails, setMethodDetails] = useState({
    paypalEmail: '',
    bankName: '',
    accountNumber: '',
    cryptoAddress: '',
    stripeEmail: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userWithdrawals, setUserWithdrawals] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchHistory = async () => {
       if (!user) return;
       const [all, profile] = await Promise.all([
         firestoreService.getAllWithdrawals(),
         firestoreService.getUserProfile(user.uid)
       ]);
       setUserWithdrawals(all.filter(w => w.userId === user?.uid));
       if (profile) {
         setWalletBalance(profile.walletBalance || 0);
       }
    };
    fetchHistory();
  }, [user]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = parseFloat(amount);
    if (!withdrawAmount || withdrawAmount <= 0) return;
    if (!user) return alert('Please login');
    if (withdrawAmount > walletBalance) return alert('Insufficient balance');

    setIsSubmitting(true);
    try {
      const payload = {
        amount: withdrawAmount,
        method,
        details: method === 'PayPal' ? methodDetails.paypalEmail : 
                 method === 'Bank' ? `${methodDetails.bankName} - ${methodDetails.accountNumber}` :
                 method === 'Crypto' ? methodDetails.cryptoAddress : methodDetails.stripeEmail,
        userEmail: user.email,
        userName: user.displayName
      };
      
      await firestoreService.addWithdrawal(user.uid, payload);
      alert("Withdrawal request submitted for review!");
      setAmount('');
      
      // Refresh balance and history
      const [all, profile] = await Promise.all([
         firestoreService.getAllWithdrawals(),
         firestoreService.getUserProfile(user.uid)
      ]);
      setUserWithdrawals(all.filter(w => w.userId === user?.uid));
      if (profile) setWalletBalance(profile.walletBalance || 0);
    } catch (err: any) {
      alert(err.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-slide-up space-y-8 transition-colors">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Withdraw</h1>
          <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.1em] mt-1">Manage Your Earnings</p>
        </div>
        <button className="w-11 h-11 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-sm active:scale-95 transition-all">
          <i className="fas fa-history text-sm"></i>
        </button>
      </header>

      {/* Balance Card */}
      <section className="brand-bg-green p-8 rounded-[40px] text-white shadow-2xl shadow-[#2D4F32]/30 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Available Balance</p>
          <h2 className="text-4xl font-black tracking-tight mb-8">${walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          
          <div className="flex gap-4">
            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p className="text-white/50 text-[8px] font-black uppercase tracking-widest mb-1">Total Payouts</p>
              <p className="text-lg font-bold">${userWithdrawals.filter(w => w.status === 'completed').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</p>
            </div>
            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p className="text-white/50 text-[8px] font-black uppercase tracking-widest mb-1">In Review</p>
              <p className="text-lg font-bold">${userWithdrawals.filter(w => w.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Withdraw Form */}
      <section className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-slate-50 dark:border-slate-700 shadow-sm transition-colors">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Request Payout</h3>
        <form onSubmit={handleWithdraw} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Amount to Withdraw</label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-900 dark:text-white">$</span>
              <input required type="number" step="0.01" placeholder="0.00" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 dark:text-white rounded-2xl py-4 pl-10 pr-6 text-sm font-bold outline-none focus:border-[#2D4F32]" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              {['PayPal', 'Bank', 'Crypto', 'Stripe'].map(m => (
                <button key={m} type="button" onClick={() => setMethod(m)} className={`p-4 rounded-3xl transition-all border-2 flex flex-col items-center gap-3 relative ${method === m ? 'bg-slate-50 dark:bg-slate-900 border-[#2D4F32]' : 'bg-white dark:bg-slate-800 border-slate-50 dark:border-slate-700 text-slate-400'}`}>
                   <span className="text-[10px] font-black uppercase tracking-widest">{m}</span>
                   {method === m && <div className="absolute top-2 right-2 w-4 h-4 brand-bg-green rounded-full flex items-center justify-center"><i className="fas fa-check text-[8px] text-white"></i></div>}
                </button>
              ))}
            </div>
          </div>

          <button disabled={isSubmitting} type="submit" className={`w-full brand-bg-green text-white py-5 rounded-[24px] font-bold text-lg shadow-xl shadow-[#2D4F32]/20 active:scale-[0.98] transition-all ${isSubmitting ? 'opacity-50' : 'hover:opacity-95'}`}>
            {isSubmitting ? 'Processing...' : 'Withdraw Funds'}
          </button>
        </form>
      </section>

      {/* Transaction History */}
      <section>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Transactions</h2>
        </div>
        <div className="space-y-3">
          {userWithdrawals.length > 0 ? userWithdrawals.map(tx => (
            <div key={tx.id} className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-50 dark:border-slate-700 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${tx.status === 'completed' ? 'bg-emerald-50 text-emerald-500' : tx.status === 'pending' ? 'bg-amber-50 text-amber-500' : 'bg-rose-50 text-rose-500'}`}>
                <i className={`fas ${tx.status === 'completed' ? 'fa-check' : tx.status === 'pending' ? 'fa-clock' : 'fa-times'}`}></i>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{tx.method} Withdrawal</h4>
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">{tx.createdAt?.toDate().toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-sm text-slate-900 dark:text-white">- ${tx.amount}</p>
                <p className={`text-[8px] font-black uppercase tracking-widest ${tx.status === 'pending' ? 'text-amber-500' : tx.status === 'completed' ? 'text-emerald-500' : 'text-rose-500'}`}>{tx.status}</p>
              </div>
            </div>
          )) : <div className="p-8 text-center text-slate-400 text-xs font-bold">No transactions yet.</div>}
        </div>
      </section>
    </div>
  );
};

export default Withdraw;

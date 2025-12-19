
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { auth, firestoreService } from '../services/firebase';

const ChatAdmin: React.FC = () => {
  const { id } = useParams(); // id here is the thread ID (usually user.uid)
  const navigate = useNavigate();
  const location = useLocation();
  const user = auth.currentUser;
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const autoSendTriggered = useRef(false);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = firestoreService.subscribeToMessages(id, (msgs) => {
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    // Handle Auto-Message from Application Details
    const handleAutoMessage = async () => {
      if (location.state?.autoMessage && user && id && !autoSendTriggered.current) {
        autoSendTriggered.current = true;
        try {
          await firestoreService.sendMessage(id, location.state.autoMessage, user.uid, 'user');
        } catch (err) {
          console.error("Auto-send error:", err);
        }
      }
    };
    handleAutoMessage();
  }, [location.state, user, id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user || !id) return;

    try {
      const text = inputValue.trim();
      setInputValue('');
      await firestoreService.sendMessage(id, text, user.uid, 'user');
    } catch (err) {
      console.error("Message send error:", err);
      alert("Failed to send message. Please try again.");
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return 'Just now';
    return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-slide-up bg-[#F8FAF8] dark:bg-slate-950 -m-4 rounded-[40px] overflow-hidden shadow-2xl transition-colors">
      <header className="flex items-center gap-4 py-5 px-6 border-b border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl sticky top-0 z-10 transition-all">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center text-slate-900 dark:text-white bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm active:scale-95 transition-all hover:bg-slate-50">
          <i className="fas fa-chevron-left text-sm"></i>
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-11 h-11 brand-bg-green rounded-2xl flex items-center justify-center text-white relative shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-500/5">
            <i className="fas fa-headset"></i>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-4 border-white dark:border-slate-900 rounded-full"></div>
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Chat</h1>
            <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Support Online
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-8 space-y-4 bg-gradient-to-b from-slate-50/50 to-transparent dark:from-transparent">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-10 animate-pulse">
            <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[40px] flex items-center justify-center mb-8 shadow-sm border border-slate-100 dark:border-slate-800 rotate-3">
              <i className="fas fa-paper-plane text-4xl text-slate-100 dark:text-slate-800"></i>
            </div>
            <h3 className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-[0.2em] mb-3">Live Feed</h3>
            <p className="text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed max-w-[220px]">
              Ready to process plaintext messages.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => {
              const isMe = msg.senderId === user?.uid;

              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-slide-up`}>
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[90%]`}>
                    <div className={`p-4 font-mono text-xs border transition-all ${
                      isMe 
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-2xl rounded-tr-none' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl rounded-tl-none'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                    <p className="text-[8px] mt-1.5 font-black uppercase tracking-widest opacity-30 px-1">
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <footer className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 transition-colors">
        <form onSubmit={handleSendMessage} className="relative group">
          <input 
            type="text" 
            placeholder="Write a message..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl py-5 pl-7 pr-16 text-sm font-bold outline-none focus:border-[#2D4F32] dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 shadow-inner dark:text-white transition-all"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 brand-bg-green rounded-2xl text-white flex items-center justify-center shadow-lg active:scale-90 transition-all hover:scale-105 group-focus-within:shadow-emerald-500/30">
            <i className="fas fa-arrow-up text-sm"></i>
          </button>
        </form>
        <p className="text-[8px] text-center text-slate-300 dark:text-slate-600 font-black uppercase tracking-[0.2em] mt-4">
          Feed Encrypted • Plaintext Mode
        </p>
      </footer>
    </div>
  );
};

export default ChatAdmin;

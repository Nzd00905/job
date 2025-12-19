
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
    <div className="flex flex-col h-[calc(100vh-100px)] animate-slide-up bg-[#F8FAF8] dark:bg-[#0A0F1E] -mx-4 -mt-6 rounded-b-[48px] overflow-hidden transition-colors relative">
      {/* Dynamic Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2D4F32 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      <header className="flex items-center gap-4 py-6 px-6 border-b border-slate-100 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-20 transition-all">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 flex items-center justify-center text-slate-900 dark:text-white bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm active:scale-90 transition-all hover:bg-slate-50"
        >
          <i className="fas fa-chevron-left text-sm"></i>
        </button>
        
        <div className="flex items-center gap-3.5 flex-1">
          <div className="w-11 h-11 brand-bg-green rounded-2xl flex items-center justify-center text-white relative shadow-lg shadow-[#2D4F32]/20 ring-4 ring-emerald-500/5">
            <i className="fas fa-headset text-lg"></i>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-4 border-white dark:border-slate-900 rounded-full"></div>
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-slate-900 dark:text-white tracking-tight truncate">Support Concierge</h1>
            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.15em] flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Verified Agent
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-8 space-y-6 relative z-10">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8">
            <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-[32px] flex items-center justify-center mb-8 shadow-sm border border-slate-100 dark:border-slate-800/50 animate-bounce">
              <i className="fas fa-comments text-3xl text-emerald-100 dark:text-slate-800"></i>
            </div>
            <h3 className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-[0.1em] mb-2">How can we help?</h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-medium leading-relaxed max-w-[200px]">
              Our team usually responds within minutes.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, index) => {
              const isMe = msg.senderId === user?.uid;
              const showAvatar = index === 0 || messages[index - 1].senderId !== msg.senderId;

              return (
                <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                  <div className={`flex items-end gap-2.5 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Optional small avatar for admin */}
                    {!isMe && showAvatar && (
                      <div className="w-6 h-6 rounded-lg brand-bg-green flex-shrink-0 flex items-center justify-center mb-1">
                        <i className="fas fa-user-tie text-[10px] text-white"></i>
                      </div>
                    )}
                    {!isMe && !showAvatar && <div className="w-6" />}

                    <div className="flex flex-col">
                      <div className={`px-4 py-3 shadow-sm border transition-all ${
                        isMe 
                        ? 'brand-bg-green border-emerald-800/20 text-white rounded-2xl rounded-br-none' 
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 rounded-2xl rounded-bl-none'
                      }`}>
                        <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      <p className={`text-[9px] mt-1.5 font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600 ${isMe ? 'text-right' : 'text-left'}`}>
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <footer className="p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-t border-slate-100 dark:border-slate-800/50 relative z-20">
        <form onSubmit={handleSendMessage} className="relative group max-w-lg mx-auto">
          <input 
            type="text" 
            placeholder="Type your message..."
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl py-5 pl-7 pr-16 text-sm font-bold outline-none focus:border-[#2D4F32] dark:focus:border-emerald-500 focus:ring-4 focus:ring-[#2D4F32]/5 shadow-sm dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={!inputValue.trim()}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-12 h-12 brand-bg-green rounded-2xl text-white flex items-center justify-center shadow-xl shadow-[#2D4F32]/30 active:scale-90 transition-all hover:scale-105 disabled:opacity-30 disabled:grayscale disabled:scale-100 disabled:shadow-none"
          >
            <i className="fas fa-paper-plane text-sm"></i>
          </button>
        </form>
        <div className="flex justify-center gap-4 mt-4">
           <span className="text-[8px] text-slate-300 dark:text-slate-700 font-black uppercase tracking-[0.2em]">End-to-End Encryption</span>
        </div>
      </footer>
    </div>
  );
};

export default ChatAdmin;

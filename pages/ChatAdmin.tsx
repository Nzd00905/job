
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, firestoreService } from '../services/firebase';

const ChatAdmin: React.FC = () => {
  const { id } = useParams(); // id here is the userId (target of chat)
  const navigate = useNavigate();
  const user = auth.currentUser;
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = firestoreService.subscribeToMessages(id, (msgs) => {
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user || !id) return;

    try {
      await firestoreService.sendMessage(id, inputValue, user.uid, 'user');
      setInputValue('');
    } catch (err) {
      alert("Failed to send message");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] animate-slide-up">
      <header className="flex items-center gap-4 py-4 px-2 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAF8]/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 transition-colors">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center text-slate-900 dark:text-white bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all">
          <i className="fas fa-chevron-left"></i>
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 brand-bg-green rounded-full flex items-center justify-center text-white relative">
            <i className="fas fa-headset"></i>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 dark:text-white">Admin Support</h1>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Official Support Channel</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-xs uppercase font-black tracking-widest">
            No messages yet. Send a message to start.
          </div>
        ) : messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-5 py-4 rounded-[24px] shadow-sm ${
              msg.senderId === user?.uid 
              ? 'brand-bg-green text-white rounded-tr-none' 
              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-50 dark:border-slate-700 rounded-tl-none'
            }`}>
              <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
              <p className={`text-[8px] mt-2 font-bold uppercase tracking-widest ${msg.senderId === user?.uid ? 'text-white/60' : 'text-slate-400'}`}>
                {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Sending...'}
              </p>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <footer className="pt-4 pb-2">
        <form onSubmit={handleSendMessage} className="relative">
          <input 
            type="text" 
            placeholder="Type your message..."
            className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[32px] py-5 pl-8 pr-16 text-sm font-semibold outline-none focus:border-[#2D4F32] shadow-sm dark:text-white"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 brand-bg-green rounded-full text-white flex items-center justify-center shadow-lg active:scale-90 transition-all">
            <i className="fas fa-paper-plane text-sm"></i>
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatAdmin;

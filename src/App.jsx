import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Mail, User, Plus, X, Trash2, RefreshCw, Search, Inbox, AlertTriangle } from 'lucide-react';

function App() {
  const [inboxes, setInboxes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [emails, setEmails] = useState({});
  const [loading, setLoading] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({ provider: 'GMAIL', user_name: '', email: '', password: '' });

  // جلب الحسابات من Supabase
  const fetchInboxes = async () => {
    let { data } = await supabase.from('inboxes').select('*').order('created_at', { ascending: false });
    if (data) setInboxes(data);
  };

  useEffect(() => { fetchInboxes(); }, []);

  // جلب الإيمايلات الحقيقية من الباكيند (Inbox + Spam)
  const loadRealEmails = async (inboxId) => {
    setLoading(prev => ({ ...prev, [inboxId]: true }));
    try {
      const res = await fetch(`/api/fetch-emails?id=${inboxId}`);
      const data = await res.json();
      if (!data.error) {
        setEmails(prev => ({ ...prev, [inboxId]: data }));
      } else {
        console.error("API Error:", data.error);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
    setLoading(prev => ({ ...prev, [inboxId]: false }));
  };

  // تحديث الكل
  const refreshAllInboxes = () => {
    inboxes.forEach(box => loadRealEmails(box.id));
  };

  // إضافة حساب جديد
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('inboxes').insert([formData]);
    if (!error) {
      setIsModalOpen(false);
      setFormData({ provider: 'GMAIL', user_name: '', email: '', password: '' });
      fetchInboxes();
    } else {
      alert("Error adding inbox: " + error.message);
    }
  };

  // حذف حساب
  const deleteInbox = async (id) => {
    if (window.confirm("Are you sure you want to delete this inbox?")) {
      await supabase.from('inboxes').delete().eq('id', id);
      fetchInboxes();
    }
  };

  return (
    <div className="min-h-screen bg-[#1a2c3d] text-white font-sans selection:bg-blue-500/30">
      
      {/* --- HEADER --- */}
      <header className="flex items-center justify-between bg-[#243b55] p-3 px-6 shadow-xl border-b border-gray-800 sticky top-0 z-50">
        <div className="flex items-center gap-2 text-2xl font-bold italic text-blue-400 min-w-max cursor-pointer">
          <Mail size={22} fill="currentColor"/> Inboxious
        </div>

        {/* --- GLOBAL SEARCH --- */}
        <div className="flex-1 max-w-2xl mx-8 relative group">
          <input 
            type="text" 
            placeholder="Search across all inboxes (Subject or Sender)..." 
            className="w-full bg-[#1a2c3d] border border-gray-700 text-white py-2 px-10 rounded-md outline-none focus:border-blue-500 focus:bg-white focus:text-gray-900 transition-all duration-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
          {searchTerm && (
            <X className="absolute right-3 top-2.5 text-gray-500 cursor-pointer hover:text-red-500" size={18} onClick={() => setSearchTerm("")} />
          )}
        </div>

        <div className="flex items-center gap-3 min-w-max">
          <button 
            onClick={refreshAllInboxes} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-900/20"
          >
            <RefreshCw size={14} className={Object.values(loading).some(v => v) ? "animate-spin" : ""} />
            REFRESH ALL
          </button>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-[#58a641] hover:bg-green-600 text-white px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-900/20"
          >
            <Plus size={16}/> ADD INBOX
          </button>
          <div className="bg-gray-700 p-2 rounded-full cursor-pointer hover:bg-gray-600 border border-gray-600"><User size={18} /></div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {inboxes.map((box) => {
            // فلترة الإيمايلات بناءً على البحث
            const filteredEmails = (emails[box.id] || []).filter(mail => 
              mail.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
              mail.from.toLowerCase().includes(searchTerm.toLowerCase())
            );

            return (
              <div key={box.id} className="bg-[#101e2b] rounded-md overflow-hidden border border-gray-800 shadow-2xl hover:border-gray-700 transition-colors">
                
                {/* Inbox Card Header */}
                <div className={`p-2.5 px-4 flex justify-between items-center ${box.provider === 'GMAIL' ? 'bg-[#58a641]' : 'bg-[#2b5797]'}`}>
                  <div className="flex items-center gap-2 text-sm font-bold tracking-tight">
                    <div className="bg-white/20 p-1 rounded"><Mail size={14}/></div>
                    {box.provider}
                  </div>
                  <div className="text-right text-[10px]">
                    <div className="font-bold uppercase tracking-wider">{box.user_name}</div>
                    <div className="opacity-80 font-mono">{box.email}</div>
                  </div>
                </div>

                {/* Inbox Card Body */}
                <div className="p-3 space-y-1 bg-[#0d1621] h-[320px] overflow-y-auto custom-scrollbar">
                  <div className="flex gap-2 mb-3">
                    <button 
                      onClick={() => loadRealEmails(box.id)} 
                      className="flex-1 text-[10px] bg-blue-900/40 hover:bg-blue-800 text-blue-400 py-1.5 rounded font-bold border border-blue-700/50 transition uppercase tracking-widest active:scale-[0.98]"
                    >
                      {loading[box.id] ? "CONNECTING..." : "FETCH EMAILS"}
                    </button>
                    <button 
                      onClick={() => deleteInbox(box.id)} 
                      className="bg-red-900/40 hover:bg-red-800 text-red-500 p-1.5 rounded border border-red-700/50 transition active:scale-90"
                    >
                      <Trash2 size={14}/>
                    </button>
                  </div>

                  {filteredEmails.length > 0 ? filteredEmails.map((mail, i) => (
                    <div key={i} className="p-2 border-b border-gray-800/50 text-[10px] hover:bg-[#1b3147] transition flex justify-between items-start group relative">
                      <div className="flex flex-col truncate pr-2">
                         <span className="text-blue-400 font-bold truncate group-hover:text-blue-300">{mail.from}</span>
                         <span className="text-gray-300 truncate font-medium">{mail.subject}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                         <span className="text-[8px] text-gray-600 whitespace-nowrap font-mono">{new Date(mail.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                         
                         {/* --- SPAM / INBOX REAL TIME BADGE --- */}
                         {mail.folder === 'SPAM' ? (
                           <span className="bg-red-900/30 text-red-500 border border-red-800/50 px-1.5 rounded-[2px] text-[8px] font-bold tracking-tighter flex items-center gap-1 animate-pulse">
                             <AlertTriangle size={8}/> SPAM
                           </span>
                         ) : (
                           <span className="bg-green-900/30 text-green-500 border border-green-800/50 px-1.5 rounded-[2px] text-[8px] font-bold tracking-tighter flex items-center gap-1">
                             <Inbox size={8}/> INBOX
                           </span>
                         )}
                      </div>
                    </div>
                  )) : (
                    <div className="text-gray-700 text-center py-20 text-[10px] italic flex flex-col items-center gap-2">
                      <Mail size={24} className="opacity-10"/>
                      {searchTerm ? "No emails match your search" : "No emails found. Click Fetch."}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* --- ADD INBOX MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[100] backdrop-blur-md">
          <div className="bg-[#243b55] w-full max-w-md p-8 rounded-lg border border-gray-600 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-gray-500 hover:text-white transition"><X size={20}/></button>
            <h2 className="text-xl font-bold mb-8 uppercase tracking-[0.2em] text-center text-blue-400">Setup New Inbox</h2>
            <form onSubmit={handleSubmit} className="space-y-5 text-[10px] font-bold uppercase tracking-wider">
              <div>
                <label className="text-gray-400 mb-1.5 block">Email Provider</label>
                <select className="w-full p-3 bg-[#1a2c3d] rounded border border-gray-700 outline-none focus:border-blue-500 transition shadow-inner" value={formData.provider} onChange={(e) => setFormData({...formData, provider: e.target.value})}>
                  <option value="GMAIL">GMAIL (Google)</option>
                  <option value="OUTLOOK">OUTLOOK / HOTMAIL (Microsoft)</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 mb-1.5 block">User / Label</label>
                <input type="text" placeholder="e.g. Test Account 01" className="w-full p-3 bg-[#1a2c3d] rounded border border-gray-700 outline-none focus:border-blue-500" value={formData.user_name} onChange={(e) => setFormData({...formData, user_name: e.target.value})} required />
              </div>
              <div>
                <label className="text-gray-400 mb-1.5 block">Email Address</label>
                <input type="email" placeholder="account@gmail.com" className="w-full p-3 bg-[#1a2c3d] rounded border border-gray-700 outline-none focus:border-blue-500" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
              </div>
              <div>
                <label className="text-gray-400 mb-1.5 block">App Password (16-digits)</label>
                <input type="password" placeholder="xxxx xxxx xxxx xxxx" className="w-full p-3 bg-[#1a2c3d] rounded border border-gray-700 outline-none focus:border-blue-500" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                <p className="normal-case text-[9px] text-gray-500 mt-2 font-medium tracking-normal italic">* Ensure IMAP is enabled in your email security settings.</p>
              </div>
              <div className="flex gap-3 pt-4">
                 <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 py-3.5 rounded font-bold tracking-widest shadow-lg shadow-blue-900/40 transition active:scale-95">SAVE ACCOUNT</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

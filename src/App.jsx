import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Mail, User, Plus, X, Trash2, RefreshCw, Search, Inbox, Globe, Hash } from 'lucide-react';

function App() {
  const [inboxes, setInboxes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [emails, setEmails] = useState({});
  const [loading, setLoading] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({ provider: 'GMAIL', user_name: '', email: '', password: '' });

  // 1. جلب الحسابات من Supabase
  const fetchInboxes = async () => {
    let { data } = await supabase.from('inboxes').select('*').order('created_at', { ascending: false });
    if (data) setInboxes(data);
  };
  useEffect(() => { fetchInboxes(); }, []);

  // 2. جلب الإيمايلات الحقيقية
  const loadRealEmails = async (id) => {
    setLoading(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/fetch-emails?id=${id}`);
      const data = await res.json();
      if (!data.error) {
        setEmails(prev => ({ ...prev, [id]: data }));
      } else {
        alert("API Error: " + data.error);
      }
    } catch (err) { console.log("Fetch error"); }
    setLoading(prev => ({ ...prev, [id]: false }));
  };

  const refreshAllInboxes = () => inboxes.forEach(box => loadRealEmails(box.id));

  return (
    <div className="min-h-screen bg-[#1a2c3d] text-white font-sans selection:bg-blue-500/30">
      
      {/* --- HEADER --- */}
      <header className="flex items-center justify-between bg-[#243b55] p-3 px-6 border-b border-gray-800 sticky top-0 z-50 shadow-2xl">
        <div className="text-2xl font-bold italic text-blue-400 flex items-center gap-2">
          <Mail size={22} fill="currentColor"/> Inboxious
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl mx-8 relative">
          <input 
            type="text" 
            placeholder="Search across all inboxes..." 
            className="w-full bg-[#1a2c3d] border border-gray-700 text-white py-2 px-10 rounded-md outline-none focus:border-blue-500 focus:bg-white focus:text-black transition-all" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
          {searchTerm && <X className="absolute right-3 top-2.5 text-gray-400 cursor-pointer" size={18} onClick={() => setSearchTerm("")} />}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={refreshAllInboxes} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition active:scale-95 shadow-lg shadow-blue-900/20">
            <RefreshCw size={14} className={Object.values(loading).some(v => v) ? "animate-spin" : ""} /> REFRESH ALL
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-[#58a641] hover:bg-green-600 px-4 py-2 rounded text-xs font-bold flex items-center gap-2 shadow-lg shadow-green-900/20">
            <Plus size={16}/> ADD INBOX
          </button>
          <div className="bg-gray-700 p-2 rounded-full border border-gray-600"><User size={18} /></div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="p-6 max-w-7xl mx-auto mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {inboxes.map((box) => {
            const list = emails[box.id] || [];
            const filtered = list.filter(m => 
              m.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
              m.from.toLowerCase().includes(searchTerm.toLowerCase())
            );

            return (
              <div key={box.id} className="bg-[#101e2b] rounded-md overflow-hidden border border-gray-800 shadow-2xl transition-all">
                {/* Header Card */}
                <div className={`p-3 px-4 flex justify-between items-center ${box.provider === 'GMAIL' ? 'bg-green-600' : 'bg-blue-700'} shadow-inner`}>
                  <div className="font-bold flex items-center gap-2 text-sm tracking-tight uppercase">
                    <Mail size={16}/> {box.provider}
                  </div>
                  <div className="text-right text-[10px] font-bold uppercase">
                    <div>{box.user_name}</div>
                    <div className="opacity-70 font-mono tracking-tighter">{box.email}</div>
                  </div>
                </div>

                {/* Body Card */}
                <div className="p-4 space-y-2 bg-[#0d1621] h-[450px] overflow-y-auto custom-scrollbar">
                  <div className="flex gap-2 mb-4">
                    <button 
                      onClick={() => loadRealEmails(box.id)} 
                      className="flex-1 text-[10px] bg-blue-900/40 hover:bg-blue-800 text-blue-400 py-2.5 rounded font-black border border-blue-700/30 uppercase tracking-widest transition"
                    >
                      {loading[box.id] ? "FETCHING EMAILS..." : "FETCH EMAILS"}
                    </button>
                    <button 
                      onClick={() => { if(window.confirm("Delete?")) supabase.from('inboxes').delete().eq('id', box.id).then(() => fetchInboxes()); }} 
                      className="bg-red-900/40 hover:bg-red-800 text-red-500 p-2 rounded border border-red-700/30 transition"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </div>

                  {filtered.length > 0 ? filtered.map((mail, i) => (
                    <div key={i} className="p-3 border-b border-gray-800/50 bg-[#0f1a26]/40 mb-2 rounded shadow-sm hover:bg-[#1b3147]/30 transition group relative">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col truncate pr-2 max-w-[70%]">
                          <span className="text-blue-400 font-bold text-[11px] truncate group-hover:text-blue-300">{mail.from}</span>
                          <span className="text-gray-200 text-[10px] font-bold truncate uppercase tracking-tighter">{mail.subject}</span>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1.5">
                          <span className="text-[9px] text-gray-600 font-mono font-bold tracking-tight">{new Date(mail.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          <span className={`px-2 py-0.5 rounded-[2px] text-[8px] font-black border uppercase tracking-tighter ${mail.folder === 'SPAM' ? 'bg-red-900/30 text-red-500 border-red-800 animate-pulse' : 'bg-green-900/30 text-green-500 border-green-800'}`}>
                            {mail.folder}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2 overflow-hidden">
                        <div className="bg-white/5 px-2 py-0.5 rounded border border-white/5 text-[9px] text-gray-500 font-mono flex items-center gap-1.5 whitespace-nowrap">
                          <Hash size={10} className="text-gray-700"/> {mail.ip}
                        </div>
                        <div className="bg-white/5 px-2 py-0.5 rounded border border-white/5 text-[9px] text-gray-500 flex items-center gap-1.5 truncate max-w-[140px]">
                          <Globe size={10} className="text-gray-700"/> {mail.domain}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-gray-700 text-center py-24 text-[10px] italic flex flex-col items-center gap-2">
                      <Mail size={32} className="opacity-10"/>
                      {searchTerm ? "No results found for your search" : "Inbox is empty. Click Fetch Emails."}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* --- ADD MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-[100] backdrop-blur-md">
          <div className="bg-[#243b55] w-full max-w-md p-8 rounded-lg border border-gray-600 shadow-2xl relative font-bold uppercase text-[10px] tracking-widest">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-gray-500 hover:text-white transition"><X size={20}/></button>
            <h2 className="text-xl font-black mb-8 text-center text-blue-400 italic">Add New Account</h2>
            <form onSubmit={(e) => { e.preventDefault(); supabase.from('inboxes').insert([formData]).then(() => { setIsModalOpen(false); fetchInboxes(); }); }} className="space-y-5">
              <div>
                <label className="text-gray-500 mb-1.5 block">Provider</label>
                <select className="w-full p-3 bg-[#1a2c3d] rounded border border-gray-700 outline-none focus:border-blue-500" onChange={(e) => setFormData({...formData, provider: e.target.value})}>
                  <option value="GMAIL">GMAIL (Google)</option>
                  <option value="OUTLOOK">OUTLOOK / HOTMAIL</option>
                </select>
              </div>
              <div>
                <label className="text-gray-500 mb-1.5 block">Name</label>
                <input type="text" placeholder="e.g. Account 01" className="w-full p-3 bg-[#1a2c3d] rounded border border-gray-700 outline-none focus:border-blue-500" onChange={(e) => setFormData({...formData, user_name: e.target.value})} required />
              </div>
              <div>
                <label className="text-gray-500 mb-1.5 block">Email</label>
                <input type="email" placeholder="example@gmail.com" className="w-full p-3 bg-[#1a2c3d] rounded border border-gray-700 outline-none focus:border-blue-500" onChange={(e) => setFormData({...formData, email: e.target.value})} required />
              </div>
              <div>
                <label className="text-gray-500 mb-1.5 block">App Password</label>
                <input type="password" placeholder="xxxx xxxx xxxx xxxx" className="w-full p-3 bg-[#1a2c3d] rounded border border-gray-700 outline-none focus:border-blue-500" onChange={(e) => setFormData({...formData, password: e.target.value})} required />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded font-black shadow-lg transition active:scale-95">SAVE ACCOUNT</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

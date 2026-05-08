import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Mail, User, Plus, X, Trash2, RefreshCw, Search, Inbox, Globe, Hash, Copy, Check } from 'lucide-react';

function App() {
  const [inboxes, setInboxes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [emails, setEmails] = useState({});
  const [loading, setLoading] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false); // لحالة Copy All
  const [formData, setFormData] = useState({ provider: 'GMAIL', user_name: '', email: '', password: '' });

  const fetchInboxes = async () => {
    let { data } = await supabase.from('inboxes').select('*').order('created_at', { ascending: false });
    if (data) setInboxes(data);
  };
  useEffect(() => { fetchInboxes(); }, []);

  const loadRealEmails = async (id) => {
    setLoading(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/fetch-emails?id=${id}`);
      const data = await res.json();
      if (!data.error) setEmails(prev => ({ ...prev, [id]: data }));
    } catch (err) { console.log("Fetch error"); }
    setLoading(prev => ({ ...prev, [id]: false }));
  };

  const refreshAllInboxes = () => inboxes.forEach(box => loadRealEmails(box.id));

  // --- ميزة Copy All Emails ---
  const copyAllEmails = () => {
    const all = inboxes.map(i => i.email).join(', ');
    navigator.clipboard.writeText(all);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- ميزة النسخ السريع ---
  const fastCopy = (text) => {
    navigator.clipboard.writeText(text);
    // تطلع تنبيه بسيط أو تغيير لون الأيقونة
  };

  return (
    <div className="min-h-screen bg-[#1a2c3d] text-white font-sans">
      
      {/* HEADER */}
      <header className="flex items-center justify-between bg-[#243b55] p-3 px-6 border-b border-gray-800 sticky top-0 z-50 shadow-2xl">
        <div className="text-2xl font-bold italic text-blue-400 flex items-center gap-2">
          <Mail size={22} fill="currentColor"/> Inboxious
        </div>

        <div className="flex-1 max-w-xl mx-8 relative">
          <input type="text" placeholder="Search subject/sender..." className="w-full bg-[#1a2c3d] border border-gray-700 text-white py-2 px-10 rounded-md outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
        </div>

        <div className="flex items-center gap-2">
          {/* بوطون Copy All الجديدة */}
          <button onClick={copyAllEmails} className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-[10px] font-bold flex items-center gap-2 transition uppercase">
            {copied ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
            {copied ? "Copied!" : "Copy All Inboxes"}
          </button>
          
          <button onClick={refreshAllInboxes} className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-[10px] font-bold flex items-center gap-2 transition uppercase">
            <RefreshCw size={14} className={Object.values(loading).some(v => v) ? "animate-spin" : ""} /> REFRESH ALL
          </button>
          
          <button onClick={() => setIsModalOpen(true)} className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-[10px] font-bold transition shadow-lg">+ ADD</button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {inboxes.map((box) => {
            const list = emails[box.id] || [];
            const filtered = list.filter(m => m.subject.toLowerCase().includes(searchTerm.toLowerCase()) || m.from.toLowerCase().includes(searchTerm.toLowerCase()));
            return (
              <div key={box.id} className="bg-[#101e2b] rounded-md overflow-hidden border border-gray-800 shadow-2xl transition-all">
                {/* Header Card */}
                <div className={`p-2.5 px-4 flex justify-between items-center ${box.provider === 'GMAIL' ? 'bg-green-600' : 'bg-blue-700'}`}>
                  <span className="font-bold text-xs uppercase tracking-tighter">{box.provider} - {box.user_name}</span>
                  <button onClick={() => fastCopy(box.email)} className="text-[9px] font-mono opacity-80 hover:opacity-100 flex items-center gap-1">
                    {box.email} <Copy size={10}/>
                  </button>
                </div>

                <div className="p-4 space-y-2 bg-[#0d1621] h-[450px] overflow-y-auto">
                  <div className="flex gap-2 mb-4">
                    <button onClick={() => loadRealEmails(box.id)} className="flex-1 text-[10px] bg-blue-900/40 text-blue-400 py-2 rounded font-black border border-blue-700/30 uppercase tracking-widest">{loading[box.id] ? "LOADING..." : "REFRESH BOX"}</button>
                    <button onClick={() => { if(window.confirm("Delete?")) supabase.from('inboxes').delete().eq('id', box.id).then(() => fetchInboxes()); }} className="bg-red-900/40 text-red-500 p-2 rounded border border-red-700/30"><Trash2 size={16}/></button>
                  </div>

                  {filtered.map((mail, i) => (
                    <div key={i} className="p-3 border-b border-gray-800/50 bg-[#0f1a26]/40 mb-2 rounded hover:bg-[#1b3147]/30 transition group">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col truncate pr-2 max-w-[70%]">
                          <span className="text-blue-400 font-bold text-[11px] truncate">{mail.from}</span>
                          <span className="text-gray-200 text-[10px] font-bold truncate uppercase">{mail.subject}</span>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <span className="text-[9px] text-gray-600 font-mono font-bold tracking-tight">{new Date(mail.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          <span className={`px-2 py-0.5 rounded-[2px] text-[8px] font-black border uppercase ${mail.folder === 'SPAM' ? 'bg-red-900/30 text-red-500 border-red-800' : 'bg-green-900/30 text-green-500 border-green-800'}`}>{mail.folder}</span>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        {/* نسخ الـ IP بنقرة واحدة */}
                        <button onClick={() => fastCopy(mail.ip)} title="Click to copy IP" className="bg-white/5 px-2 py-0.5 rounded border border-white/5 text-[9px] text-gray-500 font-mono flex items-center gap-1.5 hover:text-white transition active:scale-95">
                          <Hash size={10} className="text-gray-700"/> {mail.ip}
                        </button>
                        <button onClick={() => fastCopy(mail.domain)} title="Click to copy Domain" className="bg-white/5 px-2 py-0.5 rounded border border-white/5 text-[9px] text-gray-500 flex items-center gap-1.5 truncate max-w-[140px] hover:text-white transition active:scale-95">
                          <Globe size={10} className="text-gray-700"/> {mail.domain}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
export default App;

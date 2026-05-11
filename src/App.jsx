import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Mail, User, Plus, X, Trash2, RefreshCw, Search, Inbox, Globe, Hash, Copy, Check, ShieldCheck, Lock, Activity } from 'lucide-react';

function App() {
  // --- 1. حماية الموقع بالمود باس ---
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('site_auth') === 'true');
  const [passwordInput, setPasswordInput] = useState("");
  const adminPassword = import.meta.env.VITE_SITE_PASSWORD || "admin123";

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === adminPassword) {
      localStorage.setItem('site_auth', 'true');
      setIsAuthenticated(true);
    } else { alert("Wrong Password!"); }
  };

  // --- 2. حالات الموقع ---
  const [inboxes, setInboxes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [emails, setEmails] = useState({});
  const [loading, setLoading] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({ provider: 'GMAIL', user_name: '', email: '', password: '' });

  useEffect(() => { if (isAuthenticated) fetchInboxes(); }, [isAuthenticated]);

  const fetchInboxes = async () => {
    let { data } = await supabase.from('inboxes').select('*').order('created_at', { ascending: false });
    if (data) setInboxes(data);
  };

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
  const copyAllEmails = () => {
    const all = inboxes.map(i => i.email).join(', ');
    navigator.clipboard.writeText(all);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="bg-[#1e293b] p-8 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md text-center">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"><Lock className="text-white" size={32}/></div>
          <h1 className="text-xl font-black text-white uppercase tracking-widest mb-8 italic">Private Access</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" placeholder="PASSWORD" className="w-full p-4 bg-[#0f172a] border border-slate-700 rounded-xl outline-none text-center text-white font-bold tracking-[0.5em]" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} autoFocus />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-black uppercase tracking-widest transition active:scale-95">Unlock</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans">
      {/* HEADER */}
      <header className="flex items-center justify-between bg-[#1e293b]/80 backdrop-blur-md p-3 px-6 border-b border-slate-800 sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg"><Mail size={20} fill="white"/></div>
          <span className="text-xl font-black text-white italic uppercase tracking-tighter">Inboxious <span className="text-blue-500 text-xs font-bold ml-1">PRO</span></span>
        </div>
        <div className="flex-1 max-w-xl mx-8 relative">
          <input type="text" placeholder="Search..." className="w-full bg-[#0f172a] border border-slate-700 text-white py-2 px-10 rounded-lg outline-none text-sm focus:border-blue-500 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copyAllEmails} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-[10px] font-bold flex items-center gap-2 transition border border-slate-700 uppercase">
            {copied ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>} {copied ? "Copied!" : "Seed List"}
          </button>
          <button onClick={refreshAllInboxes} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-[10px] font-bold flex items-center gap-2 transition uppercase">
            <RefreshCw size={14} className={Object.values(loading).some(v => v) ? "animate-spin" : ""} /> ALL
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg text-[10px] font-bold transition shadow-lg shadow-emerald-900/30 uppercase">+ Add</button>
          <button onClick={() => {localStorage.removeItem('site_auth'); window.location.reload();}} className="p-2 text-slate-500 hover:text-white"><X size={20}/></button>
        </div>
      </header>

      {/* MAIN (ROW LAYOUT) */}
      <main className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {inboxes.map((box) => {
          const filtered = (emails[box.id] || []).filter(m => m.subject.toLowerCase().includes(searchTerm.toLowerCase()) || m.from.toLowerCase().includes(searchTerm.toLowerCase()));
          return (
            <div key={box.id} className="bg-[#1e293b] border border-slate-800 rounded-xl overflow-hidden shadow-2xl transition-all group">
              <div className="bg-slate-900/50 p-3 px-5 flex items-center justify-between border-b border-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-600 font-bold group-hover:bg-blue-600 transition-all uppercase">{box.user_name.charAt(0)}</div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-tighter">{box.email} <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{box.user_name}</span></h3>
                    <div className="flex gap-2 mt-1">
                      <span className="flex items-center gap-1 text-[8px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase">● Online</span>
                      <span className="flex items-center gap-1 text-[8px] text-blue-500 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 uppercase">● {filtered.length} Loaded</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => loadRealEmails(box.id)} className="text-[10px] font-bold bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 uppercase">{loading[box.id] ? "Fetching..." : "Fetch"}</button>
                  <button onClick={() => { if(window.confirm("Delete?")) supabase.from('inboxes').delete().eq('id', box.id).then(() => fetchInboxes()); }} className="text-slate-500 hover:text-red-500"><Trash2 size={18}/></button>
                </div>
              </div>

              {/* Horizontal List */}
              <div className="p-4 flex gap-4 overflow-x-auto bg-[#0f172a]/20">
                {filtered.map((mail, i) => (
                  <div key={i} className="min-w-[320px] max-w-[320px] bg-[#1e293b]/50 border border-slate-800 p-3 rounded-lg hover:border-blue-500/30 transition-all shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${mail.folder === 'SPAM' ? 'bg-red-500/10 text-red-500 border-red-500/30 animate-pulse' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'}`}>{mail.folder}</span>
                      <span className="text-[9px] text-slate-500 font-mono">{new Date(mail.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="flex flex-col mb-3">
                      <span className="text-blue-400 font-bold text-[11px] truncate">{mail.from}</span>
                      <span className="text-white text-[10px] font-bold truncate uppercase leading-tight">{mail.subject}</span>
                    </div>
                    {/* NEW: IP, Domain & Tech Badges */}
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-800/50">
                      <div className="bg-slate-900 p-1.5 rounded flex-1 text-[9px] text-slate-400 border border-slate-800 flex items-center justify-between">
                        <span className="truncate flex items-center gap-1"><Hash size={10}/> {mail.ip}</span>
                        <Copy size={10} className="cursor-pointer hover:text-white" onClick={() => navigator.clipboard.writeText(mail.ip)}/>
                      </div>
                      <div className="bg-slate-900 p-1.5 rounded flex-1 text-[9px] text-slate-400 border border-slate-800 flex items-center justify-between">
                        <span className="truncate flex items-center gap-1"><Globe size={10}/> {mail.domain}</span>
                        <Copy size={10} className="cursor-pointer hover:text-white" onClick={() => navigator.clipboard.writeText(mail.domain)}/>
                      </div>
                    </div>
                    {/* Tech Inspector Row */}
                    <div className="flex gap-1.5 mt-2">
                      {['spf', 'dkim', 'dmarc'].map(key => (
                        <div key={key} className={`flex-1 text-center py-1 rounded text-[7px] font-black uppercase border ${mail[key] === 'PASS' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : mail[key] === 'FAIL' ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse' : 'bg-slate-800 text-slate-600 border-slate-700'}`}>
                          {key}: {mail[key]}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </main>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-[100] backdrop-blur-md uppercase font-bold text-[10px]">
          <div className="bg-[#1e293b] w-full max-w-md p-8 rounded-2xl border border-slate-700 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-slate-500 hover:text-white p-2"><X size={20}/></button>
            <h2 className="text-xl font-black text-center text-blue-400 italic mb-8">Add New Inbox</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const { error } = await supabase.from('inboxes').insert([formData]);
              if (!error) { setIsModalOpen(false); setFormData({ provider: 'GMAIL', user_name: '', email: '', password: '' }); fetchInboxes(); }
            }} className="space-y-4">
              <select className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl" value={formData.provider} onChange={(e) => setFormData({...formData, provider: e.target.value})}><option value="GMAIL">GMAIL</option><option value="OUTLOOK">OUTLOOK</option></select>
              <input type="text" placeholder="Label" className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl" value={formData.user_name} onChange={(e) => setFormData({...formData, user_name: e.target.value})} required />
              <input type="email" placeholder="Email" className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
              <input type="password" placeholder="App Password" className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
              <button type="submit" className="w-full bg-blue-600 py-4 rounded-xl font-black tracking-widest uppercase mt-4 shadow-lg shadow-blue-900/40">Save Connection</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Mail, User, Plus, X, Trash2, RefreshCw, Search, Inbox, Globe, Hash, Copy, Check, ShieldCheck, Activity } from 'lucide-react';

function App() {
  const [inboxes, setInboxes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [emails, setEmails] = useState({});
  const [loading, setLoading] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);
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

  const copyAllEmails = () => {
    const all = inboxes.map(i => i.email).join(', ');
    navigator.clipboard.writeText(all);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fastCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('inboxes').insert([formData]);
    if (!error) {
      setIsModalOpen(false);
      setFormData({ provider: 'GMAIL', user_name: '', email: '', password: '' });
      fetchInboxes();
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* --- HEADER --- */}
      <header className="flex items-center justify-between bg-[#1e293b]/80 backdrop-blur-md p-3 px-6 border-b border-slate-800 sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-900/40">
            <Mail size={20} className="text-white" fill="currentColor"/>
          </div>
          <span className="text-xl font-black tracking-tighter text-white uppercase italic">Inboxious <span className="text-blue-500 text-xs not-italic font-bold ml-1">PRO</span></span>
        </div>

        <div className="flex-1 max-w-xl mx-8 relative">
          <input 
            type="text" 
            placeholder="Search keywords, subjects, or senders..." 
            className="w-full bg-[#0f172a] border border-slate-700 text-white py-2 px-10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
        </div>

        <div className="flex items-center gap-2">
          <button onClick={copyAllEmails} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-[10px] font-bold flex items-center gap-2 transition border border-slate-700 uppercase">
            {copied ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
            {copied ? "Copied!" : "Copy Seed List"}
          </button>
          <button onClick={refreshAllInboxes} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-[10px] font-bold flex items-center gap-2 transition uppercase shadow-lg shadow-blue-900/30">
            <RefreshCw size={14} className={Object.values(loading).some(v => v) ? "animate-spin" : ""} /> REFRESH ALL
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg text-[10px] font-bold transition shadow-lg shadow-emerald-900/30 uppercase">+ Add Account</button>
        </div>
      </header>

      {/* --- MAIN CONTENT (ROW LAYOUT) --- */}
      <main className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {inboxes.map((box) => {
          const list = emails[box.id] || [];
          const filtered = list.filter(m => m.subject.toLowerCase().includes(searchTerm.toLowerCase()) || m.from.toLowerCase().includes(searchTerm.toLowerCase()));
          
          return (
            <div key={box.id} className="bg-[#1e293b] border border-slate-800 rounded-xl overflow-hidden shadow-2xl transition-all hover:border-slate-700 group">
              
              {/* Row Header (Account Info) */}
              <div className="bg-slate-900/50 p-3 px-5 flex items-center justify-between border-b border-slate-800/50">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-600 font-bold text-slate-300 shadow-inner group-hover:from-blue-600 group-hover:to-blue-800 group-hover:text-white transition-all">
                    {box.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {box.email}
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 uppercase">{box.user_name}</span>
                    </h3>
                    <div className="flex gap-2 mt-1">
                      <span className="flex items-center gap-1 text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20"><ShieldCheck size={10}/> Connected</span>
                      <span className="flex items-center gap-1 text-[9px] text-blue-500 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20"><Activity size={10}/> Inbox {filtered.length}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={() => loadRealEmails(box.id)} className="text-[10px] font-bold text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition uppercase">
                    {loading[box.id] ? "Fetching..." : "Fetch"}
                  </button>
                  <button onClick={() => { if(window.confirm("Delete?")) supabase.from('inboxes').delete().eq('id', box.id).then(() => fetchInboxes()); }} className="text-slate-500 hover:text-red-500 transition p-1">
                    <Trash2 size={18}/>
                  </button>
                </div>
              </div>

              {/* Row Body (Horizontal Scrollable Emails) */}
              <div className="p-4 flex gap-4 overflow-x-auto custom-scrollbar bg-[#0f172a]/20">
                {filtered.length > 0 ? filtered.map((mail, i) => (
                  <div key={i} className="min-w-[320px] max-w-[320px] bg-[#1e293b]/50 border border-slate-800 p-3 rounded-lg hover:border-blue-500/30 transition-colors relative shadow-sm">
                    {/* Folder Badge */}
                    <div className="flex justify-between items-center mb-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border ${
                        mail.folder === 'SPAM' ? 'bg-red-500/10 text-red-500 border-red-500/30 animate-pulse' : 
                        mail.subject.toLowerCase().includes('declined') ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                        'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                      }`}>
                        {mail.folder === 'SPAM' ? '● Spam' : mail.subject.toLowerCase().includes('declined') ? '● Forums' : '● Primary'}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">{new Date(mail.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>

                    <div className="flex flex-col mb-3">
                      <span className="text-blue-400 font-bold text-[11px] truncate">{mail.from}</span>
                      <span className="text-white text-[10px] font-bold truncate uppercase mt-0.5">{mail.subject}</span>
                    </div>

                    {/* Bottom Info (IP & Domain) */}
                    <div className="flex gap-1.5 mt-auto pt-2 border-t border-slate-800">
                      <button onClick={() => fastCopy(mail.ip)} className="flex-1 bg-slate-900/50 hover:bg-slate-800 p-1.5 rounded flex items-center justify-between px-2 text-slate-400 hover:text-white transition group/btn border border-slate-800">
                        <div className="flex items-center gap-1.5 text-[9px] font-mono"><Hash size={10} className="text-slate-600"/> {mail.ip}</div>
                        <Copy size={10} className="opacity-0 group-hover/btn:opacity-100 transition-opacity"/>
                      </button>
                      <button onClick={() => fastCopy(mail.domain)} className="flex-1 bg-slate-900/50 hover:bg-slate-800 p-1.5 rounded flex items-center justify-between px-2 text-slate-400 hover:text-white transition group/btn border border-slate-800 overflow-hidden">
                        <div className="flex items-center gap-1.5 text-[9px] truncate"><Globe size={10} className="text-slate-600"/> {mail.domain}</div>
                        <Copy size={10} className="opacity-0 group-hover/btn:opacity-100 transition-opacity"/>
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="w-full flex items-center justify-center py-10 text-slate-600 text-xs italic tracking-widest bg-slate-900/20 rounded-lg">
                    {loading[box.id] ? "Connecting to server..." : "No mails found. Click Fetch to synchronize."}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </main>

      {/* --- ADD MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
          <div className="bg-[#1e293b] w-full max-w-md p-8 rounded-2xl border border-slate-700 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-slate-500 hover:text-white transition p-2"><X size={20}/></button>
            <div className="text-center mb-8">
              <h2 className="text-xl font-black text-white italic uppercase tracking-widest">Add New Inbox</h2>
              <p className="text-xs text-slate-500 mt-1">Setup IMAP connection for your seed list</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Provider</label>
                <select className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm font-bold" value={formData.provider} onChange={(e) => setFormData({...formData, provider: e.target.value})}>
                  <option value="GMAIL">GMAIL (Google Account)</option>
                  <option value="OUTLOOK">OUTLOOK / MSN / HOTMAIL</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Account Label</label>
                <input type="text" placeholder="e.g. David Seed 01" className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm font-bold placeholder:text-slate-700" value={formData.user_name} onChange={(e) => setFormData({...formData, user_name: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Email Address</label>
                <input type="email" placeholder="example@gmail.com" className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm font-bold placeholder:text-slate-700" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">App Password</label>
                <input type="password" placeholder="xxxx xxxx xxxx xxxx" className="w-full p-3 bg-[#0d1421] border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm font-bold placeholder:text-slate-700" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition shadow-lg shadow-blue-900/40 active:scale-95 mt-4">Save Connection</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

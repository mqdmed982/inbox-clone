import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Mail, User, Plus, X, Trash2, RefreshCw, Search, Inbox, AlertTriangle, Copy, Globe, Hash } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

function App() {
  const [inboxes, setInboxes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [emails, setEmails] = useState({});
  const [loading, setLoading] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
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

  const calculateStats = () => {
    let inbox = 0, spam = 0;
    Object.values(emails).flat().forEach(m => m.folder === 'INBOX' ? inbox++ : spam++);
    return [{ name: 'Inbox', value: inbox, color: '#10b981' }, { name: 'Spam', value: spam, color: '#ef4444' }];
  };

  const statsData = calculateStats();
  const totalMails = statsData[0].value + statsData[1].value;
  const rate = totalMails > 0 ? Math.round((statsData[0].value / totalMails) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#1a2c3d] text-white font-sans selection:bg-blue-500/30">
      <header className="flex items-center justify-between bg-[#243b55] p-3 px-6 shadow-xl border-b border-gray-800 sticky top-0 z-50">
        <div className="text-2xl font-bold italic text-blue-400 min-w-max flex items-center gap-2">
          <Mail size={22} fill="currentColor"/> Inboxious
        </div>
        <div className="flex-1 max-w-2xl mx-8 relative">
          <input type="text" placeholder="Search..." className="w-full bg-[#1a2c3d] border border-gray-700 text-white py-2 px-10 rounded-md outline-none focus:border-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={refreshAllInboxes} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition active:scale-95">
            <RefreshCw size={14} className={Object.values(loading).some(v => v) ? "animate-spin" : ""} /> REFRESH ALL
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-[#58a641] hover:bg-green-600 px-4 py-2 rounded text-xs font-bold flex items-center gap-2"><Plus size={16}/> ADD INBOX</button>
          <div className="bg-gray-700 p-2 rounded-full border border-gray-600"><User size={18} /></div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#243b55] p-6 rounded-lg border border-gray-700 flex flex-col items-center relative h-56 shadow-2xl">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Overall Delivery</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={statsData} innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value">{statsData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip/></PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-6 pointer-events-none">
              <span className="text-3xl font-black text-green-500 leading-none">{rate}%</span>
              <span className="text-[8px] text-gray-500 uppercase font-bold tracking-tighter">Inbox Rate</span>
            </div>
          </div>
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div className="bg-[#243b55] p-8 rounded-lg border border-gray-700 flex flex-col justify-center shadow-2xl">
              <span className="text-gray-400 text-[10px] font-bold uppercase mb-2">Total Mails</span>
              <span className="text-6xl font-black text-blue-400 leading-none">{totalMails}</span>
            </div>
            <div className="bg-[#243b55] p-8 rounded-lg border border-gray-700 flex flex-col justify-center shadow-2xl">
              <span className="text-gray-400 text-[10px] font-bold uppercase mb-2">Active Boxes</span>
              <span className="text-6xl font-black text-green-500 leading-none">{inboxes.length}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {inboxes.map((box) => {
            const filtered = (emails[box.id] || []).filter(m => m.subject.toLowerCase().includes(searchTerm.toLowerCase()) || m.from.toLowerCase().includes(searchTerm.toLowerCase()));
            return (
              <div key={box.id} className="bg-[#101e2b] rounded overflow-hidden border border-gray-800 shadow-2xl">
                <div className={`p-2.5 px-4 flex justify-between items-center ${box.provider === 'GMAIL' ? 'bg-[#58a641]' : 'bg-[#2b5797]'}`}>
                  <div className="text-sm font-bold flex items-center gap-2"><Mail size={16}/> {box.provider}</div>
                  <div className="text-right text-[10px] uppercase font-bold"><div>{box.user_name}</div><div className="opacity-70 font-mono tracking-tighter">{box.email}</div></div>
                </div>
                <div className="p-3 space-y-1 bg-[#0d1621] h-[400px] overflow-y-auto">
                  <div className="flex gap-2 mb-3">
                    <button onClick={() => loadRealEmails(box.id)} className="flex-1 text-[10px] bg-blue-900/40 hover:bg-blue-800 text-blue-400 py-2 rounded font-black border border-blue-700/30 uppercase tracking-widest">{loading[box.id] ? "FETCHING..." : "FETCH EMAILS"}</button>
                    <button onClick={() => { supabase.from('inboxes').delete().eq('id', box.id).then(() => fetchInboxes()); }} className="bg-red-900/40 hover:bg-red-800 text-red-500 p-2 rounded border border-red-700/30"><Trash2 size={14}/></button>
                  </div>
                  {filtered.map((mail, i) => (
                    <div key={i} className="p-3 border-b border-gray-800/50 bg-[#0f1a26]/40 mb-2 rounded shadow-sm group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col truncate pr-2">
                          <span className="text-blue-400 font-bold text-[11px] truncate">{mail.from}</span>
                          <span className="text-gray-200 text-[10px] font-bold truncate uppercase">{mail.subject}</span>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <span className="text-[9px] text-gray-600 font-mono">{new Date(mail.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          <span className={`px-2 py-0.5 rounded-[2px] text-[8px] font-black border ${mail.folder === 'SPAM' ? 'bg-red-900/30 text-red-500 border-red-800' : 'bg-green-900/30 text-green-500 border-green-800'}`}>{mail.folder}</span>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <div className="bg-white/5 px-2 py-1 rounded border border-white/5 text-[9px] flex items-center gap-1.5 text-gray-400 font-mono"><Hash size={10}/>{mail.ip}</div>
                        <div className="bg-white/5 px-2 py-1 rounded border border-white/5 text-[9px] flex items-center gap-1.5 text-gray-400 max-w-[150px] truncate"><Globe size={10}/>{mail.domain}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[100] backdrop-blur-md">
          <div className="bg-[#243b55] w-full max-w-md p-8 rounded-lg border border-gray-600 shadow-2xl relative uppercase text-[10px] font-bold">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-gray-500 hover:text-white transition"><X size={20}/></button>
            <h2 className="text-xl font-black mb-8 text-center text-blue-400 tracking-widest italic">Add New Account</h2>
            <form onSubmit={(e) => { e.preventDefault(); supabase.from('inboxes').insert([formData]).then(() => { setIsModalOpen(false); fetchInboxes(); }); }} className="space-y-4">
              <select className="w-full p-3 bg-[#1a2c3d] rounded border border-gray-700 outline-none" onChange={(e) => setFormData({...formData, provider: e.target.value})}><option value="GMAIL">GMAIL</option><option value="OUTLOOK">OUTLOOK</option></select>
              <input type="text" placeholder="User Name" className="w-full p-3 bg-[#1a2c3d] rounded border border-gray-700 outline-none" onChange={(e) => setFormData({...formData, user_name: e.target.value})} required />
              <input type="email" placeholder="Email Address" className="w-full p-3 bg-[#1a2c3d] rounded border border-gray-700 outline-none" onChange={(e) => setFormData({...formData, email: e.target.value})} required />
              <input type="password" placeholder="App Password" className="w-full p-3 bg-[#1a2c3d] rounded border border-gray-700 outline-none" onChange={(e) => setFormData({...formData, password: e.target.value})} required />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded font-black tracking-widest shadow-lg transition active:scale-95">SAVE ACCOUNT</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;

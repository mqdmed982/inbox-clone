import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Mail, User, Plus, X, Trash2, RefreshCw, Search, Inbox, AlertTriangle, Copy, Globe, Hash, PieChart as PieIcon } from 'lucide-react';
// استيراد مكونات الرسم البياني
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

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

  const loadRealEmails = async (inboxId) => {
    setLoading(prev => ({ ...prev, [inboxId]: true }));
    try {
      const res = await fetch(`/api/fetch-emails?id=${inboxId}`);
      const data = await res.json();
      if (!data.error) setEmails(prev => ({ ...prev, [inboxId]: data }));
    } catch (err) { console.error("Fetch error"); }
    setLoading(prev => ({ ...prev, [inboxId]: false }));
  };

  const refreshAllInboxes = () => {
    inboxes.forEach(box => loadRealEmails(box.id));
  };

  // --- حساب الإحصائيات للرسم البياني ---
  const calculateStats = () => {
    let inboxCount = 0;
    let spamCount = 0;
    Object.values(emails).forEach(emailList => {
      emailList.forEach(mail => {
        if (mail.folder === 'INBOX') inboxCount++;
        else if (mail.folder === 'SPAM') spamCount++;
      });
    });
    return [
      { name: 'Inbox', value: inboxCount, color: '#10b981' }, // أخضر
      { name: 'Spam', value: spamCount, color: '#ef4444' }   // أحمر
    ];
  };

  const statsData = calculateStats();
  const totalEmails = statsData[0].value + statsData[1].value;
  const inboxPercent = totalEmails > 0 ? Math.round((statsData[0].value / totalEmails) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#1a2c3d] text-white font-sans">
      {/* Header */}
      <header className="flex items-center justify-between bg-[#243b55] p-3 px-6 shadow-xl border-b border-gray-800 sticky top-0 z-50">
        <div className="flex items-center gap-2 text-2xl font-bold italic text-blue-400 min-w-max">
          <Mail size={22} fill="currentColor"/> Inboxious
        </div>

        <div className="flex-1 max-w-2xl mx-8 relative">
          <input 
            type="text" 
            placeholder="Search across all inboxes..." 
            className="w-full bg-[#1a2c3d] border border-gray-700 text-white py-2 px-10 rounded-md outline-none focus:border-blue-500 focus:bg-white focus:text-gray-900 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
        </div>

        <div className="flex items-center gap-3 min-w-max">
          <button onClick={refreshAllInboxes} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition shadow-lg">
            <RefreshCw size={14} className={Object.values(loading).some(v => v) ? "animate-spin" : ""} />
            REFRESH ALL
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-[#58a641] hover:bg-green-600 text-white px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2">
            <Plus size={16}/> ADD INBOX
          </button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        
        {/* --- SECTION CHARTS (الجديد) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#243b55] p-6 rounded-lg border border-gray-700 shadow-xl col-span-1 flex flex-col items-center">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Overall Delivery</h3>
            <div className="w-full h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statsData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{backgroundColor: '#1a2c3d', border: 'none', borderRadius: '8px', fontSize: '10px'}} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-green-500">{inboxPercent}%</span>
                <span className="text-[8px] text-gray-500 uppercase">Inbox Rate</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div className="bg-[#243b55] p-8 rounded-lg border border-gray-700 flex flex-col justify-center">
              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">Total Mails Fetched</span>
              <span className="text-5xl font-black text-blue-400">{totalEmails}</span>
            </div>
            <div className="bg-[#243b55] p-8 rounded-lg border border-gray-700 flex flex-col justify-center">
              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">Active Inboxes</span>
              <span className="text-5xl font-black text-green-500">{inboxes.length}</span>
            </div>
          </div>
        </div>

        {/* --- GRID INBOXES --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {inboxes.map((box) => {
            const allEmails = emails[box.id] || [];
            const filteredEmails = allEmails.filter(mail => 
              mail.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
              mail.from.toLowerCase().includes(searchTerm.toLowerCase())
            );

            return (
              <div key={box.id} className="bg-[#101e2b] rounded-md overflow-hidden border border-gray-800 shadow-2xl">
                <div className={`p-2.5 px-4 flex justify-between items-center ${box.provider === 'GMAIL' ? 'bg-[#58a641]' : 'bg-[#2b5797]'}`}>
                  <div className="flex items-center gap-2 text-sm font-bold tracking-tight"><Mail size={16}/> {box.provider}</div>
                  <div className="text-right text-[10px]">
                    <div className="font-bold uppercase tracking-wider">{box.user_name}</div>
                    <div className="opacity-80 font-mono">{box.email}</div>
                  </div>
                </div>

                <div className="p-3 space-y-1 bg-[#0d1621] h-[380px] overflow-y-auto">
                  <div className="flex gap-2 mb-3">
                    <button onClick={() => loadRealEmails(box.id)} className="flex-1 text-[10px] bg-blue-900/40 hover:bg-blue-800 text-blue-400 py-1.5 rounded font-bold border border-blue-700/50 transition tracking-widest uppercase">
                      {loading[box.id] ? "CONNECTING..." : "FETCH EMAILS"}
                    </button>
                    <button onClick={() => { supabase.from('inboxes').delete().eq('id', box.id).then(() => fetchInboxes()); }} className="bg-red-900/40 hover:bg-red-800 text-red-500 p-1.5 rounded border border-red-700/50 transition">
                      <Trash2 size={14}/>
                    </button>
                  </div>

                  {filteredEmails.map((mail, i) => (
                    <div key={i} className="p-3 border-b border-gray-800/50 bg-[#0f1a26]/30 mb-2 rounded-sm flex justify-between items-start">
                      <div className="flex flex-col truncate pr-2">
                         <span className="text-blue-400 font-bold text-[11px] truncate">{mail.from}</span>
                         <span className="text-gray-200 text-[10px] font-bold truncate uppercase">{mail.subject}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                         <span className="text-[8px] text-gray-600 font-mono">{new Date(mail.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                         <span className={`px-1.5 py-0.5 rounded-[2px] text-[8px] font-bold ${mail.folder === 'SPAM' ? 'bg-red-900/30 text-red-500 border border-red-800' : 'bg-green-900/30 text-green-500 border border-green-800'}`}>
                           {mail.folder}
                         </span>
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

import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Mail, User, Plus, X, Trash2, RefreshCw, Search, Inbox, AlertTriangle } from 'lucide-react';

function App() {
  const [inboxes, setInboxes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [emails, setEmails] = useState({});
  const [loading, setLoading] = useState({});
  const [searchTerm, setSearchTerm] = useState(""); // State ديال البحث
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
    } catch (err) { console.log("Fetch error"); }
    setLoading(prev => ({ ...prev, [inboxId]: false }));
  };

  const refreshAllInboxes = () => {
    inboxes.forEach(box => loadRealEmails(box.id));
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

  const deleteInbox = async (id) => {
    if (window.confirm("Delete this inbox?")) {
      await supabase.from('inboxes').delete().eq('id', id);
      fetchInboxes();
    }
  };

  return (
    <div className="min-h-screen bg-[#1a2c3d] text-white font-sans">
      {/* --- HEADER --- */}
      <header className="flex items-center justify-between bg-[#243b55] p-3 px-6 shadow-lg border-b border-gray-800 sticky top-0 z-40">
        <div className="flex items-center gap-2 text-2xl font-bold italic text-blue-400 min-w-max">
          <Mail size={22} fill="currentColor"/> Inboxious
        </div>

        {/* --- SEARCH BAR --- */}
        <div className="flex-1 max-w-2xl mx-8 relative">
          <input 
            type="text" 
            placeholder="Search by subject or sender across all inboxes..." 
            className="w-full bg-white text-gray-800 py-1.5 px-10 rounded-sm outline-none text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2 text-gray-400" size={18} />
          {searchTerm && (
            <X 
              className="absolute right-3 top-2 text-gray-400 cursor-pointer hover:text-gray-600" 
              size={18} 
              onClick={() => setSearchTerm("")}
            />
          )}
        </div>

        <div className="flex items-center gap-3 min-w-max">
          <button onClick={refreshAllInboxes} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-sm text-xs font-bold flex items-center gap-2 transition shadow-md">
            <RefreshCw size={14} className={Object.values(loading).some(v => v) ? "animate-spin" : ""} />
            REFRESH ALL
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-[#58a641] hover:bg-green-600 text-white px-4 py-1.5 rounded-sm text-xs font-bold flex items-center gap-2">
            <Plus size={16}/> ADD INBOX
          </button>
          <div className="bg-gray-600 p-2 rounded-full cursor-pointer"><User size={18} /></div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {inboxes.map((box) => {
            // فلترة الإيمايلات على حسب البحث
            const filteredEmails = (emails[box.id] || []).filter(mail => 
              mail.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
              mail.from.toLowerCase().includes(searchTerm.toLowerCase())
            );

            return (
              <div key={box.id} className="bg-[#101e2b] rounded-md overflow-hidden border border-gray-800 shadow-2xl transition-all duration-300">
                {/* Card Header */}
                <div className={`p-2 px-4 flex justify-between items-center ${box.provider === 'GMAIL' ? 'bg-[#58a641]' : 'bg-[#2b5797]'}`}>
                  <div className="flex items-center gap-2 text-sm font-bold"><Mail size={16}/> {box.provider}</div>
                  <div className="text-right text-[10px]">
                    <div className="font-bold uppercase tracking-wider">{box.user_name}</div>
                    <div className="opacity-80 font-mono">{box.email}</div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-3 space-y-1 bg-[#0d1621] h-72 overflow-y-auto">
                  <div className="flex gap-2 mb-3">
                    <button onClick={() => loadRealEmails(box.id)} className="flex-1 text-[10px] bg-blue-900/40 hover:bg-blue-800 py-1.5 rounded font-bold border border-blue-700/50 transition uppercase tracking-widest">
                      {loading[box.id] ? "LOADING..." : "REFRESH"}
                    </button>
                    <button onClick={() => deleteInbox(box.id)} className="bg-red-900/40 hover:bg-red-800 p-1.5 rounded border border-red-700/50 transition"><Trash2 size={14}/></button>
                  </div>

                  {filteredEmails.length > 0 ? filteredEmails.map((mail, i) => (
                    <div key={i} className="p-2 border-b border-gray-800 text-[10px] hover:bg-[#1b3147] transition flex justify-between items-start group">
                      <div className="flex flex-col truncate pr-2">
                         <span className="text-blue-400 font-bold truncate group-hover:text-blue-300">{mail.from}</span>
                         <span className="text-gray-200 truncate font-medium">{mail.subject}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                         <span className="text-[8px] text-gray-600 whitespace-nowrap">{new Date(mail.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                         {/* --- SPAM / INBOX BADGE --- */}
                         <span className="bg-green-900/30 text-green-500 border border-green-800 px-1.5 rounded-[2px] text-[8px] font-bold tracking-tighter">INBOX</span>
                      </div>
                    </div>
                  )) : (
                    <div className="text-gray-600 text-center py-16 text-[10px] italic font-light">
                      {searchTerm ? "No emails match your search" : "No emails loaded"}
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm text-sm">
          <div className="bg-[#243b55] w-full max-w-md p-6 rounded-md border border-gray-600 shadow-2xl">
            <h2 className="text-lg font-bold mb-6 uppercase tracking-widest text-center border-b border-gray-700 pb-4">Add New Inbox</h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold uppercase">
              <div>
                <label className="text-gray-400 mb-1 block tracking-widest">PROVIDER</label>
                <select className="w-full p-2.5 bg-[#1a2c3d] rounded border border-gray-700 outline-none focus:border-blue-500" value={formData.provider} onChange={(e) => setFormData({...formData, provider: e.target.value})}>
                  <option value="GMAIL">GMAIL</option>
                  <option value="OUTLOOK">OUTLOOK / HOTMAIL</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 mb-1 block tracking-widest">USER NAME</label>
                <input type="text" placeholder="e.g. David" className="w-full p-2.5 bg-[#1a2c3d] rounded border border-gray-700 outline-none focus:border-blue-500" value={formData.user_name} onChange={(e) => setFormData({...formData, user_name: e.target.value})} required />
              </div>
              <div>
                <label className="text-gray-400 mb-1 block tracking-widest">EMAIL ADDRESS</label>
                <input type="email" placeholder="example@gmail.com" className="w-full p-2.5 bg-[#1a2c3d] rounded border border-gray-700 outline-none focus:border-blue-500" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
              </div>
              <div>
                <label className="text-gray-400 mb-1 block tracking-widest">APP PASSWORD</label>
                <input type="password" placeholder="•••• •••• •••• ••••" className="w-full p-2.5 bg-[#1a2c3d] rounded border border-gray-700 outline-none focus:border-blue-500" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
              </div>
              <div className="flex gap-2 pt-6">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-700 py-3 rounded tracking-widest hover:bg-gray-600 transition">CANCEL</button>
                 <button type="submit" className="flex-1 bg-[#58a641] py-3 rounded tracking-widest hover:bg-green-600 transition shadow-lg">SAVE INBOX</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

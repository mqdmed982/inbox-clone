import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Mail, User, Plus, X, Trash2, RefreshCw, Search } from 'lucide-react';

function App() {
  const [inboxes, setInboxes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [emails, setEmails] = useState({});
  const [loading, setLoading] = useState({});
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
      else console.log(data.error);
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
      <header className="flex items-center justify-between bg-[#243b55] p-3 px-6 shadow-lg border-b border-gray-800">
        <div className="flex items-center gap-2 text-2xl font-bold italic text-blue-400">
          <Mail size={22} fill="currentColor"/> Inboxious
        </div>

        <div className="flex items-center gap-3">
          <button onClick={refreshAllInboxes} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-sm text-xs font-bold flex items-center gap-2 transition shadow-md">
            <RefreshCw size={14} className={Object.values(loading).some(v => v) ? "animate-spin" : ""} />
            REFRESH ALL
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-[#58a641] hover:bg-green-600 text-white px-4 py-1.5 rounded-sm text-xs font-bold flex items-center gap-2 transition shadow-md">
            <Plus size={16}/> ADD INBOX
          </button>
          <div className="bg-gray-600 p-2 rounded-full cursor-pointer"><User size={18} /></div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {inboxes.map((box) => (
            <div key={box.id} className="bg-[#101e2b] rounded-md overflow-hidden border border-gray-800 shadow-2xl">
              <div className={`p-2 px-4 flex justify-between items-center ${box.provider === 'GMAIL' ? 'bg-[#58a641]' : 'bg-[#2b5797]'}`}>
                <div className="flex items-center gap-2 text-sm font-bold"><Mail size={16}/> {box.provider}</div>
                <div className="text-right text-[10px]">
                  <div className="font-bold uppercase">{box.user_name}</div>
                  <div className="opacity-80 font-mono text-[9px]">{box.email}</div>
                </div>
              </div>

              <div className="p-3 space-y-1 bg-[#0d1621] h-64 overflow-y-auto">
                <div className="flex gap-2 mb-3">
                  <button onClick={() => loadRealEmails(box.id)} className="flex-1 text-[10px] bg-blue-900/40 hover:bg-blue-800 py-1.5 rounded font-bold border border-blue-700/50 transition">
                    {loading[box.id] ? "CONNECTING..." : "REFRESH"}
                  </button>
                  <button onClick={() => deleteInbox(box.id)} className="bg-red-900/40 hover:bg-red-800 p-1.5 rounded border border-red-700/50 transition"><Trash2 size={14}/></button>
                </div>

                {emails[box.id] ? emails[box.id].map((mail, i) => (
                  <div key={i} className="p-2 border-b border-gray-800 text-[10px] hover:bg-[#1b3147] transition flex justify-between items-center">
                    <div className="flex flex-col truncate pr-2">
                       <span className="text-blue-400 font-bold truncate">{mail.from}</span>
                       <span className="text-gray-200 truncate">{mail.subject}</span>
                    </div>
                    <span className="text-[8px] text-gray-600 whitespace-nowrap">{new Date(mail.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                )) : (
                  <div className="text-gray-600 text-center py-12 text-[10px] italic">No emails loaded</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#243b55] w-full max-w-md p-6 rounded-md border border-gray-600 shadow-2xl">
            <h2 className="text-xl font-bold mb-6 uppercase tracking-widest text-sm text-center">Add New Inbox</h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
              <div>
                <label className="text-gray-400 mb-1 block">PROVIDER</label>
                <select className="w-full p-2 bg-[#1a2c3d] rounded border border-gray-700 outline-none" value={formData.provider} onChange={(e) => setFormData({...formData, provider: e.target.value})}>
                  <option value="GMAIL">GMAIL</option>
                  <option value="OUTLOOK">OUTLOOK / HOTMAIL</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 mb-1 block">USER NAME</label>
                <input type="text" placeholder="e.g. David" className="w-full p-2 bg-[#1a2c3d] rounded border border-gray-700 outline-none" value={formData.user_name} onChange={(e) => setFormData({...formData, user_name: e.target.value})} required />
              </div>
              <div>
                <label className="text-gray-400 mb-1 block">EMAIL ADDRESS</label>
                <input type="email" placeholder="example@gmail.com" className="w-full p-2 bg-[#1a2c3d] rounded border border-gray-700 outline-none" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
              </div>
              <div>
                <label className="text-gray-400 mb-1 block">APP PASSWORD</label>
                <input type="password" placeholder="•••• •••• •••• ••••" className="w-full p-2 bg-[#1a2c3d] rounded border border-gray-700 outline-none" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
              </div>
              <div className="flex gap-2 pt-4">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-700 py-3 rounded uppercase hover:bg-gray-600 transition">Cancel</button>
                 <button type="submit" className="flex-1 bg-[#58a641] py-3 rounded uppercase hover:bg-green-600 transition">Save Inbox</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

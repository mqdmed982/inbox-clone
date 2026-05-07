import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Search, Copy, User, Mail, MoreHorizontal, Plus, X, Eye, EyeOff, Trash2 } from 'lucide-react';

function App() {
  const [inboxes, setInboxes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState({});
  const [emails, setEmails] = useState({});
  const [loading, setLoading] = useState({});

  const [formData, setFormData] = useState({
    provider: 'GMAIL',
    user_name: '',
    email: '',
    password: ''
  });

  const fetchInboxes = async () => {
    let { data, error } = await supabase
      .from('inboxes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.log("error", error);
    else setInboxes(data);
  };

  useEffect(() => {
    fetchInboxes();
  }, []);

  const loadRealEmails = async (inboxId) => {
    setLoading(prev => ({ ...prev, [inboxId]: true }));
    try {
      const res = await fetch(`/api/fetch-emails?id=${inboxId}`);
      const data = await res.json();
      if (data.error) {
        alert("Error: " + data.error);
      } else {
        setEmails(prev => ({ ...prev, [inboxId]: data }));
      }
    } catch (err) {
      alert("Connection failed");
    }
    setLoading(prev => ({ ...prev, [inboxId]: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('inboxes').insert([formData]);
    if (error) {
      alert("Error: " + error.message);
    } else {
      setIsModalOpen(false);
      setFormData({ provider: 'GMAIL', user_name: '', email: '', password: '' });
      fetchInboxes();
    }
  };

  const deleteInbox = async (id) => {
    if (window.confirm("Delete this inbox?")) {
      const { error } = await supabase.from('inboxes').delete().eq('id', id);
      if (error) alert(error.message);
      else fetchInboxes();
    }
  };

  return (
    <div className="min-h-screen bg-[#1a2c3d] text-white font-sans">
      <header className="flex items-center justify-between bg-[#243b55] p-3 px-6 shadow-lg">
        <div className="flex items-center gap-2 text-2xl font-bold italic">
          <div className="bg-blue-600 p-1 rounded-sm"><Mail size={22} fill="white"/></div>
          Inboxious
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsModalOpen(true)} className="bg-[#58a641] hover:bg-green-600 text-white px-4 py-1.5 rounded-sm text-xs font-bold flex items-center gap-2">
            <Plus size={16}/> ADD INBOX
          </button>
          <div className="bg-gray-600 p-2 rounded-full"><User size={18} /></div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 text-center uppercase text-[10px] font-bold text-gray-400">
          {['GMAIL', 'Outlook', 'Yahoo', 'Others'].map(label => (
            <div key={label} className="bg-[#243b55] p-6 rounded-md border border-gray-700">
              <div className="w-20 h-20 border-8 border-[#1a2c3d] rounded-full flex items-center justify-center mx-auto mb-2 text-white text-lg">0%</div>
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {inboxes.map((box) => (
            <div key={box.id} className="bg-[#101e2b] rounded-md overflow-hidden border border-gray-800 shadow-2xl">
              <div className={`p-2 px-4 flex justify-between items-center ${box.provider === 'GMAIL' ? 'bg-[#58a641]' : 'bg-[#2b5797]'}`}>
                <div className="flex items-center gap-2 text-sm font-bold capitalize"><Mail size={16}/> {box.provider}</div>
                <div className="text-right text-[10px]">
                  <div className="font-bold uppercase">{box.user_name}</div>
                  <div className="opacity-80">{box.email}</div>
                </div>
              </div>

              <div className="p-3 space-y-1 bg-[#0d1621] h-64 overflow-y-auto">
                <div className="flex gap-2 mb-3">
                  <button 
                    onClick={() => loadRealEmails(box.id)}
                    className="flex-1 text-[10px] bg-blue-600 hover:bg-blue-700 py-1.5 rounded font-bold transition"
                  >
                    {loading[box.id] ? "CONNECTING..." : "REFRESH EMAILS"}
                  </button>
                  <button onClick={() => deleteInbox(box.id)} className="bg-red-600 p-1.5 rounded hover:bg-red-700"><Trash2 size={14}/></button>
                </div>

                {emails[box.id] ? emails[box.id].map((mail, i) => (
                  <div key={i} className="p-2 border-b border-gray-800 text-[10px] hover:bg-[#1b3147]">
                    <div className="text-blue-400 font-bold truncate">{mail.from}</div>
                    <div className="text-gray-200 truncate">{mail.subject}</div>
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
          <div className="bg-[#243b55] w-full max-w-md p-6 rounded-md border border-gray-600">
            <div className="flex justify-between items-center mb-6 font-bold uppercase tracking-widest text-sm">
              <h2>Add New Inbox</h2>
              <button onClick={() => setIsModalOpen(false)}><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
              <select className="w-full p-2 bg-[#1a2c3d] rounded border border-gray-700" value={formData.provider} onChange={(e) => setFormData({...formData, provider: e.target.value})}>
                <option value="GMAIL">GMAIL</option>
                <option value="OUTLOOK">OUTLOOK</option>
              </select>
              <input type="text" placeholder="Name" className="w-full p-2 bg-[#1a2c3d] rounded border border-gray-700" value={formData.user_name} onChange={(e) => setFormData({...formData, user_name: e.target.value})} required />
              <input type="email" placeholder="Email" className="w-full p-2 bg-[#1a2c3d] rounded border border-gray-700" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
              <input type="password" placeholder="App Password" className="w-full p-2 bg-[#1a2c3d] rounded border border-gray-700" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
              <button type="submit" className="w-full bg-[#58a641] hover:bg-green-600 py-3 rounded font-bold uppercase">Save Inbox</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

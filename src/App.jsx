import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Search, Copy, User, Mail, MoreHorizontal, Plus, X } from 'lucide-react';

function App() {
  const [inboxes, setInboxes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State dial l-formulaire
  const [formData, setFormData] = useState({
    provider: 'Gmail',
    user_name: '',
    email: ''
    password: '' // Zid hada
  });

  // 1. Njib l-data men Supabase
  const fetchInboxes = async () => {
    let { data, error } = await supabase.from('inboxes').select('*').order('id', { ascending: false });
    if (error) console.log("error", error);
    else setInboxes(data);
  };

  useEffect(() => {
    fetchInboxes();
  }, []);

  // 2. Fonction bach n-siftou data l-Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('inboxes')
      .insert([formData]);

    if (error) {
      alert("Erreur: " + error.message);
    } else {
      setIsModalOpen(false); // Sedd l-modal
      setFormData({ provider: 'Gmail', user_name: '', email: '' }); // Khwi l-form
      fetchInboxes(); // Re-fresh l-list
    }
  };

  return (
    <div className="min-h-screen bg-[#1a2c3d] text-white p-4 font-sans relative">
      
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between mb-8 bg-[#243b55] p-4 rounded shadow-md gap-4">
        <div className="text-2xl font-bold flex items-center gap-2">
          <div className="bg-blue-500 p-1 rounded-sm"><Mail size={20}/></div> Inboxious
        </div>
        
        <div className="flex-1 max-w-xl relative">
          <input type="text" placeholder="Search..." className="w-full p-2 bg-white text-black rounded-sm outline-none" />
          <button className="absolute right-0 top-0 bg-green-600 h-full px-4 rounded-r-sm"><Search size={18}/></button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2"
          >
            <Plus size={16}/> Add Inbox
          </button>
          <div className="bg-gray-700 p-2 rounded-full cursor-pointer"><User size={20} /></div>
        </div>
      </header>

      {/* Grid dial l-boitat */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {inboxes.map((box) => (
          <div key={box.id} className="bg-[#101e2b] rounded-md overflow-hidden border border-gray-800 shadow-xl">
            <div className="bg-[#58a641] p-2 flex justify-between items-center px-4">
              <div className="flex items-center gap-2 font-bold uppercase text-sm"><Mail size={16}/> {box.provider}</div>
              <div className="text-right">
                <div className="text-xs font-bold">{box.user_name}</div>
                <div className="text-[10px] opacity-80">{box.email}</div>
              </div>
            </div>
            <div className="p-4 space-y-2">
               {[1, 2, 3, 4].map(i => <div key={i} className="h-5 bg-[#1b3147] rounded-sm opacity-40"></div>)}
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL (L-formulaire dial zyadat boita) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#243b55] w-full max-w-md p-6 rounded-lg shadow-2xl border border-gray-600">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Add New Inbox</h2>
              <button onClick={() => setIsModalOpen(false)}><X /></button>
            </div>
            
            <div>
  <label className="block text-xs font-bold mb-1 uppercase text-gray-400">App Password / Password</label>
  <input 
    type="password" required
    placeholder="••••••••"
    className="w-full p-2 bg-[#1a2c3d] rounded border border-gray-600 outline-none text-white focus:border-blue-500"
    value={formData.password}
    onChange={(e) => setFormData({...formData, password: e.target.value})}
  />
  <p className="text-[10px] text-gray-500 mt-1">* For Gmail, use an "App Password".</p>
</div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 uppercase">Provider</label>
                <select 
                  className="w-full p-2 bg-[#1a2c3d] rounded border border-gray-600 outline-none"
                  value={formData.provider}
                  onChange={(e) => setFormData({...formData, provider: e.target.value})}
                >
                  <option>Gmail</option>
                  <option>Outlook</option>
                  <option>Yahoo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 uppercase">User Name</label>
                <input 
                  type="text" required
                  className="w-full p-2 bg-[#1a2c3d] rounded border border-gray-600 outline-none"
                  value={formData.user_name}
                  onChange={(e) => setFormData({...formData, user_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 uppercase">Email Address</label>
                <input 
                  type="email" required
                  className="w-full p-2 bg-[#1a2c3d] rounded border border-gray-600 outline-none"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <button type="submit" className="w-full bg-green-600 hover:bg-green-700 py-3 rounded font-bold mt-4 transition-colors">
                Save Inbox
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Search, Copy, User, Mail, MoreHorizontal, Plus, X, Eye, EyeOff, Trash2 } from 'lucide-react';

function App() {
  const [inboxes, setInboxes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState({}); // Bach t-khbi/t-biyen password f l-card

  // State dial l-formulaire
  const [formData, setFormData] = useState({
    provider: 'GMAIL',
    user_name: '',
    email: '',
    password: ''
  });

  // 1. Njib l-data men Supabase
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

  // 2. Fonction bach n-siftou boita jdida
const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Sending to Supabase:", formData); // Bach n-choufou achnou siftna

    const { data, error } = await supabase
      .from('inboxes')
      .insert([formData]);

    if (error) {
      // Hna ghadi i-goul lik l-khata2 nichan (mital: Column not found)
      alert("SUPABASE ERROR: " + error.message);
      console.error("Full Error:", error);
    } else {
      alert("✅ Saved Successfully!"); // Bach n-t-akdou bli t-zadit
      setIsModalOpen(false);
      setFormData({ provider: 'GMAIL', user_name: '', email: '', password: '' });
      fetchInboxes();
    }
  };

  // 3. Fonction dial l-msh (Delete)
  const deleteInbox = async (id) => {
    if (window.confirm("Are you sure you want to delete this inbox?")) {
      const { error } = await supabase.from('inboxes').delete().eq('id', id);
      if (error) alert(error.message);
      else fetchInboxes();
    }
  };

  return (
    <div className="min-h-screen bg-[#1a2c3d] text-white font-sans">
      
      {/* --- HEADER --- */}
      <header className="flex items-center justify-between bg-[#243b55] p-3 px-6 shadow-lg border-b border-gray-800">
        <div className="flex items-center gap-2 text-2xl font-bold tracking-tighter italic">
          <div className="bg-blue-600 p-1 rounded-sm"><Mail size={22} fill="white"/></div>
          Inboxious
        </div>

        <div className="flex-1 max-w-2xl mx-8 relative hidden md:block">
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full bg-white text-gray-800 py-1.5 px-4 rounded-sm outline-none text-sm"
          />
          <button className="absolute right-0 top-0 bg-[#58a641] h-full px-4 rounded-r-sm hover:bg-green-600 transition">
            <Search size={18} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#58a641] hover:bg-green-600 text-white px-4 py-1.5 rounded-sm text-xs font-bold flex items-center gap-2 shadow-md transition"
          >
            <Plus size={16}/> ADD INBOX
          </button>
          <div className="bg-gray-600 p-2 rounded-full cursor-pointer hover:bg-gray-500 transition"><User size={18} /></div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        
        {/* --- STATS SECTION --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {['GMAIL', 'Outlook / Hotmail', 'At&t / Yahoo', 'Others'].map((label) => (
            <div key={label} className="bg-[#243b55] p-6 rounded-md flex flex-col items-center border border-gray-700 shadow-xl">
              <div className="w-24 h-24 border-[10px] border-[#1a2c3d] rounded-full flex items-center justify-center mb-3">
                <span className="text-xl font-bold">0%</span>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
            </div>
          ))}
        </div>

        {/* --- GRID DIAL L-BOITAT --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {inboxes.length > 0 ? inboxes.map((box) => (
            <div key={box.id} className="bg-[#101e2b] rounded-md overflow-hidden border border-gray-800 shadow-2xl group">
              
              {/* Card Header */}
              <div className={`p-2 px-4 flex justify-between items-center ${box.provider === 'GMAIL' ? 'bg-[#58a641]' : 'bg-[#2b5797]'}`}>
                <div className="flex items-center gap-2">
                  <div className="bg-white p-1 rounded-sm"><Mail className={box.provider === 'GMAIL' ? 'text-red-600' : 'text-blue-600'} size={16}/></div>
                  <span className="font-bold text-sm tracking-wide">{box.provider}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black uppercase leading-tight">{box.user_name}</div>
                  <div className="text-[10px] opacity-90">{box.email}</div>
                </div>
              </div>

              {/* Card Body (Simulated Emails) */}
              <div className="p-4 space-y-1 relative h-48 overflow-hidden">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex gap-2 items-center opacity-30">
                    <div className="w-4 h-4 bg-gray-700 rounded-sm"></div>
                    <div className="flex-1 h-3 bg-gray-700 rounded-full"></div>
                    <div className="w-8 h-2 bg-gray-800 rounded-full"></div>
                  </div>
                ))}
                
                {/* Information Overlay (Hover) */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                   <div className="text-xs font-mono bg-black/60 p-2 rounded border border-gray-700">
                      Password: {showPassword[box.id] ? box.password : '••••••••'}
                   </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => setShowPassword(prev => ({...prev, [box.id]: !prev[box.id]}))}
                        className="bg-blue-600 p-1.5 rounded text-xs px-3 flex items-center gap-1 font-bold"
                      >
                        {showPassword[box.id] ? <EyeOff size={14}/> : <Eye size={14}/>} {showPassword[box.id] ? 'Hide' : 'Show'}
                      </button>
                      <button 
                        onClick={() => deleteInbox(box.id)}
                        className="bg-red-600 p-1.5 rounded text-xs px-3 flex items-center gap-1 font-bold"
                      >
                        <Trash2 size={14}/> Delete
                      </button>
                   </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-800 rounded-xl text-gray-500 uppercase font-bold tracking-widest">
               No inboxes found. Add one to start testing.
            </div>
          )}
        </div>
      </main>

      {/* --- MODAL (ADD INBOX FORM) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#243b55] w-full max-w-md p-6 rounded-md shadow-2xl border border-gray-600">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><Plus size={20} className="text-green-500"/> Add New Inbox</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition"><X /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-[10px] font-bold mb-1 uppercase text-gray-400 tracking-wider">Provider</label>
                <select 
                  className="w-full p-2 bg-[#1a2c3d] rounded border border-gray-700 outline-none focus:border-green-500 transition"
                  value={formData.provider}
                  onChange={(e) => setFormData({...formData, provider: e.target.value})}
                >
                  <option value="GMAIL">GMAIL</option>
                  <option value="OUTLOOK">OUTLOOK / HOTMAIL</option>
                  <option value="YAHOO">YAHOO</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold mb-1 uppercase text-gray-400 tracking-wider">User Name</label>
                  <input 
                    type="text" required placeholder="e.g. David"
                    className="w-full p-2 bg-[#1a2c3d] rounded border border-gray-700 outline-none focus:border-green-500 transition"
                    value={formData.user_name}
                    onChange={(e) => setFormData({...formData, user_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1 uppercase text-gray-400 tracking-wider">Email</label>
                  <input 
                    type="email" required placeholder="example@gmail.com"
                    className="w-full p-2 bg-[#1a2c3d] rounded border border-gray-700 outline-none focus:border-green-500 transition"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold mb-1 uppercase text-gray-400 tracking-wider">Password / App Password</label>
                <input 
                  type="password" required placeholder="••••••••••••••••"
                  className="w-full p-2 bg-[#1a2c3d] rounded border border-gray-700 outline-none focus:border-green-500 transition"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <p className="text-[10px] text-gray-500 mt-1 italic">* Use Google "App Password" for Gmail accounts.</p>
              </div>

              <button type="submit" className="w-full bg-[#58a641] hover:bg-green-600 py-3 rounded font-bold mt-4 shadow-lg transition-all active:scale-95">
                SAVE INBOX
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

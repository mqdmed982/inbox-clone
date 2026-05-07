import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Search, Copy, User, Mail, MoreHorizontal } from 'lucide-react';

function App() {
  const [inboxes, setInboxes] = useState([]);

  useEffect(() => {
    const fetchInboxes = async () => {
      let { data, error } = await supabase.from('inboxes').select('*');
      if (error) console.log("error", error);
      else setInboxes(data);
    };
    fetchInboxes();
  }, []);

  return (
    <div className="min-h-screen bg-[#1a2c3d] text-white p-4 font-sans">
      <header className="flex flex-wrap items-center justify-between mb-8 bg-[#243b55] p-4 rounded shadow-md gap-4">
        <div className="text-2xl font-bold flex items-center gap-2 italic">
          <div className="bg-blue-500 p-1 rounded-sm"><Mail size={20}/></div> Inboxious
        </div>
        <div className="flex-1 max-w-xl relative">
          <input type="text" placeholder="Enter keyword to search your mails..." className="w-full p-2 bg-white text-black rounded-sm outline-none" />
          <button className="absolute right-0 top-0 bg-green-600 h-full px-4 rounded-r-sm"><Search size={18}/></button>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-gray-200 text-black px-3 py-1 rounded text-xs flex items-center gap-2 font-bold uppercase shadow-sm">
            <Copy size={14}/> Copy Recipients
          </button>
          <div className="bg-gray-700 p-2 rounded-full cursor-pointer"><User size={20} /></div>
          <MoreHorizontal className="cursor-pointer text-gray-400" />
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {['GMAIL', 'Outlook / Hotmail', 'At&t / Yahoo', 'Others'].map((item) => (
          <div key={item} className="bg-[#243b55] p-6 rounded-lg text-center border border-gray-600">
            <div className="w-20 h-20 border-8 border-gray-700 rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-xl">0%</div>
            <div className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">{item}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {inboxes.length > 0 ? inboxes.map((box) => (
          <div key={box.id} className="bg-[#101e2b] rounded-md overflow-hidden border border-gray-800 shadow-xl">
            <div className="bg-[#58a641] p-2 flex justify-between items-center px-4">
              <div className="flex items-center gap-2 font-bold uppercase text-sm"><Mail size={16}/> {box.provider}</div>
              <div className="text-right">
                <div className="text-xs font-bold">{box.user_name}</div>
                <div className="text-[10px] opacity-80">{box.email}</div>
              </div>
            </div>
            <div className="p-4 space-y-2">
               {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-5 bg-[#1b3147] rounded-sm opacity-40"></div>)}
            </div>
          </div>
        )) : (
          <div className="col-span-2 text-center text-gray-500 py-20 border-2 border-dashed border-gray-700 rounded-lg">
            No inboxes found in Supabase. Add some data to see them here.
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
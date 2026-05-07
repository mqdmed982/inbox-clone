// Zid hado f west App() function l-fouq:
const [emails, setEmails] = useState({});
const [loading, setLoading] = useState({});

const loadRealEmails = async (inboxId) => {
  setLoading(prev => ({...prev, [inboxId]: true}));
  try {
    const res = await fetch(`/api/fetch-emails?id=${inboxId}`);
    const data = await res.json();
    if (data.error) {
       alert("Error: " + data.error);
    } else {
       setEmails(prev => ({...prev, [inboxId]: data}));
    }
  } catch (err) {
    alert("Connection to backend failed");
  }
  setLoading(prev => ({...prev, [inboxId]: false}));
};

// West l-JSX (f blast fin k-i-banu les emails):
<div className="p-2 space-y-1 bg-[#0d1621] h-64 overflow-y-auto">
  <button 
    onClick={() => loadRealEmails(box.id)}
    className="w-full text-[10px] bg-blue-600 hover:bg-blue-700 py-1.5 rounded mb-2 font-bold tracking-widest transition"
  >
    {loading[box.id] ? "CONNECTING TO IMAP..." : "REFRESH EMAILS"}
  </button>

  {emails[box.id] ? emails[box.id].map((mail, i) => (
    <div key={i} className="p-2 border-b border-gray-800 text-[10px] hover:bg-[#1b3147] transition cursor-default">
      <div className="text-blue-400 font-bold truncate">{mail.from}</div>
      <div className="text-gray-200 truncate">{mail.subject}</div>
      <div className="text-[8px] text-gray-600">{new Date(mail.date).toLocaleTimeString()}</div>
    </div>
  )) : (
    <div className="text-gray-600 text-center py-12 text-[10px] italic">
      Click refresh to fetch real emails from {box.provider}
    </div>
  )}
</div>


<button 
  onClick={() => loadRealEmails(box.id)}
  className="w-full text-[10px] bg-blue-600 hover:bg-blue-700 py-1 rounded mb-2 font-bold"
>
  {loading[box.id] ? "Loading..." : "REFRESH EMAILS"}
</button>


  export default App;

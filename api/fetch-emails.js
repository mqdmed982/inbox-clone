import { ImapFlow } from 'imapflow';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "ID is required" });

  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { data: inbox } = await supabase.from('inboxes').select('*').eq('id', id).single();

  if (!inbox) return res.status(404).json({ error: "Inbox not found" });

  const client = new ImapFlow({
    host: inbox.provider.toUpperCase() === 'GMAIL' ? 'imap.gmail.com' : 'imap-mail.outlook.com',
    port: 993,
    secure: true,
    auth: { user: inbox.email, pass: inbox.password },
    logger: false
  });

  try {
    await client.connect();
    let allMessages = [];

    // --- 1. جلب الإيمايلات من الـ INBOX ---
    let inboxBox = await client.mailboxOpen('INBOX');
    if (inboxBox.exists > 0) {
      let lastIndex = inboxBox.exists;
      let firstIndex = Math.max(1, lastIndex - 9);
      for await (let msg of client.fetch(`${firstIndex}:${lastIndex}`, { envelope: true })) {
        allMessages.push({
          from: msg.envelope.from[0].name || msg.envelope.from[0].address,
          subject: msg.envelope.subject,
          date: msg.envelope.date,
          folder: 'INBOX' // وسم Inbox
        });
      }
    }

    // --- 2. جلب الإيمايلات من الـ SPAM ---
    // Gmail كيتسمى '[Gmail]/Spam'، Outlook كيتسمى 'Junk'
    const spamFolderName = inbox.provider.toUpperCase() === 'GMAIL' ? '[Gmail]/Spam' : 'Junk';
    
    try {
      let spamBox = await client.mailboxOpen(spamFolderName);
      if (spamBox.exists > 0) {
        let lastSpam = spamBox.exists;
        let firstSpam = Math.max(1, lastSpam - 9);
        for await (let msg of client.fetch(`${firstSpam}:${lastSpam}`, { envelope: true })) {
          allMessages.push({
            from: msg.envelope.from[0].name || msg.envelope.from[0].address,
            subject: msg.envelope.subject,
            date: msg.envelope.date,
            folder: 'SPAM' // وسم Spam
          });
        }
      }
    } catch (e) { console.log("No spam folder found or accessible"); }

    await client.logout();

    // ترتيب كلشي على حسب التاريخ (الأحدث هو الأول)
    allMessages.sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.status(200).json(allMessages.slice(0, 15)); // كيرجع أحسن 15 إيمايل مخلطين
    
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

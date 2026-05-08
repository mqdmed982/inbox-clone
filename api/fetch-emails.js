import { ImapFlow } from 'imapflow';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const { id } = req.query;
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

    // دالة لاستخراج الـ IP
    const extractIP = (headersRaw) => {
      const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
      const match = (headersRaw || "").match(ipRegex);
      return match ? match[0] : '0.0.0.0';
    };

    // 1. جلب من Inbox (فقط آخر 10)
    let boxInfo = await client.mailboxOpen('INBOX');
    if (boxInfo.exists > 0) {
      let range = `${Math.max(1, boxInfo.exists - 9)}:*`;
      for await (let msg of client.fetch(range, { envelope: true, headers: true })) {
        allMessages.push({
          from: msg.envelope.from[0].name || msg.envelope.from[0].address,
          subject: msg.envelope.subject || 'No Subject',
          date: msg.envelope.date,
          folder: 'INBOX',
          ip: extractIP(msg.headers.toString()),
          domain: msg.envelope.from[0].address.split('@')[1] || 'unknown'
        });
      }
    }

    // 2. محاولة جلب من Spam (اختياري باش ما يوقعش Timeout)
    try {
      let folders = await client.list();
      let spamFolder = folders.find(f => f.path.toLowerCase().includes('spam') || f.path.toLowerCase().includes('junk'));
      if (spamFolder) {
        await client.mailboxOpen(spamFolder.path);
        let status = await client.status(spamFolder.path, {messages: true});
        if (status.messages > 0) {
          let sRange = `${Math.max(1, status.messages - 4)}:*`; // جيب غير 5 من Spam باش يكون سريع
          for await (let msg of client.fetch(sRange, { envelope: true, headers: true })) {
            allMessages.push({
              from: msg.envelope.from[0].name || msg.envelope.from[0].address,
              subject: msg.envelope.subject || 'No Subject',
              date: msg.envelope.date,
              folder: 'SPAM',
              ip: extractIP(msg.headers.toString()),
              domain: msg.envelope.from[0].address.split('@')[1] || 'unknown'
            });
          }
        }
      }
    } catch (e) { console.log("Spam fetch skipped"); }

    await client.logout();
    allMessages.sort((a, b) => new Date(b.date) - new Date(a.date));
    return res.status(200).json(allMessages);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

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

    // دالة لاستخراج الـ IP
    const extractIP = (headers) => {
      const received = headers.get('received');
      if (!received) return '0.0.0.0';
      const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
      const match = received.match(ipRegex);
      return match ? match[0] : 'Hidden';
    };

    // جلب من الـ Inbox
    let inboxBox = await client.mailboxOpen('INBOX');
    if (inboxBox.exists > 0) {
      let lastIndex = inboxBox.exists;
      let firstIndex = Math.max(1, lastIndex - 9);
      for await (let msg of client.fetch(`${firstIndex}:${lastIndex}`, { envelope: true, headers: true })) {
        allMessages.push({
          from: msg.envelope.from[0].name || msg.envelope.from[0].address,
          subject: msg.envelope.subject || 'No Subject',
          date: msg.envelope.date,
          folder: 'INBOX',
          ip: extractIP(msg.headers),
          domain: msg.envelope.from[0].address.split('@')[1]
        });
      }
    }

    await client.logout();
    allMessages.sort((a, b) => new Date(b.date) - new Date(a.date));
    return res.status(200).json(allMessages);
    
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

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

    const extractIP = (headersRaw) => {
      const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
      const match = headersRaw.match(ipRegex);
      return match ? match[0] : '0.0.0.0';
    };

    // 1. جلب من Inbox
    await client.mailboxOpen('INBOX');
    let inboxStatus = await client.status('INBOX', {messages: true});
    if (inboxStatus.messages > 0) {
      let range = `${Math.max(1, inboxStatus.messages - 9)}:*`;
      for await (let msg of client.fetch(range, { envelope: true, headers: true })) {
        allMessages.push({
          from: msg.envelope.from[0].name || msg.envelope.from[0].address,
          subject: msg.envelope.subject,
          date: msg.envelope.date,
          folder: 'INBOX',
          ip: extractIP(msg.headers.toString()),
          domain: msg.envelope.from[0].address.split('@')[1]
        });
      }
    }

    // 2. جلب من Spam (كنقلبو على أي دوسي فيه كلمة Spam)
    let folders = await client.list();
    let spamFolder = folders.find(f => f.path.toLowerCase().includes('spam') || f.path.toLowerCase().includes('junk'));
    
    if (spamFolder) {
      await client.mailboxOpen(spamFolder.path);
      let spamStatus = await client.status(spamFolder.path, {messages: true});
      if (spamStatus.messages > 0) {
        let range = `${Math.max(1, spamStatus.messages - 9)}:*`;
        for await (let msg of client.fetch(range, { envelope: true, headers: true })) {
          allMessages.push({
            from: msg.envelope.from[0].name || msg.envelope.from[0].address,
            subject: msg.envelope.subject,
            date: msg.envelope.date,

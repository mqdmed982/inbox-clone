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
    let mailbox = await client.mailboxOpen('INBOX');
    let lastIndex = mailbox.exists;
    let firstIndex = Math.max(1, lastIndex - 9); 
    
    let messages = [];
    for await (let message of client.fetch(`${firstIndex}:${lastIndex}`, { envelope: true })) {
      messages.push({
        from: message.envelope.from[0].name || message.envelope.from[0].address,
        subject: message.envelope.subject,
        date: message.envelope.date
      });
    }
    await client.logout();
    return res.status(200).json(messages.reverse());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

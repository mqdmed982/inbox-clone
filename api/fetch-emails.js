import { ImapFlow } from 'imapflow';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const { id } = req.query;

  // 1. Connecti m3a Supabase bach njibu l-password dial l-boita
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  const { data: inbox, error: dbError } = await supabase
    .from('inboxes')
    .select('*')
    .eq('id', id)
    .single();

  if (dbError || !inbox) return res.status(404).json({ error: "Inbox not found" });

  // 2. Setup IMAP (Gmail / Outlook)
  const client = new ImapFlow({
    host: inbox.provider.toUpperCase() === 'GMAIL' ? 'imap.gmail.com' : 'imap-mail.outlook.com',
    port: 993,
    secure: true,
    auth: {
      user: inbox.email,
      pass: inbox.password // Hna khass koun dak l-16 haraf dial App Password
    },
    logger: false
  });

  try {
    await client.connect();
    let lock = await client.getMailboxLock('INBOX');
    
    let messages = [];
    // Njibu akher 10 dial les emails
    for await (let message of client.listMessages('INBOX', { recent: true }, { envelope: true })) {
      messages.push({
        from: message.envelope.from[0].name || message.envelope.from[0].address,
        subject: message.envelope.subject,
        date: message.envelope.date
      });
    }

    lock.release();
    await client.logout();
    return res.status(200).json(messages.reverse());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

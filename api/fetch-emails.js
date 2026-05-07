import { ImapFlow } from 'imapflow';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) return res.status(400).json({ error: "ID is required" });

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

  const client = new ImapFlow({
    host: inbox.provider.toUpperCase() === 'GMAIL' ? 'imap.gmail.com' : 'imap-mail.outlook.com',
    port: 993,
    secure: true,
    auth: {
      user: inbox.email,
      pass: inbox.password // خاصو يكون App Password
    },
    logger: false
  });

  try {
    await client.connect();
    // كنحلوا الـ INBOX
    let lock = await client.getMailboxLock('INBOX');
    
    let messages = [];
    
    // كنستعملو fetch عوض listMessages
    // '1:*' كتعني جيب كاع الإيمايلات، وغادي ناخدو غير الآخرين منهم
    for await (let message of client.fetch('1:*', { envelope: true })) {
      messages.push({
        from: message.envelope.from[0].name || message.envelope.from[0].address,
        subject: message.envelope.subject,
        date: message.envelope.date
      });
    }

    lock.release();
    await client.logout();

    // كنقلبو الترتيب باش يجي الجديد هو اللول وناخدو غير آخر 10
    return res.status(200).json(messages.reverse().slice(0, 10));
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "IMAP Error: " + err.message });
  }
}

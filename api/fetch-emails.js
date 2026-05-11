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

    // --- وظيفة ذكية لقراءة الـ Headers وتحليل SPF/DKIM/DMARC ---
    const parseHeaders = (headersRaw) => {
      const h = headersRaw.toLowerCase();
      // استخراج الـ IP
      const ipMatch = h.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
      
      const checkStatus = (key) => {
        // Regex كيقرا dmarc=fail أو dmarc: fail أو dmarc=pass
        const regex = new RegExp(`${key}[:=]\\s*(pass|fail|softfail|none|permerror)`, 'i');
        const match = h.match(regex);
        if (match) {
          const res = match[1].toLowerCase();
          if (res === 'pass') return 'PASS';
          if (res === 'fail' || res === 'softfail') return 'FAIL';
        }
        // محاولة ثانية بسيطة إيلا فشل الـ Regex
        if (h.includes(`${key}=pass`) || h.includes(`${key}:pass`)) return 'PASS';
        if (h.includes(`${key}=fail`) || h.includes(`${key}:fail`) || h.includes(`${key}=softfail`)) return 'FAIL';
        return 'NONE';
      };

      return {
        ip: ipMatch ? ipMatch[0] : '0.0.0.0',
        spf: checkStatus('spf'),
        dkim: checkStatus('dkim'),
        dmarc: checkStatus('dmarc')
      };
    };

    // جلب من Inbox
    let inboxBox = await client.mailboxOpen('INBOX');
    if (inboxBox.exists > 0) {
      let range = `${Math.max(1, inboxBox.exists - 9)}:*`;
      for await (let msg of client.fetch(range, { envelope: true, headers: true })) {
        const info = parseHeaders(msg.headers.toString());
        allMessages.push({
          from: msg.envelope.from[0].name || msg.envelope.from[0].address,
          subject: msg.envelope.subject || 'No Subject',
          date: msg.envelope.date,
          folder: 'INBOX',
          ...info,
          domain: msg.envelope.from[0].address.split('@')[1] || 'unknown'
        });
      }
    }

    // جلب من Spam
    try {
      let folders = await client.list();
      let spamFolder = folders.find(f => f.path.toLowerCase().includes('spam') || f.path.toLowerCase().includes('junk'));
      if (spamFolder) {
        await client.mailboxOpen(spamFolder.path);
        let status = await client.status(spamFolder.path, {messages: true});
        if (status.messages > 0) {
          let range = `${Math.max(1, status.messages - 4)}:*`;
          for await (let msg of client.fetch(range, { envelope: true, headers: true })) {
            const info = parseHeaders(msg.headers.toString());
            allMessages.push({
              from: msg.envelope.from[0].name || msg.envelope.from[0].address,
              subject: msg.envelope.subject || 'No Subject',
              date: msg.envelope.date,
              folder: 'SPAM',
              ...info,
              domain: msg.envelope.from[0].address.split('@')[1] || 'unknown'
            });
          }
        }
      }
    } catch (e) {}

    await client.logout();
    allMessages.sort((a, b) => new Date(b.date) - new Date(a.date));
    return res.status(200).json(allMessages);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

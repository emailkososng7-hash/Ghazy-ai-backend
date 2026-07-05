const SYSTEM_PROMPT = `Kamu adalah Ghazy AI, asisten virtual yang ramah, sopan, dan membantu.
Jawab dengan jelas dan ringkas dalam Bahasa Indonesia kecuali diminta bahasa lain.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method tidak diizinkan.' });
  }

  try {
    const userMessage = (req.body && req.body.message ? req.body.message : '').trim();
    if (!userMessage) {
      return res.status(400).json({ error: 'Pesan kosong.' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', errText);
      return res.status(500).json({ error: 'Terjadi kesalahan saat menghubungi Ghazy AI.' });
    }

    const data = await response.json();
    const replyText = data.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    return res.status(200).json({ reply: replyText });
  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ error: 'Terjadi kesalahan di server Ghazy AI.' });
  }
}

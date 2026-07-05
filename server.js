// ============================================================
// Ghazy AI - Backend
// Server kecil yang menyimpan API key dengan aman di sisi server,
// lalu meneruskan pesan dari frontend ke Anthropic API.
// ============================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('\n⚠️  ANTHROPIC_API_KEY belum diatur. Salin .env.example menjadi .env dan isi API key kamu.\n');
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.use(cors());
app.use(express.json());

// Kepribadian / instruksi dasar Ghazy AI. Ubah sesuka hati.
const SYSTEM_PROMPT = `Kamu adalah Ghazy AI, asisten virtual yang ramah, sopan, dan membantu.
Jawab dengan jelas dan ringkas dalam Bahasa Indonesia kecuali diminta bahasa lain.`;

// Menyimpan riwayat percakapan sementara di memori server (per proses).
// Untuk banyak pengguna sekaligus, sebaiknya simpan riwayat per sesi/user (mis. pakai session id).
let conversationHistory = [];

app.post('/api/chat', async (req, res) => {
  try {
    const userMessage = (req.body.message || '').trim();
    if (!userMessage) {
      return res.status(400).json({ error: 'Pesan kosong.' });
    }

    conversationHistory.push({ role: 'user', content: userMessage });

    // Batasi panjang riwayat supaya tidak terus membengkak
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: conversationHistory,
    });

    const replyText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    conversationHistory.push({ role: 'assistant', content: replyText });

    res.json({ reply: replyText });
  } catch (err) {
    console.error('Error saat memanggil Anthropic API:', err.message);
    res.status(500).json({ error: 'Terjadi kesalahan di server Ghazy AI.' });
  }
});

// Endpoint untuk mengosongkan riwayat percakapan (dipanggil saat tombol "Bersihkan" ditekan)
app.post('/api/clear', (req, res) => {
  conversationHistory = [];
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.send('Ghazy AI backend sedang berjalan. Gunakan endpoint POST /api/chat.');
});

app.listen(PORT, () => {
  console.log(`✅ Ghazy AI backend berjalan di http://localhost:${PORT}`);
});

import fs from 'fs';

// Read GEMINI_API_KEY from .env.local if not already in env
if (!process.env.GEMINI_API_KEY && fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf-8');
  const match = content.match(/GEMINI_API_KEY=(.+)/);
  if (match) process.env.GEMINI_API_KEY = match[1].trim();
}

const key = process.env.GEMINI_API_KEY;
console.log('Gemini API Key configured:', Boolean(key));

async function testGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    })
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

const poem = await testGemini('Hãy sáng tác một bài thơ lục bát 4 câu về làng gốm Bát Tràng và men lam truyền thống.');
console.log('\n--- KẾT QUẢ THỬ NGHIỆM TRÍ TUỆ AI GEMINI ---:\n', poem);


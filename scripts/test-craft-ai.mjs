import fs from 'fs';

// Read GEMINI_API_KEY from .env.local if not already in env
if (!process.env.GEMINI_API_KEY && fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf-8');
  const match = content.match(/GEMINI_API_KEY=(.+)/);
  if (match) process.env.GEMINI_API_KEY = match[1].trim();
}

console.log('Key loaded:', Boolean(process.env.GEMINI_API_KEY));

const { askEnhancedCraftAssistant } = await import('../lib/craftAiEngine.ts');

const queries = [
  'Hãy sáng tác một bài thơ tình lãng mạn gắn với làng gốm Bát Tràng?',
  'Tôi muốn dẫn bạn gái đi chơi cuối tuần, thích chỗ yên tĩnh ngắm hoàng hôn, gợi ý giúp tôi?'
];

for (const q of queries) {
  console.log('\n--- QUESTION:', q);
  const res = await askEnhancedCraftAssistant(q);
  console.log('SOURCE:', res.source, '| MODEL:', res.modelUsed);
  console.log('REPLY:\n', res.reply.slice(0, 350));
}

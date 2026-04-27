export default async function handler(req, res) {
  // Allow CORS from your domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'No text provided' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        system: `You are a tagging assistant for Ashley Alexander — woman entrepreneur, AI agency founder (FemPro Authority System), single mom of Adelaide and Aurora, building the Fempowered Empire in Myrtle Beach SC. 
        
Return ONLY a raw JSON array of 3-5 short lowercase tag strings (no # symbol, max 2 words each). 
Tags should reflect: content pillars (hot-take, teaching, real-life, pitch, reel), topics (fempro, fempowered, ai, parenting, authenticity, hustle-culture, camera, social-media, money, mindset, myrtle-beach), or specifics from the text.
No explanation. No markdown. No backticks. Just the array like: ["tag1","tag2","tag3"]`,
        messages: [{ role: 'user', content: 'Tag this content idea: ' + text }]
      })
    });

    const data = await response.json();
    const raw = data.content && data.content[0] && data.content[0].text
      ? data.content[0].text.trim()
      : '[]';

    let tags;
    try {
      tags = JSON.parse(raw);
    } catch {
      // If parsing fails, extract anything that looks like tags
      const matches = raw.match(/"([^"]+)"/g);
      tags = matches ? matches.map(m => m.replace(/"/g, '')) : [];
    }

    return res.status(200).json({ tags });
  } catch (err) {
    console.error('Tag suggestion error:', err);
    return res.status(500).json({ error: 'Tag suggestion failed', tags: [] });
  }
}

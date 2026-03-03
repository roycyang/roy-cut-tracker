import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a nutritionist AI. Given a meal description (text or photo), estimate its macros.

RULES:
- Be conservative — round calories UP, protein DOWN
- If unsure about portion size, assume a moderate/typical serving
- Return ONLY valid JSON, no markdown, no explanation
- The "name" should be a short, friendly meal name (3-6 words)
- The "ingredients" should list key ingredients with rough portions

Response format (JSON only):
{"name":"...","ingredients":"...","cal":0,"protein":0,"carbs":0,"fat":0}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, text, imageBase64, imageMimeType, plannedMeal } = req.body;

  if (!type || (type === 'text' && !text) || (type === 'image' && !imageBase64)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const userContent = [];

  if (type === 'image') {
    userContent.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: imageMimeType || 'image/jpeg',
        data: imageBase64,
      },
    });
    userContent.push({
      type: 'text',
      text: `Analyze this meal photo and estimate macros.${plannedMeal ? `\nPlanned meal for reference: ${plannedMeal}` : ''}`,
    });
  } else {
    userContent.push({
      type: 'text',
      text: `Estimate macros for this meal: "${text}"${plannedMeal ? `\nPlanned meal for reference: ${plannedMeal}` : ''}`,
    });
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    });

    const raw = message.content[0].text.trim();
    const result = JSON.parse(raw);

    return res.status(200).json(result);
  } catch (err) {
    console.error('Meal analysis error:', err);
    return res.status(500).json({ error: 'Failed to analyze meal' });
  }
}

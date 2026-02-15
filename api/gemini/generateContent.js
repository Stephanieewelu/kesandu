/**
 * Vercel Serverless Function: Gemini AI Content Generation
 * Endpoint: /api/gemini/generateContent
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get API key from environment variable
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      console.error('EXPO_PUBLIC_GEMINI_API_KEY is not configured');
      return res.status(500).json({
        error: 'Server configuration error: API key not configured'
      });
    }

    // Call Google Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error('Gemini API Error:', errorData);
      return res.status(geminiResponse.status).json({
        error: errorData
      });
    }

    const data = await geminiResponse.json();

    // Extract the generated text from Gemini's response
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return res.status(200).json({
      message: generatedText,
      data: data
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

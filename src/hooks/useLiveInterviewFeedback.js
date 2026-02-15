import { useState, useCallback, useRef, useEffect } from 'react';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

async function analyzeFeedback(transcript, question, expectedTopics) {
  if (!transcript || transcript.trim().length < 10) {
    return null; // Not enough text to analyze
  }

  try {
    const requestUrl = `${GEMINI_API_URL}/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const prompt = `
You are a real-time interview coach analyzing a candidate's live response.

QUESTION: ${question}
EXPECTED KEY TOPICS: ${expectedTopics.join(', ')}
CANDIDATE'S RESPONSE SO FAR: "${transcript}"

Provide brief, actionable real-time feedback as JSON:
{
  "isOnTrack": true|false,
  "coveragePercent": 0-100,
  "strengths": ["What they're doing well"],
  "gaps": ["What they're missing"],
  "tips": ["Quick tip to improve"],
  "suggestedAdditions": ["Mention...", "Consider..."],
  "clarity": 1-10,
  "depth": 1-10,
  "confidence": 1-10,
  "nextStep": "What to say next to strengthen the answer"
}

Be concise. This is real-time feedback, not a lecture.
    `.trim();

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (!response.ok) {
      throw new Error('Feedback API failed');
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    text = text.trim();
    if (text.startsWith('```json')) text = text.slice(7);
    else if (text.startsWith('```')) text = text.slice(3);
    if (text.endsWith('```')) text = text.slice(0, -3);

    return JSON.parse(text);
  } catch (err) {
    console.error('Feedback analysis error:', err);
    return null;
  }
}

export default function useLiveInterviewFeedback() {
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const feedbackTimeoutRef = useRef(null);

  const analyzeLiveTranscript = useCallback(
    (transcript, question, expectedTopics) => {
      // Debounce to avoid too many API calls
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }

      setLoading(true);

      feedbackTimeoutRef.current = setTimeout(async () => {
        const result = await analyzeFeedback(transcript, question, expectedTopics);
        if (result) {
          setFeedback(result);
        }
        setLoading(false);
      }, 2000); // Wait 2 seconds after user stops typing/speaking
    },
    []
  );

  const clearFeedback = useCallback(() => {
    setFeedback(null);
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
  }, []);

  return {
    feedback,
    loading,
    analyzeLiveTranscript,
    clearFeedback,
  };
}

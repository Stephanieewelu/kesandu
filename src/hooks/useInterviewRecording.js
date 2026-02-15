import { useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const INTERVIEW_RECORDINGS_KEY = '@kesandu_interview_recordings';
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

async function analyzeInterview(transcript, question) {
  try {
    const requestUrl = `${GEMINI_API_URL}/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `
Analyze this interview response and provide detailed feedback.

QUESTION: ${question}
RESPONSE: "${transcript}"

Provide JSON feedback:
{
  "scoreBreakdown": {
    "clarity": 1-10,
    "accuracy": 1-10,
    "completeness": 1-10,
    "confidence": 1-10,
    "pacing": 1-10
  },
  "overallScore": 1-100,
  "strengths": ["What they did well"],
  "weaknesses": ["Areas to improve"],
  "suggestions": ["Specific improvement suggestions"],
  "keyPoints": {
    "mentioned": ["Points they covered"],
    "missing": ["Important points they missed"]
  },
  "verdict": "Would hire / Strong / Good / Needs work",
  "nextSteps": ["What to practice next"]
}
    `.trim();

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (!response.ok) throw new Error('Analysis failed');

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No response');

    text = text.trim();
    if (text.startsWith('```json')) text = text.slice(7);
    else if (text.startsWith('```')) text = text.slice(3);
    if (text.endsWith('```')) text = text.slice(0, -3);

    return JSON.parse(text);
  } catch (err) {
    console.error('Analysis error:', err);
    return null;
  }
}

export default function useInterviewRecording() {
  const [recordings, setRecordings] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const recordingsRef = useRef([]);

  // Load recordings on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(INTERVIEW_RECORDINGS_KEY);
        if (stored) {
          recordingsRef.current = JSON.parse(stored);
          setRecordings(recordingsRef.current);
        }
      } catch (e) {
        console.warn('Failed to load recordings:', e);
      }
    })();
  }, []);

  // Start recording
  const startRecording = useCallback(async (question, metadata = {}) => {
    const recordingId = `rec_${Date.now()}`;
    const recording = {
      id: recordingId,
      question,
      transcript: '',
      startTime: new Date().toISOString(),
      duration: 0,
      audioUrl: null,
      metadata,
      analysis: null,
      rating: null,
      notes: '',
      compared: null, // Comparison with feedback
    };

    setIsRecording(true);
    setCurrentTranscript('');

    return recordingId;
  }, []);

  // Update transcript during recording
  const updateTranscript = useCallback((text) => {
    setCurrentTranscript(text);
  }, []);

  // Stop recording and save
  const stopRecording = useCallback(
    async (recordingId, finalTranscript, duration) => {
      try {
        setLoading(true);
        setIsRecording(false);

        const recording = {
          id: recordingId,
          transcript: finalTranscript,
          duration, // in seconds
          endTime: new Date().toISOString(),
          audioUrl: `recording_${recordingId}.m4a`, // Placeholder for actual audio file
          metadata: {},
          analysis: null,
          rating: null,
          notes: '',
          compared: null,
        };

        // Get the question from recordings
        const existingRecording = recordingsRef.current.find(r => r.id === recordingId);
        if (existingRecording) {
          recording.question = existingRecording.question;
        }

        recordingsRef.current.push(recording);
        setRecordings([...recordingsRef.current]);

        // Persist
        await AsyncStorage.setItem(
          INTERVIEW_RECORDINGS_KEY,
          JSON.stringify(recordingsRef.current)
        );

        setLoading(false);
        return recording;
      } catch (e) {
        setLoading(false);
        console.error('Stop recording error:', e);
        return null;
      }
    },
    []
  );

  // Analyze recording
  const analyzeRecording = useCallback(async (recordingId) => {
    try {
      setLoading(true);

      const recording = recordingsRef.current.find(r => r.id === recordingId);
      if (!recording) throw new Error('Recording not found');

      const analysis = await analyzeInterview(recording.transcript, recording.question);

      const index = recordingsRef.current.findIndex(r => r.id === recordingId);
      if (index >= 0) {
        recordingsRef.current[index].analysis = analysis;
        setRecordings([...recordingsRef.current]);

        await AsyncStorage.setItem(
          INTERVIEW_RECORDINGS_KEY,
          JSON.stringify(recordingsRef.current)
        );
      }

      setLoading(false);
      return analysis;
    } catch (e) {
      setLoading(false);
      console.error('Analysis error:', e);
      return null;
    }
  }, []);

  // Compare recording with feedback
  const compareWithFeedback = useCallback(async (recordingId, originalFeedback) => {
    try {
      const recording = recordingsRef.current.find(r => r.id === recordingId);
      if (!recording || !recording.analysis) return null;

      const requestUrl = `${GEMINI_API_URL}/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

      const prompt = `
Compare this practice interview response with the original AI feedback.

ORIGINAL AI FEEDBACK:
${JSON.stringify(originalFeedback, null, 2)}

RECORDING ANALYSIS:
${JSON.stringify(recording.analysis, null, 2)}

RECORDING TRANSCRIPT:
${recording.transcript}

Provide JSON comparison:
{
  "improvements": ["What got better since feedback"],
  "stillNeeding": ["What still needs work"],
  "progressScore": 0-100,
  "verdict": "Improved / Same / Regressed",
  "encouragement": "Motivational message",
  "nextSession": "What to focus on next"
}
      `.trim();

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      if (!response.ok) throw new Error('Comparison failed');

      const data = await response.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('No response');

      text = text.trim();
      if (text.startsWith('```json')) text = text.slice(7);
      else if (text.startsWith('```')) text = text.slice(3);
      if (text.endsWith('```')) text = text.slice(0, -3);

      const comparison = JSON.parse(text);

      // Save comparison
      const index = recordingsRef.current.findIndex(r => r.id === recordingId);
      if (index >= 0) {
        recordingsRef.current[index].compared = comparison;
        setRecordings([...recordingsRef.current]);

        await AsyncStorage.setItem(
          INTERVIEW_RECORDINGS_KEY,
          JSON.stringify(recordingsRef.current)
        );
      }

      return comparison;
    } catch (e) {
      console.error('Comparison error:', e);
      return null;
    }
  }, []);

  // Add notes to recording
  const addNotes = useCallback(async (recordingId, notes) => {
    try {
      const index = recordingsRef.current.findIndex(r => r.id === recordingId);
      if (index >= 0) {
        recordingsRef.current[index].notes = notes;
        setRecordings([...recordingsRef.current]);

        await AsyncStorage.setItem(
          INTERVIEW_RECORDINGS_KEY,
          JSON.stringify(recordingsRef.current)
        );
      }
    } catch (e) {
      console.error('Notes error:', e);
    }
  }, []);

  // Rate recording
  const rateRecording = useCallback(async (recordingId, rating) => {
    try {
      const index = recordingsRef.current.findIndex(r => r.id === recordingId);
      if (index >= 0) {
        recordingsRef.current[index].rating = rating;
        setRecordings([...recordingsRef.current]);

        await AsyncStorage.setItem(
          INTERVIEW_RECORDINGS_KEY,
          JSON.stringify(recordingsRef.current)
        );
      }
    } catch (e) {
      console.error('Rating error:', e);
    }
  }, []);

  // Get recording stats
  const getRecordingStats = useCallback(() => {
    if (recordingsRef.current.length === 0) {
      return {
        totalRecordings: 0,
        avgScore: 0,
        bestScore: 0,
        totalMinutes: 0,
        improvedCount: 0,
      };
    }

    const stats = {
      totalRecordings: recordingsRef.current.length,
      avgScore: 0,
      bestScore: 0,
      totalMinutes: 0,
      improvedCount: 0,
    };

    let totalScore = 0;
    let analyzed = 0;

    recordingsRef.current.forEach(recording => {
      stats.totalMinutes += Math.round(recording.duration / 60);

      if (recording.analysis) {
        totalScore += recording.analysis.overallScore || 0;
        analyzed += 1;
        stats.bestScore = Math.max(stats.bestScore, recording.analysis.overallScore || 0);
      }

      if (recording.compared && recording.compared.verdict === 'Improved') {
        stats.improvedCount += 1;
      }
    });

    if (analyzed > 0) {
      stats.avgScore = Math.round(totalScore / analyzed);
    }

    return stats;
  }, []);

  // Delete recording
  const deleteRecording = useCallback(async (recordingId) => {
    try {
      recordingsRef.current = recordingsRef.current.filter(r => r.id !== recordingId);
      setRecordings([...recordingsRef.current]);

      await AsyncStorage.setItem(
        INTERVIEW_RECORDINGS_KEY,
        JSON.stringify(recordingsRef.current)
      );
    } catch (e) {
      console.error('Delete error:', e);
    }
  }, []);

  // Export recording as transcript
  const exportAsTranscript = useCallback((recordingId) => {
    const recording = recordingsRef.current.find(r => r.id === recordingId);
    if (!recording) return null;

    const transcript = `
# Interview Recording - ${new Date(recording.endTime).toLocaleDateString()}

## Question
${recording.question}

## Your Response
${recording.transcript}

## Duration
${Math.round(recording.duration / 60)} minutes

## Analysis
${recording.analysis ? `
### Score: ${recording.analysis.overallScore}%
**Verdict:** ${recording.analysis.verdict}

### Score Breakdown
- Clarity: ${recording.analysis.scoreBreakdown.clarity}/10
- Accuracy: ${recording.analysis.scoreBreakdown.accuracy}/10
- Completeness: ${recording.analysis.scoreBreakdown.completeness}/10
- Confidence: ${recording.analysis.scoreBreakdown.confidence}/10
- Pacing: ${recording.analysis.scoreBreakdown.pacing}/10

### Strengths
${recording.analysis.strengths?.map(s => `- ${s}`).join('\n') || 'N/A'}

### Areas for Improvement
${recording.analysis.weaknesses?.map(w => `- ${w}`).join('\n') || 'N/A'}

### Suggestions
${recording.analysis.suggestions?.map(s => `- ${s}`).join('\n') || 'N/A'}
` : 'Not analyzed yet'}

${recording.notes ? `## Your Notes\n${recording.notes}` : ''}

---
*Generated by Kesandu*
`;

    return transcript;
  }, []);

  return {
    // State
    recordings,
    isRecording,
    currentTranscript,
    loading,

    // Methods
    startRecording,
    updateTranscript,
    stopRecording,
    analyzeRecording,
    compareWithFeedback,
    addNotes,
    rateRecording,
    getRecordingStats,
    deleteRecording,
    exportAsTranscript,
  };
}

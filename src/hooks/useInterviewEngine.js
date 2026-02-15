import { useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@kesandu_interviews';
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const INTERVIEWER_STYLES = {
  FRIENDLY_GOOGLER: {
    name: 'Friendly Googler 🟢',
    prompt: 'You are a friendly Google interviewer. Be encouraging but thorough. Ask follow-up questions naturally. Show genuine interest in the candidate\'s thinking.',
  },
  RIGOROUS_AMAZONIAN: {
    name: 'Rigorous Amazonian 🟡',
    prompt: 'You are a rigorous Amazon interviewer focused on leadership principles. Ask tough questions about trade-offs and decision-making. Probe deeply.',
  },
  TOUGH_META: {
    name: 'Tough Meta 🔴',
    prompt: 'You are a tough Meta interviewer. Challenge solutions immediately. Ask for optimization. Expect excellence. Be direct and technical.',
  },
  PALANTIR_FDE: {
    name: 'Palantir FDE 🟣',
    prompt: 'You are a Palantir Forward Deployed Engineer interviewer. Focus on real-world, ambiguous problems. Ask about client scenarios and messy data. Value pragmatism.',
  },
  STARTUP_CTO: {
    name: 'Startup CTO ⚪',
    prompt: 'You are a Startup CTO interviewer. Focus on speed, ownership, and building with constraints. Ask what they\'d build first with limited resources.',
  },
};

const ROLES = {
  DATA_ENGINEER: {
    name: 'Data Engineer 🔧',
    description: 'SQL, pipelines, architecture, distributed systems',
    topics: ['SQL Mastery', 'Pipeline Design', 'System Design', 'Data Modeling', 'Query Optimization'],
  },
  AI_ENGINEER: {
    name: 'AI Engineer 🤖',
    description: 'ML fundamentals, LLMs, MLOps, deployment',
    topics: ['ML Fundamentals', 'LLM & Generative AI', 'MLOps', 'Model Deployment', 'Coding'],
  },
  DATA_SCIENTIST: {
    name: 'Data Scientist 📊',
    description: 'Statistics, A/B testing, modeling, case studies',
    topics: ['Statistics & Probability', 'A/B Testing', 'ML Modeling', 'Case Studies', 'Communication'],
  },
  FDE: {
    name: 'Forward Deployed Engineer 🚀',
    description: 'Client scenarios, rapid prototyping, full-stack',
    topics: ['Client Scenarios', 'Rapid Prototyping', 'Full-Stack Data', 'Soft Skills'],
  },
  DATA_ANALYST: {
    name: 'Data Analyst 📈',
    description: 'SQL, analytics, metrics, visualization',
    topics: ['SQL Analytics', 'Business Cases', 'Visualization', 'Statistics'],
  },
};

const COMPANIES = {
  GOOGLE: { name: 'Google', style: 'FRIENDLY_GOOGLER' },
  AMAZON: { name: 'Amazon', style: 'RIGOROUS_AMAZONIAN' },
  META: { name: 'Meta', style: 'TOUGH_META' },
  PALANTIR: { name: 'Palantir', style: 'PALANTIR_FDE' },
  STARTUP: { name: 'Startup', style: 'STARTUP_CTO' },
};

async function callGemini(prompt) {
  try {
    const requestUrl = `${GEMINI_API_URL}/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API request failed');
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No response text received');

    text = text.trim();
    if (text.startsWith('```json')) text = text.slice(7);
    else if (text.startsWith('```')) text = text.slice(3);
    if (text.endsWith('```')) text = text.slice(0, -3);

    return JSON.parse(text);
  } catch (err) {
    console.error('Gemini API error:', err);
    throw err;
  }
}

export default function useInterviewEngine() {
  const [interviewState, setInterviewState] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [score, setScore] = useState(null);
  const interviewHistoryRef = useRef([]);

  // Load interview history
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          interviewHistoryRef.current = JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Failed to load interview history:', e);
      }
    })();
  }, []);

  const startInterview = useCallback(async (role, company, roundType = 'Technical Deep Dive') => {
    setLoading(true);
    setError(null);
    setConversation([]);
    setScore(null);

    try {
      const roleConfig = ROLES[role] || ROLES.DATA_ENGINEER;
      const companyConfig = COMPANIES[company] || COMPANIES.GOOGLE;
      const styleConfig = INTERVIEWER_STYLES[companyConfig.style];

      setInterviewState({
        role,
        company,
        roundType,
        roleConfig,
        companyConfig,
        styleConfig,
        startTime: Date.now(),
      });

      const initialPrompt = `
You are conducting a ${roundType} interview for a ${roleConfig.name} position at ${companyConfig.name}.

${styleConfig.prompt}

IMPORTANT: You must respond ONLY with valid JSON in this exact format:
{
  "question": "Your interview question here",
  "context": "Brief context about why you're asking this",
  "difficulty": "easy|medium|hard",
  "expectedTopics": ["topic1", "topic2"]
}

Start with an engaging opening question that assesses the candidate's ${roleConfig.name} skills. Focus on one of these topics: ${roleConfig.topics.slice(0, 2).join(', ')}.
      `.trim();

      const initialResponse = await callGemini(initialPrompt);
      setCurrentQuestion(initialResponse);
      setConversation([{ role: 'interviewer', content: initialResponse.question }]);
    } catch (err) {
      setError(err.message);
      console.error('Failed to start interview:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const answerQuestion = useCallback(async (answer) => {
    if (!interviewState || !currentQuestion) {
      setError('No active interview');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedConversation = [
        ...conversation,
        { role: 'candidate', content: answer },
      ];
      setConversation(updatedConversation);

      const conversationText = updatedConversation
        .map(m => `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
        .join('\n\n');

      const followUpPrompt = `
You are continuing a ${interviewState.roundType} interview for a ${interviewState.roleConfig.name} position at ${interviewState.companyConfig.name}.

${interviewState.styleConfig.prompt}

Here is the conversation so far:
${conversationText}

Based on the candidate's answer, provide:
1. A follow-up question or probe deeper into their response
2. Assess their technical depth and communication

Respond ONLY with valid JSON in this exact format:
{
  "question": "Your follow-up question",
  "feedback": "Brief assessment of their answer",
  "depth": 1-10,
  "communication": 1-10,
  "context": "Why you're asking this follow-up"
}

Focus on assessing: technical depth, system thinking, trade-offs, and communication.
      `.trim();

      const followUpResponse = await callGemini(followUpPrompt);

      setCurrentQuestion(followUpResponse);
      updatedConversation.push({ role: 'interviewer', content: followUpResponse.question });
      setConversation(updatedConversation);

      // Update running score
      const avgDepth = (followUpResponse.depth || 5) / 10;
      const avgComm = (followUpResponse.communication || 5) / 10;
      const currentScore = Math.round((avgDepth + avgComm) * 50);
      setScore(currentScore);
    } catch (err) {
      setError(err.message);
      console.error('Failed to get follow-up:', err);
    } finally {
      setLoading(false);
    }
  }, [interviewState, currentQuestion, conversation]);

  const endInterview = useCallback(async () => {
    if (!interviewState || conversation.length === 0) {
      setError('No interview to end');
      return;
    }

    setLoading(true);

    try {
      const conversationText = conversation
        .map(m => `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
        .join('\n\n');

      const reportPrompt = `
You conducted a ${interviewState.roundType} interview for a ${interviewState.roleConfig.name} position at ${interviewState.companyConfig.name}.

Here is the full conversation:
${conversationText}

Provide a detailed interview report. Respond ONLY with valid JSON:
{
  "overallScore": 0-100,
  "recommendation": "Strong Hire|Hire|Maybe|No Hire",
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["area1", "area2", "area3"],
  "technicalDepth": 0-100,
  "communication": 0-100,
  "problemSolving": 0-100,
  "nextSteps": ["recommended topic", "practice area"]
}
      `.trim();

      const report = await callGemini(reportPrompt);

      const interview = {
        id: Date.now().toString(),
        role: interviewState.role,
        company: interviewState.company,
        roundType: interviewState.roundType,
        timestamp: new Date().toISOString(),
        duration: Math.floor((Date.now() - interviewState.startTime) / 1000),
        conversationLength: conversation.length,
        report,
      };

      // Save to history
      interviewHistoryRef.current.push(interview);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(interviewHistoryRef.current));

      setScore(report.overallScore);
      setInterviewState(null);
      setCurrentQuestion(null);

      return interview;
    } catch (err) {
      setError(err.message);
      console.error('Failed to end interview:', err);
    } finally {
      setLoading(false);
    }
  }, [interviewState, conversation]);

  return {
    // State
    interviewState,
    currentQuestion,
    conversation,
    loading,
    error,
    score,

    // Methods
    startInterview,
    answerQuestion,
    endInterview,

    // Configs
    ROLES,
    COMPANIES,
    INTERVIEWER_STYLES,

    // History
    history: interviewHistoryRef.current,
  };
}

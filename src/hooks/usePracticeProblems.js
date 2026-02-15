import { useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@kesandu_practice_problems';
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const PROBLEM_TYPES = {
  CODING: { name: 'Coding', emoji: '💻', description: 'Write and optimize code' },
  SYSTEM_DESIGN: { name: 'System Design', emoji: '🏗️', description: 'Design large-scale systems' },
  SQL: { name: 'SQL Query', emoji: '🗄️', description: 'Write complex SQL queries' },
  CASE_STUDY: { name: 'Case Study', emoji: '📊', description: 'Analyze business problems' },
  DEBUGGING: { name: 'Debugging', emoji: '🐛', description: 'Find and fix bugs' },
  ARCHITECTURE: { name: 'Architecture', emoji: '🧱', description: 'Design data architectures' },
};

const DIFFICULTY_LEVELS = {
  EASY: { name: 'Easy', value: 1, color: '#22C55E' },
  MEDIUM: { name: 'Medium', value: 2, color: '#F59E0B' },
  HARD: { name: 'Hard', value: 3, color: '#EF4444' },
};

async function generateProblem(role, problemType, difficulty = DIFFICULTY_LEVELS.MEDIUM) {
  try {
    const requestUrl = `${GEMINI_API_URL}/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `
Generate a ${difficulty.name.toLowerCase()} ${problemType} practice problem for a ${role} interview.

Return ONLY valid JSON:
{
  "title": "Descriptive problem title",
  "description": "Complete problem description with context",
  "problemType": "${problemType}",
  "difficulty": "${difficulty.name}",
  "role": "${role}",
  "keyTopics": ["topic1", "topic2", "topic3"],
  "timeLimit": 20,
  "hints": [
    "First hint if stuck",
    "Second hint if still stuck",
    "Final hint"
  ],
  "evaluation": {
    "criteria": ["criterion1", "criterion2", "criterion3"],
    "idealApproach": "How an expert would approach this",
    "commonMistakes": ["mistake1", "mistake2"],
    "advancedOptimizations": ["optimization1", "optimization2"]
  },
  "resources": ["resource link 1", "resource link 2"]
}

Make the problem realistic and interview-ready.
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
      throw new Error('Generation failed');
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No response');

    text = text.trim();
    if (text.startsWith('```json')) text = text.slice(7);
    else if (text.startsWith('```')) text = text.slice(3);
    if (text.endsWith('```')) text = text.slice(0, -3);

    const problem = JSON.parse(text);
    problem.id = Date.now().toString();
    problem.createdAt = new Date().toISOString();

    return problem;
  } catch (err) {
    console.error('Problem generation error:', err);
    throw err;
  }
}

async function evaluateSolution(problem, solution) {
  try {
    const requestUrl = `${GEMINI_API_URL}/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `
Evaluate this ${problem.problemType} solution for a ${problem.role} interview problem.

PROBLEM:
${problem.description}

CANDIDATE'S SOLUTION:
${solution}

Evaluation criteria:
${problem.evaluation.criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Return ONLY valid JSON:
{
  "score": 0-100,
  "level": "Poor|Below Average|Average|Good|Excellent",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "improvements": ["improvement1", "improvement2"],
  "complexity": "What's the time/space complexity?",
  "feedback": "Overall assessment and recommendations"
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

    if (!response.ok) {
      throw new Error('Evaluation failed');
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No evaluation');

    text = text.trim();
    if (text.startsWith('```json')) text = text.slice(7);
    else if (text.startsWith('```')) text = text.slice(3);
    if (text.endsWith('```')) text = text.slice(0, -3);

    return JSON.parse(text);
  } catch (err) {
    console.error('Evaluation error:', err);
    throw err;
  }
}

export default function usePracticeProblems() {
  const [currentProblem, setCurrentProblem] = useState(null);
  const [problemHistory, setProblemHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const problemHistoryRef = useRef([]);

  // Load history on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          problemHistoryRef.current = JSON.parse(stored);
          setProblemHistory(problemHistoryRef.current);
        }
      } catch (e) {
        console.warn('Failed to load problem history:', e);
      }
    })();
  }, []);

  const generateNewProblem = useCallback(async (role, problemType, difficulty = DIFFICULTY_LEVELS.MEDIUM) => {
    setLoading(true);
    setError(null);
    setEvaluation(null);

    try {
      const problem = await generateProblem(role, problemType, difficulty);
      setCurrentProblem(problem);
      return problem;
    } catch (err) {
      setError(err.message);
      console.error('Failed to generate problem:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitSolution = useCallback(async (solution) => {
    if (!currentProblem) {
      setError('No current problem');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await evaluateSolution(currentProblem, solution);
      setEvaluation(result);

      // Save to history
      const attemptRecord = {
        id: currentProblem.id,
        problemId: currentProblem.id,
        problem: currentProblem,
        solution,
        evaluation: result,
        timestamp: new Date().toISOString(),
      };

      problemHistoryRef.current.push(attemptRecord);
      setProblemHistory(problemHistoryRef.current);

      // Persist
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(problemHistoryRef.current)
      );

      return result;
    } catch (err) {
      setError(err.message);
      console.error('Failed to evaluate solution:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentProblem]);

  const getStats = useCallback(() => {
    if (problemHistoryRef.current.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        problemsSolved: 0,
        byDifficulty: {},
        byType: {},
      };
    }

    const stats = {
      totalAttempts: problemHistoryRef.current.length,
      averageScore: 0,
      problemsSolved: 0,
      byDifficulty: {},
      byType: {},
    };

    let totalScore = 0;
    problemHistoryRef.current.forEach(attempt => {
      totalScore += attempt.evaluation.score || 0;

      if (attempt.evaluation.score >= 70) {
        stats.problemsSolved += 1;
      }

      // By difficulty
      const diff = attempt.problem.difficulty;
      stats.byDifficulty[diff] = (stats.byDifficulty[diff] || 0) + 1;

      // By type
      const type = attempt.problem.problemType;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    });

    stats.averageScore = Math.round(totalScore / problemHistoryRef.current.length);

    return stats;
  }, []);

  const getRecommendedNext = useCallback(() => {
    if (problemHistoryRef.current.length === 0) {
      return { type: 'SQL', difficulty: DIFFICULTY_LEVELS.EASY };
    }

    const recentAttempts = problemHistoryRef.current.slice(-5);
    const avgScore = recentAttempts.reduce((sum, a) => sum + (a.evaluation.score || 0), 0) / recentAttempts.length;

    let nextDifficulty = DIFFICULTY_LEVELS.MEDIUM;
    if (avgScore >= 80) {
      nextDifficulty = DIFFICULTY_LEVELS.HARD;
    } else if (avgScore < 50) {
      nextDifficulty = DIFFICULTY_LEVELS.EASY;
    }

    const problemTypes = Object.keys(PROBLEM_TYPES);
    const attemptedTypes = new Set(recentAttempts.map(a => a.problem.problemType));

    // Find least practiced type
    let nextType = problemTypes[0];
    let minAttempts = Infinity;
    problemTypes.forEach(type => {
      const count = problemHistoryRef.current.filter(a => a.problem.problemType === type).length;
      if (count < minAttempts) {
        minAttempts = count;
        nextType = type;
      }
    });

    return { type: nextType, difficulty: nextDifficulty };
  }, []);

  return {
    // State
    currentProblem,
    loading,
    error,
    evaluation,
    history: problemHistory,

    // Methods
    generateNewProblem,
    submitSolution,
    getStats,
    getRecommendedNext,

    // Constants
    PROBLEM_TYPES,
    DIFFICULTY_LEVELS,
  };
}

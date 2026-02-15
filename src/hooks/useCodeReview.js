import { useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CODE_REVIEWS_KEY = '@kesandu_code_reviews';
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

async function reviewCode(code, language, context = '', role = 'Data Engineer') {
  try {
    const requestUrl = `${GEMINI_API_URL}/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `
You are an expert code reviewer for a ${role}. Review this ${language} code and provide detailed feedback.

CONTEXT: ${context || 'No context provided'}

CODE:
\`\`\`${language}
${code}
\`\`\`

Provide JSON review:
{
  "overallScore": 0-100,
  "quality": 1-10,
  "readability": 1-10,
  "efficiency": 1-10,
  "correctness": 1-10,
  "maintainability": 1-10,
  "summary": "One-line summary of the code",
  "strengths": [
    { "point": "What's good", "category": "quality|readability|efficiency|correctness|maintainability" }
  ],
  "issues": [
    { "severity": "critical|high|medium|low", "issue": "The problem", "line": "Code snippet", "fix": "How to fix it" }
  ],
  "optimizations": [
    { "type": "performance|clarity|maintainability", "suggestion": "What to improve", "example": "Code example of improvement", "expectedBenefit": "Why this helps" }
  ],
  "bestPractices": ["Practice 1", "Practice 2", "Practice 3"],
  "complexity": {
    "timeComplexity": "O(n) or description",
    "spaceComplexity": "O(1) or description",
    "explanation": "Why this complexity?"
  },
  "verdict": "Excellent|Good|Fair|Needs Work",
  "nextSteps": ["Action 1", "Action 2", "Action 3"],
  "learning": "A learning point for improvement"
}

Be thorough, educational, and encouraging!
    `.trim();

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (!response.ok) throw new Error('Review failed');

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No response');

    text = text.trim();
    if (text.startsWith('```json')) text = text.slice(7);
    else if (text.startsWith('```')) text = text.slice(3);
    if (text.endsWith('```')) text = text.slice(0, -3);

    return JSON.parse(text);
  } catch (err) {
    console.error('Code review error:', err);
    throw err;
  }
}

async function suggestOptimization(code, language, focusArea = 'performance') {
  try {
    const requestUrl = `${GEMINI_API_URL}/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `
You are an expert code optimizer. Focus on ${focusArea} optimization.

CODE:
\`\`\`${language}
${code}
\`\`\`

Provide JSON optimization suggestions:
{
  "focusArea": "${focusArea}",
  "currentApproach": "How the code currently works",
  "improvements": [
    {
      "title": "Optimization title",
      "description": "What and why",
      "optimizedCode": "Better code example",
      "benefit": "Why this is better",
      "tradeoff": "Any tradeoff if exists"
    }
  ],
  "estimatedImprovement": "X% faster / X% less memory / etc",
  "difficulty": "easy|medium|hard",
  "recommended": true|false
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

    if (!response.ok) throw new Error('Optimization suggestion failed');

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No response');

    text = text.trim();
    if (text.startsWith('```json')) text = text.slice(7);
    else if (text.startsWith('```')) text = text.slice(3);
    if (text.endsWith('```')) text = text.slice(0, -3);

    return JSON.parse(text);
  } catch (err) {
    console.error('Optimization suggestion error:', err);
    throw err;
  }
}

export default function useCodeReview() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentReview, setCurrentReview] = useState(null);
  const reviewsRef = useRef([]);

  // Load reviews on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(CODE_REVIEWS_KEY);
        if (stored) {
          reviewsRef.current = JSON.parse(stored);
          setReviews(reviewsRef.current);
        }
      } catch (e) {
        console.warn('Failed to load code reviews:', e);
      }
    })();
  }, []);

  // Submit code for review
  const submitForReview = useCallback(async (code, language, context = '', role = 'Data Engineer') => {
    try {
      setLoading(true);

      const review = await reviewCode(code, language, context, role);

      const codeReview = {
        id: `review_${Date.now()}`,
        code,
        language,
        context,
        role,
        review,
        submittedAt: new Date().toISOString(),
        rating: null,
        notes: '',
        optimizations: null,
      };

      reviewsRef.current.push(codeReview);
      setReviews([...reviewsRef.current]);
      setCurrentReview(codeReview);

      // Persist
      await AsyncStorage.setItem(CODE_REVIEWS_KEY, JSON.stringify(reviewsRef.current));

      setLoading(false);
      return codeReview;
    } catch (e) {
      setLoading(false);
      console.error('Submit for review error:', e);
      throw e;
    }
  }, []);

  // Get optimization suggestions
  const getOptimizations = useCallback(async (reviewId, focusArea = 'performance') => {
    try {
      setLoading(true);

      const codeReview = reviewsRef.current.find(r => r.id === reviewId);
      if (!codeReview) throw new Error('Review not found');

      const optimizations = await suggestOptimization(
        codeReview.code,
        codeReview.language,
        focusArea
      );

      // Save optimizations
      const index = reviewsRef.current.findIndex(r => r.id === reviewId);
      if (index >= 0) {
        reviewsRef.current[index].optimizations = optimizations;
        setReviews([...reviewsRef.current]);

        await AsyncStorage.setItem(CODE_REVIEWS_KEY, JSON.stringify(reviewsRef.current));
      }

      setLoading(false);
      return optimizations;
    } catch (e) {
      setLoading(false);
      console.error('Get optimizations error:', e);
      throw e;
    }
  }, []);

  // Add notes to review
  const addNotes = useCallback(async (reviewId, notes) => {
    try {
      const index = reviewsRef.current.findIndex(r => r.id === reviewId);
      if (index >= 0) {
        reviewsRef.current[index].notes = notes;
        setReviews([...reviewsRef.current]);

        await AsyncStorage.setItem(CODE_REVIEWS_KEY, JSON.stringify(reviewsRef.current));
      }
    } catch (e) {
      console.error('Add notes error:', e);
    }
  }, []);

  // Rate review
  const rateReview = useCallback(async (reviewId, rating) => {
    try {
      const index = reviewsRef.current.findIndex(r => r.id === reviewId);
      if (index >= 0) {
        reviewsRef.current[index].rating = rating;
        setReviews([...reviewsRef.current]);

        await AsyncStorage.setItem(CODE_REVIEWS_KEY, JSON.stringify(reviewsRef.current));
      }
    } catch (e) {
      console.error('Rate review error:', e);
    }
  }, []);

  // Get code review stats
  const getReviewStats = useCallback(() => {
    if (reviewsRef.current.length === 0) {
      return {
        totalReviews: 0,
        avgScore: 0,
        bestScore: 0,
        byLanguage: {},
        byVerdict: {},
      };
    }

    const stats = {
      totalReviews: reviewsRef.current.length,
      avgScore: 0,
      bestScore: 0,
      byLanguage: {},
      byVerdict: {},
    };

    let totalScore = 0;

    reviewsRef.current.forEach(codeReview => {
      const score = codeReview.review.overallScore || 0;
      totalScore += score;
      stats.bestScore = Math.max(stats.bestScore, score);

      // By language
      const lang = codeReview.language;
      stats.byLanguage[lang] = (stats.byLanguage[lang] || 0) + 1;

      // By verdict
      const verdict = codeReview.review.verdict;
      stats.byVerdict[verdict] = (stats.byVerdict[verdict] || 0) + 1;
    });

    stats.avgScore = Math.round(totalScore / reviewsRef.current.length);

    return stats;
  }, []);

  // Get improvement areas
  const getImprovementAreas = useCallback(() => {
    const areas = {
      quality: { total: 0, avg: 0 },
      readability: { total: 0, avg: 0 },
      efficiency: { total: 0, avg: 0 },
      correctness: { total: 0, avg: 0 },
      maintainability: { total: 0, avg: 0 },
    };

    reviewsRef.current.forEach(codeReview => {
      const review = codeReview.review;
      areas.quality.total += review.quality || 0;
      areas.readability.total += review.readability || 0;
      areas.efficiency.total += review.efficiency || 0;
      areas.correctness.total += review.correctness || 0;
      areas.maintainability.total += review.maintainability || 0;
    });

    const count = reviewsRef.current.length || 1;
    Object.keys(areas).forEach(key => {
      areas[key].avg = Math.round(areas[key].total / count);
    });

    return areas;
  }, []);

  // Delete review
  const deleteReview = useCallback(async (reviewId) => {
    try {
      reviewsRef.current = reviewsRef.current.filter(r => r.id !== reviewId);
      setReviews([...reviewsRef.current]);

      await AsyncStorage.setItem(CODE_REVIEWS_KEY, JSON.stringify(reviewsRef.current));
    } catch (e) {
      console.error('Delete review error:', e);
    }
  }, []);

  // Export review as markdown
  const exportReview = useCallback((reviewId) => {
    const codeReview = reviewsRef.current.find(r => r.id === reviewId);
    if (!codeReview) return null;

    const review = codeReview.review;

    const markdown = `# Code Review - ${codeReview.language}

**Date:** ${new Date(codeReview.submittedAt).toLocaleDateString()}
**Score:** ${review.overallScore}%
**Verdict:** ${review.verdict}

## Code Reviewed
\`\`\`${codeReview.language}
${codeReview.code}
\`\`\`

## Scores
- Quality: ${review.quality}/10
- Readability: ${review.readability}/10
- Efficiency: ${review.efficiency}/10
- Correctness: ${review.correctness}/10
- Maintainability: ${review.maintainability}/10

## Strengths
${review.strengths?.map(s => `- **${s.category}:** ${s.point}`).join('\n') || 'N/A'}

## Issues Found
${review.issues?.map(i => `
### ${i.severity.toUpperCase()}: ${i.issue}
\`\`\`
${i.line}
\`\`\`
**Fix:** ${i.fix}
`).join('\n') || 'No issues found!'}

## Optimizations
${codeReview.optimizations ? review.optimizations?.map(o => `
### ${o.type}: ${o.title}
${o.description}

**Example:**
\`\`\`
${o.example}
\`\`\`

**Benefit:** ${o.benefit}
${o.tradeoff ? `**Tradeoff:** ${o.tradeoff}` : ''}
`).join('\n') : 'No optimizations yet'}

## Complexity Analysis
**Time:** ${review.complexity.timeComplexity}
**Space:** ${review.complexity.spaceComplexity}
**Explanation:** ${review.complexity.explanation}

## Best Practices
${review.bestPractices?.map(p => `- ${p}`).join('\n') || 'N/A'}

## Learning Point
${review.learning}

## Next Steps
${review.nextSteps?.map(s => `- ${s}`).join('\n') || 'N/A'}

${codeReview.notes ? `## Your Notes\n${codeReview.notes}` : ''}

---
*Generated by Kesandu AI Code Review*
`;

    return markdown;
  }, []);

  return {
    // State
    reviews,
    loading,
    currentReview,

    // Methods
    submitForReview,
    getOptimizations,
    addNotes,
    rateReview,
    getReviewStats,
    getImprovementAreas,
    deleteReview,
    exportReview,
  };
}

import { useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PORTFOLIO_STORAGE_KEY = '@kesandu_portfolio';

export default function usePortfolioBuilder() {
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const portfolioRef = useRef([]);

  // Load portfolio on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(PORTFOLIO_STORAGE_KEY);
        if (stored) {
          portfolioRef.current = JSON.parse(stored);
          setPortfolioItems(portfolioRef.current);
        }
      } catch (e) {
        console.warn('Failed to load portfolio:', e);
      }
    })();
  }, []);

  const addToPortfolio = useCallback(async (problem, solution, evaluation) => {
    const portfolioItem = {
      id: `portfolio_${Date.now()}`,
      problemId: problem.id,
      problem,
      solution,
      evaluation,
      addedAt: new Date().toISOString(),
      title: problem.title,
      description: problem.description,
      problemType: problem.problemType,
      difficulty: problem.difficulty,
      role: problem.role,
      score: evaluation.score,
      level: evaluation.level,
      notes: '',
      isPublic: false,
      shareLink: null,
    };

    portfolioRef.current.push(portfolioItem);
    setPortfolioItems(portfolioRef.current);

    await AsyncStorage.setItem(
      PORTFOLIO_STORAGE_KEY,
      JSON.stringify(portfolioRef.current)
    );

    return portfolioItem;
  }, []);

  const removeFromPortfolio = useCallback(async (portfolioItemId) => {
    portfolioRef.current = portfolioRef.current.filter(item => item.id !== portfolioItemId);
    setPortfolioItems(portfolioRef.current);

    await AsyncStorage.setItem(
      PORTFOLIO_STORAGE_KEY,
      JSON.stringify(portfolioRef.current)
    );
  }, []);

  const updatePortfolioItem = useCallback(async (portfolioItemId, updates) => {
    const index = portfolioRef.current.findIndex(item => item.id === portfolioItemId);
    if (index >= 0) {
      portfolioRef.current[index] = {
        ...portfolioRef.current[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      setPortfolioItems([...portfolioRef.current]);

      await AsyncStorage.setItem(
        PORTFOLIO_STORAGE_KEY,
        JSON.stringify(portfolioRef.current)
      );
    }
  }, []);

  const getPortfolioStats = useCallback(() => {
    if (portfolioRef.current.length === 0) {
      return {
        totalItems: 0,
        averageScore: 0,
        bestScore: 0,
        byType: {},
        byDifficulty: {},
        byRole: {},
        publicCount: 0,
      };
    }

    const stats = {
      totalItems: portfolioRef.current.length,
      averageScore: 0,
      bestScore: 0,
      byType: {},
      byDifficulty: {},
      byRole: {},
      publicCount: 0,
    };

    let totalScore = 0;
    portfolioRef.current.forEach(item => {
      totalScore += item.score || 0;
      stats.bestScore = Math.max(stats.bestScore, item.score || 0);

      if (item.isPublic) stats.publicCount += 1;

      const type = item.problemType;
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      const diff = item.difficulty;
      stats.byDifficulty[diff] = (stats.byDifficulty[diff] || 0) + 1;

      const role = item.role;
      stats.byRole[role] = (stats.byRole[role] || 0) + 1;
    });

    stats.averageScore = Math.round(totalScore / portfolioRef.current.length);

    return stats;
  }, []);

  const generateShareLink = useCallback(async (portfolioItemId) => {
    const item = portfolioRef.current.find(p => p.id === portfolioItemId);
    if (!item) return null;

    // Generate a shareable summary
    const shareData = {
      title: item.title,
      score: item.score,
      level: item.level,
      difficulty: item.difficulty,
      problemType: item.problemType,
      role: item.role,
      problem: item.problem.description,
      solution: item.solution,
      evaluation: item.evaluation,
      notes: item.notes,
    };

    // In a real app, this would generate a short code and save to server
    // For now, we'll create a local share URL representation
    const shareLink = `kesandu://portfolio/${portfolioItemId}`;

    await updatePortfolioItem(portfolioItemId, {
      shareLink,
      isPublic: true,
    });

    return shareLink;
  }, [updatePortfolioItem]);

  const exportAsMarkdown = useCallback((portfolioItem) => {
    const markdown = `# ${portfolioItem.title}

## Overview
- **Score:** ${portfolioItem.score}%
- **Level:** ${portfolioItem.level}
- **Type:** ${portfolioItem.problemType}
- **Difficulty:** ${portfolioItem.difficulty}
- **Role:** ${portfolioItem.role}

## Problem
${portfolioItem.problem.description}

## My Solution
\`\`\`
${portfolioItem.solution}
\`\`\`

## Evaluation
**Strengths:**
${portfolioItem.evaluation.strengths?.map(s => `- ${s}`).join('\n') || 'N/A'}

**Areas for Improvement:**
${portfolioItem.evaluation.improvements?.map(i => `- ${i}`).join('\n') || 'N/A'}

**Complexity:**
${portfolioItem.evaluation.complexity || 'N/A'}

## Notes
${portfolioItem.notes || 'No notes yet'}

---
*Generated by Kesandu - ${new Date(portfolioItem.addedAt).toLocaleDateString()}*
`;

    return markdown;
  }, []);

  return {
    portfolioItems,
    loading,
    addToPortfolio,
    removeFromPortfolio,
    updatePortfolioItem,
    getPortfolioStats,
    generateShareLink,
    exportAsMarkdown,
  };
}

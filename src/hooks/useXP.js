import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { xpForLevel, computeLevel } from '../../utils';

const STORAGE_KEY = '@kesandu_guru_xp';

export default function useXP() {
  const [totalXP, setTotalXP] = useState(0);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          setTotalXP(data.totalXP || 0);
          setCompletedChallenges(data.completedChallenges || []);
        }
      } catch (e) {
        console.warn('Failed to load XP:', e);
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ totalXP, completedChallenges })).catch(() => {});
  }, [totalXP, completedChallenges, loaded]);

  const awardXP = useCallback((xp, challengeId) => {
    setTotalXP(prev => prev + xp);
    if (challengeId && !completedChallenges.includes(challengeId)) {
      setCompletedChallenges(prev => [...prev, challengeId]);
    }
  }, [completedChallenges]);

  const level = computeLevel(totalXP);
  const currentLevelXP = totalXP - Array.from(
    { length: level - 1 },
    (_, i) => xpForLevel(i + 1)
  ).reduce((a, b) => a + b, 0);
  const nextLevelXP = xpForLevel(level);
  const isComplete = useCallback((id) => completedChallenges.includes(id), [completedChallenges]);

  const getModuleProgress = useCallback((moduleItem) => {
    const total = moduleItem.challenges.length;
    const done = moduleItem.challenges.filter(c => completedChallenges.includes(c.id)).length;
    return { done, total, isGuru: done === total && total > 0 };
  }, [completedChallenges]);

  return { totalXP, level, currentLevelXP, nextLevelXP, awardXP, isComplete, loaded, getModuleProgress, completedChallenges };
}

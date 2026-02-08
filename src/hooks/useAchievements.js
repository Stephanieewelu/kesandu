import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkAchievements } from '../../utils';

const ACHIEVEMENTS_KEY = '@kesandu_achievements';

export default function useAchievements() {
  const [unlockedIds, setUnlockedIds] = useState([]);
  const [newAchievement, setNewAchievement] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(ACHIEVEMENTS_KEY).then(val => {
      if (val) setUnlockedIds(JSON.parse(val));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (unlockedIds.length > 0) {
      AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlockedIds)).catch(() => {});
    }
  }, [unlockedIds]);

  const checkAndUnlock = useCallback((stats) => {
    const newly = checkAchievements(stats, unlockedIds);
    if (newly.length > 0) {
      setUnlockedIds(prev => [...prev, ...newly.map(a => a.id)]);
      setNewAchievement(newly[0]);
    }
  }, [unlockedIds]);

  const dismissAchievement = useCallback(() => setNewAchievement(null), []);

  return { unlockedIds, newAchievement, checkAndUnlock, dismissAchievement };
}

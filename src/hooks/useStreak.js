import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDateKey, computeStreak, computeStreakBonus } from '../../utils';

const STREAK_KEY = '@kesandu_streak';

export default function useStreak() {
  const [activeDays, setActiveDays] = useState([]);
  const [streakLoaded, setStreakLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STREAK_KEY).then(val => {
      if (val) setActiveDays(JSON.parse(val));
      setStreakLoaded(true);
    }).catch(() => setStreakLoaded(true));
  }, []);

  useEffect(() => {
    if (!streakLoaded) return;
    AsyncStorage.setItem(STREAK_KEY, JSON.stringify(activeDays)).catch(() => {});
  }, [activeDays, streakLoaded]);

  const recordActivity = useCallback(() => {
    const today = getDateKey();
    setActiveDays(prev => {
      if (prev.includes(today)) return prev;
      return [...prev, today];
    });
  }, []);

  const streakInfo = computeStreak(activeDays);
  const streakBonus = computeStreakBonus(streakInfo.current);

  return { streakInfo, streakBonus, recordActivity, streakLoaded };
}

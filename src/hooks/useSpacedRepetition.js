import { useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SPACED_REPETITION_KEY = '@kesandu_spaced_repetition';
const SM2_DEFAULTS = {
  easeFactor: 2.5,
  interval: 1,
  repetitions: 0,
};

/**
 * SM-2 Algorithm Implementation
 * The SuperMemo 2 algorithm for optimal spacing
 */
function calculateNextReview(review, quality) {
  const { easeFactor, interval, repetitions } = review;

  let nextEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  nextEaseFactor = Math.max(1.3, nextEaseFactor); // Minimum ease factor is 1.3

  let nextInterval, nextRepetitions;

  if (quality < 3) {
    // Failed
    nextInterval = 1;
    nextRepetitions = 0;
  } else {
    // Passed
    nextRepetitions = repetitions + 1;
    if (nextRepetitions === 1) {
      nextInterval = 1;
    } else if (nextRepetitions === 2) {
      nextInterval = 3;
    } else {
      nextInterval = Math.round(interval * nextEaseFactor);
    }
  }

  return {
    easeFactor: nextEaseFactor,
    interval: nextInterval,
    repetitions: nextRepetitions,
    quality,
  };
}

export default function useSpacedRepetition() {
  const [reviews, setReviews] = useState({});
  const [dueItems, setDueItems] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    dueToday: 0,
    dueThisWeek: 0,
    dueThisMonth: 0,
  });
  const reviewsRef = useRef({});

  // Load reviews on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(SPACED_REPETITION_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          reviewsRef.current = data;
          setReviews(data);
          updateDueItems(data);
        }
      } catch (e) {
        console.warn('Failed to load spaced repetition data:', e);
      }
    })();
  }, []);

  // Update due items list
  const updateDueItems = useCallback((reviewsData) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    let dueToday = 0;
    let dueThisWeek = 0;
    let dueThisMonth = 0;
    const due = [];

    Object.entries(reviewsData).forEach(([itemId, review]) => {
      if (review.nextReviewDate) {
        const reviewDate = new Date(review.nextReviewDate);
        const reviewDateOnly = new Date(reviewDate.getFullYear(), reviewDate.getMonth(), reviewDate.getDate());

        if (reviewDateOnly <= today) {
          due.push({ itemId, ...review, daysOverdue: Math.floor((today - reviewDateOnly) / (24 * 60 * 60 * 1000)) });
          dueToday += 1;
          dueThisWeek += 1;
          dueThisMonth += 1;
        } else if (reviewDateOnly <= nextWeek) {
          dueThisWeek += 1;
          dueThisMonth += 1;
        } else if (reviewDateOnly <= nextMonth) {
          dueThisMonth += 1;
        }
      }
    });

    setDueItems(due.sort((a, b) => (b.daysOverdue || 0) - (a.daysOverdue || 0)));
    setStats({
      totalItems: Object.keys(reviewsData).length,
      dueToday,
      dueThisWeek,
      dueThisMonth,
    });
  }, []);

  // Add item to spaced repetition
  const addItem = useCallback(async (itemId, itemData) => {
    const review = {
      itemId,
      ...itemData,
      ...SM2_DEFAULTS,
      createdAt: new Date().toISOString(),
      nextReviewDate: new Date().toISOString(), // Due immediately
      lastReviewDate: null,
      reviews: [],
    };

    reviewsRef.current[itemId] = review;
    setReviews({ ...reviewsRef.current });

    await AsyncStorage.setItem(
      SPACED_REPETITION_KEY,
      JSON.stringify(reviewsRef.current)
    );

    updateDueItems(reviewsRef.current);
    return review;
  }, [updateDueItems]);

  // Record review result
  const recordReview = useCallback(async (itemId, quality) => {
    if (!reviewsRef.current[itemId]) {
      return null;
    }

    const review = reviewsRef.current[itemId];
    const smData = calculateNextReview(
      {
        easeFactor: review.easeFactor,
        interval: review.interval,
        repetitions: review.repetitions,
      },
      quality // 0-5 scale: 0 = complete blackout, 5 = perfect response
    );

    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + smData.interval);

    const updatedReview = {
      ...review,
      ...smData,
      lastReviewDate: new Date().toISOString(),
      nextReviewDate: nextReviewDate.toISOString(),
      reviews: [
        ...(review.reviews || []),
        {
          timestamp: new Date().toISOString(),
          quality,
          interval: smData.interval,
        },
      ],
    };

    reviewsRef.current[itemId] = updatedReview;
    setReviews({ ...reviewsRef.current });

    await AsyncStorage.setItem(
      SPACED_REPETITION_KEY,
      JSON.stringify(reviewsRef.current)
    );

    updateDueItems(reviewsRef.current);
    return updatedReview;
  }, [updateDueItems]);

  // Skip review (mark as done for now)
  const skipReview = useCallback(async (itemId) => {
    return recordReview(itemId, 4); // Mark as mostly correct
  }, [recordReview]);

  // Get items due for review
  const getDueItems = useCallback((filter = 'all') => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (filter === 'overdue') {
      return dueItems.filter(item => item.daysOverdue > 0);
    }
    if (filter === 'today') {
      return dueItems.filter(item => (item.daysOverdue || 0) <= 0);
    }
    return dueItems;
  }, [dueItems]);

  // Get retention stats
  const getRetentionStats = useCallback((itemId) => {
    const review = reviewsRef.current[itemId];
    if (!review || !review.reviews) {
      return { attempts: 0, successRate: 0, averageQuality: 0 };
    }

    const reviews = review.reviews;
    const successful = reviews.filter(r => r.quality >= 3).length;
    const averageQuality = reviews.reduce((sum, r) => sum + r.quality, 0) / reviews.length;

    return {
      attempts: reviews.length,
      successRate: Math.round((successful / reviews.length) * 100),
      averageQuality: Math.round(averageQuality * 10) / 10,
      lastReviewDate: review.lastReviewDate,
      nextReviewDate: review.nextReviewDate,
      interval: review.interval,
      repetitions: review.repetitions,
      easeFactor: Math.round(review.easeFactor * 100) / 100,
    };
  }, []);

  // Get items by interval
  const getItemsByInterval = useCallback(() => {
    const intervals = {
      new: [],
      learning: [],
      review: [],
      mastered: [],
    };

    Object.entries(reviewsRef.current).forEach(([itemId, review]) => {
      if (review.repetitions === 0) {
        intervals.new.push({ itemId, ...review });
      } else if (review.interval < 7) {
        intervals.learning.push({ itemId, ...review });
      } else if (review.interval < 30) {
        intervals.review.push({ itemId, ...review });
      } else {
        intervals.mastered.push({ itemId, ...review });
      }
    });

    return intervals;
  }, []);

  // Reset item (start over)
  const resetItem = useCallback(async (itemId) => {
    if (reviewsRef.current[itemId]) {
      const review = reviewsRef.current[itemId];
      const reset = {
        ...review,
        ...SM2_DEFAULTS,
        nextReviewDate: new Date().toISOString(),
        reviews: [],
      };

      reviewsRef.current[itemId] = reset;
      setReviews({ ...reviewsRef.current });

      await AsyncStorage.setItem(
        SPACED_REPETITION_KEY,
        JSON.stringify(reviewsRef.current)
      );

      updateDueItems(reviewsRef.current);
    }
  }, [updateDueItems]);

  // Get global stats
  const getGlobalStats = useCallback(() => {
    const items = Object.values(reviewsRef.current);
    if (items.length === 0) {
      return { avgRepetitions: 0, avgEaseFactor: 0, totalReviews: 0 };
    }

    const totalRepetitions = items.reduce((sum, item) => sum + item.repetitions, 0);
    const totalEaseFactor = items.reduce((sum, item) => sum + item.easeFactor, 0);
    const totalReviews = items.reduce((sum, item) => sum + (item.reviews?.length || 0), 0);

    return {
      avgRepetitions: Math.round((totalRepetitions / items.length) * 10) / 10,
      avgEaseFactor: Math.round((totalEaseFactor / items.length) * 100) / 100,
      totalReviews,
      avgQuality: Math.round(
        items.reduce((sum, item) => {
          const avg = item.reviews?.reduce((s, r) => s + r.quality, 0) / (item.reviews?.length || 1) || 0;
          return sum + avg;
        }, 0) / items.length * 10
      ) / 10,
    };
  }, []);

  return {
    // State
    reviews,
    dueItems,
    stats,

    // Methods
    addItem,
    recordReview,
    skipReview,
    getDueItems,
    getRetentionStats,
    getItemsByInterval,
    resetItem,
    getGlobalStats,
  };
}

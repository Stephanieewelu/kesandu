import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@kesandu_certifications';

const CERTIFICATION_TIERS = {
  PRACTITIONER: {
    name: 'Certified Practitioner',
    emoji: '🥉',
    requirements: {
      socratiAssessments: 3,
      coursesTeaching: 3,
      projects: 1,
      interviews: 0,
    },
    color: '#CD7F32', // Bronze
  },
  SPECIALIST: {
    name: 'Certified Specialist',
    emoji: '🥈',
    requirements: {
      socratiAssessments: 5,
      coursesTeaching: 10,
      projects: 3,
      interviews: 5,
      averageScore: 70, // 70% avg on interviews
    },
    color: '#C0C0C0', // Silver
  },
  EXPERT: {
    name: 'Certified Expert',
    emoji: '🥇',
    requirements: {
      socratiAssessments: 10,
      coursesTeaching: 25,
      projects: 3,
      interviews: 10,
      averageScore: 80, // 80% avg on interviews
    },
    color: '#FFD700', // Gold
  },
  GENIUS: {
    name: 'Kesandu Genius',
    emoji: '💎',
    requirements: {
      socratiAssessments: 20,
      coursesTeaching: 50,
      projects: 5,
      interviews: 20,
      averageScore: 90, // 90% avg on interviews
      specializations: 2, // Multiple roles mastered
    },
    color: '#6366F1', // Indigo
  },
};

export default function useCertification() {
  const [certifications, setCertifications] = useState({});
  const [userMetrics, setUserMetrics] = useState({
    socratiAssessments: 0,
    coursesTeaching: 0,
    projects: 0,
    interviews: [],
    specializations: new Set(),
  });

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          setCertifications(data.certifications || {});
          setUserMetrics(data.metrics || userMetrics);
        }
      } catch (e) {
        console.warn('Failed to load certifications:', e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (Object.keys(certifications).length > 0 || userMetrics.interviews.length > 0) {
        try {
          await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ certifications, metrics: userMetrics })
          );
        } catch (e) {
          console.warn('Failed to save certifications:', e);
        }
      }
    })();
  }, [certifications, userMetrics]);

  const checkCertifications = useCallback((newMetrics) => {
    const newCerts = { ...certifications };
    let changed = false;

    Object.entries(CERTIFICATION_TIERS).forEach(([tier, tierConfig]) => {
      const requirements = tierConfig.requirements;
      const isMet =
        newMetrics.socratiAssessments >= requirements.socratiAssessments &&
        newMetrics.coursesTeaching >= requirements.coursesTeaching &&
        newMetrics.projects >= requirements.projects &&
        newMetrics.interviews.length >= requirements.interviews &&
        (!requirements.averageScore ||
          (newMetrics.interviews.length > 0 &&
            newMetrics.interviews.reduce((a, b) => a + b, 0) / newMetrics.interviews.length >=
            requirements.averageScore)) &&
        (!requirements.specializations || newMetrics.specializations.size >= requirements.specializations);

      if (isMet && !newCerts[tier]) {
        newCerts[tier] = {
          tier,
          name: tierConfig.name,
          earnedAt: new Date().toISOString(),
        };
        changed = true;
      }
    });

    if (changed) {
      setCertifications(newCerts);
    }

    return newCerts;
  }, [certifications]);

  const recordInterview = useCallback((score, role) => {
    const updated = {
      ...userMetrics,
      interviews: [...userMetrics.interviews, score],
      specializations: new Set([...userMetrics.specializations, role]),
    };
    setUserMetrics(updated);
    checkCertifications(updated);
  }, [userMetrics, checkCertifications]);

  const recordTeaching = useCallback((count = 1) => {
    const updated = {
      ...userMetrics,
      coursesTeaching: userMetrics.coursesTeaching + count,
    };
    setUserMetrics(updated);
    checkCertifications(updated);
  }, [userMetrics, checkCertifications]);

  const recordProject = useCallback((count = 1) => {
    const updated = {
      ...userMetrics,
      projects: userMetrics.projects + count,
    };
    setUserMetrics(updated);
    checkCertifications(updated);
  }, [userMetrics, checkCertifications]);

  const recordSocraticAssessment = useCallback((count = 1) => {
    const updated = {
      ...userMetrics,
      socratiAssessments: userMetrics.socratiAssessments + count,
    };
    setUserMetrics(updated);
    checkCertifications(updated);
  }, [userMetrics, checkCertifications]);

  const getAverageInterviewScore = useCallback(() => {
    if (userMetrics.interviews.length === 0) return 0;
    return Math.round(
      userMetrics.interviews.reduce((a, b) => a + b, 0) / userMetrics.interviews.length
    );
  }, [userMetrics.interviews]);

  const getProgressToNextTier = useCallback(() => {
    const currentTiers = Object.keys(certifications).sort();
    const nextTierName = currentTiers.length === 0
      ? 'PRACTITIONER'
      : Object.keys(CERTIFICATION_TIERS)[
        Object.keys(CERTIFICATION_TIERS).indexOf(currentTiers[currentTiers.length - 1]) + 1
      ];

    if (!nextTierName) return null;

    const nextTierReqs = CERTIFICATION_TIERS[nextTierName].requirements;
    const progress = {
      tier: nextTierName,
      name: CERTIFICATION_TIERS[nextTierName].name,
      metrics: {},
    };

    progress.metrics.socratiAssessments = {
      current: userMetrics.socratiAssessments,
      required: nextTierReqs.socratiAssessments,
      progress: (userMetrics.socratiAssessments / nextTierReqs.socratiAssessments) * 100,
    };

    progress.metrics.coursesTeaching = {
      current: userMetrics.coursesTeaching,
      required: nextTierReqs.coursesTeaching,
      progress: (userMetrics.coursesTeaching / nextTierReqs.coursesTeaching) * 100,
    };

    progress.metrics.projects = {
      current: userMetrics.projects,
      required: nextTierReqs.projects,
      progress: (userMetrics.projects / nextTierReqs.projects) * 100,
    };

    progress.metrics.interviews = {
      current: userMetrics.interviews.length,
      required: nextTierReqs.interviews,
      progress: (userMetrics.interviews.length / nextTierReqs.interviews) * 100,
    };

    return progress;
  }, [certifications, userMetrics]);

  return {
    certifications,
    userMetrics,
    recordInterview,
    recordTeaching,
    recordProject,
    recordSocraticAssessment,
    getAverageInterviewScore,
    getProgressToNextTier,
    CERTIFICATION_TIERS,
  };
}

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet, Text, View, Dimensions, TouchableOpacity,
  TextInput, Modal, ScrollView, SafeAreaView, FlatList,
  ActivityIndicator, Platform, KeyboardAvoidingView,
  Keyboard, Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import {
  Brain, CheckCircle, Zap, X, Send,
  Play, ChevronRight, Briefcase, Target,
  RotateCcw, Award, Star, BookOpen, TrendingUp, Flame,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import YoutubePlayer from 'react-native-youtube-iframe';
import ErrorBoundary from './src/components/ErrorBoundary';
import OnboardingScreen from './src/screens/OnboardingScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CertificateScreen from './src/components/CertificateScreen';
import THEME from './src/constants/theme';
import CONTENT_DATA from './src/constants/content';
import {
  GURU_RANKS, getGuruRank, getNextRank,
  stem, normalize, tokenize, buildNGrams,
  countSyllables, computeReadingLevel,
  conceptPresent, matchConceptGroups,
  detectForbiddenTerms, DEPTH_MARKERS, computeDepthBonus,
  computeWhyDepthScore, detectAnalogyUse, computeAnalogyBonus,
  computeContrastBonus,
  PASS_THRESHOLD, PARTIAL_THRESHOLD, FORBIDDEN_PENALTY,
  READING_LEVEL_PENALTY, MIN_WORDS_SCORE_CAP, evaluateAnswer,
  xpForLevel, computeLevel,
  getDateKey, computeStreak, computeStreakBonus,
  analyzePerformancePattern, generateAdaptiveFeedback,
  ACHIEVEMENTS, checkAchievements,
} from './utils';

const { width, height } = Dimensions.get('window');
const IS_IOS = Platform.OS === 'ios';

// THEME imported from src/constants/theme
// CONTENT_DATA imported from src/constants/content

// ============================================================================
// 3. XP PERSISTENCE HOOK
// ============================================================================

const STORAGE_KEY = '@kesandu_guru_xp';
const ONBOARDING_KEY = '@kesandu_onboarding_done';

function useOnboarding() {
  const [hasOnboarded, setHasOnboarded] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
      setHasOnboarded(val === 'true');
    }).catch(() => setHasOnboarded(false));
  }, []);

  const completeOnboarding = useCallback(async () => {
    setHasOnboarded(true);
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true').catch(() => {});
  }, []);

  return { hasOnboarded, completeOnboarding };
}

function useXP() {
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

// ============================================================================
// 4. STREAK PERSISTENCE HOOK
// ============================================================================

const STREAK_KEY = '@kesandu_streak';
const ACHIEVEMENTS_KEY = '@kesandu_achievements';

function useStreak() {
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

// ============================================================================
// 5. ACHIEVEMENTS HOOK
// ============================================================================

function useAchievements() {
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

// ============================================================================
// 6. COMPONENTS
// ============================================================================

// -- Achievement Toast Component --

const AchievementToast = ({ achievement, onDismiss }) => {
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (achievement) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, { toValue: -120, duration: 300, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => onDismiss());
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [achievement, slideAnim, opacityAnim, onDismiss]);

  if (!achievement) return null;

  return (
    <Animated.View
      style={[
        styles.achievementToast,
        { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
    >
      <View style={styles.achievementToastIcon}>
        <Star size={18} color={THEME.guru} fill={THEME.guru} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.achievementToastTitle}>Achievement Unlocked!</Text>
        <Text style={styles.achievementToastName}>{achievement.title}</Text>
        <Text style={styles.achievementToastDesc}>{achievement.description}</Text>
      </View>
    </Animated.View>
  );
};

// -- Streak Display Component --

const StreakBadge = ({ current, isActiveToday }) => {
  if (current <= 0) return null;

  return (
    <View style={[styles.streakBadge, isActiveToday && styles.streakBadgeActive]}>
      <Flame size={12} color={isActiveToday ? '#FF6B35' : '#666'} fill={isActiveToday ? '#FF6B35' : 'transparent'} />
      <Text style={[styles.streakText, isActiveToday && styles.streakTextActive]}>{current}</Text>
    </View>
  );
};

// -- Score Bar Component --

const ScoreBar = ({ score, status }) => {
  const barWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barWidth, {
      toValue: score,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [score, barWidth]);

  const color = status === 'PASS'
    ? THEME.success
    : status === 'PARTIAL'
      ? THEME.partial
      : THEME.danger;

  return (
    <View style={styles.scoreBarContainer}>
      <View style={styles.scoreBarTrack}>
        <Animated.View
          style={[
            styles.scoreBarFill,
            {
              backgroundColor: color,
              width: barWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={[styles.scoreLabel, { color }]}>{score}/100</Text>
    </View>
  );
};

// -- Concept Breakdown Component --

const ConceptBreakdown = ({ breakdown }) => {
  if (!breakdown) return null;

  return (
    <View style={styles.breakdownContainer}>
      <Text style={styles.breakdownTitle}>CONCEPT COVERAGE</Text>
      {breakdown.concepts.map((c, i) => (
        <View key={i} style={styles.breakdownRow}>
          <Text style={{ fontSize: 14 }}>{c.matched ? '\u2705' : '\u274C'}</Text>
          <Text style={styles.breakdownText}>
            Area {c.groupIndex + 1}
            {c.matchedTerm ? ` \u2014 "${c.matchedTerm}"` : ' \u2014 not detected'}
          </Text>
          <View style={[styles.weightBadge, { opacity: c.weight / 3 }]}>
            <Text style={styles.weightText}>{'\u00D7'}{c.weight}</Text>
          </View>
        </View>
      ))}

      <View style={styles.breakdownRow}>
        <Text style={{ fontSize: 14 }}>{breakdown.wordCount.passed ? '\u2705' : '\u26A0\uFE0F'}</Text>
        <Text style={styles.breakdownText}>
          Words: {breakdown.wordCount.actual}/{breakdown.wordCount.required}
        </Text>
      </View>

      {breakdown.depthBonus > 0 && (
        <View style={styles.breakdownRow}>
          <Text style={{ fontSize: 14 }}>{'\uD83E\uDDE0'}</Text>
          <Text style={styles.breakdownText}>
            Depth bonus: +{breakdown.depthBonus} pts
          </Text>
        </View>
      )}

      {breakdown.whyDepthBonus > 0 && (
        <View style={styles.breakdownRow}>
          <Text style={{ fontSize: 14 }}>{'\uD83D\uDD0D'}</Text>
          <Text style={styles.breakdownText}>
            Why-depth bonus: +{Math.min(10, breakdown.whyDepthBonus)} pts
          </Text>
        </View>
      )}

      {breakdown.analogyBonus > 0 && (
        <View style={styles.breakdownRow}>
          <Text style={{ fontSize: 14 }}>{'\uD83C\uDF1F'}</Text>
          <Text style={styles.breakdownText}>
            Analogy bonus: +{breakdown.analogyBonus} pts
          </Text>
        </View>
      )}

      {breakdown.contrastBonus > 0 && (
        <View style={styles.breakdownRow}>
          <Text style={{ fontSize: 14 }}>{'\uD83E\uDD14'}</Text>
          <Text style={styles.breakdownText}>
            Critical thinking bonus: +{breakdown.contrastBonus} pts
          </Text>
        </View>
      )}

      {breakdown.readingLevel && (
        <View style={styles.breakdownRow}>
          <Text style={{ fontSize: 14 }}>{breakdown.readingLevel.passed ? '\u2705' : '\u26A0\uFE0F'}</Text>
          <Text style={styles.breakdownText}>
            Reading level: grade {breakdown.readingLevel.actual} (max {breakdown.readingLevel.max})
          </Text>
        </View>
      )}

      {breakdown.forbidden.length > 0 && (
        <>
          <Text style={[styles.breakdownTitle, { marginTop: 10, color: THEME.danger }]}>
            JARGON VIOLATIONS
          </Text>
          {breakdown.forbidden.map((v, i) => (
            <View key={i} style={styles.breakdownRow}>
              <Text style={{ fontSize: 14 }}>{'\uD83D\uDEAB'}</Text>
              <Text style={[styles.breakdownText, { color: THEME.danger }]}>
                "{v.term}" (-{FORBIDDEN_PENALTY} pts)
              </Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
};

// -- Guru Badge Component --

const GuruBadge = ({ guruTitle, isGuru, progress }) => {
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (isGuru) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0.4, duration: 1200, useNativeDriver: false }),
        ])
      ).start();
    }
  }, [isGuru, glowAnim]);

  if (isGuru) {
    return (
      <Animated.View style={[styles.guruBadge, { opacity: glowAnim }]}>
        <Award size={12} color={THEME.guru} />
        <Text style={styles.guruBadgeText}>{guruTitle}</Text>
      </Animated.View>
    );
  }

  return (
    <View style={styles.progressBadge}>
      <Text style={styles.progressBadgeText}>
        {progress.done}/{progress.total} mastered
      </Text>
    </View>
  );
};

// -- Guru Celebration Overlay --

const GuruCelebration = ({ visible, guruTitle, onDismiss }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 3, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.celebrationOverlay, { opacity: opacityAnim }]}>
      <Animated.View style={[styles.celebrationCard, { transform: [{ scale: scaleAnim }] }]}>
        <Award size={48} color={THEME.guru} />
        <Text style={styles.celebrationTitle}>GURU UNLOCKED</Text>
        <Text style={styles.celebrationSubtitle}>{guruTitle}</Text>
        <Text style={styles.celebrationDesc}>
          You've mastered all challenges for this topic. You are now a certified guru!
        </Text>
        <TouchableOpacity style={styles.celebrationBtn} onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Continue after guru unlock">
          <Text style={styles.celebrationBtnText}>CONTINUE</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

// -- Chat Engine Component --

const ChatEngine = ({ challenge, onComplete, onExit, isAlreadyComplete }) => {
  const [history, setHistory] = useState([
    { id: 'init', text: challenge.initialAiMessage, sender: 'ai' },
  ]);
  const [input, setInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [status, setStatus] = useState('ACTIVE');
  const [attemptHistory, setAttemptHistory] = useState([]);
  const listRef = useRef(null);

  const handleSend = useCallback(() => {
    if (!input.trim() || isAiTyping) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const userMsg = { id: Date.now().toString(), text: input, sender: 'user' };
    setHistory(prev => [...prev, userMsg]);
    const userInput = input;
    setInput('');
    setIsAiTyping(true);
    Keyboard.dismiss();

    setTimeout(() => {
      const result = evaluateAnswer(userInput, challenge);
      setLastResult(result);

      const newAttemptHistory = [...attemptHistory, { score: result.score }];
      setAttemptHistory(newAttemptHistory);

      // Generate adaptive coaching tips
      const pattern = analyzePerformancePattern(newAttemptHistory);
      const adaptiveTips = generateAdaptiveFeedback(pattern, challenge.type, result.score);

      const feedbackText = result.feedback.join('\n');
      const coachingText = adaptiveTips.length > 0
        ? '\n\n' + adaptiveTips.map(t => `\u{1F4AC} ${t}`).join('\n')
        : '';

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        text: feedbackText + coachingText,
        sender: 'ai',
        result,
      };

      setHistory(prev => [...prev, aiMsg]);
      setIsAiTyping(false);

      if (result.passed) {
        setStatus('SUCCESS');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (result.status === 'PARTIAL') {
        setStatus('PARTIAL');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        setStatus('FAIL');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }, 1000);
  }, [input, isAiTyping, challenge, attemptHistory]);

  const handleRetry = useCallback(() => {
    setStatus('ACTIVE');
    setLastResult(null);
    setHistory(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        text: '\uD83D\uDD04 Give it another shot. Think about the feedback above.',
        sender: 'ai',
      },
    ]);
  }, []);

  const renderMessage = useCallback(({ item }) => {
    const isAi = item.sender === 'ai';
    return (
      <View style={{ marginBottom: 16 }}>
        <View style={[styles.bubble, isAi ? styles.bubbleAi : styles.bubbleUser]}>
          <Text style={styles.bubbleText}>{item.text}</Text>
        </View>
        {item.result && (
          <View style={{ marginTop: 8 }}>
            <ScoreBar score={item.result.score} status={item.result.status} />
            <ConceptBreakdown breakdown={item.result.breakdown} />
            {item.result.xpEarned > 0 && (
              <View style={styles.xpEarnedBadge}>
                <Zap size={14} color={THEME.guru} fill={THEME.guru} />
                <Text style={styles.xpEarnedText}>+{item.result.xpEarned} XP</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={onExit} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Close challenge">
          <X size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{challenge.type.replace('_', ' ')}</Text>
          <Text style={styles.headerSubtitle}>
            {challenge.type === 'TEACH_BACK' ? '\uD83C\uDF93 Feynman Mode' : challenge.type === 'APPLY' ? '\uD83D\uDCBC Apply Mode' : '\uD83E\uDDEA Accuracy Mode'}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.briefBox}>
        <Target size={14} color={THEME.primary} />
        <Text style={styles.briefText}>{challenge.prompt}</Text>
      </View>

      {isAlreadyComplete && (
        <View style={styles.completeBanner}>
          <CheckCircle size={14} color={THEME.success} />
          <Text style={styles.completeBannerText}>Already completed \u2014 practice mode (no XP)</Text>
        </View>
      )}

      <FlatList
        ref={listRef}
        data={history}
        keyExtractor={i => i.id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={renderMessage}
      />

      {isAiTyping && (
        <View style={styles.typingIndicator}>
          <ActivityIndicator size="small" color={THEME.primary} />
          <Text style={styles.typingText}>Evaluating your knowledge...</Text>
        </View>
      )}

      <KeyboardAvoidingView behavior={IS_IOS ? 'padding' : 'height'}>
        {status === 'ACTIVE' ? (
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Prove your understanding..."
              placeholderTextColor={THEME.muted}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || isAiTyping}
              accessibilityRole="button"
              accessibilityLabel="Send your answer"
            >
              <Send size={20} color={input.trim() ? '#000' : '#666'} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionBar}>
            {(status === 'FAIL' || status === 'PARTIAL') && (
              <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} accessibilityRole="button" accessibilityLabel="Try challenge again">
                <RotateCcw size={18} color={THEME.textSoft} />
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.collectBtn,
                {
                  backgroundColor: status === 'SUCCESS'
                    ? THEME.success
                    : status === 'PARTIAL'
                      ? THEME.partial
                      : THEME.muted,
                },
              ]}
              onPress={() => {
                if (lastResult && lastResult.xpEarned > 0) {
                  onComplete(lastResult.xpEarned, challenge.id);
                } else {
                  onExit();
                }
              }}
            >
              <Text style={styles.collectBtnText}>
                {lastResult?.xpEarned > 0 ? `COLLECT +${lastResult.xpEarned} XP` : 'CLOSE'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// -- Video Feed Item (Memoized with optimized YouTube Player) --

const PLAYER_PARAMS = Object.freeze({
  controls: false,
  modestbranding: true,
  loop: true,
  rel: false,
});

const WEBVIEW_PROPS = Object.freeze({
  androidLayerType: 'hardware',
  allowsInlineMediaPlayback: true,
  scrollEnabled: false,
});

const VideoFeedItem = React.memo(
  ({ item, isActive, onEnter, moduleProgress }) => {
    const [playing, setPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
      if (isActive) {
        setPlaying(true);
      } else {
        setPlaying(false);
        setIsReady(false);
      }
    }, [isActive]);

    const onStateChange = useCallback((state) => {
      if (state === 'playing') setIsReady(true);
      if (state === 'ended') setPlaying(false);
    }, []);

    const handlePlay = useCallback(() => setPlaying(true), []);
    const handleEnter = useCallback(() => onEnter(item), [item, onEnter]);

    return (
      <View style={{ width, height, backgroundColor: '#000' }}>
        {isActive ? (
          <View style={styles.videoContainer}>
            <YoutubePlayer
              height={height}
              width={width}
              videoId={item.youtubeId}
              play={playing}
              onChangeState={onStateChange}
              initialPlayerParams={PLAYER_PARAMS}
              webViewProps={WEBVIEW_PROPS}
            />
            {!isReady && (
              <TouchableOpacity style={styles.manualPlayOverlay} onPress={handlePlay}>
                <Play size={40} color="rgba(255,255,255,0.8)" fill="rgba(255,255,255,0.8)" />
                <Text style={styles.tapToPlayText}>TAP TO PLAY</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.offscreenPlaceholder}>
            <Play size={32} color="rgba(255,255,255,0.3)" />
          </View>
        )}

        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <View style={styles.categoryRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
              <GuruBadge
                guruTitle={item.guruTitle}
                isGuru={moduleProgress.isGuru}
                progress={moduleProgress}
              />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.creator}>{item.creator}</Text>

            {/* Progress bar for this module */}
            <View style={styles.moduleProgressRow}>
              <View style={styles.moduleProgressTrack}>
                <View
                  style={[
                    styles.moduleProgressFill,
                    {
                      width: `${moduleProgress.total > 0 ? (moduleProgress.done / moduleProgress.total) * 100 : 0}%`,
                      backgroundColor: moduleProgress.isGuru ? THEME.guru : THEME.primary,
                    },
                  ]}
                />
              </View>
              <Text style={[
                styles.moduleProgressText,
                moduleProgress.isGuru && { color: THEME.guru },
              ]}>
                {moduleProgress.isGuru
                  ? 'GURU'
                  : `${moduleProgress.done}/${moduleProgress.total}`}
              </Text>
            </View>

            <Text style={styles.challengeCount}>
              {item.challenges.length} challenge{item.challenges.length > 1 ? 's' : ''} {'\u2022'} +{item.xp} XP
            </Text>

            <TouchableOpacity
              style={[
                styles.dojoBtn,
                moduleProgress.isGuru && styles.dojoBtnGuru,
              ]}
              onPress={handleEnter}
              accessibilityRole="button"
              accessibilityLabel={moduleProgress.isGuru ? `Review ${item.title} dojo` : `Enter ${item.title} dojo`}
            >
              <Brain size={20} color="#000" />
              <Text style={styles.dojoBtnText}>
                {moduleProgress.isGuru ? 'REVIEW DOJO' : 'ENTER DOJO'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  },
  (prev, next) =>
    prev.item.id === next.item.id &&
    prev.isActive === next.isActive &&
    prev.moduleProgress.done === next.moduleProgress.done
);

// ============================================================================
// 7. MAIN APP
// ============================================================================

function AppContent() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeModule, setActiveModule] = useState(null);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [showCelebration, setShowCelebration] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [certificateModule, setCertificateModule] = useState(null);
  const { totalXP, level, currentLevelXP, nextLevelXP, awardXP, isComplete, loaded, getModuleProgress, completedChallenges } = useXP();
  const { hasOnboarded, completeOnboarding } = useOnboarding();
  const { streakInfo, streakBonus, recordActivity, streakLoaded } = useStreak();
  const { unlockedIds, newAchievement, checkAndUnlock, dismissAchievement } = useAchievements();

  const guruRank = getGuruRank(totalXP);
  const nextRank = getNextRank(totalXP);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 70,
    minimumViewTime: 300,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const getItemLayout = useCallback((_, index) => ({
    length: height,
    offset: height * index,
    index,
  }), []);

  const handleOpenModule = useCallback((m) => setActiveModule(m), []);
  const handleCloseModule = useCallback(() => setActiveModule(null), []);

  const handleOpenChallenge = useCallback((c) => {
    setActiveModule(null);
    setTimeout(() => setActiveChallenge(c), 350);
  }, []);

  const handleChallengeComplete = useCallback((xp, challengeId) => {
    if (!isComplete(challengeId)) {
      awardXP(xp, challengeId);
    }
    setActiveChallenge(null);
    recordActivity();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Check achievements after a brief delay to let state update
    setTimeout(() => {
      const guruCount = CONTENT_DATA.filter(m => getModuleProgress(m).isGuru).length;
      const allChallenges = CONTENT_DATA.flatMap(m => m.challenges);
      const passedIds = [...completedChallenges, challengeId];
      const teachBackPasses = allChallenges.filter(c => c.type === 'TEACH_BACK' && passedIds.includes(c.id)).length;
      const applyPasses = allChallenges.filter(c => c.type === 'APPLY' && passedIds.includes(c.id)).length;
      const modulesAttempted = CONTENT_DATA.filter(m => m.challenges.some(c => passedIds.includes(c.id))).length;

      checkAndUnlock({
        totalPasses: passedIds.length,
        currentStreak: streakInfo.current + (streakInfo.isActiveToday ? 0 : 1),
        guruCount,
        highestScore: 0,
        modulesAttempted,
        teachBackPasses,
        applyPasses,
        totalAnalogies: 0,
      });

      // Check guru unlock
      for (const mod of CONTENT_DATA) {
        const allDone = mod.challenges.every(
          c => c.id === challengeId || isComplete(c.id)
        );
        if (allDone && mod.challenges.some(c => c.id === challengeId)) {
          setShowCelebration(mod.guruTitle);
          setCertificateModule(mod);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        }
      }
    }, 500);
  }, [awardXP, isComplete, recordActivity, completedChallenges, getModuleProgress, streakInfo, checkAndUnlock]);

  const handleChallengeExit = useCallback(() => setActiveChallenge(null), []);

  const renderFeedItem = useCallback(({ item, index }) => (
    <VideoFeedItem
      item={item}
      isActive={index === activeIndex && !activeModule && !activeChallenge}
      onEnter={handleOpenModule}
      moduleProgress={getModuleProgress(item)}
    />
  ), [activeIndex, activeModule, activeChallenge, handleOpenModule, getModuleProgress]);

  const levelProgress = nextLevelXP > 0 ? Math.min(1, currentLevelXP / nextLevelXP) : 0;
  const guruCount = CONTENT_DATA.filter(m => getModuleProgress(m).isGuru).length;

  if (hasOnboarded === null || !loaded || !streakLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00D9FF" />
      </View>
    );
  }

  if (!hasOnboarded) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* VIDEO FEED */}
      <FlatList
        data={CONTENT_DATA}
        keyExtractor={item => item.id}
        pagingEnabled
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={getItemLayout}
        renderItem={renderFeedItem}
        windowSize={3}
        maxToRenderPerBatch={2}
        removeClippedSubviews
        initialNumToRender={1}
      />

      {/* HUD OVERLAY */}
      <SafeAreaView style={styles.hud} pointerEvents="box-none">
        <View style={styles.hudLeft}>
          <TouchableOpacity
            onPress={() => setShowSettings(true)}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <Text style={styles.logo}>KESANDU</Text>
            <Text style={styles.logoSubtitle}>GURU</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.hudRight}>
          {/* Streak badge */}
          <StreakBadge current={streakInfo.current} isActiveToday={streakInfo.isActiveToday} />
          {/* Guru rank badge */}
          <View style={[styles.rankBadge, { borderColor: guruRank.color }]}>
            <Text style={[styles.rankText, { color: guruRank.color }]}>
              {guruRank.title}
            </Text>
          </View>
          {/* Level badge */}
          <View style={styles.levelBadge}>
            <Text style={styles.levelNumber}>{level}</Text>
          </View>
          {/* XP progress */}
          <View style={styles.xpSection}>
            <View style={styles.xpBarTrack}>
              <View style={[styles.xpBarFill, { width: `${levelProgress * 100}%` }]} />
            </View>
            <View style={styles.xpPill}>
              <Zap size={12} color={THEME.guru} fill={THEME.guru} />
              <Text style={styles.xpText}>{totalXP}</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Guru count indicator */}
      {guruCount > 0 && (
        <View style={styles.guruCountBadge}>
          <Award size={14} color={THEME.guru} />
          <Text style={styles.guruCountText}>{guruCount}/{CONTENT_DATA.length}</Text>
        </View>
      )}

      {/* MODULE DETAIL MODAL */}
      <Modal visible={!!activeModule} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.chatHeader}>
            <Text style={styles.headerTitle}>TRAINING MODULE</Text>
            <TouchableOpacity onPress={handleCloseModule} accessibilityRole="button" accessibilityLabel="Close training module">
              <X size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 20 }}>
            {/* Module guru progress */}
            {activeModule && (
              <View style={styles.moduleGuruHeader}>
                <Award
                  size={20}
                  color={getModuleProgress(activeModule).isGuru ? THEME.guru : THEME.muted}
                />
                <Text style={[
                  styles.moduleGuruTitle,
                  getModuleProgress(activeModule).isGuru && { color: THEME.guru },
                ]}>
                  {activeModule.guruTitle}
                </Text>
                <Text style={styles.moduleGuruStatus}>
                  {getModuleProgress(activeModule).isGuru
                    ? 'MASTERED'
                    : `${getModuleProgress(activeModule).done}/${getModuleProgress(activeModule).total} complete`}
                </Text>
              </View>
            )}

            {/* Scenario card */}
            <View style={styles.scenarioCard}>
              <View style={styles.scenarioHeader}>
                <Briefcase size={16} color={THEME.warning} />
                <Text style={styles.scenarioRole}>{activeModule?.applicationScenario.role}</Text>
              </View>
              <Text style={styles.scenarioContext}>{activeModule?.applicationScenario.context}</Text>
            </View>

            <Text style={styles.sectionTitle}>CHALLENGES</Text>
            {activeModule?.challenges.map((c, i) => {
              const completed = isComplete(c.id);
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.challengeRow, completed && styles.challengeRowComplete]}
                  onPress={() => handleOpenChallenge(c)}
                >
                  <View style={[styles.indexCircle, completed && styles.indexCircleComplete]}>
                    {completed ? (
                      <CheckCircle size={16} color={THEME.success} />
                    ) : (
                      <Text style={styles.indexNumber}>{i + 1}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.challengeTitle}>{c.title}</Text>
                    <Text style={styles.challengeType}>
                      {c.type === 'TEACH_BACK' ? '\uD83C\uDF93 Teach Back' : c.type === 'APPLY' ? '\uD83D\uDCBC Apply It' : '\uD83E\uDDEA Concept Check'}
                      {' \u2022 '}+{c.xp_reward} XP
                    </Text>
                  </View>
                  <ChevronRight size={20} color={completed ? THEME.success : THEME.primary} />
                </TouchableOpacity>
              );
            })}

            {/* Next rank teaser */}
            {nextRank && (
              <View style={styles.nextRankCard}>
                <TrendingUp size={16} color={nextRank.color} />
                <Text style={styles.nextRankText}>
                  Next rank: <Text style={{ color: nextRank.color, fontWeight: 'bold' }}>{nextRank.title}</Text> at {nextRank.minXP} XP
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* CHAT ARENA MODAL */}
      <Modal visible={!!activeChallenge} animationType="slide">
        {activeChallenge && (
          <ChatEngine
            challenge={activeChallenge}
            onExit={handleChallengeExit}
            onComplete={handleChallengeComplete}
            isAlreadyComplete={isComplete(activeChallenge?.id)}
          />
        )}
      </Modal>

      {/* GURU CELEBRATION OVERLAY */}
      <GuruCelebration
        visible={!!showCelebration}
        guruTitle={showCelebration || ''}
        onDismiss={() => setShowCelebration(null)}
      />

      {/* SETTINGS MODAL */}
      <Modal visible={showSettings} animationType="slide">
        <SettingsScreen
          onClose={() => setShowSettings(false)}
          totalXP={totalXP}
          level={level}
          streak={streakInfo.current}
          achievements={unlockedIds.length}
        />
      </Modal>

      {/* ACHIEVEMENT TOAST */}
      <AchievementToast achievement={newAchievement} onDismiss={dismissAchievement} />

      {/* COMPLETION CERTIFICATE */}
      <CertificateScreen
        visible={!!certificateModule && !showCelebration}
        module={certificateModule}
        onClose={() => setCertificateModule(null)}
      />
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

// ============================================================================
// 8. STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // -- Video Feed --
  videoContainer: {
    width,
    height,
    position: 'absolute',
    justifyContent: 'center',
  },
  offscreenPlaceholder: {
    width,
    height,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  tapToPlayText: {
    color: '#FFF',
    marginTop: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 50,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  overlayContent: { gap: 6 },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    color: '#DDD',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  creator: { color: '#CCC', fontSize: 15 },
  challengeCount: { color: '#999', fontSize: 13 },
  moduleProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  moduleProgressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  moduleProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  moduleProgressText: {
    color: THEME.primary,
    fontSize: 12,
    fontWeight: '700',
    minWidth: 35,
  },
  dojoBtn: {
    flexDirection: 'row',
    backgroundColor: THEME.primary,
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  dojoBtnGuru: {
    backgroundColor: THEME.guru,
  },
  dojoBtnText: { fontWeight: 'bold', fontSize: 16, color: '#000' },

  // -- HUD --
  hud: {
    position: 'absolute',
    top: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: IS_IOS ? 8 : 12,
  },
  hudLeft: {},
  hudRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 3,
  },
  logoSubtitle: {
    color: THEME.guru,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 4,
    marginTop: -2,
  },
  rankBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rankText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  levelBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelNumber: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },
  xpSection: {
    alignItems: 'flex-end',
  },
  xpBarTrack: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 3,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: THEME.guru,
    borderRadius: 2,
  },
  xpPill: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  xpText: {
    color: THEME.guru,
    fontWeight: 'bold',
    fontSize: 13,
  },

  // -- Guru count badge --
  guruCountBadge: {
    position: 'absolute',
    bottom: 30,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  guruCountText: {
    color: THEME.guru,
    fontWeight: '700',
    fontSize: 13,
  },

  // -- Guru Badge --
  guruBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  guruBadgeText: {
    color: THEME.guru,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  progressBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  progressBadgeText: {
    color: '#999',
    fontSize: 10,
    fontWeight: '600',
  },

  // -- Celebration --
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  celebrationCard: {
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: width * 0.85,
    borderWidth: 2,
    borderColor: THEME.guru,
  },
  celebrationTitle: {
    color: THEME.guru,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 16,
  },
  celebrationSubtitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  celebrationDesc: {
    color: '#AAA',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 12,
  },
  celebrationBtn: {
    backgroundColor: THEME.guru,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 24,
  },
  celebrationBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },

  // -- Chat --
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: IS_IOS ? 8 : 16,
    borderBottomWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: THEME.muted,
    fontSize: 11,
    marginTop: 2,
  },
  briefBox: {
    backgroundColor: THEME.surface,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    borderBottomWidth: 1,
    borderColor: THEME.border,
  },
  briefText: { color: '#DDD', flex: 1, fontSize: 14, lineHeight: 20 },
  completeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 255, 157, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderColor: THEME.border,
  },
  completeBannerText: {
    color: THEME.success,
    fontSize: 12,
  },
  bubble: { maxWidth: '88%', padding: 14, borderRadius: 18, marginBottom: 4 },
  bubbleAi: { alignSelf: 'flex-start', backgroundColor: '#1A1A2E', borderTopLeftRadius: 4 },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 217, 255, 0.12)',
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.3)',
  },
  bubbleText: { color: '#FFF', fontSize: 14, lineHeight: 21 },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  typingText: { color: THEME.muted, fontSize: 12 },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderColor: THEME.border,
    gap: 10,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: THEME.surface,
    color: '#FFF',
    borderRadius: 20,
    padding: 12,
    paddingTop: 12,
    minHeight: 48,
    maxHeight: 120,
    fontSize: 15,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  sendBtn: {
    backgroundColor: THEME.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: THEME.surface,
  },
  actionBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    borderTopWidth: 1,
    borderColor: THEME.border,
  },
  retryBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: THEME.surface,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  retryBtnText: { color: THEME.textSoft, fontWeight: '600', fontSize: 15 },
  collectBtn: {
    flex: 1.5,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectBtnText: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#000',
  },

  // -- Score & Breakdown --
  scoreBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    maxWidth: '88%',
  },
  scoreBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#222',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 45,
    textAlign: 'right',
  },
  breakdownContainer: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 12,
    maxWidth: '88%',
    gap: 6,
    marginTop: 4,
  },
  breakdownTitle: {
    color: THEME.muted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownText: {
    color: '#AAA',
    fontSize: 12,
    flex: 1,
  },
  weightBadge: {
    backgroundColor: THEME.primary,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  weightText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '700',
  },
  xpEarnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  xpEarnedText: {
    color: THEME.guru,
    fontWeight: '700',
    fontSize: 14,
  },

  // -- Module Modal --
  modalContainer: { flex: 1, backgroundColor: '#000' },
  moduleGuruHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: THEME.border,
  },
  moduleGuruTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  moduleGuruStatus: {
    color: THEME.muted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  scenarioCard: {
    backgroundColor: 'rgba(255, 214, 0, 0.06)',
    padding: 18,
    borderRadius: 14,
    borderColor: 'rgba(255, 214, 0, 0.3)',
    borderWidth: 1,
    marginBottom: 28,
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  scenarioRole: {
    color: THEME.warning,
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scenarioContext: { color: '#EEE', fontSize: 15, lineHeight: 22 },
  sectionTitle: {
    color: THEME.primary,
    fontWeight: 'bold',
    marginBottom: 12,
    fontSize: 12,
    letterSpacing: 1,
  },
  challengeRow: {
    flexDirection: 'row',
    backgroundColor: THEME.surface,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  challengeRowComplete: {
    borderColor: 'rgba(0, 255, 157, 0.2)',
    backgroundColor: 'rgba(0, 255, 157, 0.04)',
  },
  indexCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexCircleComplete: {
    backgroundColor: 'rgba(0, 255, 157, 0.15)',
  },
  indexNumber: { fontWeight: 'bold', fontSize: 14 },
  challengeTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  challengeType: { color: '#888', fontSize: 12, marginTop: 2 },
  nextRankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 16,
    borderRadius: 14,
    marginTop: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  nextRankText: {
    color: '#AAA',
    fontSize: 13,
    flex: 1,
  },

  // -- Streak Badge --
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  streakBadgeActive: {
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  streakText: {
    color: '#666',
    fontSize: 11,
    fontWeight: '700',
  },
  streakTextActive: {
    color: '#FF6B35',
  },

  // -- Achievement Toast --
  achievementToast: {
    position: 'absolute',
    top: IS_IOS ? 60 : 40,
    left: 16,
    right: 16,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    zIndex: 200,
  },
  achievementToastIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementToastTitle: {
    color: THEME.guru,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  achievementToastName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 2,
  },
  achievementToastDesc: {
    color: '#AAA',
    fontSize: 12,
    marginTop: 1,
  },
});

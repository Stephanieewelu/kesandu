import Constants from 'expo-constants';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, Text, View, Dimensions, TouchableOpacity,
  TextInput, Modal, SafeAreaView, FlatList, SectionList,
  ActivityIndicator, Platform, KeyboardAvoidingView,
  Keyboard, Image, Vibration, Linking, ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import YoutubePlayer from 'react-native-youtube-iframe';
import InterviewScreen from './src/screens/InterviewScreen';
import PracticeProblemsScreen from './src/screens/PracticeProblemsScreen';
import PortfolioBuilderScreen from './src/screens/PortfolioBuilderScreen';
import SpacedRepetitionScreen from './src/screens/SpacedRepetitionScreen';
import CloudSyncScreen from './src/screens/CloudSyncScreen';
import CodeReviewScreen from './src/screens/CodeReviewScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import EditProblemScreen from './src/screens/EditProblemScreen';
import useMobileSync from './src/hooks/useMobileSyncSupabase';


const { width } = Dimensions.get('window');
const IS_IOS = Platform.OS === 'ios';
const IS_WEB = Platform.OS === 'web';
const SCREEN_WIDTH = width;
const MAX_CONTENT_WIDTH = IS_WEB ? Math.min(800, SCREEN_WIDTH - 32) : SCREEN_WIDTH;
const COLORS = {
  bg: '#09090B',
  surface: '#18181B',
  surfaceLight: '#27272A',
  border: '#3F3F46',
  text: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  accent: '#E4E4E7',
  success: '#22C55E',
  gold: '#EAB308',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
};

const TYPOGRAPHY = {
  mono: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
};

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const API_URL = 'https://gemini-proxy.vercel.app';


// Debug (remove after confirming)
console.log('=== ENV CHECK ===');
console.log('Key exists:', !!GEMINI_API_KEY);
console.log('Key length:', GEMINI_API_KEY?.length);
console.log('API URL:', API_URL);
const API_CONFIG = {
  gemini: {
    apiKey: GEMINI_API_KEY,
    model: 'gemini-2.5-flash',
  },
  apiUrl: null, // Disabled proxy due to CORS issues, using direct API
};

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

async function callGemini(prompt) {
  try {
    let requestUrl;
    let requestBody;

    if (API_CONFIG.apiUrl) { // Use proxy if API_CONFIG.apiUrl is set
      requestUrl = `${API_CONFIG.apiUrl}/api/gemini/generateContent`;
      requestBody = JSON.stringify({ prompt, apiKey: API_CONFIG.gemini.apiKey });
      console.log('Calling Gemini via proxy');
    } else { // Fallback to direct Gemini API
      requestUrl = `${GEMINI_API_URL}/${API_CONFIG.gemini.model}:generateContent?key=${API_CONFIG.gemini.apiKey}`;
      requestBody = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      });
      console.log('Calling Gemini directly');
    }

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API error body:', JSON.stringify(errorData));
      throw new Error(errorData.error?.message || 'API request failed');
    }

    const rawResponseText = await response.text();
    let data = JSON.parse(rawResponseText);
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No response text received');

    // Strip markdown code fences if Gemini wraps the JSON
    text = text.trim();
    if (text.startsWith('```json')) text = text.slice(7);
    else if (text.startsWith('```')) text = text.slice(3);
    if (text.endsWith('```')) text = text.slice(0, -3);
    text = text.trim();

    console.log('Gemini response (first 100):', text.substring(0, 100));
    console.log('Full response:', text);
    return text;
  } catch (error) {
    console.error('callGemini error:', error.message);
    throw error;
  }
}
// ============================================================================
// FIRST PRINCIPLES ENGINE
// ============================================================================
const FirstPrinciplesEngine = {
  converse: async (userMessage, lesson, messageHistory) => {
    const historyText = messageHistory
      .map(m => `${m.role === 'ai' ? 'Tutor' : 'Student'}: ${m.text}`)
      .join('\n');
    const prompt = `
You are a Socratic tutor teaching "${lesson.title}" using first principles thinking.
CORE QUESTION: ${lesson.coreQuestion}
FIRST PRINCIPLES THE STUDENT MUST DISCOVER:
${lesson.firstPrinciples.map((p, i) => `${i + 1}. ${p}`).join('\n')}
SURFACE-LEVEL ANSWERS TO PUSH PAST:
${lesson.surfaceAnswers.map(a => `- "${a}"`).join('\n')}
CONVERSATION SO FAR:
${historyText}
Student's latest message: "${userMessage}"
INSTRUCTIONS:
1. Evaluate the student's depth of understanding (0-4):
   - 0: No understanding or surface-level only
   - 1: Recognizes there's more beneath the surface
   - 2: Can articulate one or two first principles
   - 3: Connects multiple principles together
   - 4: Can teach others and apply to novel situations
2. If the student gives a surface-level answer, challenge them with a probing question.
3. If the student shows genuine insight, acknowledge it and push further.
4. Never lecture. Ask questions that lead to discovery.
5. Be concise — 2-4 sentences max.
Respond in this exact JSON format:
{
  "text": "Your Socratic response here",
  "evaluation": {
    "depth_level": <0-4>,
    "mastery_achieved": <true if depth_level is 4>,
    "can_teach_others": <true if depth_level >= 4>
  }
}`;
    try {
      const raw = await callGemini(prompt);
      console.log('Raw Gemini response:', raw.substring(0, 200));
      const parsed = JSON.parse(raw);
      return {
        text: parsed.text || "Let's think about this differently...",
        evaluation: parsed.evaluation || { depth_level: 0 },
      };
    } catch (error) {
      console.error('FirstPrinciples converse error:', error.message, 'Raw response:', error);
      return {
        text: "I had trouble processing that. Could you rephrase your thinking?",
        evaluation: { depth_level: 0 },
      };
    }
  },
};

// ============================================================================
// SPACED REPETITION ENGINE
// ============================================================================
const SpacedRepetitionEngine = {
  calculateNextReview: (quality, repetitions, easeFactor, interval) => {
    let newInterval, newRepetitions, newEaseFactor;
    if (quality >= 3) {
      if (repetitions === 0) newInterval = 1;
      else if (repetitions === 1) newInterval = 6;
      else newInterval = Math.round(interval * easeFactor);
      newRepetitions = repetitions + 1;
    } else {
      newInterval = 1;
      newRepetitions = 0;
    }
    newEaseFactor = Math.max(1.3,
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
    return {
      interval: newInterval,
      repetitions: newRepetitions,
      easeFactor: newEaseFactor,
      nextReviewDate: nextReviewDate.toISOString(),
    };
  },

  generateReviewCards: async (lesson, depthLevel) => {
    const prompt = `
Given this lesson on "${lesson.title}" with these first principles:
${lesson.firstPrinciples.map((p, i) => `${i + 1}. ${p}`).join('\n')}
Generate 5 spaced repetition review cards testing depth level ${depthLevel}/4.
Mix these card types:
- "explain": Explain a principle in own words
- "apply": Novel scenario, which principle applies
- "debug": Broken system, what principle was violated
- "connect": How two principles relate
- "teach": Explain to a specific audience
Return JSON:
{
  "cards": [
    {
      "id": "unique_id",
      "type": "explain|apply|debug|connect|teach",
      "front": "The question or prompt",
      "back": "The ideal answer",
      "difficulty": 1-5,
      "principle_tested": "which first principle this tests"
    }
  ]
}`;
    try {
      const raw = await callGemini(prompt);
      return JSON.parse(raw);
    } catch (e) {
      return { cards: [] };
    }
  },
};

// ============================================================================
// HABIT ENGINE
// ============================================================================
const HabitEngine = {
  STORAGE_KEY: '@kesandu_habits',
  getStreakData: async () => {
    try {
      const data = await AsyncStorage.getItem(HabitEngine.STORAGE_KEY);
      if (data) return JSON.parse(data);
      return {
        currentStreak: 0, longestStreak: 0, lastActiveDate: null,
        dailyGoal: 1, todayCompleted: 0, weeklyActivity: {}, totalDaysActive: 0,
      };
    } catch (e) {
      return { currentStreak: 0, longestStreak: 0, weeklyActivity: {} };
    }
  },
  recordActivity: async () => {
    const data = await HabitEngine.getStreakData();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    data.weeklyActivity[today] = (data.weeklyActivity[today] || 0) + 1;
    data.todayCompleted = data.weeklyActivity[today];
    if (data.lastActiveDate === today) {
      // already active today
    } else if (data.lastActiveDate === yesterday) {
      data.currentStreak += 1;
    } else {
      data.currentStreak = 1;
    }
    if (data.lastActiveDate !== today) data.totalDaysActive += 1;
    data.lastActiveDate = today;
    data.longestStreak = Math.max(data.longestStreak, data.currentStreak);
    await AsyncStorage.setItem(HabitEngine.STORAGE_KEY, JSON.stringify(data));
    return data;
  },
};

// ============================================================================
// ADAPTIVE LEARNING ENGINE
// ============================================================================
const AdaptiveLearningEngine = {
  getRecommendations: (userData, curriculum) => {
    const allLessons = Object.values(curriculum).flatMap(track => track.lessons);
    const completed = new Set(userData.completedLessons || []);
    const depthLevels = userData.depthLevels || {};
    const recommendations = [];

    const needsDeepening = allLessons.filter(l =>
      completed.has(l.id) && (depthLevels[l.id] || 0) < 3
    );
    if (needsDeepening.length > 0) {
      recommendations.push({
        type: 'deepen', title: '🔁 Deepen Your Understanding',
        subtitle: "You passed these but haven't reached mastery",
        lessons: needsDeepening.sort((a, b) => (depthLevels[a.id] || 0) - (depthLevels[b.id] || 0)).slice(0, 3),
      });
    }

    const nextUp = allLessons.filter(l => !completed.has(l.id));
    if (nextUp.length > 0) {
      recommendations.push({
        type: 'next', title: '⚡ Recommended Next',
        subtitle: 'Based on your current progress',
        lessons: nextUp.slice(0, 3),
      });
    }

    const needsReview = allLessons.filter(l => {
      if (!completed.has(l.id)) return false;
      const progress = userData.lessonProgress?.[l.id];
      if (!progress) return true;
      return (Date.now() - progress.updatedAt) / 86400000 > 7;
    });
    if (needsReview.length > 0) {
      recommendations.push({
        type: 'review', title: '🧠 Due for Review',
        subtitle: "Spaced repetition says it's time",
        lessons: needsReview.slice(0, 3),
      });
    }
    return recommendations;
  },
  getMasteryScore: (userData, curriculum) => {
    const allLessons = Object.values(curriculum).flatMap(track => track.lessons);
    const totalPossible = allLessons.length * 4;
    const achieved = Object.values(userData.depthLevels || {}).reduce((sum, d) => sum + d, 0);
    return Math.round((achieved / Math.max(1, totalPossible)) * 100);
  },
};

// ============================================================================
// TEACHING ENGINE
// ============================================================================
const TeachingEngine = {
  evaluate: async (lesson, explanation, messageHistory) => {
    const prompt = `
You are a confused but eager student. The user is TEACHING you about "${lesson.title}".
WHAT THEY SHOULD EXPLAIN:
${lesson.firstPrinciples.map((p, i) => `${i + 1}. ${p}`).join('\n')}
CONVERSATION:
${messageHistory.map(m => `${m.role === 'ai' ? 'Student' : 'Teacher'}: ${m.text}`).join('\n')}
Teacher says: "${explanation}"
YOUR ROLE: Smart but uninformed student. Ask clarifying questions. If vague, ask for examples. If jargon, ask for simpler words. Occasionally give a WRONG interpretation to test them.
Evaluate teaching (0-4):
0: Can't explain beyond surface 1: Relies on jargon 2: Clear with examples 3: Handles follow-ups 4: Adapts to any audience
Return JSON:
{
  "text": "Your response as confused student (2-3 sentences)",
  "evaluation": { "depth_level": 0-4, "mastery_achieved": false, "can_teach_others": false }
}`;
    try {
      const raw = await callGemini(prompt);
      return JSON.parse(raw);
    } catch (e) {
      return { text: "Hmm, can you explain that differently?", evaluation: { depth_level: 0 } };
    }
  },
};
// ============================================================================
// ACHIEVEMENTS
// ============================================================================
const ACHIEVEMENTS = [
  { id: 'first-lesson', title: 'First Steps', description: 'Complete your first lesson', emoji: '🌱',
    condition: (data) => (data.completedLessons?.length || 0) >= 1 },
  { id: 'depth-4', title: 'True Understanding', description: 'Reach depth 4 on any lesson', emoji: '🧠',
    condition: (data) => Object.values(data.depthLevels || {}).some(d => d >= 4) },
  { id: 'streak-7', title: 'Weekly Warrior', description: '7-day streak', emoji: '🔥',
    condition: (data) => (data.streakData?.currentStreak || 0) >= 7 },
  { id: 'five-lessons', title: 'Getting Serious', description: 'Complete 5 lessons', emoji: '⚡',
    condition: (data) => (data.completedLessons?.length || 0) >= 5 },
  { id: 'debugger', title: 'Bug Hunter', description: 'Complete a debug lesson', emoji: '🐛',
    condition: (data) => (data.completedLessons || []).some(id => id.startsWith('debug-')) },
  { id: 'xp-5000', title: 'XP Hoarder', description: 'Earn 5,000 XP', emoji: '💰',
    condition: (data) => (data.totalXP || 0) >= 5000 },
  { id: 'streak-30', title: 'Monthly Master', description: '30-day streak', emoji: '👑',
    condition: (data) => (data.streakData?.longestStreak || 0) >= 30 },
];

// ============================================================================
// TIMED CHALLENGES
// ============================================================================
const CHALLENGES = [
  {
    id: 'challenge-1', title: 'The Silent Failure', timeLimit: 600, difficulty: 'medium', xpReward: 300,
    scenario: `Your e-commerce API returns 200 OK for all requests, but customers report that orders placed after 11 PM are never fulfilled. The order table shows these orders with status "pending". The fulfillment service logs show no errors. The cron job that processes pending orders runs every hour.`,
    clues: [
      'The server timezone is UTC', 'Customers are in EST (UTC-5)',
      "The cron job query: SELECT * FROM orders WHERE status='pending' AND created_at >= CURRENT_DATE",
      'CURRENT_DATE in PostgreSQL returns the date in the server timezone',
    ],
    rootCause: 'CURRENT_DATE in UTC means orders placed between 7-11:59 PM EST fall on the next UTC date and get missed by the cron.',
    principlesTested: ['timezone handling', 'cron edge cases', 'SQL date functions'],
  },
  {
    id: 'challenge-2', title: 'The Memory Leak', timeLimit: 900, difficulty: 'hard', xpReward: 500,
    scenario: `Your Node.js API restarts every ~4 hours in production. Memory grows linearly. Same code runs fine in staging (10x less traffic). Issue started after deploying a caching feature.`,
    clues: [
      'Cache uses a Map() object', 'Keys are user_id + request_path',
      'No TTL or max size on cache', '50,000 unique users/hour in prod', '500 test users in staging',
    ],
    rootCause: 'Unbounded cache growth. Map grows without eviction. Need TTL, max size, or LRU cache.',
    principlesTested: ['memory management', 'cache eviction', 'prod vs staging parity'],
  },
  {
    id: 'challenge-3', title: 'The Race Condition', timeLimit: 600, difficulty: 'hard', xpReward: 500,
    scenario: `Your payment system occasionally charges customers twice (~0.1% of the time). Code checks if payment exists before creating. Only happens during flash sales.`,
    clues: [
      'Code: if (!await Payment.findOne({orderId})) await Payment.create({orderId, amount})',
      'PostgreSQL with READ COMMITTED isolation', 'Not wrapped in a transaction',
      'Flash sales cause 100x concurrent requests',
    ],
    rootCause: 'TOCTOU race condition. Two requests both check, both get null, both create. Fix: unique constraint + transaction.',
    principlesTested: ['concurrency', 'database isolation', 'TOCTOU'],
  },
];
// ============================================================================
// YOUTUBE PLAYER
// ============================================================================
const YouTubePlayerComponent = ({ videoId, onClose }) => {
  const [playing, setPlaying] = useState(true);
  const [error, setError] = useState(false);
  const openInYouTube = async () => {
    await Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
    onClose();
  };
  if (error) {
    return (
      <Modal visible={true} animationType="slide" onRequestClose={onClose}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={styles.videoHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeVideoBtn}>
              <Text style={styles.closeVideoBtnText}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.videoError}>
            <Text style={styles.videoErrorText}>Video unavailable</Text>
            <TouchableOpacity onPress={openInYouTube} style={styles.videoRetryBtn}>
              <Text style={styles.videoRetryBtnText}>Open in YouTube</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }
  return (
    <Modal visible={true} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
        <View style={styles.videoHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeVideoBtn}>
            <Text style={styles.closeVideoBtnText}>✕ Close</Text>
          </TouchableOpacity>
          <Text style={styles.videoTitle}>Watch Video</Text>
          <TouchableOpacity onPress={openInYouTube} style={styles.closeVideoBtn}>
            <Text style={styles.closeVideoBtnText}>Open ↗</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <YoutubePlayer
            height={width * 0.5625}
            width={width}
            play={playing}
            videoId={videoId}
            onError={() => setError(true)}
            onChangeState={(state) => { if (state === 'ended') setPlaying(false); }}
            webViewProps={{ allowsInlineMediaPlayback: true }}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};
// ============================================================================
// EVIDENCE BOARD
// ============================================================================
const EvidenceBoard = ({ scenario, onRevealClue }) => {
  const [revealedClues, setRevealedClues] = useState(
    scenario.clues.filter(c => c.revealed).map(c => c.id)
  );
  const [selectedClueIds, setSelectedClueIds] = useState([]);
  const toggleSelect = (clueId) => {
    if (!revealedClues.includes(clueId)) {
      setRevealedClues(prev => [...prev, clueId]);
      if (onRevealClue) onRevealClue(clueId);
      return;
    }
    setSelectedClueIds(prev =>
      prev.includes(clueId) ? prev.filter(id => id !== clueId) : [...prev, clueId]
    );
  };
  return (
    <View style={evidenceStyles.board}>
      <Text style={evidenceStyles.title}>🔍 Evidence Board</Text>
      <Text style={evidenceStyles.subtitle}>Tap cards to reveal clues. Select to link to hypothesis.</Text>
      <View style={evidenceStyles.clueGrid}>
        {scenario.clues.map(clue => {
          const isRevealed = revealedClues.includes(clue.id);
          const isSelected = selectedClueIds.includes(clue.id);
          return (
            <TouchableOpacity key={clue.id}
              style={[evidenceStyles.clueCard, isRevealed && evidenceStyles.clueCardRevealed, isSelected && evidenceStyles.clueCardSelected]}
              onPress={() => toggleSelect(clue.id)} activeOpacity={0.7}>
              {isRevealed ? (
                <>
                  <Text style={evidenceStyles.clueLabel}>{clue.label}</Text>
                  <Text style={evidenceStyles.clueValue}>{clue.value}</Text>
                  {isSelected && <Text style={evidenceStyles.clueLinked}>✓ Linked</Text>}
                </>
              ) : (
                <>
                  <Text style={evidenceStyles.clueHidden}>?</Text>
                  <Text style={evidenceStyles.clueTapHint}>Tap to reveal</Text>
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={evidenceStyles.statsRow}>
        <Text style={evidenceStyles.statsText}>{revealedClues.length}/{scenario.clues.length} clues revealed</Text>
        <Text style={evidenceStyles.statsText}>{selectedClueIds.length} linked</Text>
      </View>
    </View>
  );
};

const evidenceStyles = StyleSheet.create({
  board: { padding: 16, backgroundColor: COLORS.surface, borderRadius: 12, marginHorizontal: 16, marginVertical: 8, borderWidth: 1, borderColor: COLORS.border },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginBottom: 16 },
  clueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  clueCard: { width: (width - 74) / 2, backgroundColor: COLORS.surfaceLight, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: COLORS.border, minHeight: 90, justifyContent: 'center' },
  clueCardRevealed: { borderColor: COLORS.info, backgroundColor: '#1e293b' },
  clueCardSelected: { borderColor: COLORS.success, borderWidth: 2 },
  clueLabel: { fontSize: 11, fontWeight: '600', color: COLORS.info, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  clueValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  clueLinked: { fontSize: 11, color: COLORS.success, marginTop: 6, fontWeight: '600' },
  clueHidden: { fontSize: 28, color: COLORS.textMuted, textAlign: 'center', fontWeight: '700' },
  clueTapHint: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  statsText: { fontSize: 12, color: COLORS.textMuted },
});

// ============================================================================
// STREAK BANNER
// ============================================================================
const StreakBanner = ({ streakData }) => {
  if (!streakData || streakData.currentStreak === 0) return null;
  const getEmoji = (s) => { if (s >= 30) return '👑'; if (s >= 14) return '🔥'; if (s >= 7) return '⚡'; if (s >= 3) return '💪'; return '✨'; };
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.now() - (6 - i) * 86400000);
    const key = date.toISOString().split('T')[0];
    return { day: date.toLocaleDateString('en', { weekday: 'narrow' }), active: (streakData.weeklyActivity?.[key] || 0) > 0 };
  });
  return (
    <View style={streakStyles.banner}>
      <View style={streakStyles.streakRow}>
        <Text style={streakStyles.streakEmoji}>{getEmoji(streakData.currentStreak)}</Text>
        <View>
          <Text style={streakStyles.streakCount}>{streakData.currentStreak} day streak</Text>
          <Text style={streakStyles.streakBest}>Best: {streakData.longestStreak} days</Text>
        </View>
      </View>
      <View style={streakStyles.weekRow}>
        {last7Days.map((d, i) => (
          <View key={i} style={streakStyles.dayCol}>
            <View style={[streakStyles.dayDot, d.active && streakStyles.dayDotActive]}>
              {d.active && <Text style={streakStyles.dayCheck}>✓</Text>}
            </View>
            <Text style={streakStyles.dayLabel}>{d.day}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const streakStyles = StyleSheet.create({
  banner: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  streakEmoji: { fontSize: 32 },
  streakCount: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  streakBest: { fontSize: 12, color: COLORS.textMuted },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around' },
  dayCol: { alignItems: 'center', gap: 4 },
  dayDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  dayDotActive: { borderColor: COLORS.success, backgroundColor: COLORS.success + '30' },
  dayCheck: { fontSize: 12, color: COLORS.success, fontWeight: '700' },
  dayLabel: { fontSize: 10, color: COLORS.textMuted },
});

// ============================================================================
// ACHIEVEMENT TOAST
// ============================================================================
const AchievementToast = ({ achievement, onDismiss }) => {
  useEffect(() => {
    Vibration.vibrate([0, 100, 50, 100]);
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <View style={achievementStyles.toast}>
      <Text style={achievementStyles.toastEmoji}>{achievement.emoji}</Text>
      <View>
        <Text style={achievementStyles.toastTitle}>Achievement Unlocked!</Text>
        <Text style={achievementStyles.toastName}>{achievement.title}</Text>
        <Text style={achievementStyles.toastDesc}>{achievement.description}</Text>
      </View>
    </View>
  );
};

const achievementStyles = StyleSheet.create({
  toast: { position: 'absolute', top: 60, left: 20, right: 20, backgroundColor: COLORS.gold + '20', borderWidth: 1, borderColor: COLORS.gold, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, zIndex: 999 },
  toastEmoji: { fontSize: 36 },
  toastTitle: { fontSize: 11, fontWeight: '700', color: COLORS.gold, textTransform: 'uppercase', letterSpacing: 1 },
  toastName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  toastDesc: { fontSize: 12, color: COLORS.textSecondary },
});

// ============================================================================
// CHALLENGE TIMER
// ============================================================================
const ChallengeTimer = ({ timeLimit, onExpire }) => {
  const [remaining, setRemaining] = useState(timeLimit);
  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(interval); onExpire(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const urgent = remaining < 60;
  return (
    <View style={[timerStyles.container, urgent && timerStyles.urgent]}>
      <Text style={[timerStyles.time, urgent && timerStyles.timeUrgent]}>
        {mins}:{secs.toString().padStart(2, '0')}
      </Text>
    </View>
  );
};

const timerStyles = StyleSheet.create({
  container: { backgroundColor: COLORS.surfaceLight, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  urgent: { borderColor: COLORS.danger, backgroundColor: COLORS.danger + '20' },
  time: { fontFamily: TYPOGRAPHY.mono, fontSize: 16, fontWeight: '700', color: COLORS.text },
  timeUrgent: { color: COLORS.danger },
});

// ============================================================================
// REVIEW SESSION
// ============================================================================
const ReviewSession = ({ cards, onComplete, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [aiEval, setAiEval] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  const card = cards[currentIndex];
  if (!card) return null;
  const progress = ((currentIndex) / cards.length) * 100;

  const evaluateAnswer = async () => {
    setEvaluating(true);
    try {
      const prompt = `Evaluate answer to review card.\nQUESTION: ${card.front}\nIDEAL: ${card.back}\nSTUDENT: "${userAnswer}"\nRate 0-5. Return JSON: { "quality": 0-5, "feedback": "1-2 sentences", "keyInsight": "one thing to remember" }`;
      const raw = await callGemini(prompt);
      setAiEval(JSON.parse(raw));
      setShowAnswer(true);
    } catch (e) { setShowAnswer(true); }
    finally { setEvaluating(false); }
  };

  const rateAndContinue = (quality) => {
    const newResults = [...results, { cardId: card.id, quality }];
    setResults(newResults);
    setShowAnswer(false); setUserAnswer(''); setAiEval(null);
    if (currentIndex + 1 >= cards.length) { onComplete(newResults); }
    else { setCurrentIndex(prev => prev + 1); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ height: 3, backgroundColor: COLORS.border }}>
        <View style={{ height: 3, backgroundColor: COLORS.success, width: `${progress}%` }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
        <TouchableOpacity onPress={onExit}><Text style={{ fontSize: 20, color: COLORS.textMuted }}>✕</Text></TouchableOpacity>
        <Text style={{ fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' }}>{currentIndex + 1}/{cards.length}</Text>
        <View style={{ backgroundColor: COLORS.surfaceLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
          <Text style={{ fontSize: 11, color: COLORS.info, fontWeight: '600', textTransform: 'uppercase' }}>{card.type}</Text>
        </View>
      </View>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={{ backgroundColor: COLORS.surface, borderRadius: 16, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border }}>
          <Text style={{ fontSize: 18, color: COLORS.text, lineHeight: 26, fontWeight: '500' }}>{card.front}</Text>
        </View>
        {!showAnswer && (
          <View>
            <TextInput style={{ backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 16, color: COLORS.text, fontSize: 15, minHeight: 100, textAlignVertical: 'top', marginBottom: 12 }}
              value={userAnswer} onChangeText={setUserAnswer} placeholder="Type your answer..." placeholderTextColor={COLORS.textMuted} multiline />
            <TouchableOpacity style={[{ backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 14, alignItems: 'center' }, !userAnswer.trim() && { opacity: 0.4 }]}
              onPress={evaluateAnswer} disabled={!userAnswer.trim() || evaluating}>
              <Text style={{ color: COLORS.bg, fontWeight: '700', fontSize: 15 }}>{evaluating ? 'Evaluating...' : 'Check Answer'}</Text>
            </TouchableOpacity>
          </View>
        )}
        {showAnswer && (
          <View>
            {aiEval && (
              <View style={{ backgroundColor: COLORS.surfaceLight, borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>{aiEval.quality >= 3 ? '✅' : '🔄'} Score: {aiEval.quality}/5</Text>
                <Text style={{ fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 8 }}>{aiEval.feedback}</Text>
                <Text style={{ fontSize: 13, color: COLORS.gold, fontStyle: 'italic' }}>💡 {aiEval.keyInsight}</Text>
              </View>
            )}
            <View style={{ backgroundColor: '#14532d20', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.success + '40' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.success, letterSpacing: 1, marginBottom: 8 }}>IDEAL ANSWER</Text>
              <Text style={{ fontSize: 14, color: COLORS.text, lineHeight: 22 }}>{card.back}</Text>
            </View>
            <Text style={{ fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 12 }}>How well did you know this?</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[{ q: 1, label: 'Forgot', color: COLORS.danger }, { q: 3, label: 'Hard', color: COLORS.warning }, { q: 4, label: 'Good', color: COLORS.info }, { q: 5, label: 'Easy', color: COLORS.success }].map(({ q, label, color }) => (
                <TouchableOpacity key={q} style={{ flex: 1, borderWidth: 1, borderColor: color, borderRadius: 10, paddingVertical: 14, alignItems: 'center' }} onPress={() => rateAndContinue(q)}>
                  <Text style={{ fontWeight: '700', fontSize: 13, color }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================================
// GURU JOURNAL
// ============================================================================
const GuruJournal = ({ lessonId, onClose }) => {
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState('');
  const [entryType, setEntryType] = useState('insight');
  useEffect(() => { loadEntries(); }, []);
  const loadEntries = async () => {
    try { const data = await AsyncStorage.getItem(`@journal_${lessonId}`); if (data) setEntries(JSON.parse(data)); } catch (e) {}
  };
  const saveEntry = async () => {
    if (!newEntry.trim()) return;
    const entry = { id: Date.now().toString(), text: newEntry.trim(), type: entryType, timestamp: new Date().toISOString(), lessonId };
    const updated = [entry, ...entries];
    setEntries(updated); setNewEntry('');
    await AsyncStorage.setItem(`@journal_${lessonId}`, JSON.stringify(updated));
  };
  const typeConfig = {
    insight: { emoji: '💡', label: 'Insight', color: COLORS.gold },
    question: { emoji: '❓', label: 'Question', color: COLORS.info },
    connection: { emoji: '🔗', label: 'Connection', color: COLORS.success },
  };
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.text }}>📓 Guru Journal</Text>
          <TouchableOpacity onPress={onClose}><Text style={{ fontSize: 16, color: COLORS.info, fontWeight: '600' }}>Done</Text></TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 8 }}>
          {Object.entries(typeConfig).map(([key, config]) => (
            <TouchableOpacity key={key} style={[{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' }, entryType === key && { borderColor: config.color, backgroundColor: config.color + '15' }]} onPress={() => setEntryType(key)}>
              <Text style={{ fontSize: 12, color: COLORS.text, fontWeight: '600' }}>{config.emoji} {config.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 }}>
          <TextInput style={{ flex: 1, backgroundColor: COLORS.surface, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, padding: 12, color: COLORS.text, fontSize: 14, minHeight: 50 }}
            value={newEntry} onChangeText={setNewEntry} placeholder="What did you realize?" placeholderTextColor={COLORS.textMuted} multiline />
          <TouchableOpacity style={[{ backgroundColor: COLORS.accent, borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' }, !newEntry.trim() && { opacity: 0.3 }]} onPress={saveEntry} disabled={!newEntry.trim()}>
            <Text style={{ color: COLORS.bg, fontWeight: '700' }}>Add</Text>
          </TouchableOpacity>
        </View>
        <FlatList data={entries} keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const config = typeConfig[item.type];
            return (
              <View style={{ backgroundColor: COLORS.surface, borderRadius: 10, padding: 14, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: config.color, marginHorizontal: 16 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', marginBottom: 4, color: COLORS.textMuted }}>{config.emoji} {config.label}</Text>
                <Text style={{ fontSize: 14, color: COLORS.text, lineHeight: 20 }}>{item.text}</Text>
                <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 6 }}>{new Date(item.timestamp).toLocaleDateString()}</Text>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: COLORS.textMuted, marginTop: 40, fontSize: 14 }}>Your journal is empty. Start capturing insights! 💡</Text>}
        />
      </SafeAreaView>
    </Modal>
  );
};
const CURRICULUM = {
  'ai-engineering': {
    id: 'ai-engineering',
    name: 'AI Engineering',
    description: 'Master the systems that power modern AI',
    lessons: [
      {
        id: 'llm-from-scratch',
        title: 'Large Language Models from Scratch',
        subtitle: 'The complete picture of how LLMs actually work',
        category: 'AI Engineering',
        creator: 'Andrej Karpathy',
        duration: '60 min',
        xp: 600,
        thumbnail: 'https://img.youtube.com/vi/zjkBMFhNj_g/maxresdefault.jpg',
        videoId: 'zjkBMFhNj_g',
        mode: 'concept',
        coreQuestion: "If LLMs are 'just' predicting the next token, how do they exhibit reasoning, creativity, and apparent understanding?",
        openingMessage: "An LLM is trained with a simple objective: predict the next word. Yet GPT-4 can write poetry, debug code, and explain quantum physics. There's a profound gap between 'predict next token' and 'appear intelligent.' I want you to think deeply: what happens during training that bridges this gap? What does the model actually learn when it learns to predict text?",
        firstPrinciples: [
          "Prediction requires compression — to predict well, you must model the underlying structure",
          "Language encodes world knowledge — predicting language means modeling reality",
          "Scale changes capabilities discontinuously — emergent abilities appear at thresholds",
          "The training objective shapes the learned representation",
          "Tokenization determines what the model can 'see' and reason about",
        ],
        surfaceAnswers: [
          "It learns patterns from lots of data",
          "It's just autocomplete",
          "More parameters means smarter",
          "It memorizes the training data",
        ],
      },
      {
        id: 'build-gpt',
        title: 'Let\'s Build GPT from Scratch',
        subtitle: 'Implementing transformers line by line',
        category: 'AI Engineering',
        creator: 'Andrej Karpathy',
        duration: '120 min',
        xp: 800,
        thumbnail: 'https://img.youtube.com/vi/kCc8FmEb1nY/maxresdefault.jpg',
        videoId: 'kCc8FmEb1nY',
        mode: 'code',
        coreQuestion: "Why does the specific architecture of transformers — attention, layer norms, residual connections — work so remarkably well?",
        openingMessage: "We're going to build a GPT from scratch. But I don't want you to just follow along — I want you to understand why each piece exists. The transformer architecture wasn't handed down from heaven; it was engineered through insight and experimentation. Every component solves a specific problem. What problems does self-attention solve that RNNs couldn't? Why do we need layer normalization? Why residual connections?",
        firstPrinciples: [
          "Attention computes dynamic, content-based routing of information",
          "Residual connections enable gradient flow and ensemble-like behavior",
          "Layer normalization stabilizes training dynamics",
          "Position encodings inject sequence order into a permutation-invariant architecture",
          "The feedforward layers provide per-position nonlinear transformation capacity",
        ],
        surfaceAnswers: [
          "Just follow the architecture diagram",
          "Use PyTorch's nn.Transformer",
          "Attention helps the model focus",
          "More layers = more abstraction",
        ],
      },
      {
        id: 'neural-networks-fundamentals',
        title: 'Neural Networks: The Math You Need',
        subtitle: 'Backpropagation and gradient descent from first principles',
        category: 'AI Engineering',
        creator: '3Blue1Brown',
        duration: '60 min',
        xp: 500,
        thumbnail: 'https://img.youtube.com/vi/aircAruvnKk/maxresdefault.jpg',
        videoId: 'aircAruvnKk',
        mode: 'concept',
        coreQuestion: "How can adjusting millions of random numbers through calculus lead to systems that recognize faces, understand speech, and generate art?",
        openingMessage: "A neural network starts as random noise — millions of numbers with no meaning. After training, those same numbers encode knowledge: how to recognize a cat, how to translate French, how to play chess. The only tool we use is calculus — specifically, gradients. How does following gradients in a million-dimensional space lead to intelligence? What makes this work?",
        firstPrinciples: [
          "Gradients point toward locally better solutions in parameter space",
          "Composition of simple functions creates expressive power",
          "The loss landscape's geometry determines what solutions are reachable",
          "Representations emerge: networks learn useful coordinate systems for data",
          "Generalization requires the loss landscape to have good inductive biases",
        ],
        surfaceAnswers: [
          "Backpropagation adjusts weights",
          "Use gradient descent to minimize loss",
          "Deep networks learn hierarchical features",
          "Just use Adam optimizer",
        ],
      },
      {
        id: 'rag-systems',
        title: 'RAG Systems: Retrieval Augmented Generation',
        subtitle: 'Giving LLMs access to knowledge',
        category: 'AI Engineering',
        creator: 'AI Engineering',
        duration: '45 min',
        xp: 550,
        thumbnail: 'https://img.youtube.com/vi/T-D1OfcDW1M/maxresdefault.jpg',
        videoId: 'T-D1OfcDW1M',
        mode: 'code',
        coreQuestion: "Why is retrieval + generation more powerful than either alone, and what are the fundamental tradeoffs in RAG system design?",
        openingMessage: "LLMs have a knowledge cutoff and hallucinate facts. The obvious solution: let them search for information. But RAG systems are surprisingly tricky to get right. Chunking strategies, embedding models, reranking, context window management — each choice has deep implications. What makes retrieval hard? Why can't we just 'search and append'?",
        firstPrinciples: [
          "Retrieval converts an open-domain problem into a closed-domain one",
          "Embedding similarity is not semantic equivalence",
          "Chunk boundaries determine what knowledge is retrievable",
          "Context window is a fixed budget — retrieval competes with reasoning space",
          "The retriever and generator must be calibrated: garbage in, garbage out",
        ],
        surfaceAnswers: [
          "Use vector databases for semantic search",
          "Chunk documents and embed them",
          "Just stuff context into the prompt",
          "Use LangChain",
        ],
      },
      {
        id: 'ai-agents',
        title: 'Building AI Agents That Actually Work',
        subtitle: 'From chatbots to autonomous systems',
        category: 'AI Engineering',
        creator: 'AI Engineering',
        duration: '50 min',
        xp: 600,
        thumbnail: 'https://img.youtube.com/vi/sal78ACtGTc/maxresdefault.jpg',
        videoId: 'sal78ACtGTc',
        mode: 'code',
        coreQuestion: "What's the difference between an LLM that uses tools and a true agent? What enables autonomy?",
        openingMessage: "Everyone's building 'AI agents' but most are just chatbots with function calling. A true agent has a goal, makes plans, takes actions, observes results, and adapts. It persists across sessions. It handles failure. What architectures enable genuine agency? What are the hard problems that make agents brittle? When do agents work, and when do they fail spectacularly?",
        firstPrinciples: [
          "Agency requires a goal representation and progress measurement",
          "Planning over actions is harder than planning over tokens",
          "Tools extend capabilities but increase failure modes",
          "Memory systems determine what context persists",
          "Agents need uncertainty quantification to know when to ask for help",
        ],
        surfaceAnswers: [
          "Use function calling / tool use",
          "Chain prompts together",
          "Give the LLM a system prompt",
          "Use an agent framework",
        ],
      },
      {
        id: 'prompt-engineering-deep',
        title: 'Prompt Engineering: The Hidden Complexity',
        subtitle: 'Why prompts work and when they fail',
        category: 'AI Engineering',
        creator: 'AI Engineering',
        duration: '40 min',
        xp: 450,
        thumbnail: 'https://img.youtube.com/vi/jC4v5AS4RIM/maxresdefault.jpg',
        videoId: 'jC4v5AS4RIM',
        mode: 'concept',
        coreQuestion: "Why do small changes in prompt wording cause dramatically different outputs? What's actually happening?",
        openingMessage: "Add 'think step by step' and accuracy jumps 30%. Rephrase a question and the model contradicts itself. Temperature 0 still gives different outputs. Prompting looks like magic or voodoo, but there's structure underneath. The prompt selects which 'computation' the model runs. How do we think about this systematically? What determines whether a prompt will work?",
        firstPrinciples: [
          "Prompts select among the model's learned behaviors/capabilities",
          "In-context learning is approximate Bayesian inference",
          "Token-level probability != task-level reliability",
          "The model's training distribution determines what prompts work",
          "Few-shot examples establish a prior over response format and content",
        ],
        surfaceAnswers: [
          "Be specific and clear",
          "Use examples",
          "Tell it to think step by step",
          "Try different phrasings",
        ],
      },
      {
        id: 'llm-eval-safety',
        title: 'Evaluating and Hardening LLM Systems',
        subtitle: 'From happy-path demos to production safety',
        category: 'AI Engineering',
        creator: 'AI Engineering',
        duration: '45 min',
        xp: 550,
        thumbnail: 'https://img.youtube.com/vi/2IK3DFHRFfw/maxresdefault.jpg',
        videoId: '2IK3DFHRFfw',
        mode: 'concept',
        coreQuestion: "Why do LLM systems that look great in demos fail in real users' hands? What does it really mean to evaluate them?",
        openingMessage: "You build an LLM feature, test it with a few prompts, and it looks brilliant. Then you ship it and users immediately find failure cases you never imagined. Traditional unit tests and accuracy metrics aren't enough. What does a good evaluation strategy for LLM systems look like? How do you reason about safety, robustness, and misuse?",
        firstPrinciples: [
          "You get what you measure — metrics shape system behavior",
          "Coverage matters more than individual clever test cases",
          "Adversarial inputs reveal capabilities normal testing misses",
          "Guardrails must fail closed, not open, under uncertainty",
          "Human feedback is expensive; use it where it changes decisions",
        ],
        surfaceAnswers: [
          "Add more unit tests",
          "Just use OpenAI’s moderation API",
          "Lower temperature to make it safer",
          "Ask users to report bad behavior",
        ],
      },
      {
        id: 'mlops-foundations',
        title: 'MLOps Foundations for LLM Products',
        subtitle: 'Shipping models as reliable products',
        category: 'AI Engineering',
        creator: 'MLOps',
        duration: '50 min',
        xp: 600,
        thumbnail: 'https://img.youtube.com/vi/06-AZXmwHjo/maxresdefault.jpg',
        videoId: '06-AZXmwHjo',
        mode: 'code',
        coreQuestion: "Training a model is one thing. Keeping it correct, fast, and cheap in production is another. Why is MLOps its own discipline?",
        openingMessage: "Most ML projects die after the first demo. The model worked once on a notebook, but no one is confident enough to depend on it. Real ML systems have data drift, changing labels, retraining, rollbacks, and tight latency budgets. What changes when a model becomes a product surface instead of a research artifact?",
        firstPrinciples: [
          "Data distribution shifts over time; monitoring is mandatory",
          "Models and data are coupled — version both together",
          "Rollouts must be gradual and reversible",
          "Feedback loops can amplify small mistakes into large failures",
          "Cost and latency are product features, not infra details",
        ],
        practicalProject: {
          title: "The Drift Detector",
          description: "Build a monitoring system that detects when a model's input data has significantly changed from its training data.",
          steps: [
            "Create a 'baseline' distribution of features from a training dataset",
            "Simulate a 'drift' event by modifying the distribution of a key feature in a production stream",
            "Implement a statistical test (like Kolmogorov-Smirnov) to compare the distributions",
            "Trigger an alert when the drift exceeds a predefined threshold",
          ]
        },
        surfaceAnswers: [
          "Put the model behind an API",
          "Use CI/CD and you’re done",
          "Retrain once a month",
          "Scale with more GPUs if it’s slow",
        ],
      },
      {
        id: 'ai-product-thinking',
        title: 'AI Product Thinking',
        subtitle: 'Designing features around capabilities, not hype',
        category: 'AI Engineering',
        creator: 'Product Engineering',
        duration: '40 min',
        xp: 500,
        thumbnail: 'https://img.youtube.com/vi/3ZDSdMpczXE/maxresdefault.jpg',
        videoId: '3ZDSdMpczXE',
        mode: 'code',
        coreQuestion: "How do you build AI projects that solve real-world problems and demonstrate production-level engineering skills?",
        openingMessage: "The difference between a demo and a product is engineering. Most AI projects are just API calls in a notebook. But to build something valuable, you need to think about system architecture, data reliability, and user value. How do you select a project that matters? What engineering patterns should you follow to make it production-ready?",
        firstPrinciples: [
          "Start with a high-value problem, not a cool model",
          "Production AI requires robust data pipelines and evaluation",
          "The best AI projects solve a specific job-to-be-done",
          "User experience determines if AI intelligence is useful",
          "Reliability and latency are as important as accuracy",
        ],
        practicalProject: {
          title: "Production-Ready AI Agent",
          description: "Build an AI agent using SerpAPI and LangChain that can research a topic and generate a structured report.",
          steps: [
            "Setup SerpAPI for real-time web search access",
            "Implement an agentic loop (ReAct pattern) for iterative research",
            "Add a validation layer to check for hallucinations",
            "Deploy as a simple API with monitoring",
          ]
        },
        surfaceAnswers: [
          "Just use a popular model",
          "Build a generic chatbot",
          "Focus only on prompt engineering",
          "More features are always better",
        ],
      },
      {
        id: 'interpretability-ai-models',
        title: 'Interpretability of AI Models',
        subtitle: 'Understanding why AI makes the decisions it does',
        category: 'AI Engineering',
        creator: 'AI Ethics & Safety',
        duration: '50 min',
        xp: 600,
        thumbnail: 'https://img.youtube.com/vi/ZRckw_fE56Q/maxresdefault.jpg',
        videoId: 'ZRckw_fE56Q',
        mode: 'concept',
        coreQuestion: "If an AI model makes a critical decision, how can we understand the reasoning behind it, and why is this crucial for trust and safety?",
        openingMessage: "Modern AI models, especially deep neural networks, are often considered 'black boxes.' They provide predictions or actions, but their internal workings are opaque. In high-stakes applications like medicine or autonomous driving, simply knowing 'what' the AI decided isn't enough; we need to know 'why.' What are the fundamental challenges in opening these black boxes, and what methods exist to shed light on their decision-making processes?",
        firstPrinciples: [
          "Interpretability builds trust and facilitates debugging",
          "Local explanations focus on individual predictions; global on overall model behavior",
          "Trade-offs exist between model performance and interpretability",
          "Feature importance methods highlight influential inputs",
          "Counterfactual explanations show what minimal change would alter a prediction",
        ],
        practicalProject: {
          title: "Model Debugger with SHAP",
          description: "Use the SHAP library to explain the predictions of a complex Gradient Boosted Model (like XGBoost) and identify 'feature leak' or bias.",
          steps: [
            "Train a simple XGBoost model on a tabular dataset",
            "Generate SHAP values for individual predictions to see 'local' explanations",
            "Create summary plots to understand 'global' feature importance",
            "Identify a prediction where the model was 'confident but wrong' and explain why using SHAP",
          ]
        },
        surfaceAnswers: [
          "Just look at the code",
          "It's too complex to understand",
          "AI explains itself",
          "Only simple models are interpretable",
        ],
      },
      {
        id: 'adversarial-robustness-llms',
        title: 'Adversarial Robustness in LLMs',
        subtitle: 'Protecting models from malicious inputs and subtle attacks',
        category: 'AI Engineering',
        creator: 'AI Safety Research',
        duration: '55 min',
        xp: 650,
        thumbnail: 'https://img.youtube.com/vi/zqyue-KI6QM/maxresdefault.jpg',
        videoId: 'zqyue-KI6QM',
        mode: 'code',
        coreQuestion: "How do you systematically test and harden AI systems against malicious inputs using professional security tools?",
        openingMessage: "Adversarial robustness isn't just a theoretical problem; it's a security requirement for production AI. Hackers can use subtle perturbations to trick your model. We're going to look at how to use the Adversarial Robustness Toolbox (ART) to create attacks and, more importantly, build defenses. What are the common attack vectors? How do we measure a model's 'security margin'?",
        firstPrinciples: [
          "Security is a process of identifying and mitigating specific attack vectors",
          "Adversarial examples exploit the gap between model training and real-world noise",
          "Robustness must be measured quantitatively using standard benchmarks",
          "Defensive distillation and adversarial training are active hardening techniques",
          "A robust system fails gracefully when under attack",
        ],
        practicalProject: {
          title: "AI Security Hardening",
          description: "Use the Adversarial Robustness Toolbox (ART) to test a simple image classifier or LLM prompt against common adversarial attacks.",
          steps: [
            "Install and configure the ART library",
            "Generate 'fast gradient sign method' (FGSM) attacks against a model",
            "Evaluate the drop in model accuracy under attack",
            "Apply a preprocessing defense and remeasure the security margin",
          ]
        },
        surfaceAnswers: [
          "Just filter bad words",
          "Train on more diverse data",
          "Use a stronger LLM",
          "Add a warning label",
        ],
      },
    ],
  },
  
  'data-engineering': {
    id: 'data-engineering',
    name: 'Data Engineering',
    description: 'Build systems that move and transform data at scale',
    lessons: [
      {
        id: 'data-pipelines-first-principles',
        title: 'Data Pipelines: Why They\'re Hard',
        subtitle: 'The fundamental challenges of moving data',
        category: 'Data Engineering',
        creator: 'Data Engineering',
        duration: '40 min',
        xp: 500,
        thumbnail: 'https://img.youtube.com/vi/VtzvF17ysbc/maxresdefault.jpg',
        videoId: 'VtzvF17ysbc',
        mode: 'concept',
        coreQuestion: "Moving data from A to B seems trivial. Why do companies have entire teams dedicated to it?",
        openingMessage: "Here's a job: every hour, copy new rows from a production database to a warehouse. Sounds like a weekend project. But companies hire teams of engineers for this. What makes it hard? I want you to think through every way this could fail. Network issues? Schema changes? Duplicate data? Late arrivals? Each failure mode reveals a fundamental challenge of distributed data systems.",
        firstPrinciples: [
          "Distributed systems have no global clock — 'new' is ambiguous",
          "Networks are unreliable — partial failure is normal",
          "Schema is a contract — changes break downstream systems",
          "Idempotency: running twice must equal running once",
          "Exactly-once delivery is impossible; pick at-least-once or at-most-once",
        ],
        practicalProject: {
          title: "The Idempotent Loader",
          description: "Build a script that loads data from a CSV to a SQL database in a way that can be safely restarted at any time without creating duplicates.",
          steps: [
            "Create a database table with a 'natural key' (e.g., order_id)",
            "Implement a 'UPSERT' (Insert or Update) logic using SQL",
            "Simulate a network failure mid-upload and restart the script",
            "Verify that the final state of the database is correct with no duplicates",
          ]
        },
        surfaceAnswers: [
          "Use Airflow to schedule jobs",
          "Add retries and error handling",
          "Store everything in a data lake",
          "Use a managed ETL service",
        ],
      },
      {
        id: 'kafka-deep-dive',
        title: 'Apache Kafka: Distributed Streaming',
        subtitle: 'Understanding event streaming from first principles',
        category: 'Data Engineering',
        creator: 'Data Engineering',
        duration: '55 min',
        xp: 600,
        thumbnail: 'https://img.youtube.com/vi/Ch5VhJzaoaI/maxresdefault.jpg',
        videoId: 'Ch5VhJzaoaI',
        mode: 'concept',
        coreQuestion: "Why did Kafka become the backbone of modern data infrastructure? What problem does it solve that databases don't?",
        openingMessage: "LinkedIn built Kafka because databases weren't enough. They needed something that could handle millions of events per second while guaranteeing ordering and durability. Kafka treats data as a log — an append-only sequence of events. This simple abstraction turns out to be incredibly powerful. But why? What makes the log abstraction so fundamental?",
        firstPrinciples: [
          "The log is the fundamental data structure of distributed systems",
          "Ordering within a partition is guaranteed; across partitions is not",
          "Consumer groups enable parallel processing with coordination",
          "Retention policies determine how long history exists",
          "Compaction transforms logs into materialized state",
        ],
        practicalProject: {
          title: "Real-time Event Streamer",
          description: "Implement a producer-consumer system that handles real-time stock price updates using a log-based architecture.",
          steps: [
            "Set up a local Kafka or Redpanda instance",
            "Build a producer that emits simulated price events to a topic",
            "Build a consumer that calculates a 5-minute moving average",
            "Demonstrate how to scale by adding more consumers to the same group",
          ]
        },
        surfaceAnswers: [
          "Kafka is a message queue",
          "Use it for microservices communication",
          "It's faster than databases",
          "Just set up topics and partitions",
        ],
      },
      {
        id: 'data-modeling',
        title: 'Data Modeling for Analytics',
        subtitle: 'Star schemas, denormalization, and why structure matters',
        category: 'Data Engineering',
        creator: 'Data Engineering',
        duration: '45 min',
        xp: 500,
        thumbnail: 'https://img.youtube.com/vi/lWPiSZf7-uQ/maxresdefault.jpg',
        videoId: 'lWPiSZf7-uQ',
        mode: 'concept',
        coreQuestion: "Why do we model data differently for analytics than for applications? What tradeoffs are we making?",
        openingMessage: "In application databases, we normalize to avoid redundancy. In analytics, we denormalize aggressively. Same data, opposite approaches. Why? The answer lies in understanding what questions each system is optimized to answer. A normalized schema optimizes for writes and consistency. A star schema optimizes for analytical queries. What are we trading away in each case?",
        firstPrinciples: [
          "Normalization optimizes for write consistency; denormalization for read performance",
          "The grain of a fact table determines what questions are answerable",
          "Slowly changing dimensions capture history; the type determines how",
          "Conformed dimensions enable cross-domain analysis",
          "Pre-aggregation trades flexibility for speed",
        ],
        practicalProject: {
          title: "The Star Schema Architect",
          description: "Design a dimensional model (Star Schema) for a retail business to track sales, inventory, and customer behavior.",
          steps: [
            "Identify the 'Fact' (e.g., a sale) and its grain (one row per item per receipt)",
            "Design 'Dimension' tables for Products, Customers, and Dates",
            "Implement a 'Type 2' Slowly Changing Dimension for customer address changes",
            "Write a SQL query that joins the fact table with dimensions to calculate monthly revenue per category",
          ]
        },
        surfaceAnswers: [
          "Use star schema for warehouses",
          "Create fact and dimension tables",
          "Denormalize for performance",
          "Use dbt for transformations",
        ],
      },
      {
        id: 'distributed-sql',
        title: 'SQL Query Execution Deep Dive',
        subtitle: 'What happens when you run a query',
        category: 'Data Engineering',
        creator: 'Data Engineering',
        duration: '50 min',
        xp: 550,
        thumbnail: 'https://img.youtube.com/vi/BHwzDmr6d7s/maxresdefault.jpg',
        videoId: 'BHwzDmr6d7s',
        mode: 'code',
        coreQuestion: "Why can the same SQL query be fast or slow depending on how the optimizer chooses to execute it?",
        openingMessage: "You write SELECT * FROM orders JOIN customers ON... The database returns results. But between query and results, a complex planning process occurs. The optimizer considers dozens of execution plans, estimates costs, and picks one. Sometimes it picks wrong, and your query takes 100x longer than it should. Understanding the query planner is understanding why databases are fast or slow.",
        firstPrinciples: [
          "The optimizer transforms declarative SQL into imperative execution plans",
          "Cost estimation depends on statistics about data distribution",
          "Join order can change complexity from O(n) to O(n²)",
          "Indexes trade write overhead for read performance",
          "The optimizer can only choose among plans it considers",
        ],
        practicalProject: {
          title: "Query Optimizer Lab",
          description: "Analyze a 'slow' query in PostgreSQL or MySQL and use indexing and query rewriting to make it 100x faster.",
          steps: [
            "Create a table with 1 million rows of random data",
            "Run a complex JOIN query and use EXPLAIN ANALYZE to see the plan",
            "Identify a 'Sequential Scan' and replace it with an 'Index Scan'",
            "Rewrite a subquery as a JOIN to help the optimizer find a better path",
          ]
        },
        surfaceAnswers: [
          "Add indexes to make queries faster",
          "Use EXPLAIN to see the query plan",
          "Avoid SELECT *",
          "Denormalize to avoid joins",
        ],
      },
      {
        id: 'data-mesh-architectures',
        title: 'Data Mesh Architectures',
        subtitle: 'Decentralizing data ownership and governance',
        category: 'Data Engineering',
        creator: 'Zhamak Dehghani',
        duration: '60 min',
        xp: 700,
        thumbnail: 'https://img.youtube.com/vi/CDWp_xyCdzw/maxresdefault.jpg',
        videoId: 'CDWp_xyCdzw',
        mode: 'concept',
        coreQuestion: "Why is centralizing data ownership in a data lake or warehouse often insufficient for large, complex organizations, and how does data mesh propose a different paradigm?",
        openingMessage: "As organizations grow, central data teams become bottlenecks. Data lakes become swamps. Data Mesh proposes a radical shift: treat data as a product, owned by domain teams. This sounds great, but what are the fundamental challenges in decentralizing data? How do you ensure interoperability, governance, and quality across independent domains? What problems does it solve, and what new ones does it create?",
        firstPrinciples: [
          "Data as a product: discoverable, addressable, trustworthy, self-describing, secure",
          "Domain-oriented ownership: teams own their data end-to-end",
          "Self-serve data platform: infrastructure as a platform for data products",
          "Federated computational governance: global rules, local execution",
          "Interoperability through standardization: common formats and protocols",
        ],
        practicalProject: {
          title: "Data Product Blueprint",
          description: "Define the specification for a 'Sales Data Product' that follows Data Mesh principles.",
          steps: [
            "Define the 'Output Port' (e.g., an S3 bucket with Parquet files and a Glue Catalog entry)",
            "Specify the SLOs (Service Level Objectives) for data freshness and quality",
            "Implement a simple data quality check script using Great Expectations",
            "Create a 'Discovery' document that explains the data schema and lineage to other teams",
          ]
        },
        surfaceAnswers: [
          "Just use microservices for data",
          "It's about breaking up the data team",
          "Another name for distributed databases",
          "It's too complex for most companies",
        ],
      },

// ============================================================================
// ============================================================================
      {
        id: 'fde-mindset',
        title: 'The FDE Mindset',
        subtitle: 'Engineering at the customer frontier',
        category: 'Forward Deployed Engineering',
        creator: 'Palantir Engineering',
        duration: '35 min',
        xp: 450,
        thumbnail: 'https://img.youtube.com/vi/cdiD-9MMpb0/maxresdefault.jpg',
        videoId: 'cdiD-9MMpb0',
        mode: 'concept',
        coreQuestion: "Why do companies deploy their best engineers to sit with customers instead of building products at headquarters?",
        openingMessage: "Palantir sends senior engineers to work on-site with customers for months or years. Not support staff — their best people. This seems inefficient: why not build reusable products that scale? The answer reveals something deep about enterprise software. What do FDEs learn sitting with customers that product teams never see? When is custom work more valuable than scalable product?",
        firstPrinciples: [
          "The map is not the territory: specs differ from actual workflows",
          "Trust is earned through presence and delivered results",
          "Edge cases dominate: enterprise reality is messier than any abstraction",
          "Speed of iteration beats perfection of plan",
          "The person closest to the problem should have authority to solve it",
        ],
        practicalProject: {
          title: "The Workflow Shadow",
          description: "Perform a 'virtual shadow' of a user's workflow and design a tool that removes their biggest friction point.",
          steps: [
            "Interview a 'user' (could be a friend or colleague) about a repetitive task they do in Excel or a web tool",
            "Map out every click and decision point in their current process",
            "Identify one step that can be automated or simplified with a script",
            "Build a prototype (e.g., a Python script or simple web UI) and get their feedback",
          ]
        },
        surfaceAnswers: [
          "FDEs customize software for customers",
          "It's like consulting but technical",
          "They bridge product and customer needs",
          "Enterprise deals need hand-holding",
        ],
      },
      {
        id: 'rapid-prototyping',
        title: 'Rapid Prototyping Under Pressure',
        subtitle: 'Building solutions in hours, not months',
        category: 'Forward Deployed Engineering',
        creator: 'FDE Patterns',
        duration: '40 min',
        xp: 500,
        thumbnail: 'https://img.youtube.com/vi/ZXsQAXx_ao0/maxresdefault.jpg',
        videoId: 'ZXsQAXx_ao0',
        mode: 'code',
        coreQuestion: "How do you build something useful in days when normal development takes months?",
        openingMessage: "A customer has an urgent problem. They need a working solution by Friday. You have four days, incomplete requirements, and no existing codebase. How do you think about this? The FDE approach isn't 'work faster' — it's 'reframe the problem.' What's the minimal thing that solves the actual need? What can you defer? What assumptions can you validate in hours instead of weeks?",
        firstPrinciples: [
          "Scope is negotiable; time often isn't — find the minimal viable solution",
          "Working software beats comprehensive documentation",
          "Validate assumptions with prototypes, not meetings",
          "Technical debt is acceptable if you know you're taking it on",
          "The first solution won't be right — design for learning",
        ],
        practicalProject: {
          title: "The 24-Hour Prototype",
          description: "Build a functional prototype for a tool that solves a specific data problem (e.g., parsing messy logs) within a strict 24-hour time limit.",
          steps: [
            "Define the 'North Star' metric for the tool's success",
            "Identify the 80/20 of features (the 20% of work that gives 80% of value)",
            "Build the core engine using a high-level language (Python/Node)",
            "Demo the tool to a peer and list 3 things you would 'fix later' (intentional technical debt)",
          ]
        },
        surfaceAnswers: [
          "Work longer hours",
          "Use no-code tools",
          "Skip testing to go faster",
          "Copy existing solutions",
        ],
      },
      {
        id: 'system-design-reality',
        title: 'System Design in the Real World',
        subtitle: 'Beyond whiteboard interviews',
        category: 'Forward Deployed Engineering',
        creator: 'System Design',
        duration: '55 min',
        xp: 600,
        thumbnail: 'https://img.youtube.com/vi/i7twT3x5yv8/maxresdefault.jpg',
        videoId: 'i7twT3x5yv8',
        mode: 'concept',
        coreQuestion: "Why do elegant system designs fail when they meet production? What's different about real systems?",
        openingMessage: "System design interviews test a sanitized version of reality. In practice, you inherit legacy systems, work with incomplete requirements, face budget constraints, and deal with organizational politics. The beautiful microservices architecture might be wrong if your team is three people. How do you make design decisions that account for reality, not just technical elegance?",
        firstPrinciples: [
          "The best architecture depends on team size, skills, and organizational structure",
          "Constraints (budget, time, legacy) shape design more than ideals",
          "Operational complexity often outweighs development complexity",
          "Reversibility matters: prefer decisions you can undo",
          "The system includes humans: consider who maintains it",
        ],
        surfaceAnswers: [
          "Follow microservices best practices",
          "Use Kubernetes for everything",
          "Design for scale from day one",
          "Draw boxes and arrows",
        ],
      },

      {
        id: 'technical-communication',
        title: 'Technical Communication Mastery',
        subtitle: 'Explaining complex systems to anyone',
        category: 'Forward Deployed Engineering',
        creator: 'Engineering Leadership',
        duration: '35 min',
        xp: 450,
        thumbnail: 'https://img.youtube.com/vi/Unzc731iCUY/maxresdefault.jpg',
        videoId: 'Unzc731iCUY',
        mode: 'concept',
        coreQuestion: "Why do brilliant engineers often fail to communicate effectively? What separates great technical communicators?",
        openingMessage: "You understand a complex system deeply. Now explain it to: (1) an executive who wants to know if it's safe, (2) a customer who wants to know if it solves their problem, (3) a new engineer who needs to modify it. Same knowledge, three completely different explanations. What changes? How do you translate expertise into understanding for different audiences?",
        firstPrinciples: [
          "Communication is about the receiver, not the sender",
          "Analogies bridge from known to unknown",
          "Abstraction level must match audience expertise",
          "Stories stick better than specifications",
          "The curse of knowledge: experts forget what's confusing",
        ],
        practicalProject: {
          title: "The Expert-to-Layman Translation",
          description: "Take a complex technical concept (e.g., Paxos consensus) and explain it to three different personas.",
          steps: [
            "Write a 1-sentence 'Executive Summary' focusing on business risk and value",
            "Write a 1-paragraph explanation for a Product Manager using a real-world analogy",
            "Create a 3-step 'Mental Model' for a junior engineer to visualize the core logic",
            "Identify 2 'jargon' terms and replace them with plain English descriptions",
          ]
        },
        surfaceAnswers: [
          "Use simple words",
          "Make slides with diagrams",
          "Avoid jargon",
          "Be concise",
        ],
      },
      {
        id: 'observability-fdes',
        title: 'Observability for FDEs',
        subtitle: 'Seeing inside the black box of customer deployments',
        category: 'Forward Deployed Engineering',
        creator: 'FDE Patterns',
        duration: '45 min',
        xp: 550,
        thumbnail: 'https://img.youtube.com/vi/FZRpQOaePFU/maxresdefault.jpg',
        videoId: 'FZRpQOaePFU',
        mode: 'concept',
        coreQuestion: "How do you diagnose and fix problems in complex systems deployed in customer environments where you have limited access and control?",
        openingMessage: "When your software is running on a customer's infrastructure, you lose direct visibility. Logs are often inaccessible, metrics are sparse, and debugging tools are restricted. Yet, you're still responsible for ensuring the system works. What are the fundamental principles of building and leveraging observability in these constrained environments? How do you get the information you need to understand system behavior and troubleshoot issues without full access?",
        firstPrinciples: [
          "Telemetry must be designed in, not bolted on",
          "Logs, metrics, and traces provide complementary views",
          "Contextual information is crucial for understanding events",
          "Alerting should be actionable, not noisy",
          "Observability is a product feature for FDEs",
        ],
        practicalProject: {
          title: "The Air-Gapped Debugger",
          description: "Design a 'Diagnostic Bundle' for an application that can be generated with one command and contains everything needed to debug a crash without network access.",
          steps: [
            "Write a script that collects sanitized logs, environment variables, and system metrics",
            "Implement a 'Heartbeat' metric that indicates if the core process is alive",
            "Design a structured JSON format for errors that includes a 'Context ID' for trace linking",
            "Create a 'Troubleshooting Playbook' that maps specific error codes in the bundle to known fixes",
          ]
        },
        surfaceAnswers: [
          "Ask the customer for logs",
          "Just use print statements",
          "It's the customer's problem",
          "Hope it doesn't break",
        ],
      },
      {
        id: 'debug-rag-outage',
        title: 'The RAG System is Down',
        subtitle: 'Diagnose and fix a critical RAG system failure',
        category: 'AI Engineering',
        creator: 'Kesandu Guru',
        duration: '90 min',
        xp: 750,
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        videoId: 'dQw4w9WgXcQ',
        mode: 'debug',
        scenario: {
          description: "Your RAG system was working for 2 customers. You expanded to 7. Now summaries are wrong.",
          clues: [
            { id: 'clue-1', label: 'Token Usage', value: '3.5x pre-rollout', revealed: true },
            { id: 'clue-2', label: 'Redis Policy Change', value: 'allkeys-lru → volatile-lru', revealed: false },
            { id: 'clue-3', label: 'Error Rate', value: 'Validation rejections up 2.75x', revealed: false },
            { id: 'clue-4', label: 'Latency', value: 'Unchanged', revealed: false },
          ],
          rootCauses: [
            { id: 'rc-1', text: 'Context window overflow from increased data volume', difficulty: 'core' },
            { id: 'rc-2', text: 'Redis serving stale cached results', difficulty: 'intermediate' },
            { id: 'rc-3', text: 'Cross-tenant retrieval contamination', difficulty: 'advanced' },
          ],
        },
        evaluation: {
          depth_0: 'Lists generic causes without connecting to evidence',
          depth_1: 'Identifies one cause connected to a specific clue',
          depth_2: 'Identifies multiple causes with evidence-based reasoning',
          depth_3: 'Ranks causes by likelihood and explains the chain of failure',
          depth_4: 'Can predict what NEW symptoms each cause would produce',
        }
      },
    ],
  },
  'guru-labs': {
    id: 'guru-labs',
    name: 'Guru Labs',
    description: 'Deep-dive implementation projects for true mastery',
    lessons: [
      {
        id: 'transformer-from-scratch',
        title: 'Transformer from Scratch',
        titleSuffix: 'GURU LAB',
        subtitle: 'Coding the architecture that changed AI',
        category: 'Guru Labs',
        creator: 'Andrej Karpathy',
        duration: '120 min',
        xp: 2000,
        thumbnail: 'https://img.youtube.com/vi/kCc8FmEb1nY/maxresdefault.jpg',
        videoId: 'kCc8FmEb1nY',
        mode: 'code',
        coreQuestion: "How does the Transformer architecture actually work at the tensor level, and how can we implement it using only NumPy or PyTorch?",
        openingMessage: "To truly understand LLMs, you must build one. We aren't just using an API; we are building the Attention mechanism, the multi-head layers, and the positional encodings from nothing. This is the granular level of understanding that separates users from creators. Are you ready to dive into the math and the code?",
        firstPrinciples: [
          "Attention is a mechanism for weighted information routing",
          "Self-attention allows tokens to look at each other's context",
          "Positional encodings inject sequence order into set-based architectures",
          "Residual connections and layer normalization enable deep training",
          "The softmax function turns raw scores into probabilities",
        ],
        practicalProject: {
          title: "Build a Mini-GPT",
          description: "Follow Karpathy's 'nanogpt' approach to build a character-level language model that generates text in the style of Shakespeare.",
          steps: [
            "Implement the Bigram Language Model as a baseline",
            "Build the Multi-Head Attention module from scratch",
            "Compose the Transformer Block with residual connections",
            "Train the model on a GPU and observe loss convergence",
          ]
        },
        surfaceAnswers: [
          "Just use HuggingFace Transformers",
          "It's about having more data",
          "Attention is all you need is just a title",
          "GPT-4 is magic",
        ],
      },
      {
        id: 'containers-from-scratch',
        title: 'Containers from Scratch',
        titleSuffix: 'GURU LAB',
        subtitle: 'Building Docker-like isolation using Linux primitives',
        category: 'Guru Labs',
        creator: 'Liz Rice',
        duration: '45 min',
        xp: 3000,
        thumbnail: 'https://img.youtube.com/vi/8fi7uSYlOdc/maxresdefault.jpg',
        videoId: '8fi7uSYlOdc',
        mode: 'code',
        coreQuestion: "What actually is a 'container', and how does the Linux kernel keep processes from seeing each other?",
        openingMessage: "Containers aren't virtual machines. They are just regular processes with special 'blinkers' on. We are going to build a container from scratch using Go and Linux system calls. You'll see exactly how Namespaces isolate what a process can see, and how Cgroups limit what it can use. This is the low-level reality of modern cloud infrastructure.",
        firstPrinciples: [
          "Namespaces isolate system resources (PID, Net, Mount, UTS)",
          "Control Groups (cgroups) limit and meter resource usage (CPU, RAM)",
          "Chroot/PivotRoot isolates the file system view",
          "A container is just a process with restricted visibility and resources",
          "Images are just tarballs of root filesystems",
        ],
        practicalProject: {
          title: "The Mini-Container",
          description: "Write a small Go program that uses 'unshare' and 'pivot_root' to launch a shell in an isolated environment.",
          steps: [
            "Use the Cloneflags to create new PID and UTS namespaces",
            "Implement 'pivot_root' to give the container its own root filesystem",
            "Setup a basic proc filesystem inside the container",
            "Apply a memory limit using the cgroups filesystem",
          ]
        },
        surfaceAnswers: [
          "Containers are lightweight virtual machines",
          "Docker uses a hypervisor like VirtualBox",
          "Containers share the host's files by default",
          "Namespaces are only for networking",
        ],
      },
    ],
  },
};

// ============================================================================
// PERSISTENCE - UPDATED WITH STREAK
// ============================================================================
function useUserData() {
  const [data, setData] = useState({
    totalXP: 0, completedLessons: [], lessonProgress: {}, depthLevels: {},
  });
  const [streakData, setStreakData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [newAchievement, setNewAchievement] = useState(null);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('@kesandu_v4'),
      HabitEngine.getStreakData(),
    ]).then(([stored, streak]) => {
      if (stored) setData(JSON.parse(stored));
      setStreakData(streak);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem('@kesandu_v4', JSON.stringify(data));
  }, [data, loaded]);

  // Check achievements whenever data changes
  useEffect(() => {
    if (!loaded) return;
    const checkData = { ...data, streakData };
    const unlockedIds = new Set(data.unlockedAchievements || []);
    for (const ach of ACHIEVEMENTS) {
      if (!unlockedIds.has(ach.id) && ach.condition(checkData)) {
        setNewAchievement(ach);
        setData(d => ({ ...d, unlockedAchievements: [...(d.unlockedAchievements || []), ach.id] }));
        break;
      }
    }
  }, [data, streakData, loaded]);

  const completeLesson = useCallback(async (lessonId, xp, depthLevel) => {
    setData(d => ({
      ...d,
      totalXP: (d.completedLessons || []).includes(lessonId) ? d.totalXP : (d.totalXP || 0) + xp,
      completedLessons: (d.completedLessons || []).includes(lessonId) ? d.completedLessons : [...(d.completedLessons || []), lessonId],
      depthLevels: { ...(d.depthLevels || {}), [lessonId]: depthLevel },
    }));
    const updatedStreak = await HabitEngine.recordActivity();
    setStreakData(updatedStreak);
  }, []);

  const saveProgress = useCallback((lessonId, history) => {
    setData(d => ({
      ...d,
      lessonProgress: { ...(d.lessonProgress || {}), [lessonId]: { history, updatedAt: Date.now() } },
    }));
  }, []);

  return {
    totalXP: data.totalXP || 0,
    completedLessons: data.completedLessons || [],
    lessonProgress: data.lessonProgress || {},
    depthLevels: data.depthLevels || {},
    streakData,
    newAchievement, setNewAchievement,
    loaded, completeLesson, saveProgress,
  };
}
// ============================================================================
// DIALOGUE COMPONENT - SUPPORTS ALL MODES
// ============================================================================
const Dialogue = ({ lesson, userData, onExit }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [depth, setDepth] = useState(0);
  const [mastery, setMastery] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [mode, setMode] = useState(lesson.mode === 'debug' ? 'debug' : 'learn'); // learn, teach, debug
  const listRef = useRef(null);
  const isCompleted = (userData.completedLessons || []).includes(lesson.id);
  const isDebugMode = lesson.mode === 'debug';

  useEffect(() => {
    const openingText = isDebugMode
      ? `🔍 Investigation Mode\n\nScenario: ${lesson.scenario?.description || lesson.openingMessage}\n\nReview the Evidence Board above. Form a hypothesis and explain your reasoning.`
      : lesson.openingMessage;
    setTimeout(() => { setMessages([{ id: 'opening', role: 'ai', text: openingText }]); }, 300);
  }, [lesson]);

  const send = useCallback(async () => {
    if (!input.trim() || thinking) return;
    const userMsg = { id: `u${Date.now()}`, role: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput(''); setThinking(true); Keyboard.dismiss();
    try {
      let response;
      if (mode === 'teach') {
        response = await TeachingEngine.evaluate(lesson, userMsg.text, messages);
      } else if (isDebugMode) {
        const prompt = `You are evaluating debugging reasoning.\nSCENARIO: ${lesson.scenario?.description || ''}\nROOT CAUSES:\n${(lesson.scenario?.rootCauses || []).map(rc => `- ${rc.text}`).join('\n')}\nCONVERSATION:\n${messages.map(m => `${m.role === 'ai' ? 'Tutor' : 'Student'}: ${m.text}`).join('\n')}\nStudent: "${userMsg.text}"\nRespond Socratically (2-4 sentences). JSON: { "text": "response", "evaluation": { "depth_level": 0-4, "mastery_achieved": false, "can_teach_others": false } }`;
        const raw = await callGemini(prompt);
        response = JSON.parse(raw);
      } else {
        response = await FirstPrinciplesEngine.converse(userMsg.text, lesson, messages);
      }
      const aiMsg = { id: `a${Date.now()}`, role: 'ai', text: response.text };
      setMessages(prev => [...prev, aiMsg]);
      if (response.evaluation) {
        setDepth(response.evaluation.depth_level || 0);
        if (response.evaluation.can_teach_others || response.evaluation.mastery_achieved) {
          setMastery(true); Vibration.vibrate(100);
        }
      }
      userData.saveProgress(lesson.id, [...messages, userMsg, aiMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { id: `e${Date.now()}`, role: 'ai', text: 'Something went wrong. Please try again.' }]);
    } finally { setThinking(false); }
  }, [input, thinking, messages, lesson, userData, mode]);

  const claim = () => { if (!isCompleted) userData.completeLesson(lesson.id, lesson.xp, depth); onExit(); };
  const exchanges = messages.filter(m => m.role === 'user').length;

  const renderMessage = useCallback(({ item }) => {
    const isAi = item.role === 'ai';
    return (
      <View style={[styles.msgRow, !isAi && styles.msgRowUser]}>
        {isAi && <View style={styles.aiIndicator} />}
        <View style={[styles.msgBubble, isAi ? styles.aiBubble : styles.userBubble]}>
          <Text style={[styles.msgText, !isAi && styles.userText]}>{item.text}</Text>
        </View>
      </View>
    );
  }, []);

  const renderListHeader = () => {
    return (
      <View>
        {/* Mode Switcher (non-debug only) */}
        {!isDebugMode && (
          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 }}>
            <TouchableOpacity
              style={[{ flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' }, mode === 'learn' && { borderColor: COLORS.info, backgroundColor: COLORS.info + '15' }]}
              onPress={() => setMode('learn')}>
              <Text style={{ fontSize: 12, color: mode === 'learn' ? COLORS.info : COLORS.textMuted, fontWeight: '600' }}>🎓 Learn</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[{ flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' }, mode === 'teach' && { borderColor: COLORS.gold, backgroundColor: COLORS.gold + '15' }]}
              onPress={() => {
                setMode('teach');
                setMessages([{ id: 'teach-opening', role: 'ai', text: `Okay, I'm a student who knows nothing about "${lesson.title}". Can you teach me? Start from the beginning — what's the most important thing I need to understand?` }]);
              }}>
              <Text style={{ fontSize: 12, color: mode === 'teach' ? COLORS.gold : COLORS.textMuted, fontWeight: '600' }}>🧑‍🏫 Teach</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Evidence Board for debug mode */}
        {isDebugMode && lesson.scenario && (
          <EvidenceBoard scenario={lesson.scenario} onRevealClue={() => {}} />
        )}
        {/* Practical Project */}
        {lesson.practicalProject && (
          <View style={styles.projectPanel}>
            <Text style={styles.projectPanelTitle}>🛠 Project: {lesson.practicalProject.title}</Text>
            <Text style={styles.projectPanelDesc}>{lesson.practicalProject.description}</Text>
            <View style={styles.projectSteps}>
              {lesson.practicalProject.steps.map((step, idx) => (
                <View key={idx} style={styles.projectStep}>
                  <Text style={styles.projectStepNum}>{idx + 1}</Text>
                  <Text style={styles.projectStepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, alignSelf: 'center', width: IS_WEB ? Math.min(800, width) : '100%' }}>
        {showVideo && lesson.videoId && <YouTubePlayerComponent videoId={lesson.videoId} onClose={() => setShowVideo(false)} />}
        {showJournal && <GuruJournal lessonId={lesson.id} onClose={() => setShowJournal(false)} />}

        <View style={styles.dialogueHeader}>
        <TouchableOpacity onPress={onExit} style={styles.headerBtn}><Text style={styles.headerBtnText}>Close</Text></TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{isDebugMode ? '🔍 ' : ''}{lesson.title}</Text>
          <Text style={styles.headerMeta}>{isDebugMode ? 'Logic Lab' : mode === 'teach' ? 'Teaching' : `${exchanges} exchanges`} · Depth {depth}/4</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowJournal(true)}>
            <Text style={styles.headerBtnText}>📓</Text>
          </TouchableOpacity>
          {lesson.videoId && (
            <TouchableOpacity style={styles.headerBtn} onPress={() => setShowVideo(true)}>
              <Text style={styles.headerBtnText}>Video</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.depthBar}>
        {[0,1,2,3,4].map(i => (
          <View key={i} style={[styles.depthSegment, i <= depth && styles.depthSegmentActive, isDebugMode && i <= depth && { backgroundColor: COLORS.info }]} />
        ))}
      </View>

      <FlatList ref={listRef} data={messages} keyExtractor={item => item.id} renderItem={renderMessage}
        ListHeaderComponent={renderListHeader} contentContainerStyle={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })} />

      {thinking && (
        <View style={styles.thinkingRow}>
          <Text style={styles.thinkingText}>Thinking</Text>
          <ActivityIndicator size="small" color={COLORS.textMuted} />
        </View>
      )}

      <KeyboardAvoidingView behavior={IS_IOS ? 'padding' : undefined}>
        {mastery ? (
          <View style={styles.masteryBar}>
            <View style={styles.masteryContent}>
              <Text style={styles.masteryTitle}>{isDebugMode ? '🔍 Root Cause Found' : mode === 'teach' ? '🧑‍🏫 Great Teacher!' : 'First Principles Achieved'}</Text>
              <Text style={styles.masterySubtitle}>You've demonstrated deep understanding</Text>
            </View>
            <TouchableOpacity style={styles.claimBtn} onPress={claim}>
              <Text style={styles.claimBtnText}>{isCompleted ? 'Continue' : `Claim ${lesson.xp} XP`}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputRow}>
            <TextInput style={styles.textInput}
              placeholder={isDebugMode ? "What's causing this?" : mode === 'teach' ? "Explain it..." : "Think through your answer..."}
              placeholderTextColor={COLORS.textMuted} value={input} onChangeText={setInput} multiline maxLength={2000} />
            <TouchableOpacity style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} onPress={send} disabled={!input.trim() || thinking}>
              <Text style={styles.sendBtnText}>Send</Text>
            </TouchableOpacity>
          </View>
        )}
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};
// ============================================================================
// LESSON CARD
// ============================================================================
const LessonCard = ({ lesson, isCompleted, depthLevel, onPress, onWatchVideo }) => {
  return (
    <TouchableOpacity style={styles.lessonCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.lessonImageContainer}>
        <Image source={{ uri: lesson.thumbnail }} style={styles.lessonImage} />
        {lesson.mode === 'debug' && (
          <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: COLORS.danger, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>🐛 DEBUG</Text>
          </View>
        )}
        {lesson.videoId && (
          <TouchableOpacity style={styles.videoBtn} onPress={(e) => { e.stopPropagation(); onWatchVideo(lesson.videoId); }}>
            <Text style={styles.videoBtnText}>▶ Watch</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.lessonInfo}>
        <Text style={styles.lessonCategory}>{lesson.category}</Text>
        <Text style={styles.lessonTitle}>{lesson.title}</Text>
        <Text style={styles.lessonSubtitle}>{lesson.subtitle}</Text>
        {lesson.practicalProject && (
          <View style={styles.projectBadge}><Text style={styles.projectBadgeText}>🛠 Hands-on Project</Text></View>
        )}
        <View style={styles.lessonMeta}>
          <Text style={styles.lessonDuration}>{lesson.duration}</Text>
          <Text style={styles.lessonXP}>{lesson.xp} XP</Text>
          {isCompleted && <Text style={styles.lessonComplete}>Depth {depthLevel || 0}/4</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
};
// ============================================================================
// HOME SCREEN - UPDATED WITH ALL FEATURES
// ============================================================================
const HomeScreen = ({ userData, userProfile, onSelectLesson, onNavigateToDashboard }) => {
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [reviewCards, setReviewCards] = useState([]);
  const [loadingReview, setLoadingReview] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // home, interview, practice, portfolio, spaced, code, sync, challenges, achievements

  const allLessons = Object.values(CURRICULUM).flatMap(track => track.lessons);
  const recommendations = AdaptiveLearningEngine.getRecommendations(userData, CURRICULUM);
  const masteryScore = AdaptiveLearningEngine.getMasteryScore(userData, CURRICULUM);

  const filteredLessons = searchQuery.trim()
    ? allLessons.filter(l =>
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  const startReview = async (lesson) => {
    setLoadingReview(true);
    try {
      const depthLevel = userData.depthLevels?.[lesson.id] || 1;
      const result = await SpacedRepetitionEngine.generateReviewCards(lesson, depthLevel);
      if (result.cards && result.cards.length > 0) {
        setReviewCards(result.cards);
        setShowReview(true);
      }
    } catch (e) {
      console.error('Review generation failed:', e);
    } finally {
      setLoadingReview(false);
    }
  };

  const sections = Object.values(CURRICULUM).map(track => ({
    title: track.name,
    description: track.description,
    data: track.lessons,
  }));

  // ---- RENDER: Review Session ----
  if (showReview && reviewCards.length > 0) {
    return (
      <ReviewSession
        cards={reviewCards}
        onComplete={(results) => {
          setShowReview(false);
          setReviewCards([]);
        }}
        onExit={() => { setShowReview(false); setReviewCards([]); }}
      />
    );
  }

  // ---- RENDER: Challenges Tab ----
  const renderChallengesTab = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 4 }}>🏆 Logic Challenges</Text>
      <Text style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 20 }}>Timed debugging scenarios to test your skills</Text>
      {CHALLENGES.map(challenge => (
        <TouchableOpacity
          key={challenge.id}
          style={{
            backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, marginBottom: 12,
            borderWidth: 1, borderColor: COLORS.border,
          }}
          onPress={() => {
            // Create a lesson-like object from challenge for the Dialogue component
            const challengeLesson = {
              id: challenge.id,
              title: challenge.title,
              subtitle: challenge.scenario.substring(0, 60) + '...',
              category: 'Logic Challenge',
              duration: `${Math.floor(challenge.timeLimit / 60)} min`,
              xp: challenge.xpReward,
              mode: 'debug',
              openingMessage: challenge.scenario,
              coreQuestion: 'What is the root cause of this issue?',
              firstPrinciples: challenge.principlesTested,
              surfaceAnswers: [],
              scenario: {
                description: challenge.scenario,
                clues: challenge.clues.map((c, i) => ({
                  id: `clue-${i}`,
                  label: `Clue ${i + 1}`,
                  value: c,
                  revealed: i === 0,
                })),
                rootCauses: [{ id: 'rc-1', text: challenge.rootCause, difficulty: 'core' }],
              },
            };
            onSelectLesson(challengeLesson);
          }}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.text }}>{challenge.title}</Text>
            <View style={{
              paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
              backgroundColor: challenge.difficulty === 'hard' ? COLORS.danger + '20' : COLORS.warning + '20',
              borderWidth: 1,
              borderColor: challenge.difficulty === 'hard' ? COLORS.danger + '40' : COLORS.warning + '40',
            }}>
              <Text style={{
                fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
                color: challenge.difficulty === 'hard' ? COLORS.danger : COLORS.warning,
              }}>{challenge.difficulty}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, marginBottom: 12 }} numberOfLines={3}>
            {challenge.scenario}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, color: COLORS.textMuted }}>
              ⏱ {Math.floor(challenge.timeLimit / 60)} min
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.gold, fontWeight: '600' }}>
              {challenge.xpReward} XP
            </Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {challenge.principlesTested.map((p, i) => (
              <View key={i} style={{ backgroundColor: COLORS.surfaceLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, color: COLORS.textMuted }}>{p}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // ---- RENDER: Achievements Tab ----
  const renderAchievementsTab = () => {
    const unlockedIds = new Set(userData.completedLessons || []);
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 4 }}>🏅 Achievements</Text>
        <Text style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 20 }}>
          {(userData.unlockedAchievements || []).length}/{ACHIEVEMENTS.length} unlocked
        </Text>
        {ACHIEVEMENTS.map(ach => {
          const unlocked = (userData.unlockedAchievements || []).includes?.(ach.id) ||
            ach.condition({ ...userData, streakData: userData.streakData });
          return (
            <View key={ach.id} style={{
              backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, marginBottom: 10,
              borderWidth: 1, borderColor: unlocked ? COLORS.gold + '40' : COLORS.border,
              opacity: unlocked ? 1 : 0.5,
              flexDirection: 'row', alignItems: 'center', gap: 14,
            }}>
              <Text style={{ fontSize: 32 }}>{unlocked ? ach.emoji : '🔒'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }}>{ach.title}</Text>
                <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>{ach.description}</Text>
              </View>
              {unlocked && <Text style={{ fontSize: 12, color: COLORS.gold, fontWeight: '600' }}>✓</Text>}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  // ---- RENDER: Home Tab ----
  const renderHomeTab = () => (
    <SectionList
      sections={filteredLessons ? [{ title: 'Search Results', data: filteredLessons }] : sections}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={() => (
        <View>
          {/* Mastery Score */}
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <View style={{
              backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
              marginBottom: 16, borderWidth: 1, borderColor: COLORS.border,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textSecondary }}>Overall Mastery</Text>
                <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.text }}>{masteryScore}%</Text>
              </View>
              <View style={{ height: 6, backgroundColor: COLORS.surfaceLight, borderRadius: 3 }}>
                <View style={{ height: 6, backgroundColor: COLORS.success, borderRadius: 3, width: `${masteryScore}%` }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                <Text style={{ fontSize: 12, color: COLORS.textMuted }}>
                  {(userData.completedLessons || []).length}/{allLessons.length} lessons
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.gold, fontWeight: '600' }}>
                  {userData.totalXP || 0} XP
                </Text>
              </View>
            </View>
          </View>

          {/* Streak Banner */}
          <StreakBanner streakData={userData.streakData} />

          {/* Recommendations */}
          {!filteredLessons && recommendations.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              {recommendations.map((rec, idx) => (
                <View key={idx} style={{ marginBottom: 12 }}>
                  <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text }}>{rec.title}</Text>
                    <Text style={{ fontSize: 12, color: COLORS.textMuted }}>{rec.subtitle}</Text>
                  </View>
                  <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={rec.lessons || []}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={{
                          width: 200, backgroundColor: COLORS.surface, borderRadius: 12,
                          borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
                        }}
                        onPress={() => onSelectLesson(item)}
                        activeOpacity={0.7}
                      >
                        <Image source={{ uri: item.thumbnail }} style={{ width: 200, height: 112 }} />
                        <View style={{ padding: 10 }}>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text }} numberOfLines={1}>{item.title}</Text>
                          <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                            {rec.type === 'deepen' ? `Depth ${userData.depthLevels?.[item.id] || 0}/4` :
                             rec.type === 'review' ? '🧠 Review due' : `${item.xp} XP`}
                          </Text>
                          {rec.type === 'review' && (
                            <TouchableOpacity
                              style={{
                                marginTop: 6, backgroundColor: COLORS.info + '20',
                                borderRadius: 6, paddingVertical: 4, alignItems: 'center',
                              }}
                              onPress={() => startReview(item)}
                            >
                              <Text style={{ fontSize: 11, color: COLORS.info, fontWeight: '600' }}>
                                {loadingReview ? '...' : '🧠 Quick Review'}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              ))}
            </View>
          )}

          {/* Search */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search lessons..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 8 }}>
                <Text style={{ color: COLORS.textMuted }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.description && <Text style={styles.sectionDesc}>{section.description}</Text>}
        </View>
      )}
      renderItem={({ item }) => (
        <LessonCard
          lesson={item}
          isCompleted={(userData.completedLessons || []).includes(item.id)}
          depthLevel={userData.depthLevels?.[item.id]}
          onPress={() => onSelectLesson(item)}
          onWatchVideo={(videoId) => setActiveVideoId(videoId)}
        />
      )}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, alignSelf: 'center', width: IS_WEB ? Math.min(800, width) : '100%' }}>
        {/* Achievement Toast */}
        {userData.newAchievement && (
          <AchievementToast
            achievement={userData.newAchievement}
            onDismiss={() => userData.setNewAchievement(null)}
          />
        )}

        {/* Video Player */}
        {activeVideoId && (
          <YouTubePlayerComponent videoId={activeVideoId} onClose={() => setActiveVideoId(null)} />
        )}

        {/* Header */}
        <View style={styles.homeHeader}>
        <View>
          <Text style={styles.homeTitle}>Kesandu</Text>
          <Text style={styles.homeSubtitle}>Birth of a Guru</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            style={styles.xpBadge}
            onPress={() => onNavigateToDashboard?.()}
          >
            <Text style={styles.xpText}>📊</Text>
          </TouchableOpacity>
          <View style={styles.xpBadge}>
            <Text style={styles.xpText}>{userData.totalXP || 0} XP</Text>
          </View>
        </View>
      </View>

        {/* Tab Content */}
        {activeTab === 'home' && renderHomeTab()}
        {activeTab === 'challenges' && renderChallengesTab()}
        {activeTab === 'achievements' && renderAchievementsTab()}
        {activeTab === 'interview' && <InterviewScreen />}
        {activeTab === 'practice' && <PracticeProblemsScreen userProfile={userProfile} />}
        {activeTab === 'portfolio' && <PortfolioBuilderScreen />}
        {activeTab === 'spaced' && <SpacedRepetitionScreen />}
        {activeTab === 'code' && <CodeReviewScreen />}
        {activeTab === 'sync' && <CloudSyncScreen />}

        {/* Bottom Tab Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            borderTopWidth: 1, borderTopColor: COLORS.border,
            backgroundColor: COLORS.bg, paddingBottom: IS_IOS ? 20 : 8, paddingTop: 8,
          }}
        >
          {[
            { id: 'home', label: 'Learn' },
            { id: 'interview', label: 'Interview' },
            { id: 'practice', label: 'Practice' },
            { id: 'portfolio', label: 'Portfolio' },
            { id: 'spaced', label: 'Review' },
            { id: 'code', label: 'Code Review' },
            { id: 'sync', label: 'Sync' },
            { id: 'challenges', label: 'Challenges' },
            { id: 'achievements', label: 'Badges' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={{ flex: 1, alignItems: 'center', gap: 2 }}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={{
                fontSize: 11, fontWeight: '600',
                color: activeTab === tab.id ? COLORS.text : COLORS.textMuted,
              }}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <StatusBar style="light" />
      </View>
    </SafeAreaView>
  );
};
// ============================================================================
// MAIN APP
// ============================================================================
export default function App() {
  const sync = useMobileSync();
  const userData = useUserData();
  const [activeLesson, setActiveLesson] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('home'); // home, settings
  const [editingProblem, setEditingProblem] = useState(null);

  // Show loading while checking auth
  if (sync.loading || !userData.loaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={{ color: COLORS.textMuted, marginTop: 16 }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show CloudSync (login/signup) if not authenticated
  if (!sync.isAuthenticated) {
    return <CloudSyncScreen />;
  }

  // Handle lesson dialog
  if (activeLesson) {
    return (
      <Dialogue
        lesson={activeLesson}
        userData={userData}
        onExit={() => setActiveLesson(null)}
      />
    );
  }

  // Handle different screens
  if (currentScreen === 'dashboard') {
    return (
      <DashboardScreen
        userProfile={sync.userProfile}
        onNavigate={(screen, data) => {
          if (screen === 'settings') setCurrentScreen('settings');
          if (screen === 'editProblem') setEditingProblem(data);
        }}
      />
    );
  }

  if (currentScreen === 'settings') {
    return (
      <SettingsScreen
        userProfile={sync.userProfile}
        onLogout={() => {
          sync.logout();
          setCurrentScreen('home');
        }}
        onBack={() => setCurrentScreen('dashboard')}
      />
    );
  }

  // Handle edit problem screen
  if (editingProblem) {
    return (
      <EditProblemScreen
        problem={editingProblem}
        userProfile={sync.userProfile}
        onSave={() => {
          setEditingProblem(null);
          setCurrentScreen('dashboard');
        }}
        onCancel={() => {
          setEditingProblem(null);
        }}
      />
    );
  }

  // Default: HomeScreen with auth support
  return (
    <HomeScreen
      userData={userData}
      userProfile={sync.userProfile}
      onSelectLesson={(lesson) => setActiveLesson(lesson)}
      onNavigateToDashboard={() => setCurrentScreen('dashboard')}
    />
  );
}
// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  // Home
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  homeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  homeSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  xpBadge: {
    backgroundColor: COLORS.gold + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gold + '40',
  },
  xpText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gold,
  },
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  // Sections
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  // Lesson Card
  lessonCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  lessonImageContainer: {
    position: 'relative',
  },
  lessonImage: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.surfaceLight,
  },
  videoBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  videoBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  lessonInfo: {
    padding: 14,
  },
  lessonCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  lessonTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  lessonSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  projectBadge: {
    backgroundColor: COLORS.gold + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  projectBadgeText: {
    fontSize: 11,
    color: COLORS.gold,
    fontWeight: '600',
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lessonDuration: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  lessonXP: {
    fontSize: 12,
    color: COLORS.gold,
    fontWeight: '600',
  },
  lessonComplete: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
  },
  // Dialogue
  dialogueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerBtn: {
    padding: 8,
  },
  headerBtnText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  depthBar: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  depthSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  depthSegmentActive: {
    backgroundColor: COLORS.success,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  msgRow: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'flex-start',
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  aiIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textMuted,
    marginRight: 8,
    marginTop: 8,
  },
  msgBubble: {
    maxWidth: IS_WEB ? '70%' : '85%',
    borderRadius: 16,
    padding: IS_WEB ? 16 : 14,
  },
  aiBubble: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userBubble: {
    backgroundColor: COLORS.accent,
  },
  msgText: {
    fontSize: IS_WEB ? 16 : 15,
    color: COLORS.text,
    lineHeight: IS_WEB ? 24 : 22,
  },
  userText: {
    color: COLORS.bg,
  },
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 30,
    paddingVertical: 8,
  },
  thinkingText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: IS_WEB ? 18 : 16,
    paddingVertical: IS_WEB ? 12 : 10,
    fontSize: IS_WEB ? 16 : 15,
    color: COLORS.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  sendBtnDisabled: {
    opacity: 0.3,
  },
  sendBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.bg,
  },
  masteryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.success + '40',
    backgroundColor: COLORS.success + '10',
  },
  masteryContent: {
    flex: 1,
  },
  masteryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.success,
  },
  masterySubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  claimBtn: {
    backgroundColor: COLORS.success,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  claimBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  // Project Panel
  projectPanel: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gold + '30',
  },
  projectPanelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.gold,
    marginBottom: 6,
  },
  projectPanelDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginBottom: 12,
  },
  projectSteps: {
    gap: 8,
  },
  projectStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  projectStepNum: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gold,
    backgroundColor: COLORS.gold + '15',
    width: 22,
    height: 22,
    borderRadius: 11,
    textAlign: 'center',
    lineHeight: 22,
  },
  projectStepText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  // Video Player
  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  closeVideoBtn: {
    padding: 8,
  },
  closeVideoBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  videoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  videoError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoErrorText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  videoRetryBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  videoRetryBtnText: {
    color: COLORS.bg,
    fontWeight: '600',
  },
});

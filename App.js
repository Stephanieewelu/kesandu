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
  RotateCcw,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import YoutubePlayer from 'react-native-youtube-iframe';

const { width, height } = Dimensions.get('window');
const IS_IOS = Platform.OS === 'ios';

// ============================================================================
// 1. THEME
// ============================================================================

const THEME = {
  primary: '#00D9FF',
  success: '#00FF9D',
  danger: '#FF4D4D',
  warning: '#FFD600',
  partial: '#FF8C00',
  bg: '#000000',
  card: '#121212',
  guru: '#FFD700',
  surface: '#111111',
  border: '#222222',
  muted: '#666666',
  text: '#FFFFFF',
  textSoft: '#CCCCCC',
};

// ============================================================================
// 2. CONTENT DATABASE (Enhanced with weights, synonyms, reading levels)
// ============================================================================

const CONTENT_DATA = [
  {
    id: '1',
    youtubeId: 'zjkBMFhNj_g',
    title: 'Large Language Models',
    creator: '@karpathy',
    category: 'AI Engineering',
    xp: 300,
    applicationScenario: {
      role: 'AI Consultant',
      context: 'A law firm wants to replace paralegals with an LLM. They trust it blindly.',
    },
    challenges: [
      {
        id: 'c1_1',
        type: 'CONCEPT_CHECK',
        title: 'The Mechanism',
        prompt: 'Does an LLM "know" facts? Explain specifically how it generates the next word.',
        initialAiMessage: "I asked ChatGPT the capital of France and it got it right. That proves it has a database of facts, doesn't it?",
        required_concepts: [
          [
            { term: 'predict', synonyms: ['predicts', 'prediction', 'predicting', 'forecast'], weight: 3 },
            { term: 'probability', synonyms: ['probable', 'probabilistic', 'likely', 'likelihood', 'chance'], weight: 3 },
            { term: 'statistics', synonyms: ['statistical', 'statistically'], weight: 2 },
            { term: 'pattern', synonyms: ['patterns', 'pattern matching', 'learned patterns'], weight: 2 },
          ],
          [
            { term: 'next token', synonyms: ['next word', 'following word', 'continuation', 'sequence'], weight: 3 },
          ],
        ],
        forbidden_terms: [],
        min_word_count: 15,
        max_reading_level: null,
        xp_reward: 150,
        partial_xp_reward: 60,
        hint: 'Focus on the statistical nature of the output.',
      },
      {
        id: 'c1_2',
        type: 'TEACH_BACK',
        title: 'Guru Synthesis',
        prompt: 'Explain LLMs to a 5-year-old. Use an analogy. No technical jargon.',
        initialAiMessage: "I'm 5. I don't know what a 'neural net' is. How does the computer write stories?",
        required_concepts: [
          [
            { term: 'like a', synonyms: ['imagine', 'pretend', 'think of', 'similar to', 'just like', 'same as'], weight: 3 },
          ],
          [
            { term: 'guess', synonyms: ['guesses', 'guessing', 'fills in', 'completes', 'finishes', 'auto-complete', 'autocomplete'], weight: 3 },
            { term: 'story', synonyms: ['stories', 'sentences', 'words', 'book'], weight: 1 },
          ],
        ],
        forbidden_terms: [
          { term: 'transformer', hint: 'Use "smart helper" or "word machine" instead.' },
          { term: 'stochastic', hint: "Way too technical! Just say 'random' or 'guessing'." },
          { term: 'gradient', hint: "A 5-year-old doesn't know calculus!" },
          { term: 'vector', hint: 'Try "direction" or just skip this concept.' },
          { term: 'embedding', hint: 'Say "turning words into numbers" if needed.' },
          { term: 'neural', hint: 'Say "brain" or "smart computer" instead.' },
          { term: 'algorithm', hint: 'Say "recipe" or "set of steps" instead.' },
          { term: 'parameter', hint: 'Skip this — too technical for a 5-year-old.' },
        ],
        min_word_count: 20,
        max_reading_level: 7,
        xp_reward: 150,
        partial_xp_reward: 60,
        hint: "Use an analogy (e.g., 'auto-complete' or 'guessing game'). Don't use big words.",
      },
    ],
  },
  {
    id: '2',
    youtubeId: 'HkdAHXoRtos',
    title: 'Git Version Control',
    creator: '@fireship',
    category: 'DevOps',
    xp: 250,
    applicationScenario: {
      role: 'Lead Developer',
      context: 'A junior dev deleted a branch. They think the code is gone forever.',
    },
    challenges: [
      {
        id: 'c2_1',
        type: 'CONCEPT_CHECK',
        title: 'Mental Model',
        prompt: 'Explain the difference between a Branch and a Commit Reference.',
        initialAiMessage: "Isn't a branch just a folder of files? When I switch branches, where do my files go?",
        required_concepts: [
          [
            { term: 'pointer', synonyms: ['reference', 'label', 'sticky note', 'bookmark', 'points to', 'refers to'], weight: 3 },
          ],
          [
            { term: 'snapshot', synonyms: ['hash', 'history', 'commit', 'save point', 'checkpoint', 'record'], weight: 2 },
          ],
        ],
        forbidden_terms: [],
        min_word_count: 15,
        max_reading_level: null,
        xp_reward: 125,
        partial_xp_reward: 50,
        hint: 'A branch is just a movable pointer to a commit.',
      },
    ],
  },
  {
    id: '3',
    youtubeId: 'Tn6-PIqc4UM',
    title: 'React Fundamentals',
    creator: '@fireship',
    category: 'Web Dev',
    xp: 250,
    applicationScenario: {
      role: 'Performance Engineer',
      context: 'A React app freezes on every keystroke. Users are complaining.',
    },
    challenges: [
      {
        id: 'c3_1',
        type: 'CONCEPT_CHECK',
        title: 'Virtual DOM',
        prompt: 'Why do we need a Virtual DOM? Why is direct DOM manipulation slow?',
        initialAiMessage: 'The browser already has a DOM. Why add another layer? Isn\'t that making things slower?',
        required_concepts: [
          [
            { term: 'batch', synonyms: ['batching', 'batches', 'groups', 'combines', 'collects', 'gathers'], weight: 3 },
            { term: 'diff', synonyms: ['diffing', 'compare', 'comparison', 'reconciliation', 'reconcile', 'checks what changed'], weight: 3 },
          ],
          [
            { term: 'repaint', synonyms: ['reflow', 'expensive', 'slow', 'layout', 're-render', 'redraw', 'costly'], weight: 2 },
          ],
        ],
        forbidden_terms: [],
        min_word_count: 20,
        max_reading_level: null,
        xp_reward: 125,
        partial_xp_reward: 50,
        hint: "Talk about 'batching' updates or 'diffing' changes.",
      },
      {
        id: 'c3_2',
        type: 'TEACH_BACK',
        title: 'ELI5: React',
        prompt: 'Explain React re-rendering to someone who only knows HTML.',
        initialAiMessage: 'I know HTML. I make web pages. Why do I need this React thing? My pages work fine.',
        required_concepts: [
          [
            { term: 'update', synonyms: ['updates', 'changes', 'change', 'refresh', 'modify', 'auto'], weight: 3 },
          ],
          [
            { term: 'page', synonyms: ['screen', 'display', 'view', 'website', 'app', 'interface'], weight: 1 },
          ],
        ],
        forbidden_terms: [
          { term: 'virtual dom', hint: 'Just say "it keeps a draft copy" or "blueprint".' },
          { term: 'reconciliation', hint: 'Way too technical. Say "figures out what changed".' },
          { term: 'fiber', hint: 'Skip this — say "it works in small steps".' },
          { term: 'jsx', hint: 'Say "HTML-like code" or "template".' },
        ],
        min_word_count: 20,
        max_reading_level: 8,
        xp_reward: 125,
        partial_xp_reward: 50,
        hint: 'Compare it to reloading vs. surgically updating parts of the page.',
      },
    ],
  },
];

// ============================================================================
// 3. SEMANTIC VALIDATION ENGINE
// ============================================================================

// ── Lightweight Stemmer ─────────────────────────────────────
// Reduces words to rough root forms for better fuzzy matching.
// Handles common English suffixes — not perfect, but effective for
// matching "predicting" → "predict", "batches" → "batch", etc.

const STEM_SUFFIXES = [
  'ingly', 'ingly', 'ation', 'ment', 'ness', 'able', 'ible',
  'ting', 'ing', 'ies', 'ied', 'ion', 'ous', 'ive',
  'ly', 'ed', 'er', 'es', 'al', 'en',
  's',
];

function stem(word) {
  let w = word.toLowerCase();
  if (w.length <= 3) return w;
  for (const suffix of STEM_SUFFIXES) {
    if (w.endsWith(suffix) && w.length - suffix.length >= 3) {
      return w.slice(0, w.length - suffix.length);
    }
  }
  return w;
}

// ── Text Processing ─────────────────────────────────────────

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[''""]/g, '')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text) {
  return normalize(text).split(' ').filter(Boolean);
}

/**
 * Builds unigrams, bigrams, and trigrams for multi-word phrase matching.
 * Also builds a parallel set of stemmed n-grams for fuzzy matching.
 * e.g. ["next", "token"] → Set includes "next", "token", "next token"
 */
function buildNGrams(tokens, maxN = 3) {
  const grams = new Set();
  const stemmedGrams = new Set();

  for (const token of tokens) {
    grams.add(token);
    stemmedGrams.add(stem(token));
  }
  for (let n = 2; n <= Math.min(maxN, tokens.length); n++) {
    for (let i = 0; i <= tokens.length - n; i++) {
      grams.add(tokens.slice(i, i + n).join(' '));
      stemmedGrams.add(tokens.slice(i, i + n).map(stem).join(' '));
    }
  }
  return { exact: grams, stemmed: stemmedGrams };
}

// ── Flesch-Kincaid Reading Level ────────────────────────────

function countSyllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 2) return 1;
  const vowelGroups = w.match(/[aeiouy]+/g);
  let count = vowelGroups ? vowelGroups.length : 1;
  if (w.endsWith('e') && !w.endsWith('le') && count > 1) count--;
  if (w.endsWith('ed') && !w.endsWith('ted') && !w.endsWith('ded')) {
    count = Math.max(1, count - 1);
  }
  return Math.max(1, count);
}

function computeReadingLevel(text) {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  const words = tokenize(text);
  if (sentences.length === 0 || words.length === 0) return 0;

  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = totalSyllables / words.length;

  // Flesch-Kincaid Grade Level formula
  const grade = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;
  return Math.max(0, Math.round(grade * 10) / 10);
}

// ── Concept Matching (with stemmed fallback) ────────────────

/**
 * Checks if a concept term (or any of its synonyms) is present in the
 * user's input n-grams. Uses exact match first, then falls back to
 * stemmed comparison for morphological variants.
 *
 * Returns: the matched surface form (string) or null.
 */
function conceptPresent(conceptObj, ngrams) {
  const normalizedTerm = normalize(conceptObj.term);

  // Exact match (highest confidence)
  if (ngrams.exact.has(normalizedTerm)) return conceptObj.term;

  // Check synonyms exact
  if (conceptObj.synonyms) {
    for (const syn of conceptObj.synonyms) {
      if (ngrams.exact.has(normalize(syn))) return syn;
    }
  }

  // Stemmed fallback for the primary term
  const stemmedTerm = normalizedTerm.split(' ').map(stem).join(' ');
  if (ngrams.stemmed.has(stemmedTerm)) return conceptObj.term;

  // Stemmed fallback for synonyms
  if (conceptObj.synonyms) {
    for (const syn of conceptObj.synonyms) {
      const stemmedSyn = normalize(syn).split(' ').map(stem).join(' ');
      if (ngrams.stemmed.has(stemmedSyn)) return syn;
    }
  }

  return null;
}

/**
 * Matches user input against concept groups (AND-of-OR structure).
 *
 * Each group is an array of concept alternatives (OR — at least one must match).
 * All groups must be satisfied for a perfect score (AND across groups).
 *
 * Within each group, the highest-weight matched concept determines the
 * earned weight for that group.
 */
function matchConceptGroups(conceptGroups, ngrams) {
  const results = [];

  for (let gi = 0; gi < conceptGroups.length; gi++) {
    const group = conceptGroups[gi];
    let bestMatch = null;

    for (const concept of group) {
      const match = conceptPresent(concept, ngrams);
      if (match !== null) {
        const weight = concept.weight || 1;
        if (!bestMatch || weight > bestMatch.weight) {
          bestMatch = { term: match, weight };
        }
      }
    }

    const groupMaxWeight = Math.max(...group.map(c => c.weight || 1));

    results.push({
      groupIndex: gi,
      matched: bestMatch !== null,
      matchedTerm: bestMatch?.term ?? null,
      weight: bestMatch?.weight ?? groupMaxWeight,
      maxWeight: groupMaxWeight,
    });
  }

  return results;
}

// ── Forbidden Term Detection ────────────────────────────────

function detectForbiddenTerms(normalizedText, forbiddenTerms) {
  if (!forbiddenTerms || forbiddenTerms.length === 0) return [];
  const violations = [];
  for (const ftg of forbiddenTerms) {
    const normalizedTerm = normalize(ftg.term);
    if (normalizedText.includes(normalizedTerm)) {
      violations.push({ term: ftg.term, hint: ftg.hint });
    }
  }
  return violations;
}

// ── Depth Heuristic ─────────────────────────────────────────
// Awards a small bonus (0-10 pts) for answers that show reasoning
// depth: causal connectives, examples, and elaboration.

const DEPTH_MARKERS = [
  'because', 'therefore', 'since', 'so that', 'this means',
  'for example', 'for instance', 'such as', 'in other words',
  'the reason', 'which means', 'as a result', 'instead of',
  'rather than', 'unlike', 'however', 'although',
];

function computeDepthBonus(normalizedText) {
  let hits = 0;
  for (const marker of DEPTH_MARKERS) {
    if (normalizedText.includes(marker)) hits++;
  }
  // Cap at 10 bonus points (diminishing returns after 5 markers)
  return Math.min(10, hits * 2);
}

// ── Main Evaluation Function ────────────────────────────────

const PASS_THRESHOLD = 70;
const PARTIAL_THRESHOLD = 40;
const FORBIDDEN_PENALTY = 15;
const READING_LEVEL_PENALTY = 20;
const MIN_WORDS_SCORE_CAP = 30;

/**
 * The core semantic validation engine.
 *
 * Pipeline:
 *   1. Normalize + tokenize + build n-grams (exact & stemmed)
 *   2. Word count gate (too short → score capped at 30)
 *   3. Forbidden term scan (TEACH_BACK: -15 per jargon word)
 *   4. Concept matching (nested AND/OR with weighted scoring + stemmed fallback)
 *   5. Depth bonus (causal connectives / examples → up to +10)
 *   6. Reading level check (TEACH_BACK: -20 if too complex)
 *   7. Weighted score → pass / partial / fail
 *
 * Thresholds: ≥70 PASS, 40-69 PARTIAL, <40 FAIL
 */
function evaluateAnswer(input, challenge) {
  const normalizedInput = normalize(input);
  const tokens = tokenize(input);
  const ngrams = buildNGrams(tokens);
  const feedback = [];
  const isTeachBack = challenge.type === 'TEACH_BACK';

  // ── Step 1: Word Count Gate ───────────────────────────
  const minWords = challenge.min_word_count || 10;
  const wordCountPassed = tokens.length >= minWords;

  if (!wordCountPassed) {
    feedback.push(
      `Too brief — ${tokens.length} words. Aim for at least ${minWords} to show understanding.`
    );
  }

  // ── Step 2: Forbidden Terms (TEACH_BACK only) ─────────
  const forbiddenViolations = isTeachBack
    ? detectForbiddenTerms(normalizedInput, challenge.forbidden_terms)
    : [];

  if (forbiddenViolations.length > 0) {
    feedback.push('\uD83C\uDFAF Jargon detected! Keep it simple:');
    for (const v of forbiddenViolations) {
      feedback.push(` \u2022 "${v.term}" \u2192 ${v.hint}`);
    }
  }

  // ── Step 3: Concept Matching (with stemmed fallback) ──
  const conceptResults = matchConceptGroups(challenge.required_concepts, ngrams);

  const totalWeight = conceptResults.reduce((sum, c) => sum + c.maxWeight, 0);
  const matchedWeight = conceptResults
    .filter(c => c.matched)
    .reduce((sum, c) => sum + c.weight, 0);

  const missedGroups = conceptResults.filter(c => !c.matched);
  if (missedGroups.length > 0) {
    feedback.push(
      `You covered ${conceptResults.length - missedGroups.length}/${conceptResults.length} key concept areas.`
    );
    if (challenge.hint) {
      feedback.push(`\uD83D\uDCA1 Hint: ${challenge.hint}`);
    }
  } else {
    feedback.push('\u2705 All key concepts covered!');
  }

  // ── Step 4: Depth Bonus ─────────────────────────────
  const depthBonus = computeDepthBonus(normalizedInput);

  // ── Step 5: Reading Level (TEACH_BACK only) ───────────
  let readingLevelResult = null;
  if (isTeachBack && challenge.max_reading_level != null && tokens.length >= 10) {
    const actualLevel = computeReadingLevel(input);
    const passed = actualLevel <= challenge.max_reading_level;
    readingLevelResult = { actual: actualLevel, max: challenge.max_reading_level, passed };

    if (!passed) {
      feedback.push(
        `\uD83D\uDCD6 Language too complex (grade ${actualLevel}). Use shorter sentences and simpler words \u2014 aim for grade ${challenge.max_reading_level} or lower.`
      );
    }
  }

  // ── Step 6: Score Calculation ─────────────────────────
  let baseScore = totalWeight > 0 ? (matchedWeight / totalWeight) * 100 : 0;

  // Add depth bonus (capped so it can't push above 100 after penalties)
  baseScore = Math.min(100, baseScore + depthBonus);

  // Apply penalties
  const forbiddenPenalty = forbiddenViolations.length * FORBIDDEN_PENALTY;
  const readingPenalty = readingLevelResult && !readingLevelResult.passed ? READING_LEVEL_PENALTY : 0;

  let finalScore = baseScore - forbiddenPenalty - readingPenalty;

  // Word count gate: cap score if too short
  if (!wordCountPassed) {
    finalScore = Math.min(finalScore, MIN_WORDS_SCORE_CAP);
  }

  finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));

  // ── Step 7: Determine Result ──────────────────────────
  let passed = false;
  let xpEarned = 0;
  let status = 'FAIL';

  const xpReward = challenge.xp_reward || 100;
  const partialXP = challenge.partial_xp_reward || Math.round(xpReward * 0.4);

  if (finalScore >= PASS_THRESHOLD) {
    passed = true;
    xpEarned = xpReward;
    status = 'PASS';
    feedback.unshift(`\uD83D\uDD25 GURU STATUS ACHIEVED \u2014 Score: ${finalScore}/100`);
  } else if (finalScore >= PARTIAL_THRESHOLD) {
    xpEarned = partialXP;
    status = 'PARTIAL';
    feedback.unshift(`\u26A1 Almost! Score: ${finalScore}/100 \u2014 Partial XP earned. Try again for full credit!`);
  } else {
    feedback.unshift(`\uD83D\uDCAA Score: ${finalScore}/100 \u2014 Re-watch the video and try again.`);
  }

  return {
    passed,
    score: finalScore,
    xpEarned,
    status,
    feedback,
    breakdown: {
      concepts: conceptResults,
      forbidden: forbiddenViolations,
      wordCount: { actual: tokens.length, required: minWords, passed: wordCountPassed },
      readingLevel: readingLevelResult,
      depthBonus,
    },
  };
}

// ============================================================================
// 4. XP PERSISTENCE HOOK
// ============================================================================

const STORAGE_KEY = '@kesandu_guru_xp';

function xpForLevel(level) {
  return Math.floor(100 * Math.pow(1.4, level - 1));
}

function computeLevel(totalXP) {
  let level = 1;
  let accumulated = 0;
  while (accumulated + xpForLevel(level) <= totalXP) {
    accumulated += xpForLevel(level);
    level++;
  }
  return level;
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

  return { totalXP, level, currentLevelXP, nextLevelXP, awardXP, isComplete, loaded };
}

// ============================================================================
// 5. COMPONENTS
// ============================================================================

// ── Score Bar Component ─────────────────────────────────────

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

// ── Concept Breakdown Component ─────────────────────────────

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
            <Text style={styles.weightText}>\u00D7{c.weight}</Text>
          </View>
        </View>
      ))}

      {/* Word count */}
      <View style={styles.breakdownRow}>
        <Text style={{ fontSize: 14 }}>{breakdown.wordCount.passed ? '\u2705' : '\u26A0\uFE0F'}</Text>
        <Text style={styles.breakdownText}>
          Words: {breakdown.wordCount.actual}/{breakdown.wordCount.required}
        </Text>
      </View>

      {/* Depth bonus */}
      {breakdown.depthBonus > 0 && (
        <View style={styles.breakdownRow}>
          <Text style={{ fontSize: 14 }}>{'\uD83E\uDDE0'}</Text>
          <Text style={styles.breakdownText}>
            Depth bonus: +{breakdown.depthBonus} pts
          </Text>
        </View>
      )}

      {/* Reading level */}
      {breakdown.readingLevel && (
        <View style={styles.breakdownRow}>
          <Text style={{ fontSize: 14 }}>{breakdown.readingLevel.passed ? '\u2705' : '\u26A0\uFE0F'}</Text>
          <Text style={styles.breakdownText}>
            Reading level: grade {breakdown.readingLevel.actual} (max {breakdown.readingLevel.max})
          </Text>
        </View>
      )}

      {/* Forbidden violations */}
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

// ── Chat Engine Component ───────────────────────────────────

const ChatEngine = ({ challenge, onComplete, onExit, isAlreadyComplete }) => {
  const [history, setHistory] = useState([
    { id: 'init', text: challenge.initialAiMessage, sender: 'ai' },
  ]);
  const [input, setInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [status, setStatus] = useState('ACTIVE');
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

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        text: result.feedback.join('\n'),
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
  }, [input, isAiTyping, challenge]);

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
      {/* Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={onExit} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <X size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{challenge.type.replace('_', ' ')}</Text>
          <Text style={styles.headerSubtitle}>
            {challenge.type === 'TEACH_BACK' ? '\uD83C\uDF93 Feynman Mode' : '\uD83E\uDDEA Accuracy Mode'}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Challenge prompt */}
      <View style={styles.briefBox}>
        <Target size={14} color={THEME.primary} />
        <Text style={styles.briefText}>{challenge.prompt}</Text>
      </View>

      {/* Already complete banner */}
      {isAlreadyComplete && (
        <View style={styles.completeBanner}>
          <CheckCircle size={14} color={THEME.success} />
          <Text style={styles.completeBannerText}>Already completed — practice mode (no XP)</Text>
        </View>
      )}

      {/* Messages */}
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
          <Text style={styles.typingText}>Evaluating...</Text>
        </View>
      )}

      {/* Input / Action area */}
      <KeyboardAvoidingView behavior={IS_IOS ? 'padding' : 'height'}>
        {status === 'ACTIVE' ? (
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Type your explanation..."
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
            >
              <Send size={20} color={input.trim() ? '#000' : '#666'} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionBar}>
            {(status === 'FAIL' || status === 'PARTIAL') && (
              <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
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

// ── Video Feed Item (Memoized with optimized YouTube Player) ────────────────
//
// Key optimizations:
// 1. YoutubePlayer only mounts when `isActive` is true — off-screen items
//    render a lightweight placeholder, avoiding iframe overhead entirely.
// 2. `playerParams` and `webViewProps` are module-level constants (not per-render).
// 3. `React.memo` with a strict comparator prevents re-renders unless the item
//    changes identity or active state flips.
// 4. `onStateChange` is a stable useCallback that doesn't depend on mutable state.

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
  ({ item, isActive, onEnter }) => {
    const [playing, setPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);

    // Sync play state to visibility — pause when scrolled away
    useEffect(() => {
      if (isActive) {
        setPlaying(true);
      } else {
        setPlaying(false);
        setIsReady(false);
      }
    }, [isActive]);

    // Stable callback — no deps that change across renders
    const onStateChange = useCallback((state) => {
      if (state === 'playing') setIsReady(true);
      if (state === 'ended') setPlaying(false);
    }, []);

    const handlePlay = useCallback(() => setPlaying(true), []);
    const handleEnter = useCallback(() => onEnter(item), [item, onEnter]);

    return (
      <View style={{ width, height, backgroundColor: '#000' }}>
        {/* Player — only mount the iframe for the active (visible) item */}
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

        {/* Overlay info */}
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.creator}>{item.creator}</Text>
            <Text style={styles.challengeCount}>
              {item.challenges.length} challenge{item.challenges.length > 1 ? 's' : ''} {'\u2022'} +{item.xp} XP
            </Text>
            <TouchableOpacity style={styles.dojoBtn} onPress={handleEnter}>
              <Brain size={20} color="#000" />
              <Text style={styles.dojoBtnText}>ENTER DOJO</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  },
  // Strict comparator: only re-render when item identity or active state changes
  (prev, next) => prev.item.id === next.item.id && prev.isActive === next.isActive
);

// ============================================================================
// 6. MAIN APP
// ============================================================================

export default function App() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeModule, setActiveModule] = useState(null);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const { totalXP, level, currentLevelXP, nextLevelXP, awardXP, isComplete, loaded } = useXP();

  // Stable viewability config — must not change between renders
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [awardXP, isComplete]);

  const handleChallengeExit = useCallback(() => setActiveChallenge(null), []);

  const renderFeedItem = useCallback(({ item, index }) => (
    <VideoFeedItem
      item={item}
      isActive={index === activeIndex && !activeModule && !activeChallenge}
      onEnter={handleOpenModule}
    />
  ), [activeIndex, activeModule, activeChallenge, handleOpenModule]);

  const levelProgress = nextLevelXP > 0 ? Math.min(1, currentLevelXP / nextLevelXP) : 0;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ── VIDEO FEED ─────────────────────────────────── */}
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

      {/* ── HUD OVERLAY ────────────────────────────────── */}
      <SafeAreaView style={styles.hud} pointerEvents="box-none">
        <View style={styles.hudLeft}>
          <Text style={styles.logo}>KESANDU</Text>
        </View>
        <View style={styles.hudRight}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelNumber}>{level}</Text>
          </View>
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

      {/* ── MODULE DETAIL MODAL ────────────────────────── */}
      <Modal visible={!!activeModule} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.chatHeader}>
            <Text style={styles.headerTitle}>TRAINING MODULE</Text>
            <TouchableOpacity onPress={handleCloseModule}>
              <X size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 20 }}>
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
                      {c.type === 'TEACH_BACK' ? '\uD83C\uDF93 Teach Back' : '\uD83E\uDDEA Concept Check'}
                      {' \u2022 '}+{c.xp_reward} XP
                    </Text>
                  </View>
                  <ChevronRight size={20} color={completed ? THEME.success : THEME.primary} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* ── CHAT ARENA MODAL ───────────────────────────── */}
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
    </View>
  );
}

// ============================================================================
// 7. STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // ── Video Feed ──────────────────────────────────────────
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
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
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
  dojoBtnText: { fontWeight: 'bold', fontSize: 16 },

  // ── HUD ─────────────────────────────────────────────────
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

  // ── Chat ────────────────────────────────────────────────
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

  // ── Score & Breakdown ───────────────────────────────────
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

  // ── Module Modal ────────────────────────────────────────
  modalContainer: { flex: 1, backgroundColor: '#000' },
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
});

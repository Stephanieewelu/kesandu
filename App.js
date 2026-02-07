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
  RotateCcw, Award, Star, BookOpen, TrendingUp,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import YoutubePlayer from 'react-native-youtube-iframe';
import {
  GURU_RANKS, getGuruRank, getNextRank,
  stem, normalize, tokenize, buildNGrams,
  countSyllables, computeReadingLevel,
  conceptPresent, matchConceptGroups,
  detectForbiddenTerms, DEPTH_MARKERS, computeDepthBonus,
  PASS_THRESHOLD, PARTIAL_THRESHOLD, FORBIDDEN_PENALTY,
  READING_LEVEL_PENALTY, MIN_WORDS_SCORE_CAP, evaluateAnswer,
  xpForLevel, computeLevel,
} from './utils';

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
  guruGlow: '#FFB800',
};

// ============================================================================
// 2. AI-FOCUSED CONTENT DATABASE
// ============================================================================

const CONTENT_DATA = [
  {
    id: '1',
    youtubeId: 'zjkBMFhNj_g',
    title: 'How LLMs Work',
    creator: '@karpathy',
    category: 'AI Foundations',
    xp: 300,
    guruTitle: 'LLM Guru',
    applicationScenario: {
      role: 'AI Consultant',
      context: 'A law firm wants to replace paralegals with an LLM. They trust it blindly. You must explain the limitations.',
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
          { term: 'parameter', hint: 'Skip this \u2014 too technical for a 5-year-old.' },
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
    youtubeId: 'aircAruvnKk',
    title: 'Neural Networks',
    creator: '@3blue1brown',
    category: 'AI Foundations',
    xp: 300,
    guruTitle: 'Neural Net Guru',
    applicationScenario: {
      role: 'ML Engineer',
      context: 'Your CEO says "just add more layers" to fix a failing model. You need to explain why that might not help.',
    },
    challenges: [
      {
        id: 'c2_1',
        type: 'CONCEPT_CHECK',
        title: 'Layers & Learning',
        prompt: 'What does a hidden layer in a neural network actually do? How does it learn?',
        initialAiMessage: "I heard neural networks have layers like a cake. Does each layer memorize different facts?",
        required_concepts: [
          [
            { term: 'weight', synonyms: ['weights', 'parameters', 'connections', 'adjusts', 'adjust'], weight: 3 },
            { term: 'activation', synonyms: ['activations', 'neurons fire', 'output signal', 'nonlinear'], weight: 2 },
          ],
          [
            { term: 'feature', synonyms: ['features', 'representation', 'abstract', 'pattern', 'patterns', 'detect'], weight: 3 },
          ],
        ],
        forbidden_terms: [],
        min_word_count: 15,
        max_reading_level: null,
        xp_reward: 150,
        partial_xp_reward: 60,
        hint: 'Think about how each layer transforms data and detects patterns.',
      },
      {
        id: 'c2_2',
        type: 'TEACH_BACK',
        title: 'ELI5: Neural Nets',
        prompt: 'Explain neural networks to someone who has never coded. Use a real-world analogy.',
        initialAiMessage: "I'm a chef. I don't know what code is. How does the computer learn to recognize a cat photo?",
        required_concepts: [
          [
            { term: 'like a', synonyms: ['imagine', 'pretend', 'think of', 'similar to', 'just like', 'same as', 'recipe'], weight: 3 },
          ],
          [
            { term: 'learn', synonyms: ['learns', 'learning', 'practice', 'practices', 'improve', 'improves', 'gets better', 'trains'], weight: 3 },
          ],
        ],
        forbidden_terms: [
          { term: 'backpropagation', hint: 'Say "learning from mistakes" instead.' },
          { term: 'gradient descent', hint: 'Say "adjusting step by step" instead.' },
          { term: 'matrix', hint: 'Skip this \u2014 say "grid of numbers" if needed.' },
          { term: 'tensor', hint: 'Way too technical. Skip it.' },
          { term: 'epoch', hint: 'Say "round of practice" instead.' },
          { term: 'loss function', hint: 'Say "score card" or "mistake counter" instead.' },
        ],
        min_word_count: 20,
        max_reading_level: 7,
        xp_reward: 150,
        partial_xp_reward: 60,
        hint: 'Compare it to learning a skill through repetition and feedback.',
      },
    ],
  },
  {
    id: '3',
    youtubeId: 'wjZofJX0v4M',
    title: 'Transformer Architecture',
    creator: '@3blue1brown',
    category: 'AI Deep Dive',
    xp: 350,
    guruTitle: 'Transformer Guru',
    applicationScenario: {
      role: 'AI Architect',
      context: 'Your team wants to build a custom model. They ask: should we use RNNs or Transformers? You need to explain the key difference.',
    },
    challenges: [
      {
        id: 'c3_1',
        type: 'CONCEPT_CHECK',
        title: 'Attention Mechanism',
        prompt: 'What is "attention" in transformers? Why was it a breakthrough over previous approaches?',
        initialAiMessage: "I know transformers replaced older models. But what exactly is 'attention' and why does it matter?",
        required_concepts: [
          [
            { term: 'attention', synonyms: ['self-attention', 'attends to', 'focus on', 'focuses on', 'looks at all', 'weighs'], weight: 3 },
          ],
          [
            { term: 'parallel', synonyms: ['simultaneously', 'all at once', 'at the same time', 'concurrent', 'not sequential'], weight: 3 },
            { term: 'context', synonyms: ['relationship', 'relationships', 'connections', 'relevant', 'relevance', 'related words'], weight: 2 },
          ],
        ],
        forbidden_terms: [],
        min_word_count: 20,
        max_reading_level: null,
        xp_reward: 175,
        partial_xp_reward: 70,
        hint: 'Think about how attention lets the model look at ALL words at once, not one by one.',
      },
      {
        id: 'c3_2',
        type: 'TEACH_BACK',
        title: 'ELI5: Attention',
        prompt: 'Explain the attention mechanism to a high school student. No math, just intuition.',
        initialAiMessage: "I'm in 10th grade. I heard AI uses 'attention' but that sounds like a human thing. What does it mean for a computer?",
        required_concepts: [
          [
            { term: 'important', synonyms: ['matters', 'relevant', 'focus', 'focuses', 'pay attention', 'which parts'], weight: 3 },
          ],
          [
            { term: 'word', synonyms: ['words', 'sentence', 'text', 'meaning', 'reads'], weight: 1 },
          ],
        ],
        forbidden_terms: [
          { term: 'query key value', hint: 'Say "the model asks what\'s important" instead.' },
          { term: 'softmax', hint: 'Way too mathy. Say "picks the most relevant parts."' },
          { term: 'dot product', hint: 'Say "measures similarity" or "compares words."' },
          { term: 'multihead', hint: 'Say "looks at things from different angles."' },
          { term: 'positional encoding', hint: 'Say "knows the order of words."' },
        ],
        min_word_count: 20,
        max_reading_level: 9,
        xp_reward: 175,
        partial_xp_reward: 70,
        hint: 'Compare it to highlighting the most important words in a sentence.',
      },
    ],
  },
  {
    id: '4',
    youtubeId: '_bvrzYOA8dY',
    title: 'Prompt Engineering',
    creator: '@fireship',
    category: 'AI Skills',
    xp: 250,
    guruTitle: 'Prompt Guru',
    applicationScenario: {
      role: 'AI Product Manager',
      context: 'Your team is getting inconsistent outputs from GPT-4. Users complain the chatbot gives random answers. You need to fix the prompting strategy.',
    },
    challenges: [
      {
        id: 'c4_1',
        type: 'CONCEPT_CHECK',
        title: 'Prompt Design',
        prompt: 'Why does prompt structure matter? What makes a good prompt vs a bad one?',
        initialAiMessage: "I just type whatever I want into ChatGPT. Sometimes it works, sometimes it doesn't. Isn't it just luck?",
        required_concepts: [
          [
            { term: 'specific', synonyms: ['specificity', 'clear', 'clarity', 'precise', 'detailed', 'explicit', 'instructions'], weight: 3 },
          ],
          [
            { term: 'context', synonyms: ['background', 'role', 'system prompt', 'examples', 'few-shot', 'few shot'], weight: 3 },
            { term: 'structure', synonyms: ['structured', 'format', 'template', 'framework', 'step by step', 'chain of thought'], weight: 2 },
          ],
        ],
        forbidden_terms: [],
        min_word_count: 15,
        max_reading_level: null,
        xp_reward: 125,
        partial_xp_reward: 50,
        hint: 'Think about clarity, context-setting, and structured output.',
      },
      {
        id: 'c4_2',
        type: 'TEACH_BACK',
        title: 'ELI5: Prompting',
        prompt: 'Explain why prompt engineering matters to someone who just uses ChatGPT casually.',
        initialAiMessage: "I just ask ChatGPT stuff and it answers. Why would I need to learn special ways to ask?",
        required_concepts: [
          [
            { term: 'ask', synonyms: ['question', 'request', 'tell', 'instruct', 'describe', 'explain to'], weight: 2 },
          ],
          [
            { term: 'better', synonyms: ['improved', 'accurate', 'useful', 'helpful', 'quality', 'good'], weight: 2 },
            { term: 'answer', synonyms: ['response', 'output', 'result', 'reply', 'results'], weight: 1 },
          ],
        ],
        forbidden_terms: [
          { term: 'token', hint: 'Say "word" or "piece of text" instead.' },
          { term: 'temperature', hint: 'Say "randomness setting" or just "creativity dial."' },
          { term: 'embedding', hint: 'Way too technical. Skip it.' },
          { term: 'latent space', hint: 'No one casually knows this. Skip it.' },
        ],
        min_word_count: 20,
        max_reading_level: 8,
        xp_reward: 125,
        partial_xp_reward: 50,
        hint: 'Compare it to asking a really smart person a vague question vs a specific one.',
      },
    ],
  },
  {
    id: '5',
    youtubeId: 'jGwO_UgTS7I',
    title: 'AI Hallucinations',
    creator: '@IBMTechnology',
    category: 'AI Safety',
    xp: 300,
    guruTitle: 'AI Safety Guru',
    applicationScenario: {
      role: 'AI Safety Officer',
      context: 'A medical startup wants to use AI to diagnose patients. The AI sometimes confidently gives wrong answers. You must explain the risk.',
    },
    challenges: [
      {
        id: 'c5_1',
        type: 'CONCEPT_CHECK',
        title: 'Why AI Lies',
        prompt: 'Why do LLMs "hallucinate"? Why do they state false things with confidence?',
        initialAiMessage: "The AI sounded so sure when it gave a wrong answer. Does it know it's lying?",
        required_concepts: [
          [
            { term: 'confidence', synonyms: ['confident', 'certainty', 'sure', 'convincing', 'plausible', 'fluent'], weight: 2 },
            { term: 'no understanding', synonyms: ['doesnt understand', 'no knowledge', 'not aware', 'no awareness', 'doesnt know', 'cant tell'], weight: 3 },
          ],
          [
            { term: 'training data', synonyms: ['trained on', 'learned from', 'data it saw', 'patterns in data', 'statistical'], weight: 3 },
          ],
        ],
        forbidden_terms: [],
        min_word_count: 15,
        max_reading_level: null,
        xp_reward: 150,
        partial_xp_reward: 60,
        hint: "The model doesn't 'know' truth from fiction \u2014 it generates plausible-sounding text.",
      },
      {
        id: 'c5_2',
        type: 'TEACH_BACK',
        title: 'ELI5: Hallucinations',
        prompt: 'Explain AI hallucinations to a non-technical manager who trusts ChatGPT completely.',
        initialAiMessage: "ChatGPT is always right though, isn't it? It sounds so professional. Why would I double-check it?",
        required_concepts: [
          [
            { term: 'make up', synonyms: ['makes up', 'invents', 'fabricates', 'creates', 'generates', 'guesses', 'fills in gaps'], weight: 3 },
          ],
          [
            { term: 'check', synonyms: ['verify', 'double check', 'fact check', 'confirm', 'validate', 'review', 'trust but verify'], weight: 3 },
          ],
        ],
        forbidden_terms: [
          { term: 'hallucinate', hint: 'They won\'t understand this term. Say "makes things up" or "invents facts."' },
          { term: 'stochastic', hint: 'Say "random" or "unpredictable" instead.' },
          { term: 'inference', hint: 'Say "when it generates an answer" instead.' },
          { term: 'token', hint: 'Say "word" or "text" instead.' },
        ],
        min_word_count: 20,
        max_reading_level: 8,
        xp_reward: 150,
        partial_xp_reward: 60,
        hint: 'Compare it to a confident student who makes up an answer rather than saying "I don\'t know."',
      },
    ],
  },
  {
    id: '6',
    youtubeId: 'HkdAHXoRtos',
    title: 'Git for AI Projects',
    creator: '@fireship',
    category: 'AI Tooling',
    xp: 200,
    guruTitle: 'Version Control Guru',
    applicationScenario: {
      role: 'ML Ops Engineer',
      context: 'A junior ML engineer deleted a model training branch. They think the code and experiment results are gone forever.',
    },
    challenges: [
      {
        id: 'c6_1',
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
        xp_reward: 100,
        partial_xp_reward: 40,
        hint: 'A branch is just a movable pointer to a commit.',
      },
    ],
  },
  {
    id: '7',
    youtubeId: 'Tn6-PIqc4UM',
    title: 'React for AI Apps',
    creator: '@fireship',
    category: 'AI Tooling',
    xp: 250,
    guruTitle: 'AI Frontend Guru',
    applicationScenario: {
      role: 'AI Frontend Engineer',
      context: 'You\'re building a ChatGPT-like interface. The app freezes on every keystroke while streaming AI responses. Users are complaining.',
    },
    challenges: [
      {
        id: 'c7_1',
        type: 'CONCEPT_CHECK',
        title: 'Virtual DOM',
        prompt: 'Why do we need a Virtual DOM? Why is direct DOM manipulation slow for AI chat UIs?',
        initialAiMessage: "The browser already has a DOM. Why add another layer? Isn't that making things slower?",
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
        id: 'c7_2',
        type: 'TEACH_BACK',
        title: 'ELI5: React',
        prompt: 'Explain React re-rendering to someone who only knows HTML and wants to build AI tools.',
        initialAiMessage: "I know HTML. I make web pages. Why do I need this React thing to build an AI chatbot?",
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
          { term: 'fiber', hint: 'Skip this \u2014 say "it works in small steps".' },
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
// 3. XP PERSISTENCE HOOK
// ============================================================================

const STORAGE_KEY = '@kesandu_guru_xp';

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

  return { totalXP, level, currentLevelXP, nextLevelXP, awardXP, isComplete, loaded, getModuleProgress };
}

// ============================================================================
// 6. COMPONENTS
// ============================================================================

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
        <TouchableOpacity style={styles.celebrationBtn} onPress={onDismiss}>
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

export default function App() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeModule, setActiveModule] = useState(null);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [showCelebration, setShowCelebration] = useState(null);
  const { totalXP, level, currentLevelXP, nextLevelXP, awardXP, isComplete, loaded, getModuleProgress } = useXP();

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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Check if this completion unlocks guru status for the module
    setTimeout(() => {
      for (const mod of CONTENT_DATA) {
        const allDone = mod.challenges.every(
          c => c.id === challengeId || isComplete(c.id)
        );
        if (allDone && mod.challenges.some(c => c.id === challengeId)) {
          setShowCelebration(mod.guruTitle);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        }
      }
    }, 500);
  }, [awardXP, isComplete]);

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

  // Count total guru badges earned
  const guruCount = CONTENT_DATA.filter(m => getModuleProgress(m).isGuru).length;

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
          <Text style={styles.logo}>KESANDU</Text>
          <Text style={styles.logoSubtitle}>GURU</Text>
        </View>
        <View style={styles.hudRight}>
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
            <TouchableOpacity onPress={handleCloseModule}>
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
                      {c.type === 'TEACH_BACK' ? '\uD83C\uDF93 Teach Back' : '\uD83E\uDDEA Concept Check'}
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
    </View>
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
});

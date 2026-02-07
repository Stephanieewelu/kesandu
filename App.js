import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet, Text, View, Dimensions, TouchableOpacity,
  TextInput, Modal, ScrollView, SafeAreaView, FlatList,
  ActivityIndicator, Platform, KeyboardAvoidingView,
  Keyboard, Animated, Pressable, Easing, AppState, Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import {
  Brain, CheckCircle, Zap, X, Send,
  ChevronRight, Briefcase, Play,
  RotateCcw, Target, Activity, Cpu, Sparkles, Settings,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Line, Circle as SvgCircle, G, Defs, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import YoutubePlayer from 'react-native-youtube-iframe';

const { width, height } = Dimensions.get('window');
const IS_IOS = Platform.OS === 'ios';

// ============================================================================
// 1. THEME — "Bioluminescent Dark"
// ============================================================================

const T = {
  // Core
  bg: '#000000',
  surface: '#0A0A12',
  card: '#0D0D1A',
  border: '#1A1A2E',

  // Neon Bioluminescence
  primary: '#00E5FF',
  primaryDim: 'rgba(0,229,255,0.15)',
  success: '#00FF9D',
  successDim: 'rgba(0,255,157,0.12)',
  danger: '#FF3366',
  dangerDim: 'rgba(255,51,102,0.15)',
  warning: '#FFD600',
  warningDim: 'rgba(255,214,0,0.1)',
  partial: '#FF8C00',
  guru: '#FFD700',

  // Neural
  synapse: '#7B61FF',
  synapseDim: 'rgba(123,97,255,0.2)',
  neural: '#00FF9D',
  neuralPulse: '#00E5FF',

  // Text
  text: '#FFFFFF',
  soft: '#8888AA',
  muted: '#555577',

  // Clarity states
  crystal: '#00E5FF',
  muddy: '#FF3366',
  haze: 'rgba(0,0,0,0.7)',
};

// ============================================================================
// 2. CONTENT DATABASE
// ============================================================================

const CONTENT = [
  {
    id: '1',
    youtubeId: 'zjkBMFhNj_g',
    title: 'Large Language Models',
    creator: '@karpathy',
    category: 'AI ENGINEERING',
    xp: 300,
    scenario: { role: 'AI Consultant', context: 'A law firm wants to replace paralegals with an LLM. They trust it blindly.' },
    challenges: [
      {
        id: 'c1_1', type: 'CONCEPT_CHECK', title: 'The Mechanism',
        prompt: 'Does an LLM "know" facts? Explain how it generates the next word.',
        aiOpener: "I asked ChatGPT the capital of France and it got it right. That proves it has a database of facts, doesn't it?",
        aiPersona: 'skeptical_executive',
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
        min_word_count: 15, max_reading_level: null,
        xp_reward: 150, partial_xp_reward: 60,
        hint: 'Focus on the statistical nature of the output.',
      },
      {
        id: 'c1_2', type: 'TEACH_BACK', title: 'Guru Synthesis',
        prompt: 'Explain LLMs to a 5-year-old. Analogy only. No jargon.',
        aiOpener: "I'm 5. I don't know what a 'neural net' is. How does the computer write stories?",
        aiPersona: 'curious_child',
        required_concepts: [
          [{ term: 'like a', synonyms: ['imagine', 'pretend', 'think of', 'similar to', 'just like', 'same as'], weight: 3 }],
          [
            { term: 'guess', synonyms: ['guesses', 'guessing', 'fills in', 'completes', 'finishes', 'auto-complete', 'autocomplete'], weight: 3 },
            { term: 'story', synonyms: ['stories', 'sentences', 'words', 'book'], weight: 1 },
          ],
        ],
        forbidden_terms: [
          { term: 'transformer', hint: '"smart helper" or "word machine"' },
          { term: 'stochastic', hint: '"random" or "guessing"' },
          { term: 'gradient', hint: 'Skip calculus for a 5-year-old!' },
          { term: 'vector', hint: '"direction" or skip it' },
          { term: 'embedding', hint: '"turning words into numbers"' },
          { term: 'neural', hint: '"brain" or "smart computer"' },
          { term: 'algorithm', hint: '"recipe" or "steps"' },
          { term: 'parameter', hint: 'Too technical — skip it' },
        ],
        min_word_count: 20, max_reading_level: 7,
        xp_reward: 150, partial_xp_reward: 60,
        hint: "Use an analogy like 'guessing game'. No big words.",
      },
    ],
  },
  {
    id: '2',
    youtubeId: 'HkdAHXoRtos',
    title: 'Git Version Control',
    creator: '@fireship',
    category: 'DEVOPS',
    xp: 250,
    scenario: { role: 'Lead Developer', context: 'A junior dev deleted a branch. They think the code is gone forever.' },
    challenges: [
      {
        id: 'c2_1', type: 'CONCEPT_CHECK', title: 'Mental Model',
        prompt: 'Explain the difference between a Branch and a Commit.',
        aiOpener: "Isn't a branch just a folder of files? When I switch branches, where do my files go?",
        aiPersona: 'confused_junior',
        required_concepts: [
          [{ term: 'pointer', synonyms: ['reference', 'label', 'sticky note', 'bookmark', 'points to', 'refers to'], weight: 3 }],
          [{ term: 'snapshot', synonyms: ['hash', 'history', 'commit', 'save point', 'checkpoint', 'record'], weight: 2 }],
        ],
        forbidden_terms: [],
        min_word_count: 15, max_reading_level: null,
        xp_reward: 125, partial_xp_reward: 50,
        hint: 'A branch is a movable pointer to a commit.',
      },
    ],
  },
  {
    id: '3',
    youtubeId: 'Tn6-PIqc4UM',
    title: 'React Fundamentals',
    creator: '@fireship',
    category: 'WEB DEV',
    xp: 250,
    scenario: { role: 'Performance Engineer', context: 'A React app freezes on every keystroke. Users are furious.' },
    challenges: [
      {
        id: 'c3_1', type: 'CONCEPT_CHECK', title: 'Virtual DOM',
        prompt: 'Why do we need a Virtual DOM? Why is direct DOM manipulation slow?',
        aiOpener: "The browser already has a DOM. Why add another layer? That's slower, not faster.",
        aiPersona: 'skeptical_executive',
        required_concepts: [
          [
            { term: 'batch', synonyms: ['batching', 'batches', 'groups', 'combines', 'collects'], weight: 3 },
            { term: 'diff', synonyms: ['diffing', 'compare', 'comparison', 'reconciliation', 'reconcile', 'checks what changed'], weight: 3 },
          ],
          [{ term: 'repaint', synonyms: ['reflow', 'expensive', 'slow', 'layout', 're-render', 'redraw', 'costly'], weight: 2 }],
        ],
        forbidden_terms: [],
        min_word_count: 20, max_reading_level: null,
        xp_reward: 125, partial_xp_reward: 50,
        hint: "Talk about 'batching' updates or 'diffing'.",
      },
      {
        id: 'c3_2', type: 'TEACH_BACK', title: 'ELI5: React',
        prompt: 'Explain React re-rendering to someone who only knows HTML.',
        aiOpener: "I know HTML. My pages work fine. Why do I need this React thing?",
        aiPersona: 'curious_child',
        required_concepts: [
          [{ term: 'update', synonyms: ['updates', 'changes', 'change', 'refresh', 'modify', 'auto'], weight: 3 }],
          [{ term: 'page', synonyms: ['screen', 'display', 'view', 'website', 'app', 'interface'], weight: 1 }],
        ],
        forbidden_terms: [
          { term: 'virtual dom', hint: '"draft copy" or "blueprint"' },
          { term: 'reconciliation', hint: '"figures out what changed"' },
          { term: 'fiber', hint: '"works in small steps"' },
          { term: 'jsx', hint: '"HTML-like code"' },
        ],
        min_word_count: 20, max_reading_level: 8,
        xp_reward: 125, partial_xp_reward: 50,
        hint: 'Compare reloading vs. surgically updating parts.',
      },
    ],
  },
];

// ============================================================================
// 3. SEMANTIC VALIDATION ENGINE + NEURAL WEIGHT
// ============================================================================

function normalize(t) {
  return t.toLowerCase().replace(/[''"]/g, '').replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}
function tokenize(t) { return normalize(t).split(' ').filter(Boolean); }

function buildNGrams(tokens, maxN = 3) {
  const g = new Set();
  tokens.forEach(t => g.add(t));
  for (let n = 2; n <= Math.min(maxN, tokens.length); n++)
    for (let i = 0; i <= tokens.length - n; i++)
      g.add(tokens.slice(i, i + n).join(' '));
  return g;
}

function countSyllables(w) {
  w = w.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 2) return 1;
  const vg = w.match(/[aeiouy]+/g);
  let c = vg ? vg.length : 1;
  if (w.endsWith('e') && !w.endsWith('le') && c > 1) c--;
  if (w.endsWith('ed') && !w.endsWith('ted') && !w.endsWith('ded')) c = Math.max(1, c - 1);
  return Math.max(1, c);
}

function readingLevel(text) {
  const sents = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const words = tokenize(text);
  if (!sents.length || !words.length) return 0;
  const syl = words.reduce((s, w) => s + countSyllables(w), 0);
  return Math.max(0, Math.round((0.39 * (words.length / sents.length) + 11.8 * (syl / words.length) - 15.59) * 10) / 10);
}

function conceptMatch(c, ng) {
  if (ng.has(normalize(c.term))) return c.term;
  if (c.synonyms) for (const s of c.synonyms) if (ng.has(normalize(s))) return s;
  return null;
}

function matchGroups(groups, ng) {
  return groups.map((grp, gi) => {
    let best = null;
    for (const c of grp) {
      const m = conceptMatch(c, ng);
      if (m && (!best || (c.weight || 1) > best.weight)) best = { term: m, weight: c.weight || 1 };
    }
    return { gi, hit: !!best, term: best?.term, weight: best?.weight ?? Math.max(...grp.map(c => c.weight || 1)), max: Math.max(...grp.map(c => c.weight || 1)) };
  });
}

function findForbidden(norm, terms) {
  return (terms || []).filter(f => norm.includes(normalize(f.term))).map(f => ({ term: f.term, hint: f.hint }));
}

// ── Real-time concept detection (for live pulse) ──
function liveConceptScan(input, challenge) {
  const ng = buildNGrams(tokenize(input));
  const groups = challenge.required_concepts;
  let matched = 0;
  let total = groups.length;
  const hits = [];
  for (const grp of groups) {
    for (const c of grp) {
      const m = conceptMatch(c, ng);
      if (m) { matched++; hits.push(m); break; }
    }
  }
  // Forbidden live scan
  const norm = normalize(input);
  const jargon = findForbidden(norm, challenge.forbidden_terms);
  return { matched, total, ratio: total > 0 ? matched / total : 0, hits, jargon };
}

// ── Full evaluation with Neural Weight ──
const PASS = 70, PARTIAL_T = 40, F_PEN = 15, R_PEN = 20, SHORT_CAP = 30;

function evaluate(input, challenge, startTime) {
  const norm = normalize(input);
  const tokens = tokenize(input);
  const ng = buildNGrams(tokens);
  const fb = [];
  const isTeach = challenge.type === 'TEACH_BACK';

  const minW = challenge.min_word_count || 10;
  const wcOk = tokens.length >= minW;
  if (!wcOk) fb.push(`Too brief — ${tokens.length}/${minW} words.`);

  const forbidden = isTeach ? findForbidden(norm, challenge.forbidden_terms) : [];
  if (forbidden.length) {
    fb.push('⚡ JARGON BREACH:');
    forbidden.forEach(v => fb.push(`   "${v.term}" → ${v.hint}`));
  }

  const concepts = matchGroups(challenge.required_concepts, ng);
  const totalW = concepts.reduce((s, c) => s + c.max, 0);
  const matchedW = concepts.filter(c => c.hit).reduce((s, c) => s + c.weight, 0);
  const missed = concepts.filter(c => !c.hit);

  if (missed.length) {
    fb.push(`Covered ${concepts.length - missed.length}/${concepts.length} neural pathways.`);
    if (challenge.hint) fb.push(`↳ ${challenge.hint}`);
  } else {
    fb.push('✦ All neural pathways activated.');
  }

  let rl = null;
  if (isTeach && challenge.max_reading_level != null && tokens.length >= 10) {
    const actual = readingLevel(input);
    const ok = actual <= challenge.max_reading_level;
    rl = { actual, max: challenge.max_reading_level, passed: ok };
    if (!ok) fb.push(`Complexity grade ${actual} → simplify to grade ${challenge.max_reading_level}.`);
  }

  let score = totalW > 0 ? (matchedW / totalW) * 100 : 0;
  score -= forbidden.length * F_PEN;
  if (rl && !rl.passed) score -= R_PEN;
  if (!wcOk) score = Math.min(score, SHORT_CAP);
  score = Math.max(0, Math.min(100, Math.round(score)));

  // ── Neural Weight: Accuracy × Efficiency × Velocity ──
  const elapsed = (Date.now() - startTime) / 1000;
  const efficiency = Math.max(0.5, 1 - (tokens.length / 200)); // Brevity bonus
  const velocity = elapsed < 30 ? 1.25 : elapsed < 60 ? 1.1 : elapsed < 120 ? 1.0 : 0.85;
  const neuralWeight = Math.round(score * efficiency * velocity);

  let status = 'FAIL', xpEarned = 0, passed = false;
  const xpR = challenge.xp_reward || 100;
  const pXP = challenge.partial_xp_reward || Math.round(xpR * 0.4);

  if (score >= PASS) {
    passed = true; xpEarned = xpR; status = 'PASS';
  } else if (score >= PARTIAL_T) {
    xpEarned = pXP; status = 'PARTIAL';
  }

  // ── Clarity Level ──
  const clarity = score >= 85 ? 'CRYSTAL' : score >= 70 ? 'CLEAR' : score >= 50 ? 'HAZY' : 'MUDDY';

  return {
    passed, score, xpEarned, status, feedback: fb, neuralWeight, clarity,
    velocity: velocity > 1 ? 'FAST' : velocity < 1 ? 'SLOW' : 'STEADY',
    efficiency: Math.round(efficiency * 100),
    elapsed: Math.round(elapsed),
    breakdown: { concepts, forbidden, wordCount: { actual: tokens.length, required: minW, passed: wcOk }, readingLevel: rl },
  };
}

// ============================================================================
// 4. AI AGENT — Persona-driven response generator
// ============================================================================

// This is the "Ghost in the Machine" — it generates contextual, persona-driven
// responses that make the AI feel alive, not just a validator.

const AI_PERSONAS = {
  skeptical_executive: {
    name: 'The Executive',
    avatar: '🏢',
    passResponses: [
      "Alright, that actually makes sense. I'll stop telling the board it's magic. Your neural weight is impressive.",
      "Okay, I'm convinced. You didn't just know it — you explained it like someone who's built one. Guru status earned.",
      "That's the clearest explanation I've heard in 47 board meetings. You've earned my respect.",
    ],
    partialResponses: [
      "I see where you're going, but my board needs a tighter pitch. You're close — tighten up the core concept.",
      "Almost there. You've got the intuition but the precision isn't quite boardroom-ready.",
      "Interesting angle, but I could poke holes in it. Shore up the fundamentals.",
    ],
    failResponses: [
      "I'm still confused, and I run a billion-dollar company. Try again — pretend my money depends on understanding this.",
      "If I presented this to my board, they'd fire me. Let's go deeper.",
      "That felt like a Wikipedia summary. I need understanding, not recitation.",
    ],
  },
  curious_child: {
    name: 'Little Genius',
    avatar: '👶',
    passResponses: [
      "Ohhhh! So it's like a guessing game! I get it now! You're really good at explaining things! ⭐",
      "That was SO cool! Even my teddy bear could understand that! You're a super teacher!",
      "WOW! Now I can tell my friends how computers write! You made it so easy!",
    ],
    partialResponses: [
      "Hmm, I kinda get it... but some words were too big. Can you use smaller words?",
      "I understand a little bit! But what does that big word mean? Try again simpler?",
      "Almost! But my brain got confused in the middle. Can you use a story?",
    ],
    failResponses: [
      "I don't understand... 😢 You used grown-up words. Can you try again like you're talking to me at the playground?",
      "That made my head hurt! Too many hard words! Try again but pretend I'm really really little.",
      "Huh? I'm 5! I don't know what those words mean! Use small words please!",
    ],
  },
  confused_junior: {
    name: 'Junior Dev',
    avatar: '💻',
    passResponses: [
      "OH. Oh wow. That actually clicks now. I've been thinking about this wrong the whole time. Thank you!",
      "Wait — so it's THAT simple? I overcomplicated it in my head. This is a lightbulb moment. 💡",
      "Okay I literally just had a breakthrough. I'm screenshotting this. Guru certified.",
    ],
    partialResponses: [
      "I think I'm getting closer... but I'm still fuzzy on one part. Can you connect the dots more?",
      "Hmm, some of that landed but I'm still shaky. Try a different angle?",
      "I see pieces of it but the full picture isn't clicking yet.",
    ],
    failResponses: [
      "I'm sorry, I'm still lost. Maybe try explaining it like I literally started coding yesterday?",
      "That went over my head. I need something more concrete — like an example I can picture.",
      "I wish I understood that but honestly I'm more confused now. Start from the basics?",
    ],
  },
};

function generateAIResponse(result, challenge) {
  const persona = AI_PERSONAS[challenge.aiPersona] || AI_PERSONAS.skeptical_executive;
  let pool;
  if (result.status === 'PASS') pool = persona.passResponses;
  else if (result.status === 'PARTIAL') pool = persona.partialResponses;
  else pool = persona.failResponses;

  const response = pool[Math.floor(Math.random() * pool.length)];
  return { text: response, persona };
}

// ============================================================================
// 5. XP + SYNAPSE PERSISTENCE
// ============================================================================

const XP_KEY = '@kesandu_v3';
const PREFS_KEY = '@kesandu_prefs';
const ONBOARD_KEY = '@kesandu_onboarded';

function xpForLv(lv) { return Math.floor(100 * Math.pow(1.4, lv - 1)); }
function calcLv(xp) { let lv = 1, acc = 0; while (acc + xpForLv(lv) <= xp) { acc += xpForLv(lv); lv++; } return lv; }

function useXP() {
  const [xp, setXP] = useState(0);
  const [done, setDone] = useState({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(XP_KEY).then(raw => {
      if (raw) { const d = JSON.parse(raw); setXP(d.xp || 0); setDone(d.done || {}); }
      setReady(true);
    }).catch(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(XP_KEY, JSON.stringify({ xp, done })).catch(() => {});
  }, [xp, done, ready]);

  const award = useCallback((pts, cid, nw) => {
    if (cid && done[cid]) return;
    setXP(p => p + pts);
    if (cid) setDone(p => ({ ...p, [cid]: { ts: Date.now(), nw: nw || 0 } }));
  }, [done]);

  const reset = useCallback(() => {
    setXP(0);
    setDone({});
  }, []);

  const isDone = useCallback((id) => !!done[id], [done]);
  const getSynapse = useCallback((id) => done[id] || null, [done]);

  const lv = calcLv(xp);
  const lvXP = xp - Array.from({ length: lv - 1 }, (_, i) => xpForLv(i + 1)).reduce((a, b) => a + b, 0);
  const nextXP = xpForLv(lv);

  return { xp, lv, lvXP, nextXP, award, isDone, getSynapse, done, ready, reset };
}

function usePreferences() {
  const [prefs, setPrefs] = useState({ haptics: true, reduceMotion: false });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY).then(raw => {
      if (raw) setPrefs(p => ({ ...p, ...JSON.parse(raw) }));
      setReady(true);
    }).catch(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs)).catch(() => {});
  }, [prefs, ready]);

  const update = useCallback((patch) => {
    setPrefs(prev => ({ ...prev, ...patch }));
  }, []);

  return { prefs, update, ready };
}

function useOnboarding() {
  const [seen, setSeen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARD_KEY).then(raw => {
      if (raw === 'true') setSeen(true);
      setReady(true);
    }).catch(() => setReady(true));
  }, []);

  const dismiss = useCallback(() => {
    setSeen(true);
    AsyncStorage.setItem(ONBOARD_KEY, 'true').catch(() => {});
  }, []);

  return { seen, ready, dismiss };
}

// ============================================================================
// 6. ANIMATED COMPONENTS
// ============================================================================

// ── Glitch Effect ──
function GlitchOverlay({ active, reduceMotion }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active || reduceMotion) return;
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 8, duration: 50, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(translateX, { toValue: -6, duration: 40, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(translateX, { toValue: 4, duration: 40, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 100, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: 80, useNativeDriver: true }),
      ]),
    ]).start();
  }, [active, reduceMotion, opacity, translateX]);

  if (!active || reduceMotion) return null;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity, transform: [{ translateX }], zIndex: 100 }]} pointerEvents="none">
      <View style={{ flex: 1, backgroundColor: 'rgba(255,51,102,0.08)' }} />
      <View style={{ position: 'absolute', top: '30%', left: 0, right: 0, height: 2, backgroundColor: T.danger, opacity: 0.6 }} />
      <View style={{ position: 'absolute', top: '60%', left: 0, right: 0, height: 1, backgroundColor: T.danger, opacity: 0.4 }} />
    </Animated.View>
  );
}

// ── Neural Pulse Bar (real-time concept detection) ──
function NeuralPulse({ ratio, jargonCount, clarity, reduceMotion }) {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, { toValue: ratio, duration: reduceMotion ? 0 : 300, useNativeDriver: false }).start();
  }, [ratio, reduceMotion, widthAnim]);

  useEffect(() => {
    if (reduceMotion) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [reduceMotion, pulseAnim]);

  const color = jargonCount > 0 ? T.danger : ratio >= 1 ? T.success : ratio > 0 ? T.primary : T.muted;
  const label = jargonCount > 0 ? 'JARGON DETECTED' : clarity || (ratio >= 1 ? 'ALL CONCEPTS FOUND' : ratio > 0 ? 'DETECTING CONCEPTS...' : 'AWAITING INPUT');

  return (
    <View style={sty.pulseContainer}>
      <View style={sty.pulseTrack}>
        <Animated.View style={[sty.pulseFill, {
          backgroundColor: color,
          width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }]} />
        {!reduceMotion && <Animated.View style={[sty.pulseGlow, { opacity: pulseAnim, backgroundColor: color }]} />}
      </View>
      <View style={sty.pulseInfo}>
        <Activity size={10} color={color} />
        <Text style={[sty.pulseLabel, { color }]}>{label}</Text>
      </View>
    </View>
  );
}

// ── Neural Weight Display ──
function NeuralWeightBadge({ nw, clarity, velocity, efficiency, elapsed, reduceMotion }) {
  const scaleAnim = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      scaleAnim.setValue(1);
      return;
    }
    Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }).start();
  }, [reduceMotion, scaleAnim]);

  const clarityColor = clarity === 'CRYSTAL' ? T.primary : clarity === 'CLEAR' ? T.success : clarity === 'HAZY' ? T.partial : T.danger;

  return (
    <Animated.View style={[sty.nwContainer, { transform: [{ scale: scaleAnim }] }]}>
      <View style={sty.nwHeader}>
        <Cpu size={14} color={T.primary} />
        <Text style={sty.nwTitle}>NEURAL WEIGHT</Text>
      </View>
      <Text style={[sty.nwScore, { color: clarityColor }]}>{nw}</Text>
      <View style={sty.nwRow}>
        <View style={sty.nwStat}>
          <Text style={sty.nwStatLabel}>CLARITY</Text>
          <Text style={[sty.nwStatVal, { color: clarityColor }]}>{clarity}</Text>
        </View>
        <View style={[sty.nwDivider]} />
        <View style={sty.nwStat}>
          <Text style={sty.nwStatLabel}>VELOCITY</Text>
          <Text style={[sty.nwStatVal, { color: velocity === 'FAST' ? T.success : velocity === 'SLOW' ? T.danger : T.soft }]}>{velocity}</Text>
        </View>
        <View style={[sty.nwDivider]} />
        <View style={sty.nwStat}>
          <Text style={sty.nwStatLabel}>EFFICIENCY</Text>
          <Text style={sty.nwStatVal}>{efficiency}%</Text>
        </View>
      </View>
      <Text style={sty.nwTime}>{elapsed}s response time</Text>
    </Animated.View>
  );
}

// ── Score Bar ──
function ScoreBar({ score, status, reduceMotion }) {
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(w, { toValue: score, duration: reduceMotion ? 0 : 700, useNativeDriver: false }).start(); }, [score, reduceMotion, w]);
  const c = status === 'PASS' ? T.success : status === 'PARTIAL' ? T.partial : T.danger;
  return (
    <View style={sty.sBarRow}>
      <View style={sty.sBarTrack}>
        <Animated.View style={[sty.sBarFill, { backgroundColor: c, width: w.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
      </View>
      <Text style={[sty.sBarNum, { color: c }]}>{score}</Text>
    </View>
  );
}

// ── Concept Breakdown ──
function Breakdown({ data }) {
  if (!data) return null;
  return (
    <View style={sty.bd}>
      <Text style={sty.bdHead}>NEURAL PATHWAYS</Text>
      {data.concepts.map((c, i) => (
        <View key={i} style={sty.bdRow}>
          <View style={[sty.bdDot, { backgroundColor: c.hit ? T.success : T.danger }]} />
          <Text style={sty.bdText}>
            Path {i + 1}{c.term ? ` → "${c.term}"` : ' ✗ inactive'}
          </Text>
          <Text style={[sty.bdW, { color: c.hit ? T.success : T.muted }]}>×{c.weight}</Text>
        </View>
      ))}
      <View style={sty.bdRow}>
        <View style={[sty.bdDot, { backgroundColor: data.wordCount.passed ? T.success : T.partial }]} />
        <Text style={sty.bdText}>Density: {data.wordCount.actual}/{data.wordCount.required} words</Text>
      </View>
      {data.readingLevel && (
        <View style={sty.bdRow}>
          <View style={[sty.bdDot, { backgroundColor: data.readingLevel.passed ? T.success : T.partial }]} />
          <Text style={sty.bdText}>Complexity: grade {data.readingLevel.actual} (≤{data.readingLevel.max})</Text>
        </View>
      )}
      {data.forbidden.length > 0 && data.forbidden.map((v, i) => (
        <View key={'f' + i} style={sty.bdRow}>
          <View style={[sty.bdDot, { backgroundColor: T.danger }]} />
          <Text style={[sty.bdText, { color: T.danger }]}>&quot;{v.term}&quot; → {v.hint}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Synaptic Map ──
function SynapticMap({ completions }) {
  // Build nodes from all challenges across all content
  const allChallenges = CONTENT.flatMap(c => c.challenges.map(ch => ({
    ...ch,
    parentTitle: c.title,
    parentCategory: c.category,
  })));

  const nodeCount = allChallenges.length;
  const centerX = width * 0.5;
  const centerY = 110;

  return (
    <View style={sty.mapContainer}>
      <View style={sty.mapHeader}>
        <Brain size={16} color={T.synapse} />
        <Text style={sty.mapTitle}>SYNAPTIC MAP</Text>
      </View>
      <Svg width={width - 40} height={220} viewBox={`0 0 ${width - 40} 220`}>
        <Defs>
          <RadialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={T.synapse} stopOpacity="0.6" />
            <Stop offset="100%" stopColor={T.synapse} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Synapses (connections) */}
        {allChallenges.map((ch, i) => {
          const angle = (i / nodeCount) * Math.PI * 2 - Math.PI / 2;
          const r = 70;
          const nx = centerX - 20 + Math.cos(angle) * r;
          const ny = centerY + Math.sin(angle) * r;
          const done = completions[ch.id];
          const decay = done ? Math.max(0.15, 1 - ((Date.now() - done.ts) / (7 * 86400000))) : 0.08;

          return (
            <G key={ch.id}>
              {/* Synapse line to center */}
              <Line
                x1={centerX - 20} y1={centerY}
                x2={nx} y2={ny}
                stroke={done ? T.synapse : T.border}
                strokeWidth={done ? 2 : 0.5}
                opacity={done ? decay : 0.15}
              />
              {/* Node */}
              {done && (
                <SvgCircle cx={nx} cy={ny} r={18} fill="url(#nodeGlow)" />
              )}
              <SvgCircle
                cx={nx} cy={ny} r={10}
                fill={done ? T.synapse : T.border}
                opacity={done ? Math.max(0.4, decay) : 0.2}
                stroke={done ? T.synapse : 'none'}
                strokeWidth={done ? 1 : 0}
              />
              {/* Label */}
              <SvgText
                x={nx} y={ny + 22}
                fill={done ? T.soft : T.muted}
                fontSize="8"
                textAnchor="middle"
                fontWeight="bold"
              >
                {ch.title.substring(0, 12)}
              </SvgText>
              {/* Neural weight */}
              {done && (
                <SvgText x={nx} y={ny + 4} fill="#FFF" fontSize="8" textAnchor="middle" fontWeight="bold">
                  {done.nw || '?'}
                </SvgText>
              )}
            </G>
          );
        })}

        {/* Center node (brain) */}
        <SvgCircle cx={centerX - 20} cy={centerY} r={20} fill={T.synapseDim} stroke={T.synapse} strokeWidth={1.5} />
        <SvgText x={centerX - 20} y={centerY + 4} fill={T.synapse} fontSize="18" textAnchor="middle">🧠</SvgText>
      </Svg>
    </View>
  );
}

// ============================================================================
// 7. CHAT ENGINE — The Neural Dojo
// ============================================================================

function ChatEngine({ challenge, onDone, onExit, alreadyDone, hapticsEnabled, reduceMotion }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [result, setResult] = useState(null);
  const [phase, setPhase] = useState('INPUT');
  const [glitchActive, setGlitchActive] = useState(false);
  const [liveScan, setLiveScan] = useState({ matched: 0, total: 0, ratio: 0, hits: [], jargon: [] });
  const startTime = useRef(Date.now());
  const listRef = useRef(null);
  const lastJargonCount = useRef(0);

  const tryHaptic = useCallback((fn) => {
    if (!hapticsEnabled) return;
    try { fn(); } catch (e) {}
  }, [hapticsEnabled]);

  // Initialize with AI opener
  useEffect(() => {
    const persona = AI_PERSONAS[challenge.aiPersona] || AI_PERSONAS.skeptical_executive;
    setMsgs([
      {
        id: '0',
        text: challenge.aiOpener,
        from: 'ai',
        persona,
      },
    ]);
    startTime.current = Date.now();
  }, [challenge]);

  // ── Real-time concept scanning as user types ──
  useEffect(() => {
    if (!text.trim()) {
      setLiveScan({ matched: 0, total: challenge.required_concepts.length, ratio: 0, hits: [], jargon: [] });
      return;
    }
    const scan = liveConceptScan(text, challenge);
    setLiveScan(scan);

    // Trigger glitch on NEW jargon detection
    if (scan.jargon.length > lastJargonCount.current) {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 350);
    }
    lastJargonCount.current = scan.jargon.length;

    // Heartbeat haptics as concepts are found
    if (scan.matched > 0 && scan.ratio < 1) {
      tryHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    } else if (scan.ratio >= 1) {
      tryHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
    }
  }, [text, challenge, tryHaptic]);

  const send = useCallback(() => {
    const val = text.trim();
    if (!val || typing) return;

    tryHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    setMsgs(p => [...p, { id: String(Date.now()), text: val, from: 'user' }]);
    const userInput = text;
    setText('');
    setTyping(true);
    Keyboard.dismiss();

    setTimeout(() => {
      const res = evaluate(userInput, challenge, startTime.current);
      const aiRes = generateAIResponse(res, challenge);
      setResult(res);

      setMsgs(p => [...p, {
        id: String(Date.now() + 1),
        text: aiRes.text,
        from: 'ai',
        persona: aiRes.persona,
        result: res,
      }]);
      setTyping(false);
      setPhase('RESULT');

      if (res.passed) {
        tryHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
      } else if (res.status === 'PARTIAL') {
        tryHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
      } else {
        tryHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
      }
    }, 1200);
  }, [text, typing, challenge, tryHaptic]);

  const retry = useCallback(() => {
    setPhase('INPUT');
    setResult(null);
    startTime.current = Date.now();
    setMsgs(p => [...p, { id: String(Date.now()), text: '↻ Neural pathways reset. Try a different approach.', from: 'system' }]);
  }, []);

  const collect = useCallback(() => {
    if (result?.xpEarned > 0 && !alreadyDone) {
      onDone(result.xpEarned, challenge.id, result.neuralWeight);
    } else {
      onExit();
    }
  }, [result, alreadyDone, challenge.id, onDone, onExit]);

  const renderMsg = useCallback(({ item }) => {
    if (item.from === 'system') {
      return (
        <View style={sty.systemMsg}>
          <Text style={sty.systemText}>{item.text}</Text>
        </View>
      );
    }
    const isAi = item.from === 'ai';
    return (
      <View style={{ marginBottom: 16 }}>
        {isAi && item.persona && (
          <View style={sty.personaRow}>
            <Text style={sty.personaAvatar}>{item.persona.avatar}</Text>
            <Text style={sty.personaName}>{item.persona.name}</Text>
          </View>
        )}
        <View style={[sty.bub, isAi ? sty.bubAi : sty.bubUser]}>
          <Text style={sty.bubText}>{item.text}</Text>
        </View>
        {item.result && (
          <View style={{ marginTop: 10 }}>
            <NeuralWeightBadge
              nw={item.result.neuralWeight}
              clarity={item.result.clarity}
              velocity={item.result.velocity}
              efficiency={item.result.efficiency}
              elapsed={item.result.elapsed}
              reduceMotion={reduceMotion}
            />
            <ScoreBar score={item.result.score} status={item.result.status} reduceMotion={reduceMotion} />
            <Breakdown data={item.result.breakdown} />
            {item.result.xpEarned > 0 && (
              <View style={sty.xpBadge}>
                <Zap size={13} color={T.guru} fill={T.guru} />
                <Text style={sty.xpBadgeText}>+{item.result.xpEarned} XP</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  }, [reduceMotion]);

  return (
    <SafeAreaView style={sty.chatSafe}>
      <GlitchOverlay active={glitchActive} reduceMotion={reduceMotion} />

      {/* Header */}
      <View style={sty.chatHead}>
        <TouchableOpacity onPress={onExit} style={sty.chatClose} accessibilityLabel="Close chat">
          <X size={20} color="#FFF" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={sty.chatType}>
            {challenge.type === 'TEACH_BACK' ? '🧬 NEURAL TEACH' : '⚡ CONCEPT SCAN'}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Challenge prompt */}
      <View style={sty.promptBox}>
        <Target size={13} color={T.primary} />
        <Text style={sty.promptText}>{challenge.prompt}</Text>
      </View>

      {alreadyDone && (
        <View style={sty.doneBanner}>
          <CheckCircle size={12} color={T.success} />
          <Text style={sty.doneLabel}>Completed — practice mode</Text>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={msgs}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={renderMsg}
      />

      {typing && (
        <View style={sty.typingRow}>
          <ActivityIndicator size="small" color={T.synapse} />
          <Text style={sty.typingLabel}>Processing neural pathways...</Text>
        </View>
      )}

      {/* Real-time Neural Pulse (visible while typing) */}
      {phase === 'INPUT' && <NeuralPulse ratio={liveScan.ratio} jargonCount={liveScan.jargon.length} reduceMotion={reduceMotion} />}

      {/* Input or Actions */}
      <KeyboardAvoidingView behavior={IS_IOS ? 'padding' : 'height'}>
        {phase === 'INPUT' ? (
          <View style={sty.inputBar}>
            <TextInput
              style={sty.inputField}
              placeholder="Channel your understanding..."
              placeholderTextColor={T.muted}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              style={[sty.sendBtn, !text.trim() && { backgroundColor: T.surface }]}
              onPress={send}
              disabled={!text.trim() || typing}
              accessibilityLabel="Send response"
            >
              <Send size={17} color={text.trim() ? '#000' : '#444'} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={sty.actionBar}>
            {result && result.status !== 'PASS' && (
              <TouchableOpacity style={sty.retryBtn} onPress={retry}>
                <RotateCcw size={15} color={T.soft} />
                <Text style={sty.retryLabel}>Retry</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[sty.collectBtn, {
                backgroundColor: result?.status === 'PASS' ? T.success : result?.status === 'PARTIAL' ? T.partial : T.muted,
              }]}
              onPress={collect}
            >
              <Text style={sty.collectLabel}>
                {result?.xpEarned > 0 && !alreadyDone ? `ABSORB +${result.xpEarned} XP` : 'EXIT'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============================================================================
// 8. VIDEO FEED CARD
// ============================================================================

function FeedCard({ item, active, onDojo, mastery }) {
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (active) {
      const t = setTimeout(() => setPlaying(true), 400);
      return () => clearTimeout(t);
    }
    setPlaying(false);
    setReady(false);
  }, [active]);

  const onState = useCallback((st) => {
    if (st === 'playing') setReady(true);
    if (st === 'ended') setPlaying(false);
  }, []);

  return (
    <View style={{ width, height, backgroundColor: '#000' }}>
      {/* Video layer */}
      {active ? (
        <View style={StyleSheet.absoluteFill}>
          <YoutubePlayer
            height={height} width={width}
            videoId={item.youtubeId} play={playing}
            onChangeState={onState}
            initialPlayerParams={{ controls: false, modestbranding: true, loop: true, rel: false }}
            webViewProps={{ androidLayerType: 'hardware', allowsInlineMediaPlayback: true, scrollEnabled: false }}
          />
        </View>
      ) : (
        <View style={[StyleSheet.absoluteFill, sty.placeholder]}>
          <Brain size={28} color="rgba(123,97,255,0.2)" />
          <Text style={sty.phText}>{item.title}</Text>
        </View>
      )}

      {/* Tap to play */}
      {active && !ready && (
        <Pressable style={[StyleSheet.absoluteFill, sty.tapLayer]} onPress={() => setPlaying(true)}>
          <View style={sty.playRing}>
            <Play size={28} color="#FFF" fill="#FFF" />
          </View>
          <Text style={sty.tapLabel}>TAP TO ACTIVATE</Text>
        </Pressable>
      )}

      {/* Mastery haze — fades as you complete challenges */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(0,0,0,${Math.max(0, 0.3 - mastery * 0.3)})` }]} pointerEvents="none" />

      {/* Info overlay */}
      <View style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end' }]} pointerEvents="box-none">
        <View style={sty.infoWrap} pointerEvents="box-none">
          <View style={sty.catPill}>
            <Text style={sty.catText}>{item.category}</Text>
          </View>
          <Text style={sty.vidTitle}>{item.title}</Text>
          <Text style={sty.vidCreator}>{item.creator}</Text>
          <Text style={sty.vidMeta}>
            {item.challenges.length} challenge{item.challenges.length > 1 ? 's' : ''} · +{item.xp} XP
          </Text>

          <TouchableOpacity style={sty.dojoBtn} onPress={() => onDojo(item)} activeOpacity={0.7}>
            <Brain size={18} color="#000" />
            <Text style={sty.dojoBtnText}>ENTER DOJO</Text>
            <Sparkles size={14} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const MemoCard = React.memo(FeedCard, (p, n) => p.item.id === n.item.id && p.active === n.active && p.mastery === n.mastery);

// ============================================================================
// 9. MAIN APP
// ============================================================================

export default function App() {
  const [idx, setIdx] = useState(0);
  const [moduleModal, setModuleModal] = useState(null);
  const [challengeModal, setChallengeModal] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const { xp, lv, lvXP, nextXP, award, isDone, getSynapse, done, ready, reset } = useXP();
  const { prefs, update, ready: prefsReady } = usePreferences();
  const { seen, ready: onboardReady, dismiss } = useOnboarding();

  useEffect(() => {
    const sub = AppState.addEventListener('change', setAppState);
    return () => sub.remove();
  }, []);

  const viewConfig = useRef({ itemVisiblePercentThreshold: 60, minimumViewTime: 250 }).current;
  const onViewChange = useRef(({ viewableItems }) => {
    if (viewableItems?.length > 0 && viewableItems[0].index != null) setIdx(viewableItems[0].index);
  }).current;
  const layout = useCallback((_, i) => ({ length: height, offset: height * i, index: i }), []);

  const openModule = useCallback((item) => setModuleModal(item), []);
  const openChallenge = useCallback((c) => {
    setModuleModal(null);
    setTimeout(() => setChallengeModal(c), 350);
  }, []);
  const onChallengeDone = useCallback((pts, cid, nw) => {
    award(pts, cid, nw);
    setChallengeModal(null);
    try {
      if (prefs.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
  }, [award, prefs.haptics]);
  const closeChallenge = useCallback(() => setChallengeModal(null), []);

  // Calculate mastery per content item
  const getMastery = useCallback((item) => {
    const total = item.challenges.length;
    if (total === 0) return 0;
    const completed = item.challenges.filter(c => isDone(c.id)).length;
    return completed / total;
  }, [isDone]);

  const anyModal = !!moduleModal || !!challengeModal || showMap || showSettings || (!seen && onboardReady);
  const isActive = appState === 'active';

  const renderCard = useCallback(({ item, index }) => (
    <MemoCard
      item={item}
      active={index === idx && !anyModal && isActive}
      onDojo={openModule}
      mastery={getMastery(item)}
    />
  ), [idx, anyModal, isActive, openModule, getMastery]);

  const lvProg = nextXP > 0 ? Math.min(1, lvXP / nextXP) : 0;
  const totalChallenges = CONTENT.reduce((s, c) => s + c.challenges.length, 0);
  const completedChallenges = CONTENT.reduce((s, c) => s + c.challenges.filter(ch => isDone(ch.id)).length, 0);

  const appReady = ready && prefsReady && onboardReady;

  const totalNeuralWeight = useMemo(
    () => Object.values(done).reduce((s, d) => s + (d.nw || 0), 0),
    [done]
  );

  if (!appReady) {
    return (
      <View style={sty.loadingRoot}>
        <ActivityIndicator size="large" color={T.primary} />
        <Text style={sty.loadingText}>Initializing neural circuits...</Text>
      </View>
    );
  }

  return (
    <View style={sty.root}>
      <StatusBar style="light" />

      {/* FEED */}
      <FlatList
        data={CONTENT}
        keyExtractor={i => i.id}
        renderItem={renderCard}
        pagingEnabled
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        viewabilityConfig={viewConfig}
        onViewableItemsChanged={onViewChange}
        getItemLayout={layout}
        windowSize={3}
        maxToRenderPerBatch={2}
        initialNumToRender={1}
        removeClippedSubviews={Platform.OS === 'android'}
      />

      {/* HUD */}
      <SafeAreaView style={sty.hud} pointerEvents="box-none">
        <View>
          <Text style={sty.logo}>KESANDU</Text>
          <Text style={sty.logoSub}>GURU</Text>
        </View>
        <View style={sty.hudRight}>
          <TouchableOpacity style={sty.mapBtn} onPress={() => setShowSettings(true)} accessibilityLabel="Open settings">
            <Settings size={16} color={T.synapse} />
          </TouchableOpacity>
          {/* Synaptic Map toggle */}
          <TouchableOpacity style={sty.mapBtn} onPress={() => setShowMap(true)} accessibilityLabel="Open synaptic map">
            <Brain size={16} color={T.synapse} />
          </TouchableOpacity>
          {/* Level + XP */}
          <View style={sty.lvBadge}>
            <Text style={sty.lvNum}>{lv}</Text>
          </View>
          <View>
            <View style={sty.xpTrack}>
              <View style={[sty.xpFill, { width: `${lvProg * 100}%` }]} />
            </View>
            <View style={sty.xpRow}>
              <Zap size={10} color={T.guru} fill={T.guru} />
              <Text style={sty.xpNum}>{xp}</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* MODULE MODAL */}
      <Modal visible={!!moduleModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModuleModal(null)}>
        <View style={sty.modalRoot}>
          <View style={sty.modalHead}>
            <Text style={sty.modalTitle}>⚡ TRAINING MODULE</Text>
            <TouchableOpacity onPress={() => setModuleModal(null)} style={sty.modalClose} accessibilityLabel="Close module">
              <X size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            {moduleModal && (
              <>
                <View style={sty.scenCard}>
                  <View style={sty.scenHead}>
                    <Briefcase size={14} color={T.warning} />
                    <Text style={sty.scenRole}>{moduleModal.scenario.role}</Text>
                  </View>
                  <Text style={sty.scenCtx}>{moduleModal.scenario.context}</Text>
                </View>
                <Text style={sty.secTitle}>NEURAL CHALLENGES</Text>
                {moduleModal.challenges.map((c, i) => {
                  const completed = isDone(c.id);
                  const syn = getSynapse(c.id);
                  return (
                    <TouchableOpacity key={c.id} style={[sty.chRow, completed && sty.chRowDone]} onPress={() => openChallenge(c)} activeOpacity={0.7}>
                      <View style={[sty.chCircle, completed && sty.chCircleDone]}>
                        {completed ? <CheckCircle size={14} color={T.success} /> : <Text style={sty.chNum}>{i + 1}</Text>}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={sty.chTitle}>{c.title}</Text>
                        <Text style={sty.chMeta}>
                          {c.type === 'TEACH_BACK' ? '🧬 Neural Teach' : '⚡ Concept Scan'} · +{c.xp_reward} XP
                        </Text>
                        {syn && <Text style={sty.chNW}>Neural Weight: {syn.nw}</Text>}
                      </View>
                      <ChevronRight size={16} color={completed ? T.success : T.primary} />
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* CHALLENGE MODAL */}
      <Modal visible={!!challengeModal} animationType="slide" onRequestClose={closeChallenge}>
        {challengeModal && (
          <ChatEngine
            challenge={challengeModal}
            onExit={closeChallenge}
            onDone={onChallengeDone}
            alreadyDone={isDone(challengeModal.id)}
            hapticsEnabled={prefs.haptics}
            reduceMotion={prefs.reduceMotion}
          />
        )}
      </Modal>

      {/* SYNAPTIC MAP MODAL */}
      <Modal visible={showMap} animationType="fade" transparent onRequestClose={() => setShowMap(false)}>
        <View style={sty.mapOverlay}>
          <View style={sty.mapModal}>
            <View style={sty.mapModalHead}>
              <Text style={sty.mapModalTitle}>🧠 SYNAPTIC MAP</Text>
              <TouchableOpacity onPress={() => setShowMap(false)} accessibilityLabel="Close synaptic map">
                <X size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
            <SynapticMap completions={done} />
            <View style={sty.mapStats}>
              <Text style={sty.mapStatText}>{completedChallenges}/{totalChallenges} synapses formed</Text>
              <Text style={sty.mapStatText}>Total Neural Weight: {totalNeuralWeight}</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* SETTINGS MODAL */}
      <Modal visible={showSettings} animationType="fade" transparent onRequestClose={() => setShowSettings(false)}>
        <View style={sty.mapOverlay}>
          <View style={sty.mapModal}>
            <View style={sty.mapModalHead}>
              <Text style={sty.mapModalTitle}>⚙️ SETTINGS</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)} accessibilityLabel="Close settings">
                <X size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={sty.settingsRow}>
              <View>
                <Text style={sty.settingsLabel}>Haptic Feedback</Text>
                <Text style={sty.settingsHint}>Turn off vibrations for a calmer session.</Text>
              </View>
              <Switch
                value={prefs.haptics}
                onValueChange={(value) => update({ haptics: value })}
                trackColor={{ false: T.border, true: T.primaryDim }}
                thumbColor={prefs.haptics ? T.primary : '#444'}
              />
            </View>
            <View style={sty.settingsRow}>
              <View>
                <Text style={sty.settingsLabel}>Reduce Motion</Text>
                <Text style={sty.settingsHint}>Minimize animated effects.</Text>
              </View>
              <Switch
                value={prefs.reduceMotion}
                onValueChange={(value) => update({ reduceMotion: value })}
                trackColor={{ false: T.border, true: T.primaryDim }}
                thumbColor={prefs.reduceMotion ? T.primary : '#444'}
              />
            </View>
            <View style={sty.settingsRow}>
              <View>
                <Text style={sty.settingsLabel}>Reset Progress</Text>
                <Text style={sty.settingsHint}>Clear XP and synaptic map history.</Text>
              </View>
              <TouchableOpacity style={sty.resetBtn} onPress={reset}>
                <Text style={sty.resetLabel}>RESET</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ONBOARDING MODAL */}
      <Modal visible={!seen} animationType="fade" transparent>
        <View style={sty.mapOverlay}>
          <View style={sty.mapModal}>
            <Text style={sty.mapModalTitle}>🧠 WELCOME TO KESANDU</Text>
            <Text style={sty.onboardText}>
              Train with short videos and neural challenges. Earn XP, unlock synapses, and master concepts faster.
            </Text>
            <View style={sty.onboardList}>
              <Text style={sty.onboardItem}>• Watch a clip, then enter the dojo.</Text>
              <Text style={sty.onboardItem}>• Teach back concepts without jargon.</Text>
              <Text style={sty.onboardItem}>• Track neural weight and clarity.</Text>
            </View>
            <TouchableOpacity style={sty.dojoBtn} onPress={dismiss}>
              <Text style={sty.dojoBtnText}>BEGIN TRAINING</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================================
// 10. STYLES
// ============================================================================

const sty = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  loadingRoot: { flex: 1, backgroundColor: T.bg, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: T.soft, fontSize: 13 },

  // Feed
  placeholder: { backgroundColor: '#050510', justifyContent: 'center', alignItems: 'center' },
  phText: { color: 'rgba(123,97,255,0.2)', fontSize: 13, marginTop: 8 },
  tapLayer: { backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 5 },
  playRing: { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(123,97,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(123,97,255,0.5)' },
  tapLabel: { color: T.soft, marginTop: 14, fontWeight: '700', fontSize: 12, letterSpacing: 2 },
  infoWrap: { paddingHorizontal: 20, paddingBottom: 50, paddingTop: 90, backgroundColor: 'rgba(0,0,10,0.6)' },
  catPill: { alignSelf: 'flex-start', backgroundColor: T.synapseDim, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  catText: { color: T.synapse, fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  vidTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  vidCreator: { color: T.soft, fontSize: 13, marginTop: 3 },
  vidMeta: { color: T.muted, fontSize: 11, marginTop: 2 },
  dojoBtn: { flexDirection: 'row', backgroundColor: T.primary, paddingVertical: 14, paddingHorizontal: 22, borderRadius: 26, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, elevation: 6, shadowColor: T.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 },
  dojoBtnText: { fontWeight: '800', fontSize: 14, color: '#000', letterSpacing: 0.8 },

  // HUD
  hud: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 16, paddingTop: IS_IOS ? 8 : 10 },
  logo: { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 4 },
  logoSub: { color: T.synapse, fontSize: 9, fontWeight: '700', letterSpacing: 6, marginTop: -2 },
  hudRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mapBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: T.synapseDim, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(123,97,255,0.3)' },
  lvBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: T.synapse, justifyContent: 'center', alignItems: 'center' },
  lvNum: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  xpTrack: { width: 52, height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 2 },
  xpFill: { height: '100%', backgroundColor: T.guru, borderRadius: 2 },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  xpNum: { color: T.guru, fontWeight: 'bold', fontSize: 11 },

  // Chat
  chatSafe: { flex: 1, backgroundColor: T.bg },
  chatHead: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderColor: T.border },
  chatClose: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  chatType: { color: '#FFF', fontWeight: '700', fontSize: 12, letterSpacing: 1.5 },
  promptBox: { backgroundColor: T.surface, padding: 12, flexDirection: 'row', gap: 8, borderBottomWidth: 1, borderColor: T.border },
  promptText: { color: T.soft, flex: 1, fontSize: 13, lineHeight: 18 },
  doneBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: T.successDim, paddingVertical: 6, paddingHorizontal: 14, borderBottomWidth: 1, borderColor: T.border },
  doneLabel: { color: T.success, fontSize: 11 },

  // Messages
  personaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  personaAvatar: { fontSize: 16 },
  personaName: { color: T.muted, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  bub: { maxWidth: '88%', padding: 13, borderRadius: 16, marginBottom: 2 },
  bubAi: { alignSelf: 'flex-start', backgroundColor: '#0D0D2B', borderTopLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(123,97,255,0.15)' },
  bubUser: { alignSelf: 'flex-end', backgroundColor: 'rgba(0,229,255,0.08)', borderBottomRightRadius: 4, borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)' },
  bubText: { color: '#EEE', fontSize: 14, lineHeight: 20 },
  systemMsg: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 16, backgroundColor: T.synapseDim, borderRadius: 12, marginVertical: 8 },
  systemText: { color: T.synapse, fontSize: 11, fontWeight: '600' },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingBottom: 4 },
  typingLabel: { color: T.muted, fontSize: 11 },

  // Neural Pulse
  pulseContainer: { paddingHorizontal: 16, paddingVertical: 6, borderTopWidth: 1, borderColor: T.border },
  pulseTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden', position: 'relative' },
  pulseFill: { height: '100%', borderRadius: 2 },
  pulseGlow: { position: 'absolute', top: -2, left: 0, right: 0, height: 8, borderRadius: 4 },
  pulseInfo: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  pulseLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },

  // Input
  inputBar: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderColor: T.border, gap: 8, alignItems: 'flex-end' },
  inputField: { flex: 1, backgroundColor: T.surface, color: '#FFF', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, minHeight: 44, maxHeight: 110, fontSize: 14, borderWidth: 1, borderColor: T.border },
  sendBtn: { backgroundColor: T.primary, width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  actionBar: { flexDirection: 'row', padding: 10, gap: 8, borderTopWidth: 1, borderColor: T.border },
  retryBtn: { flex: 1, flexDirection: 'row', backgroundColor: T.surface, paddingVertical: 13, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: T.border },
  retryLabel: { color: T.soft, fontWeight: '600', fontSize: 13 },
  collectBtn: { flex: 1.5, paddingVertical: 13, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  collectLabel: { fontWeight: '800', fontSize: 13, color: '#000', letterSpacing: 0.3 },

  // Neural Weight
  nwContainer: { backgroundColor: 'rgba(0,229,255,0.04)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(0,229,255,0.15)', marginBottom: 10, maxWidth: '88%' },
  nwHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  nwTitle: { color: T.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  nwScore: { fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  nwRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  nwStat: { flex: 1, alignItems: 'center' },
  nwStatLabel: { color: T.muted, fontSize: 8, fontWeight: '600', letterSpacing: 0.8 },
  nwStatVal: { color: T.soft, fontSize: 12, fontWeight: '700', marginTop: 2 },
  nwDivider: { width: 1, height: 24, backgroundColor: T.border },
  nwTime: { color: T.muted, fontSize: 9, marginTop: 8, textAlign: 'center' },

  // Score bar
  sBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, maxWidth: '88%' },
  sBarTrack: { flex: 1, height: 4, backgroundColor: '#111', borderRadius: 2, overflow: 'hidden' },
  sBarFill: { height: '100%', borderRadius: 2 },
  sBarNum: { fontSize: 12, fontWeight: '700', minWidth: 30, textAlign: 'right' },

  // Breakdown
  bd: { backgroundColor: 'rgba(123,97,255,0.04)', borderRadius: 10, padding: 10, maxWidth: '88%', gap: 5, marginTop: 4, borderWidth: 1, borderColor: 'rgba(123,97,255,0.1)' },
  bdHead: { color: T.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  bdRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  bdDot: { width: 6, height: 6, borderRadius: 3 },
  bdText: { color: T.soft, fontSize: 11, flex: 1 },
  bdW: { fontSize: 10, fontWeight: '700' },

  // XP Badge
  xpBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,215,0,0.06)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start', marginTop: 6, borderWidth: 1, borderColor: 'rgba(255,215,0,0.15)' },
  xpBadgeText: { color: T.guru, fontWeight: '700', fontSize: 12 },

  // Module modal
  modalRoot: { flex: 1, backgroundColor: T.bg },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: T.border },
  modalTitle: { color: '#FFF', fontWeight: '700', fontSize: 13, letterSpacing: 1 },
  modalClose: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  scenCard: { backgroundColor: T.warningDim, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,214,0,0.2)', marginBottom: 24 },
  scenHead: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 },
  scenRole: { color: T.warning, fontWeight: '700', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },
  scenCtx: { color: '#DDD', fontSize: 14, lineHeight: 20 },
  secTitle: { color: T.synapse, fontWeight: '700', fontSize: 10, letterSpacing: 1.5, marginBottom: 10 },
  chRow: { flexDirection: 'row', backgroundColor: T.surface, padding: 14, borderRadius: 12, alignItems: 'center', gap: 12, marginBottom: 8, borderWidth: 1, borderColor: T.border },
  chRowDone: { borderColor: 'rgba(0,255,157,0.15)', backgroundColor: 'rgba(0,255,157,0.02)' },
  chCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' },
  chCircleDone: { backgroundColor: 'rgba(0,255,157,0.1)' },
  chNum: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  chTitle: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  chMeta: { color: T.muted, fontSize: 11, marginTop: 2 },
  chNW: { color: T.synapse, fontSize: 10, marginTop: 2, fontWeight: '600' },

  // Synaptic Map
  mapContainer: { alignItems: 'center', paddingVertical: 10 },
  mapHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  mapTitle: { color: T.synapse, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  mapOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  mapModal: { width: width - 30, backgroundColor: T.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: T.synapseDim },
  mapModalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  mapModalTitle: { color: '#FFF', fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
  mapStats: { alignItems: 'center', paddingTop: 10, gap: 4 },
  mapStatText: { color: T.muted, fontSize: 11, fontWeight: '600' },

  // Settings
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderColor: T.border },
  settingsLabel: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  settingsHint: { color: T.muted, fontSize: 11, marginTop: 4 },
  resetBtn: { backgroundColor: T.dangerDim, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,51,102,0.3)' },
  resetLabel: { color: T.danger, fontWeight: '700', fontSize: 11, letterSpacing: 1 },

  // Onboarding
  onboardText: { color: T.soft, fontSize: 13, lineHeight: 18, marginTop: 8 },
  onboardList: { marginTop: 12, gap: 6 },
  onboardItem: { color: T.muted, fontSize: 12 },
});

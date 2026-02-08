// ============================================================================
// KESANDU GURU - Single-file version for Expo Snack
// ============================================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, Text, View, Dimensions, TouchableOpacity,
  TextInput, Modal, ScrollView, SafeAreaView, FlatList,
  ActivityIndicator, Platform, KeyboardAvoidingView,
  Keyboard, Animated, Share, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const IS_IOS = Platform.OS === 'ios';

// ============================================================================
// THEME
// ============================================================================
const THEME = {
  primary: '#00D9FF', success: '#00FF9D', danger: '#FF4D4D',
  warning: '#FFD600', partial: '#FF8C00', bg: '#000000',
  card: '#121212', guru: '#FFD700', surface: '#111111',
  border: '#222222', muted: '#666666', text: '#FFFFFF',
  textSoft: '#CCCCCC', guruGlow: '#FFB800',
};

// ============================================================================
// GURU RANKS
// ============================================================================
const GURU_RANKS = [
  { title: 'Curious Mind', minXP: 0, color: '#888888' },
  { title: 'AI Apprentice', minXP: 100, color: '#00D9FF' },
  { title: 'Pattern Seeker', minXP: 350, color: '#00FF9D' },
  { title: 'Neural Thinker', minXP: 700, color: '#FF8C00' },
  { title: 'AI Guru', minXP: 1200, color: '#FFD700' },
  { title: 'Grand Guru', minXP: 2000, color: '#FF00FF' },
];

function getGuruRank(totalXP) {
  let rank = GURU_RANKS[0];
  for (const r of GURU_RANKS) { if (totalXP >= r.minXP) rank = r; }
  return rank;
}
function getNextRank(totalXP) {
  for (const r of GURU_RANKS) { if (totalXP < r.minXP) return r; }
  return null;
}

// ============================================================================
// SEMANTIC ENGINE (simplified for Snack)
// ============================================================================
const STEM_SUFFIXES = ['ingly','ation','ment','ness','able','ible','ting','ing','ies','ied','ion','ous','ive','ly','ed','er','es','al','en','s'];

function stem(word) {
  let w = word.toLowerCase();
  if (w.length <= 3) return w;
  for (const s of STEM_SUFFIXES) {
    if (w.endsWith(s) && w.length - s.length >= 3) return w.slice(0, w.length - s.length);
  }
  return w;
}

function normalize(text) {
  return text.toLowerCase().replace(/[''""]/g, '').replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}
function tokenize(text) { return normalize(text).split(' ').filter(Boolean); }

function buildNGrams(tokens, maxN = 3) {
  const exact = new Set(), stemmed = new Set();
  for (const t of tokens) { exact.add(t); stemmed.add(stem(t)); }
  for (let n = 2; n <= Math.min(maxN, tokens.length); n++) {
    for (let i = 0; i <= tokens.length - n; i++) {
      exact.add(tokens.slice(i, i + n).join(' '));
      stemmed.add(tokens.slice(i, i + n).map(stem).join(' '));
    }
  }
  return { exact, stemmed };
}

function conceptPresent(conceptObj, ngrams) {
  const nt = normalize(conceptObj.term);
  if (ngrams.exact.has(nt)) return conceptObj.term;
  if (conceptObj.synonyms) {
    for (const syn of conceptObj.synonyms) { if (ngrams.exact.has(normalize(syn))) return syn; }
  }
  const st = nt.split(' ').map(stem).join(' ');
  if (ngrams.stemmed.has(st)) return conceptObj.term;
  if (conceptObj.synonyms) {
    for (const syn of conceptObj.synonyms) {
      if (ngrams.stemmed.has(normalize(syn).split(' ').map(stem).join(' '))) return syn;
    }
  }
  return null;
}

function matchConceptGroups(conceptGroups, ngrams) {
  return conceptGroups.map((group, gi) => {
    let bestMatch = null;
    for (const concept of group) {
      const match = conceptPresent(concept, ngrams);
      if (match !== null) {
        const weight = concept.weight || 1;
        if (!bestMatch || weight > bestMatch.weight) bestMatch = { term: match, weight };
      }
    }
    const maxWeight = Math.max(...group.map(c => c.weight || 1));
    return { groupIndex: gi, matched: !!bestMatch, matchedTerm: bestMatch?.term ?? null, weight: bestMatch?.weight ?? maxWeight, maxWeight };
  });
}

function detectForbiddenTerms(normalizedText, forbiddenTerms) {
  if (!forbiddenTerms || forbiddenTerms.length === 0) return [];
  return forbiddenTerms.filter(f => normalizedText.includes(normalize(f.term))).map(f => ({ term: f.term, hint: f.hint }));
}

const DEPTH_MARKERS = ['because','therefore','since','so that','this means','for example','for instance','such as','in other words','the reason','which means','as a result','instead of','rather than','unlike','however','although'];
function computeDepthBonus(t) { let h = 0; for (const m of DEPTH_MARKERS) { if (t.includes(m)) h++; } return Math.min(10, h * 2); }

const WHY_CAUSE = ['because','the reason is','this is because','due to','caused by','leads to','results in','as a result','consequently','which is why'];
const WHY_CONSEQUENCE = ['this means','which means','therefore','the consequence','the impact','without this','if you dont','otherwise','what happens is'];
function computeWhyDepthScore(t) {
  let c = 0, q = 0;
  for (const m of WHY_CAUSE) { if (t.includes(m)) c++; }
  for (const m of WHY_CONSEQUENCE) { if (t.includes(m)) q++; }
  return Math.min(15, c * 2 + q * 2 + (c > 0 && q > 0 ? 5 : 0));
}

const ANALOGY_PATTERNS = ['like a','just like','similar to','same as','think of it as','think of','imagine','pretend','its as if','picture a','works like','kind of like'];
function detectAnalogyUse(t) { const f = ANALOGY_PATTERNS.filter(p => t.includes(p)); return { count: f.length, patterns: f }; }
function computeAnalogyBonus(t) { return Math.min(10, detectAnalogyUse(t).count * 4); }

const CONTRAST_MARKERS = ['but','however','unlike','instead of','rather than','on the other hand','the difference','not the same','whereas','compared to','versus'];
function computeContrastBonus(t) { let h = 0; for (const m of CONTRAST_MARKERS) { if (t.includes(m)) h++; } return Math.min(8, h * 2); }

function countSyllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 2) return 1;
  const vg = w.match(/[aeiouy]+/g);
  let count = vg ? vg.length : 1;
  if (w.endsWith('e') && !w.endsWith('le') && count > 1) count--;
  return Math.max(1, count);
}
function computeReadingLevel(text) {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  const words = tokenize(text);
  if (!sentences.length || !words.length) return 0;
  const ts = words.reduce((s, w) => s + countSyllables(w), 0);
  return Math.max(0, Math.round((0.39 * words.length / sentences.length + 11.8 * ts / words.length - 15.59) * 10) / 10);
}

const PASS_THRESHOLD = 70, PARTIAL_THRESHOLD = 40, FORBIDDEN_PENALTY = 15, READING_LEVEL_PENALTY = 20;

function evaluateAnswer(input, challenge) {
  const ni = normalize(input), tokens = tokenize(input), ngrams = buildNGrams(tokens), feedback = [];
  const isTeachBack = challenge.type === 'TEACH_BACK', isApply = challenge.type === 'APPLY';
  const minWords = challenge.min_word_count || 10;
  const wordCountPassed = tokens.length >= minWords;
  if (!wordCountPassed) feedback.push(`Too brief \u2014 ${tokens.length} words. Aim for at least ${minWords}.`);

  const forbiddenViolations = isTeachBack ? detectForbiddenTerms(ni, challenge.forbidden_terms) : [];
  if (forbiddenViolations.length > 0) {
    feedback.push('\uD83C\uDFAF Jargon detected! Keep it simple:');
    forbiddenViolations.forEach(v => feedback.push(` \u2022 "${v.term}" \u2192 ${v.hint}`));
  }

  const conceptResults = matchConceptGroups(challenge.required_concepts, ngrams);
  const totalWeight = conceptResults.reduce((s, c) => s + c.maxWeight, 0);
  const matchedWeight = conceptResults.filter(c => c.matched).reduce((s, c) => s + c.weight, 0);
  const missed = conceptResults.filter(c => !c.matched);
  if (missed.length > 0) {
    feedback.push(`You covered ${conceptResults.length - missed.length}/${conceptResults.length} key concept areas.`);
    if (challenge.hint) feedback.push(`\uD83D\uDCA1 Hint: ${challenge.hint}`);
  } else { feedback.push('\u2705 All key concepts covered!'); }

  const depthBonus = computeDepthBonus(ni);
  const whyDepthBonus = computeWhyDepthScore(ni);
  const analogyResult = detectAnalogyUse(ni);
  const analogyBonus = isTeachBack ? computeAnalogyBonus(ni) : 0;
  const contrastBonus = (isApply || challenge.type === 'CONCEPT_CHECK') ? computeContrastBonus(ni) : 0;

  if (isTeachBack && analogyResult.count > 0) feedback.push(`\uD83C\uDF1F Great analogy use!`);
  else if (isTeachBack) feedback.push('\uD83D\uDCA1 Tip: Use an analogy ("it\'s like...")');
  if (contrastBonus > 0) feedback.push('\uD83E\uDD14 Good critical thinking!');
  if (isApply && whyDepthBonus >= 10) feedback.push('\uD83E\uDDE0 Excellent causal reasoning!');
  else if (isApply && whyDepthBonus < 4) feedback.push('\uD83D\uDCA1 Tip: Explain WHY this matters.');

  let readingLevelResult = null;
  if (isTeachBack && challenge.max_reading_level != null && tokens.length >= 10) {
    const actual = computeReadingLevel(input);
    readingLevelResult = { actual, max: challenge.max_reading_level, passed: actual <= challenge.max_reading_level };
    if (!readingLevelResult.passed) feedback.push(`\uD83D\uDCD6 Language too complex (grade ${actual}). Aim for grade ${challenge.max_reading_level} or lower.`);
  }

  let baseScore = totalWeight > 0 ? (matchedWeight / totalWeight) * 100 : 0;
  baseScore = Math.min(100, baseScore + depthBonus + Math.min(10, whyDepthBonus) + analogyBonus + contrastBonus);
  let finalScore = baseScore - forbiddenViolations.length * FORBIDDEN_PENALTY - (readingLevelResult && !readingLevelResult.passed ? READING_LEVEL_PENALTY : 0);
  if (!wordCountPassed) finalScore = Math.min(finalScore, 30);
  finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));

  let passed = false, xpEarned = 0, status = 'FAIL';
  const xpReward = challenge.xp_reward || 100;
  if (finalScore >= PASS_THRESHOLD) { passed = true; xpEarned = xpReward; status = 'PASS'; feedback.unshift(`\uD83D\uDD25 GURU STATUS \u2014 Score: ${finalScore}/100`); }
  else if (finalScore >= PARTIAL_THRESHOLD) { xpEarned = Math.round(xpReward * 0.4); status = 'PARTIAL'; feedback.unshift(`\u26A1 Almost! Score: ${finalScore}/100 \u2014 Partial XP earned.`); }
  else { feedback.unshift(`\uD83D\uDCAA Score: ${finalScore}/100 \u2014 Try again.`); }

  return { passed, score: finalScore, xpEarned, status, feedback, breakdown: { concepts: conceptResults, forbidden: forbiddenViolations, wordCount: { actual: tokens.length, required: minWords, passed: wordCountPassed }, readingLevel: readingLevelResult, depthBonus, whyDepthBonus, analogyBonus, contrastBonus } };
}

// ============================================================================
// XP SYSTEM
// ============================================================================
function xpForLevel(level) { return Math.floor(100 * Math.pow(1.4, level - 1)); }
function computeLevel(totalXP) {
  let level = 1, acc = 0;
  while (acc + xpForLevel(level) <= totalXP) { acc += xpForLevel(level); level++; }
  return level;
}

// ============================================================================
// STREAK
// ============================================================================
function getDateKey(date) {
  const d = date || new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function computeStreak(activeDays) {
  if (!activeDays || activeDays.length === 0) return { current: 0, longest: 0, isActiveToday: false };
  const sorted = [...new Set(activeDays)].sort().reverse();
  const today = getDateKey(), yesterday = getDateKey(new Date(Date.now() - 86400000));
  const isActiveToday = sorted[0] === today;
  const startDay = (sorted[0] === today || sorted[0] === yesterday) ? sorted[0] : null;
  let current = 0;
  if (startDay) {
    let cd = new Date(startDay + 'T00:00:00');
    for (const day of sorted) {
      if (day === getDateKey(cd)) { current++; cd = new Date(cd.getTime() - 86400000); }
      else if (day < getDateKey(cd)) break;
    }
  }
  return { current, longest: Math.max(current, 1), isActiveToday };
}
function computeStreakBonus(s) {
  if (s <= 0) return 0; if (s >= 30) return 50; if (s >= 14) return 30; if (s >= 7) return 20; if (s >= 3) return 10; return 5;
}

// ============================================================================
// ADAPTIVE FEEDBACK
// ============================================================================
function analyzePerformancePattern(history) {
  if (!history || history.length === 0) return 'NEW';
  const recent = history.slice(-3);
  const avg = recent.reduce((s, h) => s + h.score, 0) / recent.length;
  const trend = recent.length >= 2 ? recent[recent.length - 1].score - recent[0].score : 0;
  if (avg >= 70) return 'STRONG'; if (trend > 15 && recent.length >= 2) return 'IMPROVING';
  if (avg < 40 && recent.length >= 2) return 'STRUGGLING'; return 'DEVELOPING';
}
function generateAdaptiveFeedback(pattern, challengeType, score) {
  const tips = [];
  if (pattern === 'STRUGGLING') {
    tips.push('Re-watch the video focusing on one concept at a time.');
    if (challengeType === 'TEACH_BACK') tips.push('Start with "Imagine you are..." to frame a simple analogy.');
    else if (challengeType === 'APPLY') tips.push('Begin with "The main risk is..." then explain WHY.');
    else tips.push('List the 2-3 key ideas before writing your full answer.');
  } else if (pattern === 'IMPROVING') {
    tips.push('You are making progress! Focus on the concepts you missed.');
    if (score >= 50) tips.push('Close to passing. Add more depth with "because..." or "this means...".');
  } else if (pattern === 'STRONG') { tips.push('Excellent mastery! Try analogies and real-world examples for even higher scores.'); }
  else if (pattern === 'NEW') { tips.push('Take your time. No penalties for multiple attempts.'); }
  return tips;
}

// ============================================================================
// ACHIEVEMENTS
// ============================================================================
const ACHIEVEMENTS = [
  { id: 'first_pass', title: 'First Win', description: 'Pass your first challenge', condition: (s) => s.totalPasses >= 1 },
  { id: 'five_passes', title: 'High Five', description: 'Pass 5 challenges', condition: (s) => s.totalPasses >= 5 },
  { id: 'streak_3', title: 'On Fire', description: '3-day learning streak', condition: (s) => s.currentStreak >= 3 },
  { id: 'streak_7', title: 'Dedicated', description: '7-day streak', condition: (s) => s.currentStreak >= 7 },
  { id: 'guru_1', title: 'First Guru', description: 'Earn your first Guru title', condition: (s) => s.guruCount >= 1 },
  { id: 'guru_all', title: 'Grand Master', description: 'Earn all Guru titles', condition: (s) => s.guruCount >= 7 },
  { id: 'teach_master', title: 'Born Teacher', description: 'Pass 5 Teach Back challenges', condition: (s) => s.teachBackPasses >= 5 },
  { id: 'apply_master', title: 'Practitioner', description: 'Pass 5 Apply challenges', condition: (s) => s.applyPasses >= 5 },
];
function checkAchievements(stats, unlockedIds) {
  return ACHIEVEMENTS.filter(a => !unlockedIds.includes(a.id) && a.condition(stats));
}

// ============================================================================
// CONTENT DATA
// ============================================================================
const CONTENT_DATA = [
  {
    id: '1', title: 'How LLMs Work', creator: '@karpathy', category: 'AI Foundations', xp: 500, guruTitle: 'LLM Guru',
    applicationScenario: { role: 'AI Consultant', context: 'A law firm wants to replace paralegals with an LLM. Explain the limitations.' },
    challenges: [
      { id: 'c1_1', type: 'CONCEPT_CHECK', title: 'The Mechanism', prompt: 'Does an LLM "know" facts? Explain how it generates the next word.', initialAiMessage: "I asked ChatGPT the capital of France and it got it right. That proves it has a database of facts, doesn't it?",
        required_concepts: [[{ term: 'predict', synonyms: ['predicts','prediction','predicting','probability','likely','pattern','patterns'], weight: 3 }],[{ term: 'next token', synonyms: ['next word','following word','continuation','sequence'], weight: 3 }]],
        forbidden_terms: [], min_word_count: 15, max_reading_level: null, xp_reward: 150, partial_xp_reward: 60, hint: 'Focus on the statistical nature of the output.' },
      { id: 'c1_2', type: 'TEACH_BACK', title: 'Guru Synthesis', prompt: 'Explain LLMs to a 5-year-old. Use an analogy. No jargon.', initialAiMessage: "I'm 5. How does the computer write stories?",
        required_concepts: [[{ term: 'like a', synonyms: ['imagine','pretend','think of','similar to','just like'], weight: 3 }],[{ term: 'guess', synonyms: ['guesses','guessing','fills in','completes','auto-complete'], weight: 3 }]],
        forbidden_terms: [{ term: 'transformer', hint: 'Say "smart helper" instead.' },{ term: 'neural', hint: 'Say "brain" instead.' },{ term: 'algorithm', hint: 'Say "recipe" instead.' }],
        min_word_count: 20, max_reading_level: 7, xp_reward: 150, partial_xp_reward: 60, hint: "Use an analogy like 'auto-complete' or 'guessing game'." },
      { id: 'c1_3', type: 'APPLY', title: 'Real-World: Law Firm Risk', prompt: 'A law firm wants to replace paralegals with an LLM. Explain WHY this is risky.', initialAiMessage: "We're firing our paralegals next week. The AI can do legal research perfectly, right?",
        required_concepts: [[{ term: 'hallucinate', synonyms: ['make up','makes up','wrong','incorrect','false','inaccurate'], weight: 3 }],[{ term: 'verify', synonyms: ['check','review','validate','human review','oversight'], weight: 3 }],[{ term: 'liability', synonyms: ['risk','danger','harm','lawsuit','consequence'], weight: 2 }]],
        forbidden_terms: [], min_word_count: 25, max_reading_level: null, xp_reward: 200, partial_xp_reward: 80, hint: 'Think about hallucinations, legal liability, and human oversight.' },
    ],
  },
  {
    id: '2', title: 'Neural Networks', creator: '@3blue1brown', category: 'AI Foundations', xp: 500, guruTitle: 'Neural Net Guru',
    applicationScenario: { role: 'ML Engineer', context: 'Your CEO says "just add more layers" to fix a failing model.' },
    challenges: [
      { id: 'c2_1', type: 'CONCEPT_CHECK', title: 'Layers & Learning', prompt: 'What does a hidden layer actually do? How does it learn?', initialAiMessage: "Neural networks have layers like a cake. Does each layer memorize different facts?",
        required_concepts: [[{ term: 'weight', synonyms: ['weights','parameters','connections','adjusts'], weight: 3 }],[{ term: 'feature', synonyms: ['features','representation','pattern','patterns','detect'], weight: 3 }]],
        forbidden_terms: [], min_word_count: 15, max_reading_level: null, xp_reward: 150, partial_xp_reward: 60, hint: 'Think about how each layer transforms data and detects patterns.' },
      { id: 'c2_2', type: 'TEACH_BACK', title: 'ELI5: Neural Nets', prompt: 'Explain neural networks to someone who has never coded.', initialAiMessage: "I'm a chef. How does the computer learn to recognize a cat photo?",
        required_concepts: [[{ term: 'like a', synonyms: ['imagine','pretend','think of','similar to','recipe'], weight: 3 }],[{ term: 'learn', synonyms: ['learns','learning','practice','improve','gets better','trains'], weight: 3 }]],
        forbidden_terms: [{ term: 'backpropagation', hint: 'Say "learning from mistakes".' },{ term: 'gradient descent', hint: 'Say "adjusting step by step".' }],
        min_word_count: 20, max_reading_level: 7, xp_reward: 150, partial_xp_reward: 60, hint: 'Compare it to learning a skill through repetition.' },
      { id: 'c2_3', type: 'APPLY', title: 'Failing Model Fix', prompt: 'CEO says "add more layers" to fix a 60% accuracy model. Explain why that won\'t work.', initialAiMessage: "Our cat/dog classifier is 60% accurate. More layers = smarter AI, right?",
        required_concepts: [[{ term: 'overfit', synonyms: ['overfitting','memorize','too complex','data','training data','more data'], weight: 3 }],[{ term: 'instead', synonyms: ['should','better','what works','try','actually','the real issue'], weight: 2 }]],
        forbidden_terms: [], min_word_count: 25, max_reading_level: null, xp_reward: 200, partial_xp_reward: 80, hint: 'Think about overfitting and data quality.' },
    ],
  },
  {
    id: '3', title: 'Prompt Engineering', creator: '@fireship', category: 'AI Skills', xp: 425, guruTitle: 'Prompt Guru',
    applicationScenario: { role: 'AI Product Manager', context: 'Your chatbot gives inconsistent outputs. Users are frustrated.' },
    challenges: [
      { id: 'c3_1', type: 'CONCEPT_CHECK', title: 'Prompt Design', prompt: 'Why does prompt structure matter?', initialAiMessage: "I just type whatever I want into ChatGPT. Isn't it just luck?",
        required_concepts: [[{ term: 'specific', synonyms: ['clear','precise','detailed','instructions'], weight: 3 }],[{ term: 'context', synonyms: ['background','role','examples','few-shot','structure'], weight: 3 }]],
        forbidden_terms: [], min_word_count: 15, max_reading_level: null, xp_reward: 125, partial_xp_reward: 50, hint: 'Think about clarity and structured output.' },
      { id: 'c3_2', type: 'TEACH_BACK', title: 'ELI5: Prompting', prompt: 'Explain prompt engineering to a casual ChatGPT user.', initialAiMessage: "I just ask stuff and it answers. Why learn special ways to ask?",
        required_concepts: [[{ term: 'ask', synonyms: ['question','request','tell','instruct'], weight: 2 }],[{ term: 'better', synonyms: ['improved','accurate','useful','quality','good','answer','response'], weight: 2 }]],
        forbidden_terms: [{ term: 'token', hint: 'Say "word" instead.' },{ term: 'temperature', hint: 'Say "creativity dial" instead.' }],
        min_word_count: 20, max_reading_level: 8, xp_reward: 125, partial_xp_reward: 50, hint: 'Compare vague vs specific questions to a smart person.' },
    ],
  },
  {
    id: '4', title: 'AI Hallucinations', creator: '@IBMTechnology', category: 'AI Safety', xp: 500, guruTitle: 'AI Safety Guru',
    applicationScenario: { role: 'AI Safety Officer', context: 'A medical startup wants AI to diagnose patients.' },
    challenges: [
      { id: 'c4_1', type: 'CONCEPT_CHECK', title: 'Why AI Lies', prompt: 'Why do LLMs state false things with confidence?', initialAiMessage: "The AI sounded so sure when it gave a wrong answer. Does it know it's lying?",
        required_concepts: [[{ term: 'confidence', synonyms: ['confident','sure','convincing','no understanding','doesnt know'], weight: 3 }],[{ term: 'training data', synonyms: ['trained on','learned from','patterns','statistical'], weight: 3 }]],
        forbidden_terms: [], min_word_count: 15, max_reading_level: null, xp_reward: 150, partial_xp_reward: 60, hint: "The model doesn't 'know' truth from fiction." },
      { id: 'c4_2', type: 'APPLY', title: 'Medical AI Risk', prompt: 'A startup wants AI to diagnose patients. Explain the risks.', initialAiMessage: "We trained GPT on medical textbooks. It diagnosed 3 test cases correctly! Launching to patients next month!",
        required_concepts: [[{ term: 'wrong', synonyms: ['incorrect','error','misdiagnose','false','hallucinate'], weight: 3 }],[{ term: 'human', synonyms: ['doctor','physician','oversight','review','verify'], weight: 3 }],[{ term: 'harm', synonyms: ['danger','risk','death','patient safety','lives'], weight: 3 }]],
        forbidden_terms: [], min_word_count: 30, max_reading_level: null, xp_reward: 200, partial_xp_reward: 80, hint: 'Think about patient safety and human oversight.' },
    ],
  },
];

// ============================================================================
// HOOKS
// ============================================================================
function useXP() {
  const [totalXP, setTotalXP] = useState(0);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem('@kesandu_guru_xp').then(s => {
      if (s) { const d = JSON.parse(s); setTotalXP(d.totalXP || 0); setCompletedChallenges(d.completedChallenges || []); }
    }).catch(() => {}).finally(() => setLoaded(true));
  }, []);
  useEffect(() => {
    if (loaded) AsyncStorage.setItem('@kesandu_guru_xp', JSON.stringify({ totalXP, completedChallenges })).catch(() => {});
  }, [totalXP, completedChallenges, loaded]);
  const awardXP = useCallback((xp, cid) => {
    setTotalXP(p => p + xp);
    if (cid && !completedChallenges.includes(cid)) setCompletedChallenges(p => [...p, cid]);
  }, [completedChallenges]);
  const level = computeLevel(totalXP);
  const currentLevelXP = totalXP - Array.from({ length: level - 1 }, (_, i) => xpForLevel(i + 1)).reduce((a, b) => a + b, 0);
  const nextLevelXP = xpForLevel(level);
  const isComplete = useCallback((id) => completedChallenges.includes(id), [completedChallenges]);
  const getModuleProgress = useCallback((m) => {
    const total = m.challenges.length, done = m.challenges.filter(c => completedChallenges.includes(c.id)).length;
    return { done, total, isGuru: done === total && total > 0 };
  }, [completedChallenges]);
  return { totalXP, level, currentLevelXP, nextLevelXP, awardXP, isComplete, loaded, getModuleProgress, completedChallenges };
}

function useStreak() {
  const [activeDays, setActiveDays] = useState([]);
  const [streakLoaded, setStreakLoaded] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem('@kesandu_streak').then(v => { if (v) setActiveDays(JSON.parse(v)); setStreakLoaded(true); }).catch(() => setStreakLoaded(true));
  }, []);
  useEffect(() => { if (streakLoaded) AsyncStorage.setItem('@kesandu_streak', JSON.stringify(activeDays)).catch(() => {}); }, [activeDays, streakLoaded]);
  const recordActivity = useCallback(() => {
    const today = getDateKey();
    setActiveDays(p => p.includes(today) ? p : [...p, today]);
  }, []);
  const streakInfo = computeStreak(activeDays);
  return { streakInfo, recordActivity, streakLoaded };
}

function useAchievements() {
  const [unlockedIds, setUnlockedIds] = useState([]);
  const [newAchievement, setNewAchievement] = useState(null);
  useEffect(() => { AsyncStorage.getItem('@kesandu_achievements').then(v => { if (v) setUnlockedIds(JSON.parse(v)); }).catch(() => {}); }, []);
  useEffect(() => { if (unlockedIds.length > 0) AsyncStorage.setItem('@kesandu_achievements', JSON.stringify(unlockedIds)).catch(() => {}); }, [unlockedIds]);
  const checkAndUnlock = useCallback((stats) => {
    const newly = checkAchievements(stats, unlockedIds);
    if (newly.length > 0) { setUnlockedIds(p => [...p, ...newly.map(a => a.id)]); setNewAchievement(newly[0]); }
  }, [unlockedIds]);
  return { unlockedIds, newAchievement, checkAndUnlock, dismissAchievement: () => setNewAchievement(null) };
}

// ============================================================================
// SMALL COMPONENTS
// ============================================================================
const ScoreBar = ({ score, status }) => {
  const barWidth = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(barWidth, { toValue: score, duration: 800, useNativeDriver: false }).start(); }, [score]);
  const color = status === 'PASS' ? THEME.success : status === 'PARTIAL' ? THEME.partial : THEME.danger;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, maxWidth: '88%' }}>
      <View style={{ flex: 1, height: 6, backgroundColor: '#222', borderRadius: 3, overflow: 'hidden' }}>
        <Animated.View style={{ height: '100%', borderRadius: 3, backgroundColor: color, width: barWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }} />
      </View>
      <Text style={{ fontSize: 13, fontWeight: '700', color, minWidth: 45, textAlign: 'right' }}>{score}/100</Text>
    </View>
  );
};

const ConceptBreakdown = ({ breakdown }) => {
  if (!breakdown) return null;
  return (
    <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, maxWidth: '88%', gap: 6, marginTop: 4 }}>
      <Text style={{ color: '#666', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>CONCEPT COVERAGE</Text>
      {breakdown.concepts.map((c, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 14 }}>{c.matched ? '\u2705' : '\u274C'}</Text>
          <Text style={{ color: '#AAA', fontSize: 12, flex: 1 }}>Area {c.groupIndex + 1}{c.matchedTerm ? ` \u2014 "${c.matchedTerm}"` : ' \u2014 not detected'}</Text>
        </View>
      ))}
      {breakdown.depthBonus > 0 && <Text style={{ color: '#AAA', fontSize: 12 }}>{'\uD83E\uDDE0'} Depth: +{breakdown.depthBonus}</Text>}
      {breakdown.analogyBonus > 0 && <Text style={{ color: '#AAA', fontSize: 12 }}>{'\uD83C\uDF1F'} Analogy: +{breakdown.analogyBonus}</Text>}
      {breakdown.contrastBonus > 0 && <Text style={{ color: '#AAA', fontSize: 12 }}>{'\uD83E\uDD14'} Critical thinking: +{breakdown.contrastBonus}</Text>}
      {breakdown.forbidden.length > 0 && breakdown.forbidden.map((v, i) => (
        <Text key={i} style={{ color: THEME.danger, fontSize: 12 }}>{'\uD83D\uDEAB'} "{v.term}" (-{FORBIDDEN_PENALTY})</Text>
      ))}
    </View>
  );
};

const AchievementToast = ({ achievement, onDismiss }) => {
  const slideAnim = useRef(new Animated.Value(-120)).current;
  useEffect(() => {
    if (achievement) {
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }).start();
      const t = setTimeout(() => { Animated.timing(slideAnim, { toValue: -120, duration: 300, useNativeDriver: true }).start(() => onDismiss()); }, 3500);
      return () => clearTimeout(t);
    }
  }, [achievement]);
  if (!achievement) return null;
  return (
    <Animated.View style={{ position: 'absolute', top: IS_IOS ? 60 : 40, left: 16, right: 16, backgroundColor: '#1A1A2E', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)', zIndex: 200, transform: [{ translateY: slideAnim }] }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,215,0,0.15)', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 20 }}>{'\u2B50'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: THEME.guru, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>Achievement Unlocked!</Text>
        <Text style={{ color: '#FFF', fontSize: 15, fontWeight: 'bold', marginTop: 2 }}>{achievement.title}</Text>
        <Text style={{ color: '#AAA', fontSize: 12 }}>{achievement.description}</Text>
      </View>
    </Animated.View>
  );
};

// ============================================================================
// CHAT ENGINE
// ============================================================================
const ChatEngine = ({ challenge, onComplete, onExit, isAlreadyComplete }) => {
  const [history, setHistory] = useState([{ id: 'init', text: challenge.initialAiMessage, sender: 'ai' }]);
  const [input, setInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [status, setStatus] = useState('ACTIVE');
  const [attemptHistory, setAttemptHistory] = useState([]);
  const listRef = useRef(null);

  const handleSend = useCallback(() => {
    if (!input.trim() || isAiTyping) return;
    const userMsg = { id: Date.now().toString(), text: input, sender: 'user' };
    setHistory(p => [...p, userMsg]);
    const userInput = input;
    setInput(''); setIsAiTyping(true); Keyboard.dismiss();

    setTimeout(() => {
      const result = evaluateAnswer(userInput, challenge);
      setLastResult(result);
      const newHist = [...attemptHistory, { score: result.score }];
      setAttemptHistory(newHist);
      const pattern = analyzePerformancePattern(newHist);
      const tips = generateAdaptiveFeedback(pattern, challenge.type, result.score);
      const coachText = tips.length > 0 ? '\n\n' + tips.map(t => `\uD83D\uDCAC ${t}`).join('\n') : '';
      setHistory(p => [...p, { id: (Date.now() + 1).toString(), text: result.feedback.join('\n') + coachText, sender: 'ai', result }]);
      setIsAiTyping(false);
      if (result.passed) setStatus('SUCCESS');
      else if (result.status === 'PARTIAL') setStatus('PARTIAL');
      else setStatus('FAIL');
    }, 800);
  }, [input, isAiTyping, challenge, attemptHistory]);

  const handleRetry = useCallback(() => {
    setStatus('ACTIVE'); setLastResult(null);
    setHistory(p => [...p, { id: Date.now().toString(), text: '\uD83D\uDD04 Give it another shot!', sender: 'ai' }]);
  }, []);

  const renderMessage = useCallback(({ item }) => {
    const isAi = item.sender === 'ai';
    return (
      <View style={{ marginBottom: 16 }}>
        <View style={[s.bubble, isAi ? s.bubbleAi : s.bubbleUser]}>
          <Text style={s.bubbleText}>{item.text}</Text>
        </View>
        {item.result && (
          <View style={{ marginTop: 8 }}>
            <ScoreBar score={item.result.score} status={item.result.status} />
            <ConceptBreakdown breakdown={item.result.breakdown} />
            {item.result.xpEarned > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,215,0,0.1)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start', marginTop: 6 }}>
                <Text style={{ fontSize: 14 }}>{'\u26A1'}</Text>
                <Text style={{ color: THEME.guru, fontWeight: '700', fontSize: 14 }}>+{item.result.xpEarned} XP</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={s.chatHeader}>
        <TouchableOpacity onPress={onExit}><Text style={{ color: '#FFF', fontSize: 24 }}>{'\u2715'}</Text></TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>{challenge.type.replace('_', ' ')}</Text>
          <Text style={{ color: '#666', fontSize: 11 }}>{challenge.type === 'TEACH_BACK' ? '\uD83C\uDF93 Feynman Mode' : challenge.type === 'APPLY' ? '\uD83D\uDCBC Apply Mode' : '\uD83E\uDDEA Accuracy Mode'}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>
      <View style={{ backgroundColor: '#111', padding: 14, flexDirection: 'row', gap: 10, borderBottomWidth: 1, borderColor: '#222' }}>
        <Text style={{ color: THEME.primary, fontSize: 16 }}>{'\uD83C\uDFAF'}</Text>
        <Text style={{ color: '#DDD', flex: 1, fontSize: 14, lineHeight: 20 }}>{challenge.prompt}</Text>
      </View>
      {isAlreadyComplete && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,255,157,0.08)', paddingVertical: 8, paddingHorizontal: 14 }}>
          <Text style={{ color: THEME.success, fontSize: 12 }}>{'\u2705'} Already completed \u2014 practice mode (no XP)</Text>
        </View>
      )}
      <FlatList ref={listRef} data={history} keyExtractor={i => i.id} contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })} renderItem={renderMessage} />
      {isAiTyping && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingBottom: 8 }}>
          <ActivityIndicator size="small" color={THEME.primary} />
          <Text style={{ color: '#666', fontSize: 12 }}>Evaluating...</Text>
        </View>
      )}
      <KeyboardAvoidingView behavior={IS_IOS ? 'padding' : 'height'}>
        {status === 'ACTIVE' ? (
          <View style={s.inputBar}>
            <TextInput style={s.input} placeholder="Prove your understanding..." placeholderTextColor="#666"
              value={input} onChangeText={setInput} multiline maxLength={2000} />
            <TouchableOpacity style={[s.sendBtn, !input.trim() && { backgroundColor: '#111' }]} onPress={handleSend} disabled={!input.trim() || isAiTyping}>
              <Text style={{ color: input.trim() ? '#000' : '#666', fontSize: 18, fontWeight: 'bold' }}>{'\u2191'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', padding: 12, gap: 10, borderTopWidth: 1, borderColor: '#222' }}>
            {(status === 'FAIL' || status === 'PARTIAL') && (
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#111', padding: 16, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#222' }} onPress={handleRetry}>
                <Text style={{ color: '#CCC', fontWeight: '600' }}>{'\uD83D\uDD04'} Try Again</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={{ flex: 1.5, padding: 16, borderRadius: 14, alignItems: 'center', backgroundColor: status === 'SUCCESS' ? THEME.success : status === 'PARTIAL' ? THEME.partial : '#666' }}
              onPress={() => { if (lastResult?.xpEarned > 0) onComplete(lastResult.xpEarned, challenge.id); else onExit(); }}>
              <Text style={{ fontWeight: 'bold', fontSize: 15, color: '#000' }}>{lastResult?.xpEarned > 0 ? `COLLECT +${lastResult.xpEarned} XP` : 'CLOSE'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ============================================================================
// GURU CELEBRATION
// ============================================================================
const GuruCelebration = ({ visible, guruTitle, onDismiss }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 3, useNativeDriver: true }).start();
    else scaleAnim.setValue(0);
  }, [visible]);
  if (!visible) return null;
  return (
    <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
      <Animated.View style={{ backgroundColor: '#111', borderRadius: 24, padding: 32, alignItems: 'center', width: width * 0.85, borderWidth: 2, borderColor: THEME.guru, transform: [{ scale: scaleAnim }] }}>
        <Text style={{ fontSize: 48 }}>{'\uD83C\uDFC6'}</Text>
        <Text style={{ color: THEME.guru, fontSize: 28, fontWeight: '900', letterSpacing: 2, marginTop: 16 }}>GURU UNLOCKED</Text>
        <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '600', marginTop: 8 }}>{guruTitle}</Text>
        <Text style={{ color: '#AAA', fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 12 }}>You've mastered all challenges! You are now a certified guru!</Text>
        <TouchableOpacity style={{ backgroundColor: THEME.guru, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30, marginTop: 24 }} onPress={onDismiss}>
          <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 }}>CONTINUE</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ============================================================================
// CERTIFICATE
// ============================================================================
const CertificateScreen = ({ visible, module: mod, onClose }) => {
  if (!mod) return null;
  const handleShare = async () => {
    try { await Share.share({ message: `I just earned the '${mod.guruTitle}' certification on Kesandu Guru!` }); } catch (e) {}
  };
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{ backgroundColor: '#111', borderRadius: 20, padding: 28, width: '100%', maxWidth: 380, borderWidth: 2, borderColor: THEME.guru, alignItems: 'center' }}>
          <Text style={{ color: THEME.guru, fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' }}>Certificate of Mastery</Text>
          <Text style={{ fontSize: 40, marginVertical: 10 }}>{'\uD83C\uDFC5'}</Text>
          <Text style={{ color: '#FFF', fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>{mod.title}</Text>
          <Text style={{ color: THEME.guru, fontSize: 14, fontWeight: '600', marginTop: 4 }}>{mod.guruTitle}</Text>
          <Text style={{ color: '#888', fontSize: 12, marginTop: 12 }}>{new Date().toLocaleDateString()}</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <TouchableOpacity style={{ flex: 1, backgroundColor: THEME.guru, padding: 14, borderRadius: 14, alignItems: 'center' }} onPress={handleShare}>
              <Text style={{ color: '#000', fontWeight: 'bold' }}>SHARE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, backgroundColor: '#222', padding: 14, borderRadius: 14, alignItems: 'center' }} onPress={onClose}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ============================================================================
// MAIN APP
// ============================================================================
function AppContent() {
  const [activeModule, setActiveModule] = useState(null);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [showCelebration, setShowCelebration] = useState(null);
  const [certificateModule, setCertificateModule] = useState(null);
  const { totalXP, level, currentLevelXP, nextLevelXP, awardXP, isComplete, loaded, getModuleProgress, completedChallenges } = useXP();
  const { streakInfo, recordActivity, streakLoaded } = useStreak();
  const { unlockedIds, newAchievement, checkAndUnlock, dismissAchievement } = useAchievements();

  const guruRank = getGuruRank(totalXP);
  const nextRank = getNextRank(totalXP);
  const levelProgress = nextLevelXP > 0 ? Math.min(1, currentLevelXP / nextLevelXP) : 0;

  const handleOpenChallenge = useCallback((c) => {
    setActiveModule(null);
    setTimeout(() => setActiveChallenge(c), 300);
  }, []);

  const handleChallengeComplete = useCallback((xp, challengeId) => {
    if (!isComplete(challengeId)) awardXP(xp, challengeId);
    setActiveChallenge(null);
    recordActivity();
    setTimeout(() => {
      const passedIds = [...completedChallenges, challengeId];
      const guruCount = CONTENT_DATA.filter(m => getModuleProgress(m).isGuru).length;
      const teachBackPasses = CONTENT_DATA.flatMap(m => m.challenges).filter(c => c.type === 'TEACH_BACK' && passedIds.includes(c.id)).length;
      const applyPasses = CONTENT_DATA.flatMap(m => m.challenges).filter(c => c.type === 'APPLY' && passedIds.includes(c.id)).length;
      checkAndUnlock({ totalPasses: passedIds.length, currentStreak: streakInfo.current + (streakInfo.isActiveToday ? 0 : 1), guruCount, highestScore: 0, modulesAttempted: CONTENT_DATA.filter(m => m.challenges.some(c => passedIds.includes(c.id))).length, teachBackPasses, applyPasses, totalAnalogies: 0 });
      for (const mod of CONTENT_DATA) {
        if (mod.challenges.every(c => c.id === challengeId || isComplete(c.id)) && mod.challenges.some(c => c.id === challengeId)) {
          setShowCelebration(mod.guruTitle); setCertificateModule(mod); break;
        }
      }
    }, 500);
  }, [awardXP, isComplete, recordActivity, completedChallenges, getModuleProgress, streakInfo, checkAndUnlock]);

  if (!loaded || !streakLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#00D9FF" /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar style="light" />

      {/* HUD */}
      <SafeAreaView style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 20, letterSpacing: 3 }}>KESANDU</Text>
            <Text style={{ color: THEME.guru, fontWeight: '800', fontSize: 10, letterSpacing: 4, marginTop: -2 }}>GURU</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {streakInfo.current > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: streakInfo.isActiveToday ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.08)', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3, borderWidth: streakInfo.isActiveToday ? 1 : 0, borderColor: 'rgba(255,107,53,0.3)' }}>
                <Text style={{ fontSize: 12 }}>{'\uD83D\uDD25'}</Text>
                <Text style={{ color: streakInfo.isActiveToday ? '#FF6B35' : '#666', fontSize: 11, fontWeight: '700' }}>{streakInfo.current}</Text>
              </View>
            )}
            <View style={{ borderWidth: 1, borderColor: guruRank.color, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: guruRank.color, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>{guruRank.title}</Text>
            </View>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: THEME.primary, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#000', fontSize: 13, fontWeight: '800' }}>{level}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={{ width: 60, height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden', marginBottom: 3 }}>
                <View style={{ height: '100%', backgroundColor: THEME.guru, borderRadius: 2, width: `${levelProgress * 100}%` }} />
              </View>
              <Text style={{ color: THEME.guru, fontWeight: 'bold', fontSize: 13 }}>{'\u26A1'} {totalXP}</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* MODULE LIST */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}>
        {CONTENT_DATA.map((mod) => {
          const progress = getModuleProgress(mod);
          return (
            <TouchableOpacity key={mod.id} style={{ backgroundColor: '#111', borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: progress.isGuru ? 'rgba(255,215,0,0.3)' : '#222' }}
              onPress={() => setActiveModule(mod)}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ color: '#AAA', fontSize: 10, fontWeight: '600', textTransform: 'uppercase' }}>{mod.category}</Text>
                </View>
                {progress.isGuru && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,215,0,0.2)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ fontSize: 12 }}>{'\uD83C\uDFC6'}</Text>
                    <Text style={{ color: THEME.guru, fontSize: 10, fontWeight: '700' }}>{mod.guruTitle}</Text>
                  </View>
                )}
              </View>
              <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>{mod.title}</Text>
              <Text style={{ color: '#888', fontSize: 13, marginTop: 2 }}>{mod.creator}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <View style={{ flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                  <View style={{ height: '100%', borderRadius: 2, backgroundColor: progress.isGuru ? THEME.guru : THEME.primary, width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }} />
                </View>
                <Text style={{ color: progress.isGuru ? THEME.guru : THEME.primary, fontSize: 12, fontWeight: '700' }}>
                  {progress.isGuru ? 'GURU' : `${progress.done}/${progress.total}`}
                </Text>
              </View>
              <Text style={{ color: '#666', fontSize: 12, marginTop: 6 }}>{mod.challenges.length} challenges {'\u2022'} +{mod.xp} XP</Text>
            </TouchableOpacity>
          );
        })}

        {/* Next rank teaser */}
        {nextRank && (
          <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#222', marginTop: 8 }}>
            <Text style={{ color: '#AAA', fontSize: 13 }}>Next rank: <Text style={{ color: nextRank.color, fontWeight: 'bold' }}>{nextRank.title}</Text> at {nextRank.minXP} XP</Text>
          </View>
        )}
      </ScrollView>

      {/* MODULE DETAIL MODAL */}
      <Modal visible={!!activeModule} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={s.chatHeader}>
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>TRAINING MODULE</Text>
            <TouchableOpacity onPress={() => setActiveModule(null)}><Text style={{ color: '#FFF', fontSize: 24 }}>{'\u2715'}</Text></TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 20 }}>
            {activeModule && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderColor: '#222' }}>
                <Text style={{ fontSize: 20 }}>{getModuleProgress(activeModule).isGuru ? '\uD83C\uDFC6' : '\uD83C\uDFAF'}</Text>
                <Text style={{ color: getModuleProgress(activeModule).isGuru ? THEME.guru : '#FFF', fontSize: 16, fontWeight: '700', flex: 1 }}>{activeModule.guruTitle}</Text>
                <Text style={{ color: '#666', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' }}>
                  {getModuleProgress(activeModule).isGuru ? 'MASTERED' : `${getModuleProgress(activeModule).done}/${getModuleProgress(activeModule).total}`}
                </Text>
              </View>
            )}
            <View style={{ backgroundColor: 'rgba(255,214,0,0.06)', padding: 18, borderRadius: 14, borderColor: 'rgba(255,214,0,0.3)', borderWidth: 1, marginBottom: 28 }}>
              <Text style={{ color: THEME.warning, fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', marginBottom: 8 }}>{'\uD83D\uDCBC'} {activeModule?.applicationScenario.role}</Text>
              <Text style={{ color: '#EEE', fontSize: 15, lineHeight: 22 }}>{activeModule?.applicationScenario.context}</Text>
            </View>
            <Text style={{ color: THEME.primary, fontWeight: 'bold', marginBottom: 12, fontSize: 12, letterSpacing: 1 }}>CHALLENGES</Text>
            {activeModule?.challenges.map((c, i) => {
              const completed = isComplete(c.id);
              return (
                <TouchableOpacity key={c.id} style={{ flexDirection: 'row', backgroundColor: completed ? 'rgba(0,255,157,0.04)' : '#111', padding: 16, borderRadius: 14, alignItems: 'center', gap: 14, marginBottom: 10, borderWidth: 1, borderColor: completed ? 'rgba(0,255,157,0.2)' : '#222' }}
                  onPress={() => handleOpenChallenge(c)}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: completed ? 'rgba(0,255,157,0.15)' : '#FFF', alignItems: 'center', justifyContent: 'center' }}>
                    {completed ? <Text style={{ color: THEME.success, fontSize: 16 }}>{'\u2713'}</Text> : <Text style={{ fontWeight: 'bold', fontSize: 14 }}>{i + 1}</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>{c.title}</Text>
                    <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
                      {c.type === 'TEACH_BACK' ? '\uD83C\uDF93 Teach Back' : c.type === 'APPLY' ? '\uD83D\uDCBC Apply It' : '\uD83E\uDDEA Concept Check'} {'\u2022'} +{c.xp_reward} XP
                    </Text>
                  </View>
                  <Text style={{ color: completed ? THEME.success : THEME.primary, fontSize: 20 }}>{'\u203A'}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* CHAT MODAL */}
      <Modal visible={!!activeChallenge} animationType="slide">
        {activeChallenge && (
          <ChatEngine challenge={activeChallenge} onExit={() => setActiveChallenge(null)}
            onComplete={handleChallengeComplete} isAlreadyComplete={isComplete(activeChallenge?.id)} />
        )}
      </Modal>

      {/* CELEBRATION */}
      <GuruCelebration visible={!!showCelebration} guruTitle={showCelebration || ''} onDismiss={() => setShowCelebration(null)} />
      <CertificateScreen visible={!!certificateModule && !showCelebration} module={certificateModule} onClose={() => setCertificateModule(null)} />
      <AchievementToast achievement={newAchievement} onDismiss={dismissAchievement} />
    </View>
  );
}

export default function App() { return <AppContent />; }

// ============================================================================
// STYLES
// ============================================================================
const s = StyleSheet.create({
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, paddingTop: IS_IOS ? 8 : 16, borderBottomWidth: 1, borderColor: '#222', alignItems: 'center' },
  bubble: { maxWidth: '88%', padding: 14, borderRadius: 18, marginBottom: 4 },
  bubbleAi: { alignSelf: 'flex-start', backgroundColor: '#1A1A2E', borderTopLeftRadius: 4 },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: 'rgba(0,217,255,0.12)', borderBottomRightRadius: 4, borderWidth: 1, borderColor: 'rgba(0,217,255,0.3)' },
  bubbleText: { color: '#FFF', fontSize: 14, lineHeight: 21 },
  inputBar: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderColor: '#222', gap: 10, alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: '#111', color: '#FFF', borderRadius: 20, padding: 12, paddingTop: 12, minHeight: 48, maxHeight: 120, fontSize: 15, borderWidth: 1, borderColor: '#222' },
  sendBtn: { backgroundColor: THEME.primary, width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});

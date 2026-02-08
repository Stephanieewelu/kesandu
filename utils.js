// ============================================================================
// GURU RANK SYSTEM
// ============================================================================

const GURU_RANKS = [
  { title: 'Curious Mind', minXP: 0, color: '#888888', icon: '?' },
  { title: 'AI Apprentice', minXP: 100, color: '#00D9FF', icon: '>' },
  { title: 'Pattern Seeker', minXP: 350, color: '#00FF9D', icon: '^' },
  { title: 'Neural Thinker', minXP: 700, color: '#FF8C00', icon: '*' },
  { title: 'AI Guru', minXP: 1200, color: '#FFD700', icon: '#' },
  { title: 'Grand Guru', minXP: 2000, color: '#FF00FF', icon: '!' },
];

function getGuruRank(totalXP) {
  let rank = GURU_RANKS[0];
  for (const r of GURU_RANKS) {
    if (totalXP >= r.minXP) rank = r;
  }
  return rank;
}

function getNextRank(totalXP) {
  for (const r of GURU_RANKS) {
    if (totalXP < r.minXP) return r;
  }
  return null;
}

// ============================================================================
// SEMANTIC VALIDATION ENGINE
// ============================================================================

// -- Lightweight Stemmer --

const STEM_SUFFIXES = [
  'ingly', 'ation', 'ment', 'ness', 'able', 'ible',
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

// -- Text Processing --

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

// -- Flesch-Kincaid Reading Level --

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

  const grade = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;
  return Math.max(0, Math.round(grade * 10) / 10);
}

// -- Concept Matching (with stemmed fallback) --

function conceptPresent(conceptObj, ngrams) {
  const normalizedTerm = normalize(conceptObj.term);

  if (ngrams.exact.has(normalizedTerm)) return conceptObj.term;

  if (conceptObj.synonyms) {
    for (const syn of conceptObj.synonyms) {
      if (ngrams.exact.has(normalize(syn))) return syn;
    }
  }

  const stemmedTerm = normalizedTerm.split(' ').map(stem).join(' ');
  if (ngrams.stemmed.has(stemmedTerm)) return conceptObj.term;

  if (conceptObj.synonyms) {
    for (const syn of conceptObj.synonyms) {
      const stemmedSyn = normalize(syn).split(' ').map(stem).join(' ');
      if (ngrams.stemmed.has(stemmedSyn)) return syn;
    }
  }

  return null;
}

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

// -- Forbidden Term Detection --

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

// -- Depth Heuristic --

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
  return Math.min(10, hits * 2);
}

// -- Why-Depth Analysis (causal reasoning chains) --

const WHY_CAUSE_MARKERS = [
  'because', 'the reason is', 'the reason why', 'this is because',
  'this happens because', 'due to', 'caused by', 'leads to',
  'results in', 'as a result', 'consequently', 'thats why',
  'which is why', 'so when', 'this works because',
];

const WHY_CONSEQUENCE_MARKERS = [
  'this means', 'which means', 'so that', 'therefore',
  'the consequence', 'the impact', 'the effect',
  'without this', 'if you dont', 'otherwise',
  'the problem is', 'the risk is', 'the danger is',
  'what happens is', 'the result is',
];

function computeWhyDepthScore(normalizedText) {
  let causeHits = 0;
  let consequenceHits = 0;
  for (const marker of WHY_CAUSE_MARKERS) {
    if (normalizedText.includes(marker)) causeHits++;
  }
  for (const marker of WHY_CONSEQUENCE_MARKERS) {
    if (normalizedText.includes(marker)) consequenceHits++;
  }
  const chainBonus = (causeHits > 0 && consequenceHits > 0) ? 5 : 0;
  return Math.min(15, causeHits * 2 + consequenceHits * 2 + chainBonus);
}

// -- Analogy Detection (for teaching quality) --

const ANALOGY_PATTERNS = [
  'like a', 'just like', 'similar to', 'same as',
  'think of it as', 'think of', 'imagine', 'pretend',
  'its as if', 'picture a', 'compare it to', 'kind of like',
  'works like', 'acts like', 'behaves like', 'sort of like',
  'the same way', 'in the same way',
];

function detectAnalogyUse(normalizedText) {
  const found = [];
  for (const pattern of ANALOGY_PATTERNS) {
    if (normalizedText.includes(pattern)) {
      found.push(pattern);
    }
  }
  return { count: found.length, patterns: found };
}

function computeAnalogyBonus(normalizedText) {
  const { count } = detectAnalogyUse(normalizedText);
  return Math.min(10, count * 4);
}

// -- Contrast Detection (comparing concepts) --

const CONTRAST_MARKERS = [
  'but', 'however', 'unlike', 'instead of', 'rather than',
  'on the other hand', 'the difference', 'not the same',
  'while', 'whereas', 'compared to', 'versus',
  'doesnt mean', 'not actually', 'commonly confused',
  'people think', 'many assume', 'misconception',
];

function computeContrastBonus(normalizedText) {
  let hits = 0;
  for (const marker of CONTRAST_MARKERS) {
    if (normalizedText.includes(marker)) hits++;
  }
  return Math.min(8, hits * 2);
}

// -- Main Evaluation Function --

const PASS_THRESHOLD = 70;
const PARTIAL_THRESHOLD = 40;
const FORBIDDEN_PENALTY = 15;
const READING_LEVEL_PENALTY = 20;
const MIN_WORDS_SCORE_CAP = 30;

function evaluateAnswer(input, challenge) {
  const normalizedInput = normalize(input);
  const tokens = tokenize(input);
  const ngrams = buildNGrams(tokens);
  const feedback = [];
  const isTeachBack = challenge.type === 'TEACH_BACK';
  const isApply = challenge.type === 'APPLY';

  // Step 1: Word Count Gate
  const minWords = challenge.min_word_count || 10;
  const wordCountPassed = tokens.length >= minWords;

  if (!wordCountPassed) {
    feedback.push(
      `Too brief \u2014 ${tokens.length} words. Aim for at least ${minWords} to show understanding.`
    );
  }

  // Step 2: Forbidden Terms (TEACH_BACK only)
  const forbiddenViolations = isTeachBack
    ? detectForbiddenTerms(normalizedInput, challenge.forbidden_terms)
    : [];

  if (forbiddenViolations.length > 0) {
    feedback.push('\uD83C\uDFAF Jargon detected! Keep it simple:');
    for (const v of forbiddenViolations) {
      feedback.push(` \u2022 "${v.term}" \u2192 ${v.hint}`);
    }
  }

  // Step 3: Concept Matching (with stemmed fallback)
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

  // Step 4: Depth Bonus (legacy + enhanced why-depth)
  const depthBonus = computeDepthBonus(normalizedInput);
  const whyDepthBonus = computeWhyDepthScore(normalizedInput);

  // Step 4b: Analogy Bonus (TEACH_BACK gets rewarded for analogies)
  const analogyResult = detectAnalogyUse(normalizedInput);
  const analogyBonus = isTeachBack ? computeAnalogyBonus(normalizedInput) : 0;

  if (isTeachBack && analogyResult.count > 0) {
    feedback.push(`\uD83C\uDF1F Great analogy use! (${analogyResult.count} found)`);
  } else if (isTeachBack && analogyResult.count === 0) {
    feedback.push('\uD83D\uDCA1 Tip: Use an analogy to make it click (e.g., "it\'s like...")');
  }

  // Step 4c: Contrast Bonus (APPLY and CONCEPT_CHECK reward comparative thinking)
  const contrastBonus = (isApply || challenge.type === 'CONCEPT_CHECK')
    ? computeContrastBonus(normalizedInput)
    : 0;

  if (contrastBonus > 0) {
    feedback.push(`\uD83E\uDD14 Good critical thinking \u2014 you addressed misconceptions!`);
  }

  // Step 4d: Why-depth feedback for APPLY challenges
  if (isApply && whyDepthBonus >= 10) {
    feedback.push(`\uD83E\uDDE0 Excellent causal reasoning \u2014 you explained WHY, not just WHAT!`);
  } else if (isApply && whyDepthBonus < 4) {
    feedback.push(`\uD83D\uDCA1 Tip: Explain WHY this matters. Use "because...", "the risk is...", "this means...""`);
  }

  // Step 5: Reading Level (TEACH_BACK only)
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

  // Step 6: Score Calculation (enhanced with new bonuses)
  let baseScore = totalWeight > 0 ? (matchedWeight / totalWeight) * 100 : 0;
  const totalBonus = depthBonus + Math.min(10, whyDepthBonus) + analogyBonus + contrastBonus;
  baseScore = Math.min(100, baseScore + totalBonus);

  const forbiddenPenalty = forbiddenViolations.length * FORBIDDEN_PENALTY;
  const readingPenalty = readingLevelResult && !readingLevelResult.passed ? READING_LEVEL_PENALTY : 0;

  let finalScore = baseScore - forbiddenPenalty - readingPenalty;

  if (!wordCountPassed) {
    finalScore = Math.min(finalScore, MIN_WORDS_SCORE_CAP);
  }

  finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));

  // Step 7: Determine Result
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
      whyDepthBonus,
      analogyBonus,
      contrastBonus,
    },
  };
}

// ============================================================================
// XP SYSTEM
// ============================================================================

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

// ============================================================================
// STREAK SYSTEM
// ============================================================================

function getDateKey(date) {
  const d = date || new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function computeStreak(activeDays) {
  if (!activeDays || activeDays.length === 0) return { current: 0, longest: 0, isActiveToday: false };

  const sorted = [...new Set(activeDays)].sort().reverse();
  const today = getDateKey();
  const yesterday = getDateKey(new Date(Date.now() - 86400000));

  const isActiveToday = sorted[0] === today;
  const startDay = sorted[0] === today || sorted[0] === yesterday ? sorted[0] : null;

  let current = 0;
  if (startDay) {
    let checkDate = new Date(startDay + 'T00:00:00');
    for (const day of sorted) {
      const expected = getDateKey(checkDate);
      if (day === expected) {
        current++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else if (day < expected) {
        break;
      }
    }
  }

  let longest = 0;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00');
    const curr = new Date(sorted[i] + 'T00:00:00');
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (diff === 1) {
      run++;
    } else {
      longest = Math.max(longest, run);
      run = 1;
    }
  }
  longest = Math.max(longest, run, current);

  return { current, longest, isActiveToday };
}

function computeStreakBonus(currentStreak) {
  if (currentStreak <= 0) return 0;
  if (currentStreak >= 30) return 50;
  if (currentStreak >= 14) return 30;
  if (currentStreak >= 7) return 20;
  if (currentStreak >= 3) return 10;
  return 5;
}

// ============================================================================
// ADAPTIVE FEEDBACK ENGINE
// ============================================================================

const PERFORMANCE_PATTERNS = {
  STRUGGLING: { maxScore: 39, minAttempts: 2 },
  IMPROVING: { minScore: 40, maxScore: 69, minAttempts: 2 },
  STRONG: { minScore: 70 },
};

function analyzePerformancePattern(history) {
  if (!history || history.length === 0) return 'NEW';
  const recent = history.slice(-3);
  const avgScore = recent.reduce((s, h) => s + h.score, 0) / recent.length;
  const trend = recent.length >= 2
    ? recent[recent.length - 1].score - recent[0].score
    : 0;

  if (avgScore >= 70) return 'STRONG';
  if (trend > 15 && recent.length >= 2) return 'IMPROVING';
  if (avgScore < 40 && recent.length >= 2) return 'STRUGGLING';
  return 'DEVELOPING';
}

function generateAdaptiveFeedback(pattern, challengeType, score) {
  const tips = [];

  if (pattern === 'STRUGGLING') {
    tips.push('Re-watch the video focusing on one concept at a time.');
    if (challengeType === 'TEACH_BACK') {
      tips.push('Start with "Imagine you are..." to frame a simple analogy.');
    } else if (challengeType === 'APPLY') {
      tips.push('Begin with "The main risk is..." then explain WHY.');
    } else {
      tips.push('List the 2-3 key ideas before writing your full answer.');
    }
  } else if (pattern === 'IMPROVING') {
    tips.push('You are making progress! Focus on the concepts you missed.');
    if (score >= 50) {
      tips.push('You are close to passing. Add more depth with "because..." or "this means...".');
    }
  } else if (pattern === 'STRONG') {
    tips.push('Excellent mastery! Try using more analogies and real-world examples to push your score even higher.');
  } else if (pattern === 'NEW') {
    tips.push('Take your time. There are no penalties for multiple attempts.');
  }

  return tips;
}

// ============================================================================
// ACHIEVEMENT SYSTEM
// ============================================================================

const ACHIEVEMENTS = [
  { id: 'first_pass', title: 'First Win', description: 'Pass your first challenge', icon: 'star', condition: (stats) => stats.totalPasses >= 1 },
  { id: 'five_passes', title: 'High Five', description: 'Pass 5 challenges', icon: 'star', condition: (stats) => stats.totalPasses >= 5 },
  { id: 'all_modules', title: 'Completionist', description: 'Attempt all 7 modules', icon: 'trophy', condition: (stats) => stats.modulesAttempted >= 7 },
  { id: 'perfect_score', title: 'Perfectionist', description: 'Score 100 on any challenge', icon: 'diamond', condition: (stats) => stats.highestScore >= 100 },
  { id: 'streak_3', title: 'On Fire', description: '3-day learning streak', icon: 'fire', condition: (stats) => stats.currentStreak >= 3 },
  { id: 'streak_7', title: 'Dedicated Learner', description: '7-day learning streak', icon: 'fire', condition: (stats) => stats.currentStreak >= 7 },
  { id: 'streak_30', title: 'Unstoppable', description: '30-day learning streak', icon: 'fire', condition: (stats) => stats.currentStreak >= 30 },
  { id: 'guru_1', title: 'First Guru', description: 'Earn your first Guru title', icon: 'award', condition: (stats) => stats.guruCount >= 1 },
  { id: 'guru_all', title: 'Grand Master', description: 'Earn all Guru titles', icon: 'crown', condition: (stats) => stats.guruCount >= 7 },
  { id: 'teach_master', title: 'Born Teacher', description: 'Pass 5 Teach Back challenges', icon: 'book', condition: (stats) => stats.teachBackPasses >= 5 },
  { id: 'apply_master', title: 'Practitioner', description: 'Pass 5 Apply challenges', icon: 'briefcase', condition: (stats) => stats.applyPasses >= 5 },
  { id: 'analogy_king', title: 'Analogy King', description: 'Use 10+ analogies across all answers', icon: 'sparkle', condition: (stats) => stats.totalAnalogies >= 10 },
];

function checkAchievements(stats, unlockedIds) {
  const newlyUnlocked = [];
  for (const achievement of ACHIEVEMENTS) {
    if (!unlockedIds.includes(achievement.id) && achievement.condition(stats)) {
      newlyUnlocked.push(achievement);
    }
  }
  return newlyUnlocked;
}

module.exports = {
  // Guru Rank
  GURU_RANKS,
  getGuruRank,
  getNextRank,
  // Stemmer
  STEM_SUFFIXES,
  stem,
  // Text Processing
  normalize,
  tokenize,
  buildNGrams,
  // Reading Level
  countSyllables,
  computeReadingLevel,
  // Concept Matching
  conceptPresent,
  matchConceptGroups,
  // Forbidden Terms
  detectForbiddenTerms,
  // Depth
  DEPTH_MARKERS,
  computeDepthBonus,
  // Why-Depth
  WHY_CAUSE_MARKERS,
  WHY_CONSEQUENCE_MARKERS,
  computeWhyDepthScore,
  // Analogy
  ANALOGY_PATTERNS,
  detectAnalogyUse,
  computeAnalogyBonus,
  // Contrast
  CONTRAST_MARKERS,
  computeContrastBonus,
  // Evaluation
  PASS_THRESHOLD,
  PARTIAL_THRESHOLD,
  FORBIDDEN_PENALTY,
  READING_LEVEL_PENALTY,
  MIN_WORDS_SCORE_CAP,
  evaluateAnswer,
  // XP
  xpForLevel,
  computeLevel,
  // Streak
  getDateKey,
  computeStreak,
  computeStreakBonus,
  // Adaptive Feedback
  PERFORMANCE_PATTERNS,
  analyzePerformancePattern,
  generateAdaptiveFeedback,
  // Achievements
  ACHIEVEMENTS,
  checkAchievements,
};

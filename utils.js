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

  // Step 4: Depth Bonus
  const depthBonus = computeDepthBonus(normalizedInput);

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

  // Step 6: Score Calculation
  let baseScore = totalWeight > 0 ? (matchedWeight / totalWeight) * 100 : 0;
  baseScore = Math.min(100, baseScore + depthBonus);

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
};

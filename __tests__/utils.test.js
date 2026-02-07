const {
  GURU_RANKS,
  getGuruRank,
  getNextRank,
  stem,
  normalize,
  tokenize,
  buildNGrams,
  countSyllables,
  computeReadingLevel,
  conceptPresent,
  matchConceptGroups,
  detectForbiddenTerms,
  DEPTH_MARKERS,
  computeDepthBonus,
  WHY_CAUSE_MARKERS,
  WHY_CONSEQUENCE_MARKERS,
  computeWhyDepthScore,
  ANALOGY_PATTERNS,
  detectAnalogyUse,
  computeAnalogyBonus,
  CONTRAST_MARKERS,
  computeContrastBonus,
  PASS_THRESHOLD,
  PARTIAL_THRESHOLD,
  FORBIDDEN_PENALTY,
  READING_LEVEL_PENALTY,
  MIN_WORDS_SCORE_CAP,
  evaluateAnswer,
  xpForLevel,
  computeLevel,
} = require('../utils');

// ============================================================================
// GURU RANK SYSTEM
// ============================================================================

describe('Guru Rank System', () => {
  describe('GURU_RANKS', () => {
    it('should have 6 ranks in ascending XP order', () => {
      expect(GURU_RANKS).toHaveLength(6);
      for (let i = 1; i < GURU_RANKS.length; i++) {
        expect(GURU_RANKS[i].minXP).toBeGreaterThan(GURU_RANKS[i - 1].minXP);
      }
    });

    it('should start at 0 XP', () => {
      expect(GURU_RANKS[0].minXP).toBe(0);
    });
  });

  describe('getGuruRank', () => {
    it('returns Curious Mind for 0 XP', () => {
      expect(getGuruRank(0).title).toBe('Curious Mind');
    });

    it('returns Curious Mind for 99 XP (just below AI Apprentice)', () => {
      expect(getGuruRank(99).title).toBe('Curious Mind');
    });

    it('returns AI Apprentice at exactly 100 XP', () => {
      expect(getGuruRank(100).title).toBe('AI Apprentice');
    });

    it('returns Pattern Seeker at 350 XP', () => {
      expect(getGuruRank(350).title).toBe('Pattern Seeker');
    });

    it('returns Neural Thinker at 700 XP', () => {
      expect(getGuruRank(700).title).toBe('Neural Thinker');
    });

    it('returns AI Guru at 1200 XP', () => {
      expect(getGuruRank(1200).title).toBe('AI Guru');
    });

    it('returns Grand Guru at 2000 XP', () => {
      expect(getGuruRank(2000).title).toBe('Grand Guru');
    });

    it('returns Grand Guru for XP way above max threshold', () => {
      expect(getGuruRank(99999).title).toBe('Grand Guru');
    });
  });

  describe('getNextRank', () => {
    it('returns AI Apprentice as next rank for 0 XP', () => {
      expect(getNextRank(0).title).toBe('AI Apprentice');
    });

    it('returns Pattern Seeker as next rank for 100 XP', () => {
      expect(getNextRank(100).title).toBe('Pattern Seeker');
    });

    it('returns null when at max rank (2000+ XP)', () => {
      expect(getNextRank(2000)).toBeNull();
      expect(getNextRank(5000)).toBeNull();
    });

    it('returns the correct next rank at boundary values', () => {
      expect(getNextRank(349).title).toBe('Pattern Seeker');
      expect(getNextRank(350).title).toBe('Neural Thinker');
    });
  });
});

// ============================================================================
// STEMMER
// ============================================================================

describe('Stemmer', () => {
  describe('stem', () => {
    it('returns short words (<=3 chars) unchanged', () => {
      expect(stem('the')).toBe('the');
      expect(stem('an')).toBe('an');
      expect(stem('AI')).toBe('ai');
    });

    it('removes -ing suffix', () => {
      expect(stem('running')).toBe('runn');
      // 'predicting' matches '-ting' before '-ing' (suffix order matters)
      expect(stem('predicting')).toBe('predic');
      expect(stem('learning')).toBe('learn');
    });

    it('removes -ed suffix', () => {
      expect(stem('learned')).toBe('learn');
      expect(stem('predicted')).toBe('predict');
    });

    it('removes -tion/-ation suffix', () => {
      expect(stem('prediction')).toBe('predict');
      expect(stem('activation')).toBe('activ');
    });

    it('removes -ly suffix', () => {
      expect(stem('probably')).toBe('probab');
      // 'statistically' matches '-ingly' first (no match), then tries others
      // It actually matches '-ly' giving 'statistical' since only one suffix is removed
      expect(stem('statistically')).toBe('statistical');
      expect(stem('clearly')).toBe('clear');
    });

    it('removes -ness suffix', () => {
      expect(stem('awareness')).toBe('aware');
    });

    it('removes -s suffix', () => {
      expect(stem('patterns')).toBe('pattern');
      expect(stem('words')).toBe('word');
    });

    it('does not remove suffix if remaining word is too short', () => {
      expect(stem('used')).toBe('used');
      // 'ones' -> 'one' (removing -s leaves 3 chars, which meets the minimum)
      expect(stem('ones')).toBe('one');
      // 'aes' -> 'aes' (removing -s would leave 2 chars, below minimum of 3)
      expect(stem('aes')).toBe('aes');
    });

    it('converts to lowercase', () => {
      expect(stem('Running')).toBe('runn');
      expect(stem('PATTERN')).toBe('pattern');
    });
  });
});

// ============================================================================
// TEXT PROCESSING
// ============================================================================

describe('Text Processing', () => {
  describe('normalize', () => {
    it('converts to lowercase', () => {
      expect(normalize('Hello World')).toBe('hello world');
    });

    it('removes smart quotes', () => {
      expect(normalize('\u2018hello\u2019')).toBe('hello');
      expect(normalize('\u201CHello\u201D')).toBe('hello');
    });

    it('replaces punctuation with spaces', () => {
      expect(normalize('hello, world!')).toBe('hello world');
    });

    it('collapses multiple spaces', () => {
      expect(normalize('hello   world')).toBe('hello world');
    });

    it('trims whitespace', () => {
      expect(normalize('  hello  ')).toBe('hello');
    });

    it('preserves hyphens', () => {
      expect(normalize('auto-complete')).toBe('auto-complete');
    });
  });

  describe('tokenize', () => {
    it('splits normalized text into words', () => {
      expect(tokenize('Hello, World!')).toEqual(['hello', 'world']);
    });

    it('handles empty input', () => {
      expect(tokenize('')).toEqual([]);
    });

    it('filters out empty strings', () => {
      expect(tokenize('  hello  ')).toEqual(['hello']);
    });
  });

  describe('buildNGrams', () => {
    it('builds unigrams', () => {
      const tokens = ['the', 'cat', 'sat'];
      const ngrams = buildNGrams(tokens);
      expect(ngrams.exact.has('the')).toBe(true);
      expect(ngrams.exact.has('cat')).toBe(true);
      expect(ngrams.exact.has('sat')).toBe(true);
    });

    it('builds bigrams', () => {
      const tokens = ['the', 'cat', 'sat'];
      const ngrams = buildNGrams(tokens);
      expect(ngrams.exact.has('the cat')).toBe(true);
      expect(ngrams.exact.has('cat sat')).toBe(true);
    });

    it('builds trigrams', () => {
      const tokens = ['the', 'cat', 'sat'];
      const ngrams = buildNGrams(tokens);
      expect(ngrams.exact.has('the cat sat')).toBe(true);
    });

    it('builds stemmed versions', () => {
      const tokens = ['predicting', 'patterns'];
      const ngrams = buildNGrams(tokens);
      // stem('predicting') = 'predic' (removes -ting)
      expect(ngrams.stemmed.has('predic')).toBe(true);
      expect(ngrams.stemmed.has('pattern')).toBe(true);
      expect(ngrams.stemmed.has('predic pattern')).toBe(true);
    });

    it('respects maxN parameter', () => {
      const tokens = ['a', 'b', 'c', 'd'];
      const ngrams = buildNGrams(tokens, 2);
      expect(ngrams.exact.has('a b')).toBe(true);
      expect(ngrams.exact.has('a b c')).toBe(false);
    });

    it('handles single token', () => {
      const ngrams = buildNGrams(['hello']);
      expect(ngrams.exact.size).toBe(1);
      expect(ngrams.exact.has('hello')).toBe(true);
    });
  });
});

// ============================================================================
// READING LEVEL
// ============================================================================

describe('Reading Level', () => {
  describe('countSyllables', () => {
    it('counts monosyllabic words', () => {
      expect(countSyllables('cat')).toBe(1);
      expect(countSyllables('dog')).toBe(1);
      expect(countSyllables('the')).toBe(1);
    });

    it('counts multi-syllable words', () => {
      expect(countSyllables('computer')).toBe(3);
      expect(countSyllables('beautiful')).toBe(3);
    });

    it('returns 1 for short words (<=2 chars)', () => {
      expect(countSyllables('it')).toBe(1);
      expect(countSyllables('an')).toBe(1);
    });

    it('handles silent e', () => {
      expect(countSyllables('make')).toBe(1);
      expect(countSyllables('take')).toBe(1);
    });

    it('returns at least 1', () => {
      expect(countSyllables('x')).toBeGreaterThanOrEqual(1);
      expect(countSyllables('rhythm')).toBeGreaterThanOrEqual(1);
    });
  });

  describe('computeReadingLevel', () => {
    it('returns 0 for empty text', () => {
      expect(computeReadingLevel('')).toBe(0);
    });

    it('returns a low grade level for simple sentences', () => {
      const simpleText = 'The cat sat on the mat. The dog ran fast.';
      const level = computeReadingLevel(simpleText);
      expect(level).toBeLessThan(6);
    });

    it('returns a higher grade level for complex sentences', () => {
      const complexText = 'The implementation of sophisticated probabilistic algorithms necessitates comprehensive understanding of stochastic gradient descent methodologies.';
      const level = computeReadingLevel(complexText);
      expect(level).toBeGreaterThan(10);
    });

    it('returns a numeric value', () => {
      const level = computeReadingLevel('This is a test sentence.');
      expect(typeof level).toBe('number');
      expect(level).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============================================================================
// CONCEPT MATCHING
// ============================================================================

describe('Concept Matching', () => {
  describe('conceptPresent', () => {
    it('finds exact term match', () => {
      const concept = { term: 'predict', synonyms: [], weight: 3 };
      const tokens = tokenize('LLMs predict the next word');
      const ngrams = buildNGrams(tokens);
      expect(conceptPresent(concept, ngrams)).toBe('predict');
    });

    it('finds synonym match', () => {
      const concept = {
        term: 'predict',
        synonyms: ['predicts', 'prediction', 'forecast'],
        weight: 3,
      };
      const tokens = tokenize('The model makes a prediction about the next word');
      const ngrams = buildNGrams(tokens);
      expect(conceptPresent(concept, ngrams)).toBe('prediction');
    });

    it('finds stemmed match', () => {
      // Use a word whose stem matches exactly: 'learned' -> stem removes -ed -> 'learn'
      const concept = { term: 'learn', synonyms: [], weight: 3 };
      const tokens = tokenize('The model learned from data and keeps getting better');
      const ngrams = buildNGrams(tokens);
      expect(conceptPresent(concept, ngrams)).toBe('learn');
    });

    it('returns null when concept is not present', () => {
      const concept = { term: 'quantum', synonyms: ['qubit'], weight: 3 };
      const tokens = tokenize('LLMs predict the next word');
      const ngrams = buildNGrams(tokens);
      expect(conceptPresent(concept, ngrams)).toBeNull();
    });

    it('handles multi-word terms', () => {
      const concept = { term: 'next token', synonyms: ['next word'], weight: 3 };
      const tokens = tokenize('It predicts the next word in a sequence');
      const ngrams = buildNGrams(tokens);
      expect(conceptPresent(concept, ngrams)).toBe('next word');
    });
  });

  describe('matchConceptGroups', () => {
    it('matches all groups when all concepts are present', () => {
      const groups = [
        [{ term: 'predict', synonyms: ['predicts'], weight: 3 }],
        [{ term: 'next word', synonyms: ['next token'], weight: 3 }],
      ];
      const tokens = tokenize('LLMs predict the next word using statistical patterns');
      const ngrams = buildNGrams(tokens);
      const results = matchConceptGroups(groups, ngrams);

      expect(results).toHaveLength(2);
      expect(results[0].matched).toBe(true);
      expect(results[1].matched).toBe(true);
    });

    it('reports unmatched groups', () => {
      const groups = [
        [{ term: 'predict', synonyms: [], weight: 3 }],
        [{ term: 'quantum', synonyms: [], weight: 3 }],
      ];
      const tokens = tokenize('LLMs predict the next word');
      const ngrams = buildNGrams(tokens);
      const results = matchConceptGroups(groups, ngrams);

      expect(results[0].matched).toBe(true);
      expect(results[1].matched).toBe(false);
    });

    it('selects the highest weight match within a group', () => {
      const groups = [
        [
          { term: 'pattern', synonyms: [], weight: 2 },
          { term: 'predict', synonyms: [], weight: 3 },
        ],
      ];
      const tokens = tokenize('LLMs predict patterns in data');
      const ngrams = buildNGrams(tokens);
      const results = matchConceptGroups(groups, ngrams);

      expect(results[0].matched).toBe(true);
      expect(results[0].weight).toBe(3);
    });

    it('includes groupIndex in results', () => {
      const groups = [
        [{ term: 'a', weight: 1 }],
        [{ term: 'b', weight: 1 }],
      ];
      const ngrams = buildNGrams(['a', 'b']);
      const results = matchConceptGroups(groups, ngrams);

      expect(results[0].groupIndex).toBe(0);
      expect(results[1].groupIndex).toBe(1);
    });
  });
});

// ============================================================================
// FORBIDDEN TERMS
// ============================================================================

describe('Forbidden Term Detection', () => {
  describe('detectForbiddenTerms', () => {
    it('returns empty array when no forbidden terms defined', () => {
      expect(detectForbiddenTerms('some text', [])).toEqual([]);
      expect(detectForbiddenTerms('some text', null)).toEqual([]);
      expect(detectForbiddenTerms('some text', undefined)).toEqual([]);
    });

    it('detects forbidden terms in text', () => {
      const forbidden = [
        { term: 'transformer', hint: 'Use "smart helper" instead.' },
        { term: 'neural', hint: 'Say "brain" instead.' },
      ];
      const result = detectForbiddenTerms('the transformer model uses neural networks', forbidden);
      expect(result).toHaveLength(2);
      expect(result[0].term).toBe('transformer');
      expect(result[1].term).toBe('neural');
    });

    it('returns empty array when no violations found', () => {
      const forbidden = [
        { term: 'quantum', hint: 'No quantum talk.' },
      ];
      const result = detectForbiddenTerms('the cat sat on the mat', forbidden);
      expect(result).toEqual([]);
    });

    it('includes hints in violation results', () => {
      const forbidden = [
        { term: 'algorithm', hint: 'Say "recipe" instead.' },
      ];
      const result = detectForbiddenTerms('this algorithm is fast', forbidden);
      expect(result[0].hint).toBe('Say "recipe" instead.');
    });
  });
});

// ============================================================================
// DEPTH BONUS
// ============================================================================

describe('Depth Bonus', () => {
  describe('computeDepthBonus', () => {
    it('returns 0 for text with no depth markers', () => {
      expect(computeDepthBonus('the cat sat on the mat')).toBe(0);
    });

    it('returns 2 per depth marker', () => {
      expect(computeDepthBonus('this is true because it works')).toBe(2);
    });

    it('accumulates multiple markers', () => {
      const text = 'because of this, therefore the result, for example the case';
      expect(computeDepthBonus(text)).toBe(6);
    });

    it('caps at 10', () => {
      const text = 'because therefore since so that this means for example for instance such as in other words the reason which means';
      expect(computeDepthBonus(text)).toBe(10);
    });
  });
});

// ============================================================================
// WHY-DEPTH ANALYSIS
// ============================================================================

describe('Why-Depth Analysis', () => {
  describe('computeWhyDepthScore', () => {
    it('returns 0 for text with no causal markers', () => {
      expect(computeWhyDepthScore('the cat sat on the mat')).toBe(0);
    });

    it('scores cause markers', () => {
      const text = 'this happens because the model predicts words';
      expect(computeWhyDepthScore(text)).toBeGreaterThan(0);
    });

    it('scores consequence markers', () => {
      const text = 'this means the output could be wrong and the risk is high';
      expect(computeWhyDepthScore(text)).toBeGreaterThan(0);
    });

    it('awards chain bonus when both cause and consequence present', () => {
      const textWithBoth = 'this happens because the model guesses which means it can be wrong';
      const textCauseOnly = 'this happens because the model guesses words from data';
      const scoreBoth = computeWhyDepthScore(textWithBoth);
      const scoreCause = computeWhyDepthScore(textCauseOnly);
      expect(scoreBoth).toBeGreaterThan(scoreCause);
    });

    it('caps at 15', () => {
      const text = 'because due to caused by leads to results in as a result consequently this means which means so that therefore the consequence the impact the effect';
      expect(computeWhyDepthScore(text)).toBe(15);
    });
  });
});

// ============================================================================
// ANALOGY DETECTION
// ============================================================================

describe('Analogy Detection', () => {
  describe('detectAnalogyUse', () => {
    it('returns count 0 for text with no analogies', () => {
      const result = detectAnalogyUse('the model generates text');
      expect(result.count).toBe(0);
      expect(result.patterns).toEqual([]);
    });

    it('detects analogy patterns', () => {
      const result = detectAnalogyUse('think of it like a guessing game just like auto-complete');
      expect(result.count).toBeGreaterThan(0);
      expect(result.patterns.length).toBeGreaterThan(0);
    });

    it('detects "imagine" pattern', () => {
      const result = detectAnalogyUse('imagine a computer that reads lots of books');
      expect(result.count).toBe(1);
      expect(result.patterns).toContain('imagine');
    });
  });

  describe('computeAnalogyBonus', () => {
    it('returns 0 for text with no analogies', () => {
      expect(computeAnalogyBonus('the model generates text')).toBe(0);
    });

    it('awards 4 points per analogy', () => {
      const text = 'imagine a smart helper that works like a spell checker';
      const bonus = computeAnalogyBonus(text);
      expect(bonus).toBeGreaterThanOrEqual(4);
    });

    it('caps at 10', () => {
      const text = 'like a helper just like imagine pretend think of similar to works like acts like';
      expect(computeAnalogyBonus(text)).toBe(10);
    });
  });
});

// ============================================================================
// CONTRAST DETECTION
// ============================================================================

describe('Contrast Detection', () => {
  describe('computeContrastBonus', () => {
    it('returns 0 for text with no contrast markers', () => {
      expect(computeContrastBonus('the cat sat on the mat')).toBe(0);
    });

    it('detects contrast markers', () => {
      const text = 'however this doesnt mean it understands unlike a human';
      expect(computeContrastBonus(text)).toBeGreaterThan(0);
    });

    it('detects misconception markers', () => {
      const text = 'people think AI understands but that is a misconception';
      expect(computeContrastBonus(text)).toBeGreaterThan(0);
    });

    it('caps at 8', () => {
      const text = 'but however unlike instead of rather than on the other hand the difference while whereas compared to versus doesnt mean not actually';
      expect(computeContrastBonus(text)).toBe(8);
    });
  });
});

// ============================================================================
// EVALUATE ANSWER (Integration)
// ============================================================================

describe('evaluateAnswer', () => {
  const conceptCheckChallenge = {
    type: 'CONCEPT_CHECK',
    prompt: 'How do LLMs generate text?',
    required_concepts: [
      [
        { term: 'predict', synonyms: ['predicts', 'prediction', 'predicting'], weight: 3 },
        { term: 'probability', synonyms: ['probable', 'probabilistic', 'likely'], weight: 3 },
      ],
      [
        { term: 'next token', synonyms: ['next word', 'following word'], weight: 3 },
      ],
    ],
    forbidden_terms: [],
    min_word_count: 15,
    max_reading_level: null,
    xp_reward: 150,
    partial_xp_reward: 60,
    hint: 'Focus on statistical nature.',
  };

  const teachBackChallenge = {
    type: 'TEACH_BACK',
    prompt: 'Explain LLMs to a 5-year-old.',
    required_concepts: [
      [
        { term: 'like a', synonyms: ['imagine', 'pretend', 'think of', 'similar to'], weight: 3 },
      ],
      [
        { term: 'guess', synonyms: ['guesses', 'guessing', 'fills in', 'completes'], weight: 3 },
      ],
    ],
    forbidden_terms: [
      { term: 'transformer', hint: 'Too technical.' },
      { term: 'neural', hint: 'Say "brain" instead.' },
    ],
    min_word_count: 20,
    max_reading_level: 7,
    xp_reward: 150,
    partial_xp_reward: 60,
    hint: 'Use an analogy.',
  };

  describe('scoring thresholds', () => {
    it('passes with PASS status when score >= 70', () => {
      const input = 'LLMs work by predicting the next word in a sequence based on probability and statistical patterns learned from massive text datasets during training because they model language';
      const result = evaluateAnswer(input, conceptCheckChallenge);
      expect(result.status).toBe('PASS');
      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(PASS_THRESHOLD);
      expect(result.xpEarned).toBe(150);
    });

    it('returns FAIL status when too few concepts matched', () => {
      const input = 'I think AI is really cool and interesting and it does lots of amazing things for people all around the world every day';
      const result = evaluateAnswer(input, conceptCheckChallenge);
      expect(result.status).toBe('FAIL');
      expect(result.passed).toBe(false);
      expect(result.score).toBeLessThan(PARTIAL_THRESHOLD);
    });
  });

  describe('word count gate', () => {
    it('caps score at 30 when input is too brief', () => {
      const input = 'predict next word';
      const result = evaluateAnswer(input, conceptCheckChallenge);
      expect(result.score).toBeLessThanOrEqual(MIN_WORDS_SCORE_CAP);
      expect(result.breakdown.wordCount.passed).toBe(false);
    });

    it('passes word count check when minimum met', () => {
      const input = 'LLMs predict the next word in a sequence using probability and statistical patterns from training data because they learn from text corpora which means they model language';
      const result = evaluateAnswer(input, conceptCheckChallenge);
      expect(result.breakdown.wordCount.passed).toBe(true);
    });
  });

  describe('forbidden terms (TEACH_BACK)', () => {
    it('penalizes forbidden terms in teach-back challenges', () => {
      const input = 'Imagine a smart computer that guesses the next word. It is like a transformer neural network that fills in blanks using patterns it learned from reading lots of books and stories.';
      const result = evaluateAnswer(input, teachBackChallenge);
      expect(result.breakdown.forbidden.length).toBeGreaterThan(0);
    });

    it('does not check forbidden terms for CONCEPT_CHECK challenges', () => {
      const inputWithForbidden = 'The transformer model predicts the next word using probability patterns. It uses neural networks to learn statistical relationships between tokens in sequence.';
      const result = evaluateAnswer(inputWithForbidden, conceptCheckChallenge);
      expect(result.breakdown.forbidden).toEqual([]);
    });
  });

  describe('depth bonus', () => {
    it('awards depth bonus for causal connectives', () => {
      const input = 'LLMs predict the next word because they use probability from training data. For example, they learn patterns from text. This means they can generate coherent sentences without truly understanding meaning.';
      const result = evaluateAnswer(input, conceptCheckChallenge);
      expect(result.breakdown.depthBonus).toBeGreaterThan(0);
    });
  });

  describe('feedback', () => {
    it('includes feedback messages', () => {
      const input = 'LLMs predict the next word using probability based on patterns from massive training data because they learn statistical relationships from text.';
      const result = evaluateAnswer(input, conceptCheckChallenge);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('includes concept coverage feedback when concepts are missed', () => {
      const input = 'AI is really interesting and it helps people do many different tasks every single day all around the world';
      const result = evaluateAnswer(input, conceptCheckChallenge);
      expect(result.feedback.some(f => f.includes('concept areas'))).toBe(true);
    });
  });

  describe('analogy bonus for TEACH_BACK', () => {
    it('awards analogy bonus when analogies are used in teach-back', () => {
      const input = 'Imagine a computer that is like a guessing game. It reads lots of books and then it guesses what word comes next, just like how you fill in blanks in a story.';
      const result = evaluateAnswer(input, teachBackChallenge);
      expect(result.breakdown.analogyBonus).toBeGreaterThan(0);
    });

    it('does not award analogy bonus for CONCEPT_CHECK', () => {
      const input = 'LLMs predict the next word in a sequence. Imagine a probability machine that is like a calculator for language and text patterns.';
      const result = evaluateAnswer(input, conceptCheckChallenge);
      expect(result.breakdown.analogyBonus).toBe(0);
    });
  });

  describe('APPLY challenge type', () => {
    const applyChallenge = {
      type: 'APPLY',
      prompt: 'Explain why blindly trusting AI in law is risky.',
      required_concepts: [
        [
          { term: 'hallucinate', synonyms: ['make up', 'invents', 'wrong', 'incorrect'], weight: 3 },
        ],
        [
          { term: 'verify', synonyms: ['check', 'review', 'oversight', 'human review'], weight: 3 },
        ],
        [
          { term: 'risk', synonyms: ['danger', 'harm', 'liability', 'consequence'], weight: 2 },
        ],
      ],
      forbidden_terms: [],
      min_word_count: 25,
      max_reading_level: null,
      xp_reward: 200,
      partial_xp_reward: 80,
      hint: 'Think about hallucinations and human oversight.',
    };

    it('passes when all concepts and causal reasoning present', () => {
      const input = 'LLMs can make up false legal citations that look real because they hallucinate plausible-sounding text. This means there is serious risk of harm to clients. You must have human review and verify every output, otherwise the consequence could be malpractice lawsuits.';
      const result = evaluateAnswer(input, applyChallenge);
      expect(result.status).toBe('PASS');
      expect(result.score).toBeGreaterThanOrEqual(PASS_THRESHOLD);
    });

    it('awards contrast bonus for critical thinking', () => {
      const input = 'People think AI understands law but it doesnt. LLMs make up facts that look wrong. However you must check and verify every claim because the risk of harm and liability is real and unlike a human the AI wont tell you when it is guessing.';
      const result = evaluateAnswer(input, applyChallenge);
      expect(result.breakdown.contrastBonus).toBeGreaterThan(0);
    });

    it('does not check forbidden terms for APPLY challenges', () => {
      const input = 'The AI can hallucinate and make up wrong information. Always verify and check outputs because the risk of harm is too high to ignore in legal contexts and professional settings.';
      const result = evaluateAnswer(input, applyChallenge);
      expect(result.breakdown.forbidden).toEqual([]);
    });

    it('includes why-depth bonus in breakdown', () => {
      const input = 'LLMs make up wrong citations because they are statistical pattern matchers not databases. This means there is a risk of harm. You must verify and check every output as a result of this fundamental limitation.';
      const result = evaluateAnswer(input, applyChallenge);
      expect(result.breakdown.whyDepthBonus).toBeGreaterThan(0);
    });
  });

  describe('result structure', () => {
    it('returns all expected fields including new bonuses', () => {
      const input = 'LLMs predict the next word using probability patterns from training data and statistical models they have learned.';
      const result = evaluateAnswer(input, conceptCheckChallenge);
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('xpEarned');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('feedback');
      expect(result).toHaveProperty('breakdown');
      expect(result.breakdown).toHaveProperty('concepts');
      expect(result.breakdown).toHaveProperty('forbidden');
      expect(result.breakdown).toHaveProperty('wordCount');
      expect(result.breakdown).toHaveProperty('readingLevel');
      expect(result.breakdown).toHaveProperty('depthBonus');
      expect(result.breakdown).toHaveProperty('whyDepthBonus');
      expect(result.breakdown).toHaveProperty('analogyBonus');
      expect(result.breakdown).toHaveProperty('contrastBonus');
    });
  });
});

// ============================================================================
// XP SYSTEM
// ============================================================================

describe('XP System', () => {
  describe('xpForLevel', () => {
    it('returns 100 for level 1', () => {
      expect(xpForLevel(1)).toBe(100);
    });

    it('returns increasing XP for higher levels', () => {
      const xp1 = xpForLevel(1);
      const xp2 = xpForLevel(2);
      const xp3 = xpForLevel(3);
      expect(xp2).toBeGreaterThan(xp1);
      expect(xp3).toBeGreaterThan(xp2);
    });

    it('follows 1.4x exponential growth', () => {
      expect(xpForLevel(2)).toBe(Math.floor(100 * 1.4));
      expect(xpForLevel(3)).toBe(Math.floor(100 * Math.pow(1.4, 2)));
    });
  });

  describe('computeLevel', () => {
    it('returns level 1 for 0 XP', () => {
      expect(computeLevel(0)).toBe(1);
    });

    it('returns level 1 for 99 XP (below first level threshold)', () => {
      expect(computeLevel(99)).toBe(1);
    });

    it('returns level 2 at exactly 100 XP', () => {
      expect(computeLevel(100)).toBe(2);
    });

    it('returns higher levels for more XP', () => {
      const level5XP = xpForLevel(1) + xpForLevel(2) + xpForLevel(3) + xpForLevel(4);
      expect(computeLevel(level5XP)).toBe(5);
    });

    it('increases monotonically', () => {
      let prevLevel = 0;
      for (let xp = 0; xp < 5000; xp += 50) {
        const level = computeLevel(xp);
        expect(level).toBeGreaterThanOrEqual(prevLevel);
        prevLevel = level;
      }
    });
  });
});

// ============================================================================
// CONSTANTS
// ============================================================================

describe('Constants', () => {
  it('has correct threshold values', () => {
    expect(PASS_THRESHOLD).toBe(70);
    expect(PARTIAL_THRESHOLD).toBe(40);
    expect(FORBIDDEN_PENALTY).toBe(15);
    expect(READING_LEVEL_PENALTY).toBe(20);
    expect(MIN_WORDS_SCORE_CAP).toBe(30);
  });

  it('DEPTH_MARKERS is a non-empty array', () => {
    expect(Array.isArray(DEPTH_MARKERS)).toBe(true);
    expect(DEPTH_MARKERS.length).toBeGreaterThan(0);
  });
});

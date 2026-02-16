import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView,
  Dimensions, TextInput, Modal
} from 'react-native';

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
  info: '#3B82F6',
  warning: '#F59E0B',
  danger: '#EF4444',
  gold: '#EAB308',
  purple: '#A855F7',
};

const { width } = Dimensions.get('window');

const INVENT_CHALLENGES = [
  {
    id: 'data-structure',
    title: 'Invent a New Data Structure',
    difficulty: 'Hard',
    duration: '2-3 hours',
    icon: '🧩',
    category: 'Algorithms',
    description: 'Design a novel data structure for a specific problem domain',
    prompt: {
      problem: 'You need to store time-series events with fast insertions and efficient range queries',
      constraints: [
        'Insertions must be O(log n)',
        'Range queries (give me all events between time T1 and T2) must be O(log n + k) where k is result size',
        'Memory efficient - no more than 2x overhead',
        'Support out-of-order insertions'
      ],
      questions: [
        'What existing data structures could you combine?',
        'How do you handle the time dimension?',
        'What trade-offs are you making?',
        'When would you NOT use this data structure?'
      ]
    },
    deliverables: [
      'Problem statement',
      'Data structure design (diagram)',
      'Time complexity analysis',
      'Space complexity analysis',
      'Pseudocode for core operations',
      'Test cases',
      'Trade-offs discussion'
    ],
    examples: [
      'Skip List for Sorted Time Series',
      'Interval Tree with B+ Tree hybrid',
      'Cache-Aware Time-Series Buffer'
    ],
    why: 'Engineers who can INVENT, not just use, are the ones who become CTOs'
  },
  {
    id: 'database-from-scratch',
    title: 'Design a Database from Scratch',
    difficulty: 'Expert',
    duration: '4-6 hours',
    icon: '🗄️',
    category: 'Systems',
    description: 'Build a mini-database with your own design choices',
    prompt: {
      problem: 'Design a database for a real-time analytics workload (millions of writes/sec, complex queries)',
      constraints: [
        'Must handle 1M writes/sec',
        'Support ad-hoc queries (not just predefined)',
        'Data retention: 90 days',
        'Query latency: <100ms p99',
        'Cost-conscious: minimize storage and compute'
      ],
      questions: [
        'Row-store or column-store? Why?',
        'How do you index for fast queries?',
        'How do you handle query language?',
        'What concurrency model makes sense?'
      ]
    },
    deliverables: [
      'Storage engine choice (with justification)',
      'Index structure design',
      'Query language syntax',
      'Concurrency control mechanism',
      'Compaction/garbage collection strategy',
      'Architecture diagram',
      'API design'
    ],
    examples: [
      'Log-Structured Merge Tree (like Cassandra)',
      'Columnar with Parquet files (like ClickHouse)',
      'Hybrid row-column store'
    ],
    why: 'Understanding databases deeply makes you a 10x engineer'
  },
  {
    id: 'new-metric',
    title: 'Create a New Business Metric',
    difficulty: 'Medium',
    duration: '1-2 hours',
    icon: '📊',
    category: 'Product Analytics',
    description: 'Invent a metric that captures real business value',
    prompt: {
      problem: 'You work at a SaaS company. Standard metrics (DAU, retention) miss something important about user value',
      constraints: [
        'Must be actionable (teams can improve it)',
        'Must be measurable with existing data',
        'Must correlate with revenue',
        'Must be hard to game'
      ],
      questions: [
        'What user behavior drives long-term value?',
        'How do you weight different actions?',
        'How often should it be calculated?',
        'How would someone try to game this metric? How do you prevent it?'
      ]
    },
    deliverables: [
      'Metric name and definition',
      'Mathematical formula',
      'Data requirements',
      'Why it matters (business case)',
      'Gaming scenarios and prevention',
      'Implementation plan',
      'Stakeholder presentation'
    ],
    examples: [
      'Engaged User Score (weighted actions)',
      'Value Realization Time (time to first value)',
      'Feature Adoption Velocity (speed of exploring features)'
    ],
    why: 'Product sense + data skills = PM or founding engineer track'
  },
  {
    id: 'algorithm',
    title: 'Invent a New Algorithm',
    difficulty: 'Expert',
    duration: '3-5 hours',
    icon: '⚡',
    category: 'Algorithms',
    description: 'Design an algorithm for an unsolved or poorly-solved problem',
    prompt: {
      problem: 'Anomaly detection in multi-dimensional time-series with concept drift',
      constraints: [
        'Real-time (must process stream)',
        'Adaptive (learns from new data)',
        'Interpretable (explain why it\'s anomalous)',
        'Low false positives (<5%)'
      ],
      questions: [
        'What makes this hard?',
        'What existing algorithms almost work?',
        'How do you handle concept drift?',
        'How do you balance speed vs accuracy?'
      ]
    },
    deliverables: [
      'Problem formulation',
      'Algorithm design',
      'Complexity analysis',
      'Proof of correctness',
      'Edge cases handling',
      'Performance characteristics',
      'Comparison to existing approaches'
    ],
    examples: [
      'Adaptive Isolation Forest',
      'Streaming PCA with forgetting factor',
      'Hierarchical Temporal Memory variant'
    ],
    why: 'Research-level thinking + engineering = founding CTO material'
  },
  {
    id: 'protocol',
    title: 'Design a Communication Protocol',
    difficulty: 'Hard',
    duration: '2-4 hours',
    icon: '📡',
    category: 'Distributed Systems',
    description: 'Invent a network protocol for a specific use case',
    prompt: {
      problem: 'Design a protocol for syncing 100GB+ files between mobile devices over unreliable networks',
      constraints: [
        'Resume from interruptions',
        'Efficient (minimize bandwidth)',
        'Conflict resolution for concurrent edits',
        'Works on 3G networks',
        'End-to-end encrypted'
      ],
      questions: [
        'How do you chunk large files?',
        'How do you detect changes efficiently?',
        'How do you handle conflicts?',
        'What happens when network drops mid-sync?'
      ]
    },
    deliverables: [
      'Protocol specification',
      'Message formats',
      'State machine diagram',
      'Error handling',
      'Security considerations',
      'Performance analysis',
      'Comparison to existing protocols'
    ],
    examples: [
      'Rsync-inspired chunking',
      'CRDT-based sync',
      'Merkle tree diffing'
    ],
    why: 'Protocol design = understanding systems at the deepest level'
  }
];

const COMMUNITY_SUBMISSIONS = [
  {
    user: 'alex_ml',
    challenge: 'Invent a New Data Structure',
    title: 'Time-Weighted Skip List',
    upvotes: 234,
    summary: 'Combines skip list with time-decay weights for fast lookups of recent events',
    tags: ['O(log n)', 'cache-friendly', 'production-ready']
  },
  {
    user: 'sarah_data',
    challenge: 'Create a New Business Metric',
    title: 'Feature Adoption Velocity',
    upvotes: 189,
    summary: 'Measures how quickly users discover and use new features, weighted by feature importance',
    tags: ['product analytics', 'actionable', 'anti-gaming']
  },
  {
    user: 'mike_db',
    challenge: 'Design a Database from Scratch',
    title: 'Hybrid LSM + Columnar Store',
    upvotes: 312,
    summary: 'Row-oriented writes (LSM), columnar reads (Parquet), best of both worlds',
    tags: ['real-time', 'analytics', 'novel']
  }
];

export default function InventChallengesScreen() {
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [activeTab, setActiveTab] = useState('challenges');
  const [submission, setSubmission] = useState('');

  if (selectedChallenge) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedChallenge(null)}
          >
            <Text style={styles.backButtonText}>← Back to Challenges</Text>
          </TouchableOpacity>

          <View style={styles.challengeHeader}>
            <Text style={styles.challengeIcon}>{selectedChallenge.icon}</Text>
            <Text style={styles.challengeTitle}>{selectedChallenge.title}</Text>
            <View style={styles.challengeMeta}>
              <Text style={styles.metaText}>{selectedChallenge.category}</Text>
              <Text style={styles.metaText}>•</Text>
              <Text style={styles.metaText}>{selectedChallenge.duration}</Text>
            </View>
          </View>

          <Text style={styles.challengeDescription}>{selectedChallenge.description}</Text>

          {/* The Problem */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>The Problem</Text>
            <View style={styles.problemCard}>
              <Text style={styles.problemText}>{selectedChallenge.prompt.problem}</Text>
            </View>
          </View>

          {/* Constraints */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Constraints</Text>
            {selectedChallenge.prompt.constraints.map((constraint, index) => (
              <View key={index} style={styles.constraintItem}>
                <Text style={styles.constraintBullet}>⚠️</Text>
                <Text style={styles.constraintText}>{constraint}</Text>
              </View>
            ))}
          </View>

          {/* Questions to Consider */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Questions to Consider</Text>
            {selectedChallenge.prompt.questions.map((question, index) => (
              <View key={index} style={styles.questionItem}>
                <Text style={styles.questionBullet}>❓</Text>
                <Text style={styles.questionText}>{question}</Text>
              </View>
            ))}
          </View>

          {/* What to Deliver */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What You Must Deliver</Text>
            {selectedChallenge.deliverables.map((item, index) => (
              <View key={index} style={styles.deliverableItem}>
                <Text style={styles.deliverableBullet}>✓</Text>
                <Text style={styles.deliverableText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Example Approaches */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Example Approaches (Don't Copy!)</Text>
            {selectedChallenge.examples.map((example, index) => (
              <View key={index} style={styles.exampleItem}>
                <Text style={styles.exampleText}>• {example}</Text>
              </View>
            ))}
          </View>

          {/* Why This Matters */}
          <View style={styles.whyCard}>
            <Text style={styles.whyLabel}>Why This Matters:</Text>
            <Text style={styles.whyText}>{selectedChallenge.why}</Text>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => setShowSubmitModal(true)}
          >
            <Text style={styles.submitButtonText}>📤 Submit Your Invention</Text>
          </TouchableOpacity>

          {/* Submit Modal */}
          <Modal
            visible={showSubmitModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowSubmitModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Submit Your Solution</Text>
                  <TouchableOpacity onPress={() => setShowSubmitModal(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                  <TextInput
                    style={styles.submissionInput}
                    placeholder="Describe your invention, design choices, trade-offs..."
                    placeholderTextColor={COLORS.textMuted}
                    multiline
                    value={submission}
                    onChangeText={setSubmission}
                    textAlignVertical="top"
                  />
                </ScrollView>

                <TouchableOpacity
                  style={styles.modalSubmitButton}
                  onPress={() => {
                    setShowSubmitModal(false);
                    setSubmission('');
                  }}
                >
                  <Text style={styles.modalSubmitButtonText}>Submit to Community</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>💡 Invent Something</Text>
          <Text style={styles.subtitle}>Creative Engineering Challenges</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'challenges' && styles.tabActive]}
            onPress={() => setActiveTab('challenges')}
          >
            <Text style={[styles.tabText, activeTab === 'challenges' && styles.tabTextActive]}>
              Challenges
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'community' && styles.tabActive]}
            onPress={() => setActiveTab('community')}
          >
            <Text style={[styles.tabText, activeTab === 'community' && styles.tabTextActive]}>
              Community
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'challenges' ? (
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.philosophyCard}>
              <Text style={styles.philosophyIcon}>🚀</Text>
              <Text style={styles.philosophyTitle}>Why Invent?</Text>
              <Text style={styles.philosophyText}>
                Engineers who can INVENT, not just use, are the ones who become CTOs.{'\n\n'}
                This isn't about being "smart" — it's about practicing creative problem-solving.
              </Text>
            </View>

            {INVENT_CHALLENGES.map(challenge => (
              <TouchableOpacity
                key={challenge.id}
                style={styles.challengeCard}
                onPress={() => setSelectedChallenge(challenge)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardIcon}>{challenge.icon}</Text>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{challenge.title}</Text>
                    <Text style={styles.cardCategory}>{challenge.category}</Text>
                  </View>
                </View>

                <Text style={styles.cardDescription}>{challenge.description}</Text>

                <View style={styles.cardMeta}>
                  <View style={[
                    styles.difficultyBadge,
                    challenge.difficulty === 'Medium' && styles.difficultyMedium,
                    challenge.difficulty === 'Hard' && styles.difficultyHard,
                    challenge.difficulty === 'Expert' && styles.difficultyExpert
                  ]}>
                    <Text style={styles.difficultyText}>{challenge.difficulty}</Text>
                  </View>
                  <Text style={styles.durationText}>⏱️ {challenge.duration}</Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardFooterText}>
                    {challenge.deliverables.length} deliverables • {challenge.examples.length} example approaches
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.communityHeader}>Top Community Submissions</Text>

            {COMMUNITY_SUBMISSIONS.map((submission, index) => (
              <View key={index} style={styles.submissionCard}>
                <View style={styles.submissionHeader}>
                  <View style={styles.submissionUser}>
                    <Text style={styles.submissionUserIcon}>👤</Text>
                    <Text style={styles.submissionUserName}>{submission.user}</Text>
                  </View>
                  <View style={styles.upvotes}>
                    <Text style={styles.upvoteIcon}>⬆️</Text>
                    <Text style={styles.upvoteCount}>{submission.upvotes}</Text>
                  </View>
                </View>

                <Text style={styles.submissionChallenge}>{submission.challenge}</Text>
                <Text style={styles.submissionTitle}>{submission.title}</Text>
                <Text style={styles.submissionSummary}>{submission.summary}</Text>

                <View style={styles.submissionTags}>
                  {submission.tags.map((tag, tagIndex) => (
                    <View key={tagIndex} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={styles.viewButton}>
                  <Text style={styles.viewButtonText}>View Full Submission →</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.purple + '20',
    borderColor: COLORS.purple,
  },
  tabText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.purple,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  philosophyCard: {
    backgroundColor: COLORS.gold + '10',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    marginBottom: 24,
  },
  philosophyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  philosophyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  philosophyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  challengeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardCategory: {
    fontSize: 14,
    color: COLORS.purple,
  },
  cardDescription: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: COLORS.info + '20',
    borderRadius: 8,
  },
  difficultyMedium: {
    backgroundColor: COLORS.warning + '20',
  },
  difficultyHard: {
    backgroundColor: COLORS.danger + '20',
  },
  difficultyExpert: {
    backgroundColor: COLORS.purple + '20',
  },
  difficultyText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
  },
  durationText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  cardFooterText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  backButton: {
    padding: 20,
    paddingBottom: 10,
  },
  backButtonText: {
    color: COLORS.info,
    fontSize: 16,
  },
  challengeHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  challengeIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  challengeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  challengeMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  challengeDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  problemCard: {
    backgroundColor: COLORS.info + '10',
    padding: 16,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  problemText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  constraintItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.warning + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  constraintBullet: {
    fontSize: 18,
    marginRight: 10,
  },
  constraintText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  questionItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  questionBullet: {
    fontSize: 18,
    marginRight: 10,
  },
  questionText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  deliverableItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.success + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  deliverableBullet: {
    fontSize: 16,
    color: COLORS.success,
    marginRight: 10,
    fontWeight: 'bold',
  },
  deliverableText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  exampleItem: {
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 15,
    color: COLORS.textMuted,
    lineHeight: 22,
  },
  whyCard: {
    backgroundColor: COLORS.gold + '10',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  whyLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gold,
    marginBottom: 8,
  },
  whyText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  submitButton: {
    backgroundColor: COLORS.purple,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  submitButtonText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalClose: {
    fontSize: 24,
    color: COLORS.textMuted,
  },
  modalContent: {
    padding: 20,
  },
  submissionInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    padding: 16,
    color: COLORS.text,
    fontSize: 15,
    minHeight: 300,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalSubmitButton: {
    backgroundColor: COLORS.purple,
    margin: 20,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSubmitButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  communityHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  submissionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  submissionUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submissionUserIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  submissionUserName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  upvotes: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  upvoteIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  upvoteCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  submissionChallenge: {
    fontSize: 13,
    color: COLORS.purple,
    marginBottom: 6,
  },
  submissionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  submissionSummary: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  submissionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: COLORS.info + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.info,
    fontWeight: '600',
  },
  viewButton: {
    paddingVertical: 8,
  },
  viewButtonText: {
    fontSize: 14,
    color: COLORS.purple,
    fontWeight: '600',
  },
});

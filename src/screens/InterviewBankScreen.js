import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Dimensions, TextInput
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
};

const { width } = Dimensions.get('window');

const INTERVIEW_PATTERNS = {
  FAANG: [
    {
      id: 'google-swe',
      company: 'Google',
      role: 'Software Engineer',
      rounds: ['Phone Screen', 'Virtual Onsite (4-5 rounds)', 'Team Matching'],
      focus: ['Algorithms', 'System Design', 'Googleyness & Leadership'],
      patterns: [
        {
          name: 'Graph Traversal',
          examples: ['Clone Graph', 'Word Ladder', 'Course Schedule'],
          difficulty: 'Medium-Hard'
        },
        {
          name: 'Dynamic Programming',
          examples: ['Edit Distance', 'Longest Increasing Subsequence', 'Coin Change'],
          difficulty: 'Hard'
        },
        {
          name: 'System Design',
          examples: ['Design YouTube', 'Design Google Search', 'Design Google Maps'],
          difficulty: 'Hard'
        }
      ],
      tips: [
        'Communicate your thought process clearly',
        'Ask clarifying questions upfront',
        'Optimize for time and space complexity',
        'Write clean, production-ready code'
      ]
    },
    {
      id: 'meta-ml',
      company: 'Meta',
      role: 'ML Engineer',
      rounds: ['Recruiter', 'Technical Phone', 'Virtual Onsite (5 rounds)'],
      focus: ['ML Fundamentals', 'Coding', 'System Design', 'Behavioral'],
      patterns: [
        {
          name: 'ML System Design',
          examples: ['Design Newsfeed Ranking', 'Design Ad Recommendation', 'Design Friend Suggestions'],
          difficulty: 'Hard'
        },
        {
          name: 'ML Coding',
          examples: ['Implement Logistic Regression', 'Build Decision Tree', 'Gradient Descent from Scratch'],
          difficulty: 'Medium-Hard'
        },
        {
          name: 'Production ML',
          examples: ['A/B Testing Design', 'Feature Engineering', 'Model Monitoring'],
          difficulty: 'Medium'
        }
      ],
      tips: [
        'Deep dive into recommendation systems',
        'Study Meta\'s ML papers',
        'Practice trade-off discussions',
        'Know production ML metrics (precision, recall, AUC)'
      ]
    },
    {
      id: 'amazon-de',
      company: 'Amazon',
      role: 'Data Engineer',
      rounds: ['OA', 'Phone Screen', 'Virtual Onsite (4-5 rounds)'],
      focus: ['Leadership Principles', 'SQL/ETL', 'System Design', 'Behavioral'],
      patterns: [
        {
          name: 'SQL Deep Dives',
          examples: ['Complex JOINs', 'Window Functions', 'CTEs and Subqueries'],
          difficulty: 'Medium'
        },
        {
          name: 'Data Pipeline Design',
          examples: ['Design ETL for E-commerce', 'Real-time Analytics Pipeline', 'Data Lake Architecture'],
          difficulty: 'Hard'
        },
        {
          name: 'Leadership Principles',
          examples: ['Customer Obsession', 'Bias for Action', 'Dive Deep'],
          difficulty: 'Medium'
        }
      ],
      tips: [
        'Prepare STAR stories for all 16 LPs',
        'Emphasize customer impact',
        'Show ownership and bias for action',
        'Practice SQL on Redshift/Athena'
      ]
    }
  ],
  STARTUPS: [
    {
      id: 'anthropic-research',
      company: 'Anthropic',
      role: 'Research Engineer',
      rounds: ['Phone Screen', 'Take-home', 'Onsite (3-4 rounds)'],
      focus: ['ML Research', 'Coding', 'Research Discussion', 'Alignment'],
      patterns: [
        {
          name: 'Transformer Internals',
          examples: ['Implement Attention', 'Build GPT from Scratch', 'Fine-tuning Strategies'],
          difficulty: 'Hard'
        },
        {
          name: 'Research Discussion',
          examples: ['Constitutional AI', 'RLHF', 'Scaling Laws'],
          difficulty: 'Hard'
        },
        {
          name: 'Safety & Alignment',
          examples: ['Reward Modeling', 'Red Teaming', 'Interpretability'],
          difficulty: 'Hard'
        }
      ],
      tips: [
        'Read Anthropic\'s research papers',
        'Understand Constitutional AI deeply',
        'Discuss AI safety implications',
        'Show genuine interest in alignment'
      ]
    },
    {
      id: 'stripe-data',
      company: 'Stripe',
      role: 'Data Scientist',
      rounds: ['Recruiter', 'Technical Screen', 'Onsite (4 rounds)'],
      focus: ['Analytics', 'A/B Testing', 'SQL', 'Product Sense'],
      patterns: [
        {
          name: 'Product Analytics',
          examples: ['Payment Success Rate Analysis', 'Churn Prediction', 'Fraud Detection'],
          difficulty: 'Medium'
        },
        {
          name: 'Experimentation',
          examples: ['A/B Test Design', 'Sample Size Calculation', 'Metric Selection'],
          difficulty: 'Medium-Hard'
        },
        {
          name: 'Business Case Studies',
          examples: ['Increase Conversion Rate', 'Reduce Chargebacks', 'Expand to New Market'],
          difficulty: 'Medium'
        }
      ],
      tips: [
        'Understand payment systems deeply',
        'Practice SQL with real payment data',
        'Show product intuition',
        'Discuss trade-offs between metrics'
      ]
    },
    {
      id: 'scale-ml',
      company: 'Scale AI',
      role: 'ML Platform Engineer',
      rounds: ['Recruiter', 'Technical Phone', 'Onsite (4-5 rounds)'],
      focus: ['ML Infrastructure', 'System Design', 'Coding', 'Data Quality'],
      patterns: [
        {
          name: 'ML Platform Design',
          examples: ['Design Feature Store', 'Build Model Registry', 'Create Labeling Pipeline'],
          difficulty: 'Hard'
        },
        {
          name: 'Data Quality',
          examples: ['Labeling Accuracy', 'Inter-annotator Agreement', 'Active Learning'],
          difficulty: 'Medium-Hard'
        },
        {
          name: 'Production ML',
          examples: ['Model Serving', 'A/B Testing', 'Monitoring & Alerting'],
          difficulty: 'Medium'
        }
      ],
      tips: [
        'Understand data labeling workflows',
        'Study Scale\'s products (Nucleus, Rapid)',
        'Discuss ML platform best practices',
        'Show experience with production ML'
      ]
    }
  ]
};

const BEHAVIORAL_TEMPLATES = [
  {
    principle: 'Customer Obsession',
    question: 'Tell me about a time you went above and beyond for a customer',
    framework: 'STAR',
    example: {
      situation: 'Customer complained about slow query performance in analytics dashboard',
      task: 'Needed to reduce query time from 2 minutes to under 10 seconds',
      action: [
        'Profiled SQL queries to identify bottlenecks',
        'Implemented materialized views for frequently accessed data',
        'Added appropriate indexes on join columns',
        'Introduced query result caching with Redis'
      ],
      result: 'Reduced query time to 3 seconds (85% improvement), customer satisfaction score increased from 6 to 9'
    }
  },
  {
    principle: 'Bias for Action',
    question: 'Describe a situation where you had to make a decision with incomplete information',
    framework: 'STAR',
    example: {
      situation: 'Production model accuracy dropped suddenly, unclear root cause',
      task: 'Needed to restore service quickly while investigating',
      action: [
        'Rolled back to previous stable model version',
        'Set up enhanced monitoring on new model',
        'Created parallel testing environment',
        'Analyzed recent data for distribution shift'
      ],
      result: 'Service restored in 30 minutes, identified data pipeline bug causing feature corruption'
    }
  },
  {
    principle: 'Dive Deep',
    question: 'Tell me about a time you debugged a complex technical issue',
    framework: 'STAR',
    example: {
      situation: 'Memory leak causing ML service to crash every 6 hours',
      task: 'Identify root cause and fix without disrupting service',
      action: [
        'Profiled memory usage with py-spy',
        'Analyzed heap dumps to identify growing objects',
        'Traced issue to unclosed database connections in batch processing',
        'Implemented connection pooling and proper cleanup'
      ],
      result: 'Eliminated memory leak, service uptime improved from 75% to 99.9%'
    }
  }
];

export default function InterviewBankScreen() {
  const [selectedCompanyType, setSelectedCompanyType] = useState('FAANG');
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [showBehavioral, setShowBehavioral] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');

  const currentInterviews = INTERVIEW_PATTERNS[selectedCompanyType];

  if (showBehavioral) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowBehavioral(false)}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Behavioral Interview Prep</Text>
            <Text style={styles.subtitle}>STAR Method Templates</Text>
          </View>

          {BEHAVIORAL_TEMPLATES.map((template, index) => (
            <View key={index} style={styles.behavioralCard}>
              <Text style={styles.principleText}>{template.principle}</Text>
              <Text style={styles.questionText}>{template.question}</Text>

              <View style={styles.starContainer}>
                <View style={styles.starSection}>
                  <Text style={styles.starLabel}>Situation</Text>
                  <Text style={styles.starContent}>{template.example.situation}</Text>
                </View>

                <View style={styles.starSection}>
                  <Text style={styles.starLabel}>Task</Text>
                  <Text style={styles.starContent}>{template.example.task}</Text>
                </View>

                <View style={styles.starSection}>
                  <Text style={styles.starLabel}>Action</Text>
                  {template.example.action.map((action, i) => (
                    <Text key={i} style={styles.starContent}>• {action}</Text>
                  ))}
                </View>

                <View style={styles.starSection}>
                  <Text style={styles.starLabel}>Result</Text>
                  <Text style={styles.starContent}>{template.example.result}</Text>
                </View>
              </View>

              <TextInput
                style={styles.answerInput}
                placeholder="Write your own STAR story here..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                value={userAnswer}
                onChangeText={setUserAnswer}
              />
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (selectedPattern) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedPattern(null)}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.patternDetailHeader}>
            <Text style={styles.patternDetailTitle}>{selectedPattern.name}</Text>
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>{selectedPattern.difficulty}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Practice Problems</Text>
            {selectedPattern.examples.map((example, index) => (
              <View key={index} style={styles.exampleCard}>
                <Text style={styles.exampleText}>{index + 1}. {example}</Text>
                <TouchableOpacity style={styles.practiceButton}>
                  <Text style={styles.practiceButtonText}>Practice →</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (selectedInterview) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedInterview(null)}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.interviewHeader}>
            <Text style={styles.companyName}>{selectedInterview.company}</Text>
            <Text style={styles.roleText}>{selectedInterview.role}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interview Process</Text>
            {selectedInterview.rounds.map((round, index) => (
              <View key={index} style={styles.roundItem}>
                <View style={styles.roundNumber}>
                  <Text style={styles.roundNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.roundText}>{round}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Focus Areas</Text>
            <View style={styles.focusContainer}>
              {selectedInterview.focus.map((area, index) => (
                <View key={index} style={styles.focusTag}>
                  <Text style={styles.focusTagText}>{area}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Common Patterns</Text>
            {selectedInterview.patterns.map((pattern, index) => (
              <TouchableOpacity
                key={index}
                style={styles.patternCard}
                onPress={() => setSelectedPattern(pattern)}
              >
                <View style={styles.patternHeader}>
                  <Text style={styles.patternName}>{pattern.name}</Text>
                  <Text style={styles.patternDifficulty}>{pattern.difficulty}</Text>
                </View>
                <Text style={styles.patternExamples}>
                  {pattern.examples.length} practice problems
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interview Tips</Text>
            {selectedInterview.tips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Text style={styles.tipBullet}>💡</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Interview Bank</Text>
          <Text style={styles.subtitle}>Company-specific interview preparation</Text>
        </View>

        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              selectedCompanyType === 'FAANG' && styles.typeButtonActive
            ]}
            onPress={() => setSelectedCompanyType('FAANG')}
          >
            <Text style={[
              styles.typeButtonText,
              selectedCompanyType === 'FAANG' && styles.typeButtonTextActive
            ]}>
              FAANG
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              selectedCompanyType === 'STARTUPS' && styles.typeButtonActive
            ]}
            onPress={() => setSelectedCompanyType('STARTUPS')}
          >
            <Text style={[
              styles.typeButtonText,
              selectedCompanyType === 'STARTUPS' && styles.typeButtonTextActive
            ]}>
              Startups
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.behavioralButton}
          onPress={() => setShowBehavioral(true)}
        >
          <Text style={styles.behavioralButtonText}>📝 Behavioral Interview Templates</Text>
        </TouchableOpacity>

        <ScrollView
          style={styles.interviewList}
          showsVerticalScrollIndicator={false}
        >
          {currentInterviews.map(interview => (
            <TouchableOpacity
              key={interview.id}
              style={styles.interviewCard}
              onPress={() => setSelectedInterview(interview)}
            >
              <Text style={styles.cardCompanyName}>{interview.company}</Text>
              <Text style={styles.cardRoleName}>{interview.role}</Text>
              <Text style={styles.cardRounds}>{interview.rounds.length} rounds</Text>
              <View style={styles.cardFocusPreview}>
                {interview.focus.slice(0, 3).map((area, index) => (
                  <Text key={index} style={styles.cardFocusText}>{area}</Text>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
  typeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeButtonActive: {
    backgroundColor: COLORS.info + '20',
    borderColor: COLORS.info,
  },
  typeButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: COLORS.info,
  },
  behavioralButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.gold + '20',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  behavioralButtonText: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: '600',
  },
  interviewList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  interviewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardCompanyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardRoleName: {
    fontSize: 16,
    color: COLORS.info,
    marginBottom: 8,
  },
  cardRounds: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  cardFocusPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardFocusText: {
    fontSize: 12,
    color: COLORS.textMuted,
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  backButton: {
    padding: 20,
    paddingBottom: 10,
  },
  backButtonText: {
    color: COLORS.info,
    fontSize: 16,
  },
  interviewHeader: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  companyName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 20,
    color: COLORS.info,
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
  roundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  roundNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.info + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roundNumberText: {
    color: COLORS.info,
    fontWeight: 'bold',
    fontSize: 16,
  },
  roundText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    flex: 1,
  },
  focusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  focusTag: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.success + '40',
  },
  focusTagText: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: '500',
  },
  patternCard: {
    backgroundColor: COLORS.surfaceLight,
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  patternName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  patternDifficulty: {
    fontSize: 12,
    color: COLORS.warning,
  },
  patternExamples: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tipBullet: {
    fontSize: 18,
    marginRight: 10,
  },
  tipText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 22,
  },
  patternDetailHeader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  patternDetailTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.warning + '20',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  difficultyText: {
    color: COLORS.warning,
    fontSize: 14,
    fontWeight: '600',
  },
  exampleCard: {
    backgroundColor: COLORS.surfaceLight,
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exampleText: {
    fontSize: 15,
    color: COLORS.text,
    flex: 1,
  },
  practiceButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.info + '20',
    borderRadius: 8,
  },
  practiceButtonText: {
    color: COLORS.info,
    fontSize: 14,
    fontWeight: '600',
  },
  behavioralCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  principleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gold,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  starContainer: {
    marginBottom: 16,
  },
  starSection: {
    marginBottom: 12,
  },
  starLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.info,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  starContent: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 2,
  },
  answerInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    padding: 12,
    color: COLORS.text,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Dimensions
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

const CASE_STUDIES = [
  {
    id: 1,
    company: 'Stripe',
    problem: 'Fraud Detection at Scale',
    category: 'Machine Learning',
    isPremium: false,
    readTime: '15 min',
    difficulty: 'Advanced',
    businessImpact: '$2B+ saved annually',
    techStack: ['Python', 'TensorFlow', 'Kafka', 'PostgreSQL', 'Redis'],
    summary: 'How Stripe built a real-time ML system to detect fraud across billions of transactions while maintaining sub-100ms latency.',
    sections: [
      {
        title: 'The Challenge',
        content: `Stripe processes billions of dollars in transactions annually. Fraudsters are sophisticated and constantly evolving:

• Traditional rule-based systems had 60% false positive rate
• Manual review was expensive ($25 per transaction)
• Needed real-time decisions (<100ms)
• Had to work across 135 currencies and 45 countries
• Adversarial environment: fraudsters adapt to detection`
      },
      {
        title: 'The Solution Architecture',
        content: `Three-Layer Defense System:

1. Real-time ML Model (Gradient Boosted Trees)
   • Features: 1000+ engineered signals
   • Training: Daily on 100M+ transactions
   • Inference: <50ms p99 latency

2. Network Analysis Layer
   • Graph DB to detect fraud rings
   • Identifies connected suspicious accounts
   • Shares intelligence across merchants

3. Adaptive Rules Engine
   • Combines ML scores with business rules
   • Human-in-the-loop for edge cases
   • A/B tests new strategies continuously`
      },
      {
        title: 'Key Technical Decisions',
        content: `Decision 1: Why Gradient Boosted Trees over Deep Learning?
• Lower latency (50ms vs 200ms for DL)
• Better interpretability for compliance
• Easier to explain to merchants
• 10x less compute cost

Decision 2: Feature Engineering Pipeline
• Real-time features: User agent, velocity checks
• Batch features: Historical patterns (updated hourly)
• Network features: Connected accounts, devices
• External signals: IP reputation, email verification

Decision 3: Handling Concept Drift
• Continuous learning with online updates
• Shadow mode testing for new models
• Gradual rollout with automatic rollback
• Separate models per merchant segment`
      },
      {
        title: 'The Results',
        content: `Business Metrics:
• False positive rate: 60% → 8%
• Manual review cost: -85%
• Fraud loss rate: <0.01% of volume
• Customer satisfaction: +40%

Technical Metrics:
• p99 latency: 47ms
• Model retraining: Every 6 hours
• Feature processing: 1M+ events/sec
• System uptime: 99.995%

Scale:
• 100M+ predictions daily
• 50TB+ training data
• 15 model variants (by region/merchant size)
• $2B+ fraud prevented annually`
      },
      {
        title: 'Lessons Learned',
        content: `1. Start Simple, Add Complexity Only When Needed
   - Started with logistic regression
   - Moved to GBDT only when linear models plateaued

2. Feature Engineering > Model Complexity
   - Spent 80% effort on features, 20% on models
   - Network features had biggest impact

3. Build for Adversarial Environment
   - Fraudsters reverse-engineer models
   - Need continuous adaptation
   - Never reveal exact detection logic

4. Interpretability is Critical
   - Merchants need to understand decisions
   - Regulators require explainability
   - Built SHAP value explanations into API

5. Optimize for False Positives, Not Just Accuracy
   - Declining good transactions costs customers
   - Better to let small fraud through than block good users
   - Different risk tolerance per merchant`
      }
    ],
    practiceQuestions: [
      'How would you handle the cold start problem for new merchants?',
      'Design the feature pipeline for real-time inference',
      'How would you detect and respond to adversarial attacks on the model?',
      'Explain the trade-off between model latency and accuracy'
    ],
    relatedTopics: ['Anomaly Detection', 'Real-time ML', 'Graph Analysis', 'A/B Testing']
  },
  {
    id: 2,
    company: 'Netflix',
    problem: 'Personalization at 260M Users',
    category: 'Recommendation Systems',
    isPremium: true,
    readTime: '20 min',
    difficulty: 'Advanced',
    businessImpact: '$1B+ annual value from retention',
    techStack: ['Python', 'Spark', 'Cassandra', 'AWS', 'TensorFlow', 'A/B Testing'],
    summary: 'How Netflix built a multi-stage recommendation pipeline that drives 80% of viewing hours.',
    sections: [
      {
        title: 'The Challenge',
        content: `Premium Content - Unlock to Read

Upgrade to Pro to access:
• Complete technical breakdown
• Architecture diagrams
• Code examples
• Interview-style Q&A
• Downloadable case study PDF`
      }
    ],
    practiceQuestions: [
      'Design a recommendation system for cold start users',
      'How would you A/B test ranking algorithm changes?',
      'Explain the two-stage retrieval and ranking architecture'
    ],
    relatedTopics: ['Collaborative Filtering', 'Matrix Factorization', 'Bandits', 'Causal Inference']
  },
  {
    id: 3,
    company: 'OpenAI',
    problem: 'Reducing GPT-4 Latency',
    category: 'AI Infrastructure',
    isPremium: true,
    readTime: '18 min',
    difficulty: 'Expert',
    businessImpact: '10x throughput increase',
    techStack: ['CUDA', 'Triton', 'Kubernetes', 'Model Quantization', 'KV Cache'],
    summary: 'From 30s to 3s: How OpenAI optimized GPT-4 inference for production scale.',
    sections: []
  },
  {
    id: 4,
    company: 'Airbnb',
    problem: 'Building ML Platform for 1000+ Models',
    category: 'ML Engineering',
    isPremium: false,
    readTime: '16 min',
    difficulty: 'Advanced',
    businessImpact: '10x faster model deployment',
    techStack: ['Airflow', 'MLflow', 'Kubernetes', 'Feature Store', 'Spark'],
    summary: 'How Airbnb scaled from 10 models to 1000+ with Bighead ML Platform.',
    sections: [
      {
        title: 'The Problem',
        content: `By 2018, Airbnb had ML models scattered everywhere:

• 10 different deployment methods
• No standardized training pipeline
• Model drift detection was manual
• Feature engineering duplicated 100+ times
• Average time to production: 3-6 months
• Impossible to track lineage or reproduce results`
      },
      {
        title: 'Bighead Platform Architecture',
        content: `Core Components:

1. Feature Store (Zipline)
   • Centralized feature definitions
   • Point-in-time correct joins
   • Real-time + batch feature serving
   • Feature versioning and lineage

2. Training Pipeline
   • Standardized on Airflow + MLflow
   • Hyperparameter tuning with Optuna
   • Distributed training on Spark/Kubernetes
   • Automatic experiment tracking

3. Model Registry
   • Single source of truth for all models
   • A/B test metadata linked to models
   • Approval workflows for production
   • Model cards for documentation

4. Serving Infrastructure
   • Online: REST API (single predictions)
   • Batch: Spark jobs (bulk scoring)
   • Streaming: Kafka consumers
   • Multi-region deployment`
      },
      {
        title: 'Feature Store Deep Dive',
        content: `Why Feature Store?
Before: 100+ teams duplicating feature logic
After: DRY principle for ML features

Example Features:
• User: avg_booking_value_90d, cancellation_rate
• Listing: occupancy_rate, review_score_trend
• Market: demand_supply_ratio, seasonality_index

Key Design Decisions:

1. Point-in-time Correctness
   Problem: Training data leakage
   Solution: Features as time-series, joined at event time

2. Online/Offline Consistency
   Problem: Training uses Spark, serving uses Python
   Solution: Same feature definitions, different compute engines

3. Feature Versioning
   Problem: Model trained on v1 features, serving v2
   Solution: Models pin to feature versions`
      },
      {
        title: 'The Results',
        content: `Business Impact:
• Model deployment time: 6 months → 2 weeks
• Active models: 10 → 1000+
• Teams using platform: 5 → 50+
• Feature reuse: 0% → 60%

Technical Metrics:
• Feature serving latency: <10ms p99
• Batch feature pipeline: 100TB+ daily
• Model serving: 100K+ QPS
• Platform uptime: 99.9%

Developer Experience:
• 95% reduction in boilerplate code
• Automatic feature documentation
• Self-service model deployment
• Integrated monitoring dashboards`
      },
      {
        title: 'Key Takeaways',
        content: `1. Build Abstractions, Not Tools
   - Don't force teams to learn infrastructure
   - Provide simple APIs that do the right thing

2. Start with Feature Store
   - Biggest pain point in ML orgs
   - Enables reuse and consistency
   - Foundation for everything else

3. Make the Right Thing Easy
   - Default templates with best practices
   - Automatic monitoring and alerts
   - Push-button deployment

4. Obsess Over Developer Experience
   - Fast iteration cycles
   - Clear error messages
   - Comprehensive documentation
   - Active Slack support channel

5. Governance Without Bureaucracy
   - Automated checks (data quality, bias)
   - Approval workflows only for production
   - Model cards auto-generated from metadata`
      }
    ],
    practiceQuestions: [
      'Design a feature store for your company',
      'How would you ensure online/offline consistency?',
      'Explain the trade-offs: centralized platform vs team autonomy',
      'How would you handle schema evolution for features?'
    ],
    relatedTopics: ['Feature Engineering', 'MLOps', 'Model Serving', 'Data Versioning']
  },
  {
    id: 5,
    company: 'Uber',
    problem: 'Real-time Driver-Rider Matching',
    category: 'Distributed Systems',
    isPremium: true,
    readTime: '17 min',
    difficulty: 'Expert',
    businessImpact: '-20% wait times, +15% driver utilization',
    techStack: ['Go', 'Kafka', 'Redis', 'PostgreSQL', 'Geospatial Indexing'],
    summary: 'How Uber matches millions of rides per day with <1s latency using geospatial optimization.',
    sections: []
  }
];

export default function IndustryCaseStudiesScreen() {
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedSection, setSelectedSection] = useState(0);

  if (selectedCase) {
    if (selectedCase.isPremium && selectedCase.sections.length === 0) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedCase(null)}
            >
              <Text style={styles.backButtonText}>← Back to Case Studies</Text>
            </TouchableOpacity>

            <View style={styles.premiumLockContainer}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.premiumTitle}>Premium Content</Text>
              <Text style={styles.premiumCompany}>{selectedCase.company}</Text>
              <Text style={styles.premiumProblem}>{selectedCase.problem}</Text>

              <View style={styles.premiumFeatures}>
                <Text style={styles.featureItem}>✓ Complete technical breakdown</Text>
                <Text style={styles.featureItem}>✓ Architecture diagrams</Text>
                <Text style={styles.featureItem}>✓ Code examples & snippets</Text>
                <Text style={styles.featureItem}>✓ Interview-style Q&A</Text>
                <Text style={styles.featureItem}>✓ Downloadable PDF</Text>
              </View>

              <TouchableOpacity style={styles.upgradeButton}>
                <Text style={styles.upgradeButtonText}>Upgrade to Pro - $29/month</Text>
              </TouchableOpacity>

              <Text style={styles.premiumSubtext}>
                Get access to all {CASE_STUDIES.filter(c => c.isPremium).length} premium case studies
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedCase(null)}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.caseHeader}>
            <Text style={styles.companyName}>{selectedCase.company}</Text>
            <Text style={styles.problemTitle}>{selectedCase.problem}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaBadge}>
                <Text style={styles.metaText}>{selectedCase.readTime}</Text>
              </View>
              <View style={styles.metaBadge}>
                <Text style={styles.metaText}>{selectedCase.difficulty}</Text>
              </View>
              <View style={[styles.metaBadge, styles.impactBadge]}>
                <Text style={styles.impactText}>{selectedCase.businessImpact}</Text>
              </View>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.sectionTabs}
          >
            {selectedCase.sections.map((section, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.sectionTab,
                  selectedSection === index && styles.sectionTabActive
                ]}
                onPress={() => setSelectedSection(index)}
              >
                <Text style={[
                  styles.sectionTabText,
                  selectedSection === index && styles.sectionTabTextActive
                ]}>
                  {section.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionContent}>
              {selectedCase.sections[selectedSection]?.content}
            </Text>

            {selectedSection === selectedCase.sections.length - 1 && (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Tech Stack</Text>
                  <View style={styles.techContainer}>
                    {selectedCase.techStack.map((tech, index) => (
                      <View key={index} style={styles.techTag}>
                        <Text style={styles.techText}>{tech}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Practice Questions</Text>
                  {selectedCase.practiceQuestions.map((question, index) => (
                    <View key={index} style={styles.questionCard}>
                      <Text style={styles.questionText}>{index + 1}. {question}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Related Topics</Text>
                  <View style={styles.topicsContainer}>
                    {selectedCase.relatedTopics.map((topic, index) => (
                      <View key={index} style={styles.topicTag}>
                        <Text style={styles.topicText}>{topic}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Industry Case Studies</Text>
          <Text style={styles.subtitle}>How top companies solve real problems at scale</Text>
        </View>

        <ScrollView
          style={styles.caseList}
          showsVerticalScrollIndicator={false}
        >
          {CASE_STUDIES.map(caseStudy => (
            <TouchableOpacity
              key={caseStudy.id}
              style={styles.caseCard}
              onPress={() => {
                setSelectedCase(caseStudy);
                setSelectedSection(0);
              }}
            >
              <View style={styles.caseCardHeader}>
                <View style={styles.caseCardLeft}>
                  <Text style={styles.cardCompany}>{caseStudy.company}</Text>
                  <Text style={styles.cardProblem}>{caseStudy.problem}</Text>
                </View>
                {caseStudy.isPremium && (
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumBadgeText}>PRO</Text>
                  </View>
                )}
              </View>

              <Text style={styles.cardSummary}>{caseStudy.summary}</Text>

              <View style={styles.cardMeta}>
                <Text style={styles.cardCategory}>{caseStudy.category}</Text>
                <Text style={styles.cardReadTime}>📖 {caseStudy.readTime}</Text>
                <Text style={styles.cardImpact}>💰 {caseStudy.businessImpact}</Text>
              </View>

              <View style={styles.cardTechStack}>
                {caseStudy.techStack.slice(0, 4).map((tech, index) => (
                  <Text key={index} style={styles.techPreview}>{tech}</Text>
                ))}
                {caseStudy.techStack.length > 4 && (
                  <Text style={styles.techPreview}>+{caseStudy.techStack.length - 4}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}

          <View style={styles.promotionCard}>
            <Text style={styles.promotionIcon}>🎓</Text>
            <Text style={styles.promotionTitle}>Premium Case Studies</Text>
            <Text style={styles.promotionText}>
              Access detailed breakdowns from Netflix, OpenAI, Uber, and 15+ more companies
            </Text>
            <TouchableOpacity style={styles.promoButton}>
              <Text style={styles.promoButtonText}>Unlock All for $29/month</Text>
            </TouchableOpacity>
          </View>
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
  caseList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  caseCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  caseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  caseCardLeft: {
    flex: 1,
  },
  cardCompany: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardProblem: {
    fontSize: 16,
    color: COLORS.info,
    fontWeight: '500',
  },
  premiumBadge: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  premiumBadgeText: {
    color: COLORS.bg,
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardSummary: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  cardCategory: {
    fontSize: 13,
    color: COLORS.purple,
    backgroundColor: COLORS.purple + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardReadTime: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  cardImpact: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '600',
  },
  cardTechStack: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  techPreview: {
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
  caseHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  companyName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  problemTitle: {
    fontSize: 20,
    color: COLORS.info,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  impactBadge: {
    backgroundColor: COLORS.success + '20',
  },
  impactText: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '600',
  },
  sectionTabs: {
    paddingHorizontal: 20,
    marginBottom: 16,
    flexGrow: 0,
  },
  sectionTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTabActive: {
    backgroundColor: COLORS.info + '20',
    borderColor: COLORS.info,
  },
  sectionTabText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  sectionTabTextActive: {
    color: COLORS.info,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionContent: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  techContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  techTag: {
    backgroundColor: COLORS.info + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.info + '40',
  },
  techText: {
    color: COLORS.info,
    fontSize: 14,
    fontWeight: '500',
  },
  questionCard: {
    backgroundColor: COLORS.surfaceLight,
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  questionText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  topicTag: {
    backgroundColor: COLORS.purple + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.purple + '40',
  },
  topicText: {
    color: COLORS.purple,
    fontSize: 14,
    fontWeight: '500',
  },
  premiumLockContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  lockIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gold,
    marginBottom: 16,
  },
  premiumCompany: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  premiumProblem: {
    fontSize: 18,
    color: COLORS.info,
    marginBottom: 24,
    textAlign: 'center',
  },
  premiumFeatures: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  featureItem: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 24,
  },
  upgradeButton: {
    backgroundColor: COLORS.gold,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 12,
  },
  upgradeButtonText: {
    color: COLORS.bg,
    fontSize: 18,
    fontWeight: 'bold',
  },
  premiumSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  promotionCard: {
    backgroundColor: COLORS.gold + '10',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
  },
  promotionIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  promotionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  promotionText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  promoButton: {
    backgroundColor: COLORS.gold,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  promoButtonText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

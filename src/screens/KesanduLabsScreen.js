import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView,
  Dimensions, ActivityIndicator
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

const LAB_EXPERIMENTS = [
  {
    id: 'kafka-chaos',
    title: 'Break & Fix: Kafka Cluster',
    difficulty: 'Advanced',
    duration: '45 min',
    category: 'Distributed Systems',
    icon: '🔥',
    description: 'Spin up a simulated Kafka cluster, break it in creative ways, and learn to fix it',
    whatYouLearn: [
      'How Kafka handles broker failures',
      'Partition rebalancing mechanics',
      'ISR (In-Sync Replicas) behavior',
      'Leader election process'
    ],
    experiments: [
      {
        name: 'Kill a Broker',
        scenario: 'Broker 2 crashes while processing 10K msg/sec',
        whatHappens: 'Leader election triggered, ISR shrinks, rebalancing starts',
        recovery: 'Auto-recovery in 30s, manual intervention options'
      },
      {
        name: 'Network Partition',
        scenario: 'Broker 1 isolated from rest of cluster',
        whatHappens: 'Split-brain risk, clients retry, data duplication possible',
        recovery: 'Partition heals, reconciliation via ISR'
      },
      {
        name: 'Disk Full',
        scenario: 'Broker runs out of disk space',
        whatHappens: 'Writes fail, broker goes offline, data loss risk',
        recovery: 'Clean old segments, increase retention, add storage'
      }
    ],
    metrics: {
      throughput: '100K msg/sec',
      brokers: '5',
      partitions: '50',
      replication: '3x'
    }
  },
  {
    id: 'spark-skew',
    title: 'Data Skew in Spark',
    difficulty: 'Advanced',
    duration: '30 min',
    category: 'Big Data',
    icon: '⚡',
    description: 'Deploy a Spark job on 100 simulated nodes and watch it struggle with skewed data',
    whatYouLearn: [
      'Why data skew kills performance',
      'How Spark distributes work',
      'Salting technique for skew',
      'Adaptive query execution'
    ],
    experiments: [
      {
        name: 'Introduce Skew',
        scenario: '80% of data goes to 1 partition',
        whatHappens: '1 task takes 10x longer, 99 nodes idle',
        recovery: 'Apply salting, repartition with better key'
      },
      {
        name: 'Memory Pressure',
        scenario: 'Shuffle spills to disk',
        whatHappens: 'Performance degrades 100x, tasks fail',
        recovery: 'Increase executor memory, reduce partition size'
      },
      {
        name: 'GC Thrashing',
        scenario: 'Too many small objects',
        whatHappens: 'JVM spends 90% time in GC',
        recovery: 'Tune GC, use off-heap memory, optimize data structures'
      }
    ],
    metrics: {
      nodes: '100',
      data: '10TB',
      partitions: '1000',
      executors: '200'
    }
  },
  {
    id: 'db-corruption',
    title: 'Database Disaster Recovery',
    difficulty: 'Expert',
    duration: '60 min',
    category: 'Databases',
    icon: '💀',
    description: 'Corrupt a database and practice recovery procedures under pressure',
    whatYouLearn: [
      'Point-in-time recovery (PITR)',
      'Write-ahead log mechanics',
      'Backup strategies',
      'Data loss calculation'
    ],
    experiments: [
      {
        name: 'Corrupt Index',
        scenario: 'B-tree index corruption on primary key',
        whatHappens: 'Queries return wrong results, integrity violated',
        recovery: 'Rebuild index from table, validate with CHECK'
      },
      {
        name: 'Delete Production Data',
        scenario: 'DELETE FROM users WHERE true; (oops)',
        whatHappens: '10M users gone, app breaks, CEO calls',
        recovery: 'Restore from backup, replay WAL to 5 min before deletion'
      },
      {
        name: 'Disk Failure',
        scenario: 'Primary disk fails, replica is stale',
        whatHappens: 'Last 2 hours of data missing',
        recovery: 'Promote replica, calculate acceptable data loss'
      }
    ],
    metrics: {
      rows: '100M',
      size: '500GB',
      transactions: '10K/sec',
      rpo: '5 min'
    }
  },
  {
    id: 'cap-theorem',
    title: 'CAP Theorem in Action',
    difficulty: 'Advanced',
    duration: '40 min',
    category: 'Distributed Systems',
    icon: '🔺',
    description: 'Simulate network partition and viscerally understand why you can\'t have all three',
    whatYouLearn: [
      'Consistency vs Availability trade-off',
      'Partition tolerance reality',
      'AP systems (Cassandra, DynamoDB)',
      'CP systems (etcd, ZooKeeper)'
    ],
    experiments: [
      {
        name: 'Partition AP System',
        scenario: 'Split Cassandra cluster in half',
        whatHappens: 'Both sides accept writes, eventual consistency',
        recovery: 'Partition heals, read repairs, hinted handoff'
      },
      {
        name: 'Partition CP System',
        scenario: 'Split etcd cluster (3 nodes → 2 + 1)',
        whatHappens: 'Majority side (2) stays available, minority (1) rejects writes',
        recovery: 'Partition heals, minority catches up via log replication'
      },
      {
        name: 'Network Slowdown',
        scenario: 'Latency increases from 1ms to 1s',
        whatHappens: 'Timeouts, retries, cascading failures',
        recovery: 'Circuit breakers, backpressure, degraded mode'
      }
    ],
    metrics: {
      nodes: '7',
      latency: 'varies',
      partitions: 'network',
      consistency: 'configurable'
    }
  },
  {
    id: 'scale-bottleneck',
    title: 'Scale from 100 to 100M Users',
    difficulty: 'Expert',
    duration: '90 min',
    category: 'System Design',
    icon: '📈',
    description: 'Watch bottlenecks appear in real-time as you scale. Fix iteratively.',
    whatYouLearn: [
      'Where systems break first',
      'Horizontal vs vertical scaling',
      'Caching strategies',
      'Database sharding'
    ],
    experiments: [
      {
        name: 'Database Bottleneck (100K users)',
        scenario: 'Single Postgres DB hits 100% CPU',
        whatHappens: 'Query latency spikes, timeouts, app crashes',
        recovery: 'Add read replicas, implement connection pooling'
      },
      {
        name: 'Cache Stampede (1M users)',
        scenario: 'Cache expires, all requests hit DB',
        whatHappens: 'DB overload, cascading failure',
        recovery: 'Implement cache warming, probabilistic early expiration'
      },
      {
        name: 'Hot Shard (10M users)',
        scenario: 'Celebrity user causes shard overload',
        whatHappens: 'One shard at 100% while others idle',
        recovery: 'Consistent hashing with virtual nodes, dedicated celebrity shard'
      },
      {
        name: 'Global Latency (100M users)',
        scenario: 'Users in Asia see 500ms latency',
        whatHappens: 'Poor UX, user churn',
        recovery: 'Multi-region deployment, CDN, edge caching'
      }
    ],
    metrics: {
      users: '100 → 100M',
      servers: '1 → 1000+',
      databases: '1 → 50 shards',
      regions: '1 → 5'
    }
  }
];

export default function KesanduLabsScreen() {
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [experimentResults, setExperimentResults] = useState([]);

  const handleRunExperiment = (experiment) => {
    setIsRunning(true);

    // Simulate running experiment
    setTimeout(() => {
      const result = {
        experiment: experiment.name,
        status: 'failed',
        details: experiment.whatHappens,
        recovery: experiment.recovery
      };
      setExperimentResults([...experimentResults, result]);
      setIsRunning(false);
    }, 2000);
  };

  const handleFixIssue = (experiment) => {
    setIsRunning(true);

    setTimeout(() => {
      const result = {
        experiment: experiment.name,
        status: 'fixed',
        details: experiment.recovery,
        recovery: 'System restored successfully'
      };
      setExperimentResults([...experimentResults, result]);
      setIsRunning(false);
    }, 1500);
  };

  if (selectedExperiment) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setSelectedExperiment(null);
              setCurrentStep(0);
              setExperimentResults([]);
            }}
          >
            <Text style={styles.backButtonText}>← Back to Labs</Text>
          </TouchableOpacity>

          <View style={styles.experimentHeader}>
            <Text style={styles.experimentIcon}>{selectedExperiment.icon}</Text>
            <Text style={styles.experimentTitle}>{selectedExperiment.title}</Text>
            <View style={styles.experimentMeta}>
              <Text style={styles.metaText}>{selectedExperiment.category}</Text>
              <Text style={styles.metaText}>•</Text>
              <Text style={styles.metaText}>{selectedExperiment.duration}</Text>
            </View>
          </View>

          {/* Metrics Dashboard */}
          <View style={styles.metricsCard}>
            <Text style={styles.metricsTitle}>Current System Metrics</Text>
            <View style={styles.metricsGrid}>
              {Object.entries(selectedExperiment.metrics).map(([key, value]) => (
                <View key={key} style={styles.metricItem}>
                  <Text style={styles.metricValue}>{value}</Text>
                  <Text style={styles.metricLabel}>{key}</Text>
                </View>
              ))}
            </View>
          </View>

          <ScrollView style={styles.experimentContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Run Experiments</Text>

            {selectedExperiment.experiments.map((exp, index) => (
              <View key={index} style={styles.experimentCard}>
                <View style={styles.expCardHeader}>
                  <Text style={styles.expCardTitle}>{exp.name}</Text>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>Step {index + 1}</Text>
                  </View>
                </View>

                <View style={styles.expSection}>
                  <Text style={styles.expLabel}>Scenario:</Text>
                  <Text style={styles.expText}>{exp.scenario}</Text>
                </View>

                <View style={styles.expSection}>
                  <Text style={styles.expLabel}>What Happens:</Text>
                  <Text style={styles.expText}>{exp.whatHappens}</Text>
                </View>

                <View style={styles.expSection}>
                  <Text style={styles.expLabel}>Recovery:</Text>
                  <Text style={styles.expText}>{exp.recovery}</Text>
                </View>

                <View style={styles.expActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.breakButton]}
                    onPress={() => handleRunExperiment(exp)}
                    disabled={isRunning}
                  >
                    {isRunning ? (
                      <ActivityIndicator color={COLORS.text} size="small" />
                    ) : (
                      <Text style={styles.actionButtonText}>🔥 Break It</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.fixButton]}
                    onPress={() => handleFixIssue(exp)}
                    disabled={isRunning}
                  >
                    {isRunning ? (
                      <ActivityIndicator color={COLORS.text} size="small" />
                    ) : (
                      <Text style={styles.actionButtonText}>🔧 Fix It</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Results Log */}
            {experimentResults.length > 0 && (
              <View style={styles.resultsSection}>
                <Text style={styles.sectionTitle}>Experiment Log</Text>
                {experimentResults.map((result, index) => (
                  <View
                    key={index}
                    style={[
                      styles.resultCard,
                      result.status === 'failed' ? styles.resultFailed : styles.resultFixed
                    ]}
                  >
                    <View style={styles.resultHeader}>
                      <Text style={styles.resultStatus}>
                        {result.status === 'failed' ? '❌' : '✅'} {result.experiment}
                      </Text>
                      <Text style={styles.resultTime}>Just now</Text>
                    </View>
                    <Text style={styles.resultDetails}>{result.details}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* What You Learn */}
            <View style={styles.learningSection}>
              <Text style={styles.sectionTitle}>What You'll Learn</Text>
              {selectedExperiment.whatYouLearn.map((item, index) => (
                <View key={index} style={styles.learningItem}>
                  <Text style={styles.learningBullet}>💡</Text>
                  <Text style={styles.learningText}>{item}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>🧪 Kesandu Labs</Text>
          <Text style={styles.subtitle}>R&D Playground - Break things, learn deeply</Text>
        </View>

        <View style={styles.philosophyCard}>
          <Text style={styles.philosophyIcon}>🔬</Text>
          <Text style={styles.philosophyTitle}>"What If?" Sandbox</Text>
          <Text style={styles.philosophyText}>
            NO CONSEQUENCES. PURE EXPERIMENTATION.{'\n\n'}
            This is how deep intuition is built.{'\n\n'}
            Break → Fix → Learn → Repeat
          </Text>
        </View>

        <View style={styles.experimentsSection}>
          <Text style={styles.sectionTitle}>Available Experiments</Text>

          {LAB_EXPERIMENTS.map(experiment => (
            <TouchableOpacity
              key={experiment.id}
              style={styles.experimentCard}
              onPress={() => setSelectedExperiment(experiment)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>{experiment.icon}</Text>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{experiment.title}</Text>
                  <Text style={styles.cardCategory}>{experiment.category}</Text>
                </View>
              </View>

              <Text style={styles.cardDescription}>{experiment.description}</Text>

              <View style={styles.cardMeta}>
                <View style={[
                  styles.difficultyBadge,
                  experiment.difficulty === 'Advanced' && styles.difficultyAdvanced,
                  experiment.difficulty === 'Expert' && styles.difficultyExpert
                ]}>
                  <Text style={styles.difficultyText}>{experiment.difficulty}</Text>
                </View>
                <Text style={styles.durationText}>⏱️ {experiment.duration}</Text>
              </View>

              <View style={styles.cardMetrics}>
                <Text style={styles.cardMetricsTitle}>System Scale:</Text>
                <View style={styles.metricsPreview}>
                  {Object.entries(experiment.metrics).slice(0, 3).map(([key, value], index) => (
                    <Text key={index} style={styles.metricPreview}>
                      {key}: {value}
                    </Text>
                  ))}
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.cardFooterText}>
                  {experiment.experiments.length} experiments • {experiment.whatYouLearn.length} concepts
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.whySection}>
          <Text style={styles.whySectionTitle}>Why Kesandu Labs?</Text>

          <View style={styles.whyCard}>
            <Text style={styles.whyIcon}>🧠</Text>
            <Text style={styles.whyTitle}>Build Deep Intuition</Text>
            <Text style={styles.whyText}>
              Reading about CAP theorem ≠ watching it happen in real-time
            </Text>
          </View>

          <View style={styles.whyCard}>
            <Text style={styles.whyIcon}>🔥</Text>
            <Text style={styles.whyTitle}>Safe to Break Things</Text>
            <Text style={styles.whyText}>
              No prod incidents. No angry PagerDuty. Just pure learning.
            </Text>
          </View>

          <View style={styles.whyCard}>
            <Text style={styles.whyIcon}>⚡</Text>
            <Text style={styles.whyTitle}>Learn by Doing</Text>
            <Text style={styles.whyText}>
              Not "How does Kafka work?" but "What happens when I kill this broker?"
            </Text>
          </View>

          <View style={styles.whyCard}>
            <Text style={styles.whyIcon}>🎯</Text>
            <Text style={styles.whyTitle}>Interview-Ready</Text>
            <Text style={styles.whyText}>
              "Tell me about a time you debugged a production issue" → You have 5 stories
            </Text>
          </View>
        </View>
      </ScrollView>
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
  philosophyCard: {
    backgroundColor: COLORS.purple + '10',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.purple,
    alignItems: 'center',
  },
  philosophyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  philosophyTitle: {
    fontSize: 22,
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
  experimentsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  experimentCard: {
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
  difficultyAdvanced: {
    backgroundColor: COLORS.warning + '20',
  },
  difficultyExpert: {
    backgroundColor: COLORS.danger + '20',
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
  cardMetrics: {
    backgroundColor: COLORS.surfaceLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  cardMetricsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  metricsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricPreview: {
    fontSize: 12,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
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
  experimentHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  experimentIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  experimentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  experimentMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  metricsCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricItem: {
    backgroundColor: COLORS.surfaceLight,
    padding: 12,
    borderRadius: 8,
    minWidth: (width - 76) / 3,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.success,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  experimentContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  expCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  stepBadge: {
    backgroundColor: COLORS.info + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stepBadgeText: {
    fontSize: 12,
    color: COLORS.info,
    fontWeight: '600',
  },
  expSection: {
    marginBottom: 12,
  },
  expLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  expText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  expActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
  },
  breakButton: {
    backgroundColor: COLORS.danger + '20',
    borderColor: COLORS.danger,
  },
  fixButton: {
    backgroundColor: COLORS.success + '20',
    borderColor: COLORS.success,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  resultsSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  resultCard: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  resultFailed: {
    backgroundColor: COLORS.danger + '10',
    borderLeftColor: COLORS.danger,
  },
  resultFixed: {
    backgroundColor: COLORS.success + '10',
    borderLeftColor: COLORS.success,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultStatus: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  resultTime: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  resultDetails: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  learningSection: {
    marginBottom: 30,
  },
  learningItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  learningBullet: {
    fontSize: 18,
    marginRight: 10,
  },
  learningText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  whySection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  whySectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  whyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  whyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  whyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 6,
  },
  whyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

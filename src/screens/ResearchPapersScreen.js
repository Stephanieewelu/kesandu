import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView,
  Dimensions
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

const RESEARCH_PAPERS = [
  {
    id: 'attention-is-all-you-need',
    title: 'Attention Is All You Need',
    authors: 'Vaswani et al., 2017',
    category: 'Machine Learning',
    difficulty: 'Advanced',
    icon: '🤖',
    citation: '60,000+',
    summary: 'The paper that introduced Transformers and changed AI forever',
    sections: [
      {
        title: 'Abstract',
        questions: [
          'Why did they move away from RNNs?',
          'What problem does self-attention solve?',
          'What are the key advantages claimed?'
        ]
      },
      {
        title: 'Multi-Head Attention',
        questions: [
          'Why multiple attention heads instead of one?',
          'How do different heads learn different patterns?',
          'What is the computational complexity?'
        ]
      },
      {
        title: 'Positional Encoding',
        questions: [
          'Why do Transformers need positional encoding?',
          'Why sinusoidal functions specifically?',
          'What happens without positional encoding?'
        ]
      }
    ],
    exercises: [
      'Reproduce the key experiment (WMT 2014 En-De translation)',
      'Implement a mini-Transformer from scratch',
      'Explain this paper to a non-expert in 2 minutes'
    ],
    flaws: [
      'Quadratic complexity with sequence length',
      'No inherent notion of word order',
      'Requires large amounts of data'
    ],
    realWorld: 'GPT, BERT, T5, Claude - all based on this architecture'
  },
  {
    id: 'data-warehouse-toolkit',
    title: 'The Data Warehouse Toolkit',
    authors: 'Ralph Kimball, 1996',
    category: 'Data Engineering',
    difficulty: 'Medium',
    icon: '🏢',
    citation: 'Industry Standard',
    summary: 'The definitive guide to dimensional modeling and data warehousing',
    sections: [
      {
        title: 'Star Schema',
        questions: [
          'Why denormalize when we spent years learning normalization?',
          'What makes star schema query-friendly?',
          'When does star schema NOT work well?'
        ]
      },
      {
        title: 'Slowly Changing Dimensions',
        questions: [
          'Why are there 3 types of SCDs?',
          'When would you use Type 2 vs Type 3?',
          'What are the storage/performance trade-offs?'
        ]
      },
      {
        title: 'Fact Tables',
        questions: [
          'What makes a good fact vs dimension?',
          'Why store both quantities and amounts?',
          'How do you handle late-arriving facts?'
        ]
      }
    ],
    exercises: [
      'Design a star schema for an e-commerce business',
      'Model a slowly changing dimension (customer address)',
      'Present your design to simulated stakeholders'
    ],
    flaws: [
      'Can lead to data duplication',
      'Not ideal for real-time analytics',
      'Assumes relatively stable business rules'
    ],
    realWorld: 'Snowflake, BigQuery, Redshift - all optimized for this model'
  },
  {
    id: 'designing-data-intensive-apps',
    title: 'Designing Data-Intensive Applications',
    authors: 'Martin Kleppmann, 2017',
    category: 'Systems Design',
    difficulty: 'Expert',
    icon: '📚',
    citation: 'Essential Reading',
    summary: 'The bible of distributed systems and data engineering',
    sections: [
      {
        title: 'Replication',
        questions: [
          'Leader-based vs leaderless - when does each make sense?',
          'What is the fundamental trade-off in replication?',
          'How do you handle conflicts in multi-leader replication?'
        ]
      },
      {
        title: 'Partitioning',
        questions: [
          'Why partition data at all?',
          'Hash partitioning vs range partitioning - trade-offs?',
          'How do you handle hot spots?'
        ]
      },
      {
        title: 'Consistency Models',
        questions: [
          'What does "eventual consistency" actually mean?',
          'Why can\'t we have strong consistency everywhere?',
          'How does linearizability differ from serializability?'
        ]
      }
    ],
    exercises: [
      'Draw architecture for each distributed pattern',
      'Connect concepts to your project experience',
      'Identify which chapter changed how you think about systems'
    ],
    flaws: [
      'Dense - requires multiple readings',
      'More theory than implementation details',
      'Some sections are outdated (book from 2017)'
    ],
    realWorld: 'Every senior engineer interview references this book'
  },
  {
    id: 'mapreduce-paper',
    title: 'MapReduce: Simplified Data Processing',
    authors: 'Dean & Ghemawat, Google 2004',
    category: 'Distributed Systems',
    difficulty: 'Medium',
    icon: '🗺️',
    citation: '10,000+',
    summary: 'The paper that launched big data as we know it',
    sections: [
      {
        title: 'Programming Model',
        questions: [
          'Why only Map and Reduce? Why not more operations?',
          'What problems fit this model well?',
          'What problems don\'t fit well?'
        ]
      },
      {
        title: 'Fault Tolerance',
        questions: [
          'How does MapReduce handle worker failures?',
          'Why is idempotency important?',
          'What happens if the master fails?'
        ]
      },
      {
        title: 'Locality',
        questions: [
          'Why is data locality so important?',
          'How does GFS enable MapReduce?',
          'What network bottlenecks exist?'
        ]
      }
    ],
    exercises: [
      'Implement word count in MapReduce',
      'Design a MapReduce job for log analysis',
      'Explain why MapReduce lost to Spark'
    ],
    flaws: [
      'High latency - batch only',
      'No support for iterative algorithms',
      'Awkward programming model for many tasks'
    ],
    realWorld: 'Inspired Hadoop, Spark, and modern data processing'
  },
  {
    id: 'bigtable-paper',
    title: 'Bigtable: A Distributed Storage System',
    authors: 'Chang et al., Google 2006',
    category: 'Databases',
    difficulty: 'Expert',
    icon: '📊',
    citation: '8,000+',
    summary: 'Google\'s NoSQL database that inspired HBase, Cassandra, and more',
    sections: [
      {
        title: 'Data Model',
        questions: [
          'Why (row, column, timestamp) instead of traditional table?',
          'What are column families and why do they matter?',
          'How does this enable schema flexibility?'
        ]
      },
      {
        title: 'Tablet Structure',
        questions: [
          'Why split data into tablets?',
          'How does SSTable format work?',
          'What are the write and read paths?'
        ]
      },
      {
        title: 'Compaction',
        questions: [
          'Why multiple levels of compaction?',
          'How does this affect read vs write performance?',
          'When does compaction become a bottleneck?'
        ]
      }
    ],
    exercises: [
      'Design a schema for time-series data in Bigtable',
      'Trace a read request through the architecture',
      'Compare to traditional RDBMS trade-offs'
    ],
    flaws: [
      'No cross-row transactions (originally)',
      'Complex operational overhead',
      'Requires GFS/Colossus infrastructure'
    ],
    realWorld: 'Powers Gmail, Google Analytics, Google Maps'
  }
];

export default function ResearchPapersScreen() {
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);

  if (selectedPaper) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedPaper(null)}
          >
            <Text style={styles.backButtonText}>← Back to Papers</Text>
          </TouchableOpacity>

          <View style={styles.paperHeader}>
            <Text style={styles.paperIcon}>{selectedPaper.icon}</Text>
            <Text style={styles.paperTitle}>{selectedPaper.title}</Text>
            <Text style={styles.paperAuthors}>{selectedPaper.authors}</Text>
            <View style={styles.paperMeta}>
              <Text style={styles.metaText}>{selectedPaper.category}</Text>
              <Text style={styles.metaText}>•</Text>
              <Text style={styles.metaText}>📚 {selectedPaper.citation} citations</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>{selectedPaper.summary}</Text>
          </View>

          {/* Sections with Socratic Questions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🤔 Socratic Walkthrough</Text>
            <Text style={styles.sectionSubtitle}>Deep dive section by section</Text>

            {selectedPaper.sections.map((section, index) => (
              <View key={index} style={styles.sectionCard}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => setExpandedSection(expandedSection === index ? null : index)}
                >
                  <Text style={styles.sectionCardTitle}>{section.title}</Text>
                  <Text style={styles.expandIcon}>
                    {expandedSection === index ? '▼' : '▶'}
                  </Text>
                </TouchableOpacity>

                {expandedSection === index && (
                  <View style={styles.questionsContainer}>
                    {section.questions.map((question, qIndex) => (
                      <View key={qIndex} style={styles.questionCard}>
                        <Text style={styles.questionIcon}>❓</Text>
                        <Text style={styles.questionText}>{question}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Exercises */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✍️ Exercises</Text>
            {selectedPaper.exercises.map((exercise, index) => (
              <View key={index} style={styles.exerciseCard}>
                <Text style={styles.exerciseBullet}>{index + 1}.</Text>
                <Text style={styles.exerciseText}>{exercise}</Text>
              </View>
            ))}
          </View>

          {/* Methodology Flaws */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔍 Limitations & Critiques</Text>
            <Text style={styles.sectionSubtitle}>No paper is perfect - think critically</Text>
            {selectedPaper.flaws.map((flaw, index) => (
              <View key={index} style={styles.flawCard}>
                <Text style={styles.flawBullet}>⚠️</Text>
                <Text style={styles.flawText}>{flaw}</Text>
              </View>
            ))}
          </View>

          {/* Real-World Connection */}
          <View style={styles.realWorldCard}>
            <Text style={styles.realWorldTitle}>🌍 Real-World Impact</Text>
            <Text style={styles.realWorldText}>{selectedPaper.realWorld}</Text>
          </View>

          <TouchableOpacity style={styles.discussButton}>
            <Text style={styles.discussButtonText}>💬 Join Discussion Thread</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>📄 Research Papers</Text>
          <Text style={styles.subtitle}>Read like a PhD, think like an engineer</Text>
        </View>

        <View style={styles.philosophyCard}>
          <Text style={styles.philosophyIcon}>🎓</Text>
          <Text style={styles.philosophyTitle}>Why Read Papers?</Text>
          <Text style={styles.philosophyText}>
            Papers aren't just for academics.{'\n\n'}
            Every major system you use (Transformers, MapReduce, Kafka) came from a paper.{'\n\n'}
            Learn to read them, critique them, apply them.
          </Text>
        </View>

        <View style={styles.papersSection}>
          <Text style={styles.sectionHeaderTitle}>Landmark Papers</Text>

          {RESEARCH_PAPERS.map(paper => (
            <TouchableOpacity
              key={paper.id}
              style={styles.paperCard}
              onPress={() => setSelectedPaper(paper)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>{paper.icon}</Text>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{paper.title}</Text>
                  <Text style={styles.cardAuthors}>{paper.authors}</Text>
                  <Text style={styles.cardCategory}>{paper.category}</Text>
                </View>
              </View>

              <Text style={styles.cardSummary}>{paper.summary}</Text>

              <View style={styles.cardMeta}>
                <View style={[
                  styles.difficultyBadge,
                  paper.difficulty === 'Medium' && styles.difficultyMedium,
                  paper.difficulty === 'Advanced' && styles.difficultyAdvanced,
                  paper.difficulty === 'Expert' && styles.difficultyExpert
                ]}>
                  <Text style={styles.difficultyText}>{paper.difficulty}</Text>
                </View>
                <Text style={styles.citationText}>📚 {paper.citation}</Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.cardFooterText}>
                  {paper.sections.length} sections • {paper.exercises.length} exercises
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.skillsSection}>
          <Text style={styles.skillsTitle}>📚 Paper Reading Skills You'll Learn</Text>

          <View style={styles.skillCard}>
            <Text style={styles.skillIcon}>🔍</Text>
            <Text style={styles.skillTitle}>Read Abstracts Efficiently</Text>
            <Text style={styles.skillText}>Extract key insights in 2 minutes</Text>
          </View>

          <View style={styles.skillCard}>
            <Text style={styles.skillIcon}>⚠️</Text>
            <Text style={styles.skillTitle}>Spot Methodology Flaws</Text>
            <Text style={styles.skillText}>Critical thinking about claims</Text>
          </View>

          <View style={styles.skillCard}>
            <Text style={styles.skillIcon}>📊</Text>
            <Text style={styles.skillTitle}>Understand Statistical Claims</Text>
            <Text style={styles.skillText}>What do these numbers really mean?</Text>
          </View>

          <View style={styles.skillCard}>
            <Text style={styles.skillIcon}>🏢</Text>
            <Text style={styles.skillTitle}>Connect to Practical Work</Text>
            <Text style={styles.skillText}>Should you implement this at your company?</Text>
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
    backgroundColor: COLORS.info + '10',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.info,
    alignItems: 'center',
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
  papersSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  paperCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardAuthors: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  cardCategory: {
    fontSize: 13,
    color: COLORS.purple,
  },
  cardSummary: {
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
  difficultyAdvanced: {
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
  citationText: {
    fontSize: 13,
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
  paperHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  paperIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  paperTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  paperAuthors: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  paperMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  summaryCard: {
    backgroundColor: COLORS.info + '10',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  summaryText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  sectionCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  expandIcon: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  questionsContainer: {
    padding: 16,
    paddingTop: 0,
    gap: 10,
  },
  questionCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceLight,
    padding: 12,
    borderRadius: 8,
  },
  questionIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  questionText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  exerciseCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.success + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  exerciseBullet: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.success,
    marginRight: 10,
  },
  exerciseText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  flawCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.warning + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  flawBullet: {
    fontSize: 18,
    marginRight: 10,
  },
  flawText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  realWorldCard: {
    backgroundColor: COLORS.gold + '10',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  realWorldTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gold,
    marginBottom: 8,
  },
  realWorldText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  discussButton: {
    backgroundColor: COLORS.purple,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 30,
    alignItems: 'center',
  },
  discussButtonText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  skillsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  skillsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  skillCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skillIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  skillTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  skillText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

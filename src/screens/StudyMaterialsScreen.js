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

const STUDY_MATERIALS = {
  lessons: [
    {
      id: 1,
      title: 'How LLMs Work',
      completed: true,
      materials: {
        conceptSummary: {
          keyPoints: [
            'LLMs predict the next word based on statistical patterns, not knowledge',
            'They use transformer architecture with attention mechanisms',
            'Training requires massive datasets and compute',
            'Temperature controls randomness in generation'
          ],
          yourAnalogies: [
            'Like autocomplete on steroids',
            'A very sophisticated pattern matcher',
            'Think of it as a probability calculator for words'
          ],
          struggledWith: [
            'Understanding why they hallucinate',
            'The difference between memorization and prediction'
          ],
          connections: [
            'Related to: Attention Mechanisms, Transformers, Neural Networks',
            'Prerequisites: Basic probability, neural network fundamentals',
            'Applies to: ChatGPT, Claude, GPT-4, all modern LLMs'
          ],
          gotchas: [
            'They don\'t "know" anything - they predict based on patterns',
            'Bigger model ≠ always better (diminishing returns)',
            'Training data cutoff means they can be outdated'
          ]
        },
        flashcards: [
          {
            id: 'fc1',
            front: 'What guarantees exactly-once delivery in Kafka?',
            back: 'Idempotent producers + transactional APIs. Producers get unique PID, broker deduplicates, transactions ensure atomicity across partitions.',
            yourExplanation: 'Kafka uses producer IDs and sequence numbers to prevent duplicates',
            difficulty: 'medium',
            nextReview: '2 days',
            timesReviewed: 3,
            lastResult: 'correct'
          },
          {
            id: 'fc2',
            front: 'How do transformers "attend" to relevant tokens?',
            back: 'Self-attention computes Query, Key, Value matrices. Attention score = softmax(QK^T/√d_k), then weighted sum of Values. This lets each token look at all other tokens.',
            yourExplanation: 'Each word looks at every other word and decides which ones are important',
            difficulty: 'hard',
            nextReview: '1 day',
            timesReviewed: 1,
            lastResult: 'struggled'
          },
          {
            id: 'fc3',
            front: 'Why use embeddings instead of one-hot encoding?',
            back: 'Embeddings capture semantic similarity in dense vectors (300d vs 100,000d). Similar words have similar vectors. Enables transfer learning.',
            yourExplanation: 'Compresses words into meaningful numbers that capture relationships',
            difficulty: 'easy',
            nextReview: '7 days',
            timesReviewed: 5,
            lastResult: 'correct'
          }
        ],
        mindMap: {
          centralTopic: 'LLMs',
          branches: [
            {
              name: 'Architecture',
              subtopics: ['Transformers', 'Attention', 'Embeddings', 'Layers']
            },
            {
              name: 'Training',
              subtopics: ['Pre-training', 'Fine-tuning', 'RLHF', 'Datasets']
            },
            {
              name: 'Inference',
              subtopics: ['Sampling', 'Temperature', 'Top-p', 'Beam Search']
            },
            {
              name: 'Limitations',
              subtopics: ['Hallucinations', 'Context Window', 'Bias', 'Compute Cost']
            }
          ]
        },
        cheatSheet: {
          title: 'LLM Quick Reference',
          sections: [
            {
              category: 'Key Concepts',
              items: [
                { term: 'Token', definition: 'Sub-word unit (avg 4 chars). "Hello" = 1 token, "ChatGPT" = 2' },
                { term: 'Context Window', definition: 'Max tokens model can process (GPT-4: 8k-128k)' },
                { term: 'Temperature', definition: '0 = deterministic, 1 = creative, 2 = chaotic' }
              ]
            },
            {
              category: 'Common APIs',
              items: [
                {
                  term: 'OpenAI Completion',
                  definition: `response = openai.Completion.create(
  model="gpt-4",
  prompt="Explain LLMs",
  max_tokens=100,
  temperature=0.7
)`
                },
                {
                  term: 'Anthropic Messages',
                  definition: `message = client.messages.create(
  model="claude-3-sonnet",
  max_tokens=1024,
  messages=[{"role": "user", "content": "Hello"}]
)`
                }
              ]
            },
            {
              category: 'Troubleshooting',
              items: [
                { term: 'Hallucination?', definition: 'Add "Only use provided context" to prompt' },
                { term: 'Too Random?', definition: 'Lower temperature to 0.3-0.5' },
                { term: 'Context Too Long?', definition: 'Summarize or use RAG to retrieve relevant chunks' }
              ]
            }
          ]
        }
      }
    },
    {
      id: 2,
      title: 'System Design Fundamentals',
      completed: true,
      materials: {
        conceptSummary: {
          keyPoints: [
            'Start with requirements: functional, non-functional, scale',
            'Trade-offs: CAP theorem, consistency vs availability',
            'Key patterns: Load balancing, caching, sharding',
            'Always discuss bottlenecks and failure modes'
          ],
          yourAnalogies: [
            'Like designing a city\'s infrastructure',
            'Building blocks that connect together'
          ],
          struggledWith: [
            'When to denormalize databases',
            'Choosing between SQL and NoSQL'
          ],
          connections: [
            'Related to: Distributed Systems, Databases, Caching',
            'Prerequisites: Basic networking, database concepts'
          ],
          gotchas: [
            'Don\'t optimize prematurely - start simple',
            'Single point of failure is often the database',
            'Network calls are slow - batch when possible'
          ]
        },
        flashcards: [
          {
            id: 'fc4',
            front: 'What is the CAP theorem?',
            back: 'Consistency, Availability, Partition tolerance - pick 2. In practice, partition tolerance is required, so choose CP (consistent) or AP (available).',
            yourExplanation: 'You can\'t have perfect consistency and availability when network fails',
            difficulty: 'medium',
            nextReview: '3 days',
            timesReviewed: 2,
            lastResult: 'correct'
          }
        ],
        mindMap: {
          centralTopic: 'System Design',
          branches: [
            {
              name: 'Components',
              subtopics: ['Load Balancer', 'Cache', 'Database', 'Queue', 'CDN']
            },
            {
              name: 'Patterns',
              subtopics: ['Sharding', 'Replication', 'Partitioning', 'Federation']
            },
            {
              name: 'Trade-offs',
              subtopics: ['CAP Theorem', 'Latency vs Throughput', 'Consistency Models']
            }
          ]
        },
        cheatSheet: {
          title: 'System Design Cheat Sheet',
          sections: [
            {
              category: 'Numbers to Know',
              items: [
                { term: 'L1 cache', definition: '0.5 ns' },
                { term: 'RAM read', definition: '100 ns' },
                { term: 'SSD read', definition: '16 μs' },
                { term: 'Network round trip', definition: '500 μs (same DC)' },
                { term: 'Disk seek', definition: '10 ms' }
              ]
            }
          ]
        }
      }
    }
  ]
};

export default function StudyMaterialsScreen() {
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [flippedCards, setFlippedCards] = useState({});

  const handleFlipCard = (cardId) => {
    setFlippedCards({
      ...flippedCards,
      [cardId]: !flippedCards[cardId]
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return COLORS.success;
      case 'medium': return COLORS.warning;
      case 'hard': return COLORS.danger;
      default: return COLORS.info;
    }
  };

  if (selectedLesson) {
    const materials = selectedLesson.materials;

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedLesson(null)}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.lessonTitle}>{selectedLesson.title}</Text>

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsContainer}
          >
            <TouchableOpacity
              style={[styles.tab, activeTab === 'summary' && styles.tabActive]}
              onPress={() => setActiveTab('summary')}
            >
              <Text style={[styles.tabText, activeTab === 'summary' && styles.tabTextActive]}>
                📝 Summary
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'flashcards' && styles.tabActive]}
              onPress={() => setActiveTab('flashcards')}
            >
              <Text style={[styles.tabText, activeTab === 'flashcards' && styles.tabTextActive]}>
                📇 Flashcards
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'mindmap' && styles.tabActive]}
              onPress={() => setActiveTab('mindmap')}
            >
              <Text style={[styles.tabText, activeTab === 'mindmap' && styles.tabTextActive]}>
                🗺️ Mind Map
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'cheatsheet' && styles.tabActive]}
              onPress={() => setActiveTab('cheatsheet')}
            >
              <Text style={[styles.tabText, activeTab === 'cheatsheet' && styles.tabTextActive]}>
                📊 Cheat Sheet
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Concept Summary Tab */}
            {activeTab === 'summary' && (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Key Points (In Your Words)</Text>
                  {materials.conceptSummary.keyPoints.map((point, index) => (
                    <View key={index} style={styles.bulletItem}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.bulletText}>{point}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Your Analogies</Text>
                  {materials.conceptSummary.yourAnalogies.map((analogy, index) => (
                    <View key={index} style={styles.analogyCard}>
                      <Text style={styles.analogyIcon}>💡</Text>
                      <Text style={styles.analogyText}>{analogy}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>You Struggled With</Text>
                  {materials.conceptSummary.struggledWith.map((item, index) => (
                    <View key={index} style={styles.struggleItem}>
                      <Text style={styles.struggleIcon}>⚠️</Text>
                      <Text style={styles.struggleText}>{item}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Connections</Text>
                  {materials.conceptSummary.connections.map((connection, index) => (
                    <Text key={index} style={styles.connectionText}>{connection}</Text>
                  ))}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>"Gotchas" - Things You Got Wrong</Text>
                  {materials.conceptSummary.gotchas.map((gotcha, index) => (
                    <View key={index} style={styles.gotchaCard}>
                      <Text style={styles.gotchaText}>{gotcha}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Flashcards Tab */}
            {activeTab === 'flashcards' && (
              <>
                <Text style={styles.flashcardHeader}>
                  Auto-generated from your explanations • Spaced repetition enabled
                </Text>

                {materials.flashcards.map(card => (
                  <TouchableOpacity
                    key={card.id}
                    style={styles.flashcard}
                    onPress={() => handleFlipCard(card.id)}
                  >
                    <View style={styles.flashcardHeader}>
                      <View style={[
                        styles.difficultyBadge,
                        { backgroundColor: getDifficultyColor(card.difficulty) + '20' }
                      ]}>
                        <Text style={[
                          styles.difficultyText,
                          { color: getDifficultyColor(card.difficulty) }
                        ]}>
                          {card.difficulty}
                        </Text>
                      </View>
                      <Text style={styles.reviewInfo}>Next: {card.nextReview}</Text>
                    </View>

                    <View style={styles.flashcardContent}>
                      {!flippedCards[card.id] ? (
                        <>
                          <Text style={styles.flashcardLabel}>Question:</Text>
                          <Text style={styles.flashcardText}>{card.front}</Text>
                          <Text style={styles.tapToFlip}>Tap to see answer</Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.flashcardLabel}>Answer:</Text>
                          <Text style={styles.flashcardText}>{card.back}</Text>

                          <View style={styles.yourExplanation}>
                            <Text style={styles.yourExpLabel}>Your Version:</Text>
                            <Text style={styles.yourExpText}>{card.yourExplanation}</Text>
                          </View>
                        </>
                      )}
                    </View>

                    <View style={styles.flashcardFooter}>
                      <Text style={styles.reviewStats}>
                        Reviewed {card.timesReviewed}x • Last: {card.lastResult}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity style={styles.practiceButton}>
                  <Text style={styles.practiceButtonText}>Start Practice Session</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Mind Map Tab */}
            {activeTab === 'mindmap' && (
              <>
                <Text style={styles.mindMapHeader}>
                  Visual map showing connections • Exports to PDF
                </Text>

                <View style={styles.mindMapContainer}>
                  <View style={styles.centralNode}>
                    <Text style={styles.centralNodeText}>{materials.mindMap.centralTopic}</Text>
                  </View>

                  {materials.mindMap.branches.map((branch, index) => (
                    <View key={index} style={styles.branchContainer}>
                      <View style={styles.branchNode}>
                        <Text style={styles.branchText}>{branch.name}</Text>
                      </View>

                      <View style={styles.subtopicsContainer}>
                        {branch.subtopics.map((subtopic, subIndex) => (
                          <View key={subIndex} style={styles.subtopicNode}>
                            <Text style={styles.subtopicText}>{subtopic}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.exportButtons}>
                  <TouchableOpacity style={styles.exportButton}>
                    <Text style={styles.exportButtonText}>📥 Export as PNG</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.exportButton}>
                    <Text style={styles.exportButtonText}>📄 Export as PDF</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Cheat Sheet Tab */}
            {activeTab === 'cheatsheet' && (
              <>
                <Text style={styles.cheatSheetHeader}>
                  Quick reference • Printable • Offline accessible
                </Text>

                {materials.cheatSheet.sections.map((section, index) => (
                  <View key={index} style={styles.cheatSection}>
                    <Text style={styles.cheatSectionTitle}>{section.category}</Text>

                    {section.items.map((item, itemIndex) => (
                      <View key={itemIndex} style={styles.cheatItem}>
                        <Text style={styles.cheatTerm}>{item.term}</Text>
                        <Text style={styles.cheatDefinition}>{item.definition}</Text>
                      </View>
                    ))}
                  </View>
                ))}

                <TouchableOpacity style={styles.printButton}>
                  <Text style={styles.printButtonText}>🖨️ Print Cheat Sheet</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Study Materials</Text>
          <Text style={styles.subtitle}>Auto-generated after every lesson</Text>
        </View>

        <View style={styles.autoGenBanner}>
          <Text style={styles.autoGenIcon}>✨</Text>
          <View style={styles.autoGenContent}>
            <Text style={styles.autoGenTitle}>Kesandu Auto-Generates:</Text>
            <Text style={styles.autoGenText}>
              • Concept summaries in YOUR words{'\n'}
              • Flashcards from your explanations{'\n'}
              • Mind maps showing connections{'\n'}
              • Cheat sheets for quick reference
            </Text>
          </View>
        </View>

        <View style={styles.lessonsSection}>
          <Text style={styles.sectionTitle}>Your Completed Lessons</Text>

          {STUDY_MATERIALS.lessons.map(lesson => (
            <TouchableOpacity
              key={lesson.id}
              style={styles.lessonCard}
              onPress={() => setSelectedLesson(lesson)}
            >
              <View style={styles.lessonCardHeader}>
                <Text style={styles.lessonCardTitle}>{lesson.title}</Text>
                <Text style={styles.completedBadge}>✓ Completed</Text>
              </View>

              <View style={styles.materialsPreview}>
                <View style={styles.materialItem}>
                  <Text style={styles.materialIcon}>📝</Text>
                  <Text style={styles.materialText}>Summary</Text>
                </View>
                <View style={styles.materialItem}>
                  <Text style={styles.materialIcon}>📇</Text>
                  <Text style={styles.materialText}>
                    {lesson.materials.flashcards.length} Cards
                  </Text>
                </View>
                <View style={styles.materialItem}>
                  <Text style={styles.materialIcon}>🗺️</Text>
                  <Text style={styles.materialText}>Mind Map</Text>
                </View>
                <View style={styles.materialItem}>
                  <Text style={styles.materialIcon}>📊</Text>
                  <Text style={styles.materialText}>Cheat Sheet</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.featuresSectionTitle}>What Makes This Special</Text>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🧠</Text>
            <Text style={styles.featureTitle}>Based on YOUR Learning</Text>
            <Text style={styles.featureDescription}>
              Extracted from your teach-backs and explanations - not generic content
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🔄</Text>
            <Text style={styles.featureTitle}>Spaced Repetition Built-in</Text>
            <Text style={styles.featureDescription}>
              Flashcards automatically scheduled based on how well you know them
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🎯</Text>
            <Text style={styles.featureTitle}>Tracks Your Struggles</Text>
            <Text style={styles.featureDescription}>
              Remembers concepts you found difficult for focused review
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
  autoGenBanner: {
    backgroundColor: COLORS.purple + '10',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.purple,
    flexDirection: 'row',
  },
  autoGenIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  autoGenContent: {
    flex: 1,
  },
  autoGenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  autoGenText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  lessonsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  lessonCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  lessonCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  lessonCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  completedBadge: {
    fontSize: 12,
    color: COLORS.success,
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  materialsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  materialIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  materialText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  featuresSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  featureCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  backButton: {
    padding: 20,
    paddingBottom: 10,
  },
  backButtonText: {
    color: COLORS.info,
    fontSize: 16,
  },
  lessonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
    flexGrow: 0,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.info + '20',
    borderColor: COLORS.info,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.info,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  bullet: {
    fontSize: 18,
    color: COLORS.info,
    marginRight: 10,
    fontWeight: 'bold',
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  analogyCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.gold + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gold,
  },
  analogyIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  analogyText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  struggleItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.warning + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  struggleIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  struggleText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  connectionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  gotchaCard: {
    backgroundColor: COLORS.danger + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  gotchaText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  flashcardHeader: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  flashcard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reviewInfo: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  flashcardContent: {
    marginVertical: 16,
  },
  flashcardLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  flashcardText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: 12,
  },
  tapToFlip: {
    fontSize: 14,
    color: COLORS.info,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  yourExplanation: {
    backgroundColor: COLORS.surfaceLight,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  yourExpLabel: {
    fontSize: 13,
    color: COLORS.gold,
    fontWeight: '600',
    marginBottom: 6,
  },
  yourExpText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  flashcardFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  reviewStats: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  practiceButton: {
    backgroundColor: COLORS.info,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 24,
  },
  practiceButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  mindMapHeader: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  mindMapContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  centralNode: {
    backgroundColor: COLORS.info,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 24,
  },
  centralNodeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  branchContainer: {
    width: '100%',
    marginBottom: 20,
  },
  branchNode: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 12,
  },
  branchText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtopicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  subtopicNode: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subtopicText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  exportButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  exportButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exportButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  cheatSheetHeader: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  cheatSection: {
    marginBottom: 24,
  },
  cheatSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.info,
  },
  cheatItem: {
    backgroundColor: COLORS.surfaceLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  cheatTerm: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 6,
  },
  cheatDefinition: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  printButton: {
    backgroundColor: COLORS.success,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 24,
  },
  printButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

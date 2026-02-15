import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
  TextInput, SafeAreaView, Dimensions
} from 'react-native';
import usePracticeProblems from '../hooks/usePracticeProblems';

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
};

const { width } = Dimensions.get('window');

export default function PracticeProblemsScreen() {
  const practice = usePracticeProblems();
  const [showRoleSelector, setShowRoleSelector] = useState(true);
  const [selectedRole, setSelectedRole] = useState('DATA_ENGINEER');
  const [selectedProblemType, setSelectedProblemType] = useState('SQL');
  const [selectedDifficulty, setSelectedDifficulty] = useState(practice.DIFFICULTY_LEVELS.MEDIUM);
  const [solution, setSolution] = useState('');
  const [showStats, setShowStats] = useState(false);

  const ROLES = {
    DATA_ENGINEER: 'Data Engineer 🔧',
    AI_ENGINEER: 'AI Engineer 🤖',
    DATA_SCIENTIST: 'Data Scientist 📊',
    ANALYST: 'Data Analyst 📈',
  };

  const handleGenerateProblem = async () => {
    setShowRoleSelector(false);
    setSolution('');
    await practice.generateNewProblem(selectedRole, selectedProblemType, selectedDifficulty);
  };

  const handleSubmitSolution = async () => {
    if (!solution.trim()) {
      alert('Please write a solution first');
      return;
    }
    await practice.submitSolution(solution);
  };

  const handleNewProblem = () => {
    const recommended = practice.getRecommendedNext();
    setSelectedDifficulty(recommended.difficulty);
    handleGenerateProblem();
  };

  // Role Selector
  if (showRoleSelector && !practice.currentProblem) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.selectorScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>💪 Practice Problems</Text>
              <Text style={styles.subtitle}>Build mastery through deliberate practice</Text>
            </View>

            {/* Role Selection */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Select Role</Text>
              {Object.entries(ROLES).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.card,
                    selectedRole === key && styles.cardSelected,
                  ]}
                  onPress={() => setSelectedRole(key)}
                >
                  <Text style={styles.cardTitle}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Problem Type Selection */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Problem Type</Text>
              <View style={styles.typesGrid}>
                {Object.entries(practice.PROBLEM_TYPES).map(([key, type]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.typeCard,
                      selectedProblemType === key && styles.typeCardSelected,
                    ]}
                    onPress={() => setSelectedProblemType(key)}
                  >
                    <Text style={styles.typeEmoji}>{type.emoji}</Text>
                    <Text style={styles.typeName}>{type.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Difficulty Selection */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Difficulty</Text>
              <View style={styles.difficultyRow}>
                {Object.entries(practice.DIFFICULTY_LEVELS).map(([key, level]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.diffButton,
                      selectedDifficulty.value === level.value && styles.diffButtonSelected,
                      { borderColor: level.color }
                    ]}
                    onPress={() => setSelectedDifficulty(level)}
                  >
                    <Text style={[styles.diffText, selectedDifficulty.value === level.value && { color: level.color }]}>
                      {level.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.startButton} onPress={handleGenerateProblem}>
              <Text style={styles.startButtonText}>🎯 Start Problem</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statsButton} onPress={() => setShowStats(true)}>
              <Text style={styles.statsButtonText}>📊 My Stats</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Stats View
  if (showStats && !practice.currentProblem) {
    const stats = practice.getStats();
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.statsScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>📊 Your Stats</Text>
          </View>

          {stats.totalAttempts === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No problems solved yet</Text>
              <TouchableOpacity style={styles.startButton} onPress={() => setShowStats(false)}>
                <Text style={styles.startButtonText}>Start Practicing</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Summary Stats */}
              <View style={styles.statsGrid}>
                <StatCard
                  label="Total Attempts"
                  value={stats.totalAttempts}
                  icon="💪"
                />
                <StatCard
                  label="Average Score"
                  value={`${stats.averageScore}%`}
                  icon="📈"
                />
                <StatCard
                  label="Solved (70+)"
                  value={stats.problemsSolved}
                  icon="✅"
                />
              </View>

              {/* By Type */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>By Problem Type</Text>
                {Object.entries(stats.byType).map(([type, count]) => (
                  <View key={type} style={styles.statItem}>
                    <Text style={styles.statItemLabel}>{type}</Text>
                    <Text style={styles.statItemValue}>{count} attempts</Text>
                  </View>
                ))}
              </View>

              {/* By Difficulty */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>By Difficulty</Text>
                {Object.entries(stats.byDifficulty).map(([diff, count]) => (
                  <View key={diff} style={styles.statItem}>
                    <Text style={styles.statItemLabel}>{diff}</Text>
                    <Text style={styles.statItemValue}>{count} attempts</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <TouchableOpacity style={styles.backButton} onPress={() => setShowStats(false)}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Problem Solving View
  if (practice.currentProblem && !practice.evaluation) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.problemContainer}>
          <ScrollView contentContainerStyle={styles.problemScroll} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.problemHeader}>
              <View>
                <Text style={styles.problemTitle}>{practice.currentProblem.title}</Text>
                <View style={styles.diffBadge}>
                  <Text style={styles.diffBadgeText}>
                    {practice.PROBLEM_TYPES[practice.currentProblem.problemType].emoji} {practice.currentProblem.difficulty}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowRoleSelector(true)}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Problem Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Problem</Text>
              <Text style={styles.problemDescription}>{practice.currentProblem.description}</Text>
            </View>

            {/* Key Topics */}
            {practice.currentProblem.keyTopics && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Key Topics</Text>
                <View style={styles.topicsList}>
                  {practice.currentProblem.keyTopics.map((topic, idx) => (
                    <View key={idx} style={styles.topicTag}>
                      <Text style={styles.topicTagText}>{topic}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Hints */}
            {practice.currentProblem.hints && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💡 Hints</Text>
                {practice.currentProblem.hints.map((hint, idx) => (
                  <View key={idx} style={styles.hintCard}>
                    <Text style={styles.hintLabel}>Hint {idx + 1}</Text>
                    <Text style={styles.hintText}>{hint}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Solution Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Solution</Text>
              <TextInput
                style={styles.solutionInput}
                placeholder="Write your solution here..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={12}
                value={solution}
                onChangeText={setSolution}
              />
            </View>
          </ScrollView>

          <View style={styles.problemFooter}>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitSolution} disabled={practice.loading}>
              {practice.loading ? (
                <ActivityIndicator color={COLORS.bg} size="small" />
              ) : (
                <Text style={styles.submitButtonText}>📤 Submit Solution</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Evaluation View
  if (practice.evaluation) {
    const eval_ = practice.evaluation;
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.evaluationScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>📋 Evaluation</Text>
          </View>

          {/* Score */}
          <View style={[styles.scoreCard, { borderLeftColor: eval_.score >= 70 ? COLORS.success : COLORS.warning }]}>
            <Text style={styles.scoreLabel}>Score</Text>
            <Text style={styles.scoreValue}>{eval_.score}%</Text>
            <Text style={styles.levelText}>{eval_.level}</Text>
          </View>

          {/* Strengths */}
          {eval_.strengths && eval_.strengths.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: COLORS.success }]}>✅ Strengths</Text>
              {eval_.strengths.map((strength, idx) => (
                <View key={idx} style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.itemText}>{strength}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Weaknesses */}
          {eval_.weaknesses && eval_.weaknesses.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: COLORS.warning }]}>⚠️ Weaknesses</Text>
              {eval_.weaknesses.map((weakness, idx) => (
                <View key={idx} style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.itemText}>{weakness}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Improvements */}
          {eval_.improvements && eval_.improvements.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📈 Improvements</Text>
              {eval_.improvements.map((improvement, idx) => (
                <View key={idx} style={styles.improvementCard}>
                  <Text style={styles.improvementText}>{improvement}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Complexity */}
          {eval_.complexity && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⏱️ Complexity</Text>
              <View style={styles.complexityCard}>
                <Text style={styles.complexityText}>{eval_.complexity}</Text>
              </View>
            </View>
          )}

          {/* Feedback */}
          {eval_.feedback && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💬 Feedback</Text>
              <View style={styles.feedbackCard}>
                <Text style={styles.feedbackText}>{eval_.feedback}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.evaluationFooter}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNewProblem}>
            <Text style={styles.nextButtonText}>🚀 Next Problem</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

function StatCard({ label, value, icon }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  selectorScroll: {
    padding: 20,
    paddingBottom: 200,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardSelected: {
    borderColor: COLORS.info,
    backgroundColor: COLORS.surfaceLight,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  typeCardSelected: {
    borderColor: COLORS.info,
    backgroundColor: COLORS.surfaceLight,
  },
  typeEmoji: {
    fontSize: 24,
  },
  typeName: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  diffButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: 'center',
  },
  diffButtonSelected: {
    backgroundColor: COLORS.surfaceLight,
  },
  diffText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  startButton: {
    backgroundColor: COLORS.info,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: '600',
  },
  statsButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  statsButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  statsScroll: {
    padding: 20,
    paddingBottom: 120,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statItemLabel: {
    color: COLORS.text,
    fontSize: 14,
  },
  statItemValue: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  problemContainer: {
    flex: 1,
  },
  problemScroll: {
    padding: 20,
    paddingBottom: 120,
  },
  problemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  problemTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
    marginBottom: 8,
  },
  diffBadge: {
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  diffBadgeText: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.textMuted,
    fontSize: 28,
  },
  problemDescription: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 22,
  },
  topicsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicTag: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  topicTagText: {
    color: COLORS.info,
    fontSize: 12,
    fontWeight: '600',
  },
  hintCard: {
    backgroundColor: COLORS.surfaceLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  hintLabel: {
    color: COLORS.warning,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  hintText: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
  },
  solutionInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'monospace',
    minHeight: 200,
    textAlignVertical: 'top',
  },
  problemFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitButton: {
    backgroundColor: COLORS.success,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: '600',
  },
  evaluationScroll: {
    padding: 20,
    paddingBottom: 120,
  },
  scoreCard: {
    backgroundColor: COLORS.surface,
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  scoreLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  scoreValue: {
    color: COLORS.text,
    fontSize: 44,
    fontWeight: '700',
    marginBottom: 8,
  },
  levelText: {
    color: COLORS.info,
    fontSize: 16,
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bullet: {
    color: COLORS.accent,
    fontSize: 16,
    marginRight: 12,
  },
  itemText: {
    color: COLORS.text,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  improvementCard: {
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.info,
    marginBottom: 8,
  },
  improvementText: {
    color: COLORS.text,
    fontSize: 13,
  },
  complexityCard: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  complexityText: {
    color: COLORS.text,
    fontSize: 13,
    fontFamily: 'monospace',
  },
  feedbackCard: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.success,
  },
  feedbackText: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 20,
  },
  evaluationFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  nextButton: {
    backgroundColor: COLORS.info,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: '600',
  },
});

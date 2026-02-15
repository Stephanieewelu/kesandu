import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView,
  TextInput, ActivityIndicator, Alert, Picker
} from 'react-native';
import useCodeReview from '../hooks/useCodeReview';

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

const LANGUAGES = [
  'python', 'javascript', 'typescript', 'java', 'sql', 'go',
  'rust', 'cpp', 'csharp', 'scala'
];

const ROLES = [
  'Data Engineer', 'AI Engineer', 'Data Scientist', 'Backend Engineer',
  'Frontend Engineer', 'Full Stack Engineer'
];

export default function CodeReviewScreen() {
  const codeReview = useCodeReview();
  const [showEditor, setShowEditor] = useState(true);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [context, setContext] = useState('');
  const [role, setRole] = useState('Data Engineer');
  const [selectedReview, setSelectedReview] = useState(null);
  const [showOptimizations, setShowOptimizations] = useState(false);
  const [notes, setNotes] = useState('');

  const handleSubmitCode = async () => {
    if (!code.trim()) {
      Alert.alert('Empty Code', 'Please write some code to review');
      return;
    }

    try {
      const review = await codeReview.submitForReview(code, language, context, role);
      setCode('');
      setContext('');
      setShowEditor(false);
      setSelectedReview(review);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleGetOptimizations = async (focusArea) => {
    if (selectedReview) {
      await codeReview.getOptimizations(selectedReview.id, focusArea);
      setShowOptimizations(true);
    }
  };

  // Show Code Editor
  if (showEditor && !selectedReview) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Code Review</Text>
            <Text style={styles.subtitle}>Get expert feedback on your code</Text>
          </View>

          {/* Language Selector */}
          <View style={styles.section}>
            <Text style={styles.label}>Language</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={language}
                onValueChange={setLanguage}
                style={styles.picker}
              >
                {LANGUAGES.map(lang => (
                  <Picker.Item key={lang} label={lang} value={lang} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Role Selector */}
          <View style={styles.section}>
            <Text style={styles.label}>Your Role</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={role}
                onValueChange={setRole}
                style={styles.picker}
              >
                {ROLES.map(r => (
                  <Picker.Item key={r} label={r} value={r} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Code Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Code</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="Paste your code here..."
              placeholderTextColor={COLORS.textMuted}
              value={code}
              onChangeText={setCode}
              multiline
              numberOfLines={15}
              fontFamily="monospace"
            />
          </View>

          {/* Context */}
          <View style={styles.section}>
            <Text style={styles.label}>Context (Optional)</Text>
            <TextInput
              style={styles.contextInput}
              placeholder="What does this code do? Any specific concerns?"
              placeholderTextColor={COLORS.textMuted}
              value={context}
              onChangeText={setContext}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitCode}
            disabled={codeReview.loading}
          >
            {codeReview.loading ? (
              <ActivityIndicator color={COLORS.bg} size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Submit for Review</Text>
            )}
          </TouchableOpacity>

          {/* Recent Reviews */}
          {codeReview.reviews.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Reviews</Text>
              {codeReview.reviews.slice(-3).map(review => (
                <TouchableOpacity
                  key={review.id}
                  style={styles.reviewItem}
                  onPress={() => {
                    setSelectedReview(review);
                    setShowEditor(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewLanguage}>{review.language.toUpperCase()}</Text>
                    <Text style={styles.reviewScore}>Score: {review.review.overallScore}%</Text>
                    <Text style={styles.reviewDate}>
                      {new Date(review.submittedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.reviewArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Show Review Results
  if (selectedReview && !showOptimizations) {
    const review = selectedReview.review;
    const stats = codeReview.getReviewStats();

    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Score Card */}
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Overall Score</Text>
            <Text style={styles.scoreValue}>{review.overallScore}%</Text>
            <Text style={[styles.verdictText, { color: getVerdictColor(review.verdict) }]}>
              {review.verdict}
            </Text>
          </View>

          {/* Score Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detailed Scores</Text>
            <ScoreRow label="Quality" score={review.quality} />
            <ScoreRow label="Readability" score={review.readability} />
            <ScoreRow label="Efficiency" score={review.efficiency} />
            <ScoreRow label="Correctness" score={review.correctness} />
            <ScoreRow label="Maintainability" score={review.maintainability} />
          </View>

          {/* Strengths */}
          {review.strengths && review.strengths.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: COLORS.success }]}>Strengths</Text>
              {review.strengths.map((s, idx) => (
                <View key={idx} style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemText}>{s.point}</Text>
                    <Text style={styles.itemCategory}>{s.category}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Issues */}
          {review.issues && review.issues.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: COLORS.warning }]}>Issues Found</Text>
              {review.issues.map((issue, idx) => (
                <IssueCard key={idx} issue={issue} />
              ))}
            </View>
          )}

          {/* Complexity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Complexity Analysis</Text>
            <View style={styles.complexityCard}>
              <ComplexityRow label="Time" value={review.complexity.timeComplexity} />
              <ComplexityRow label="Space" value={review.complexity.spaceComplexity} />
              <Text style={styles.complexityExplanation}>{review.complexity.explanation}</Text>
            </View>
          </View>

          {/* Best Practices */}
          {review.bestPractices && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Best Practices</Text>
              {review.bestPractices.map((practice, idx) => (
                <View key={idx} style={styles.practiceItem}>
                  <Text style={styles.practiceText}>{practice}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Learning */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Learnings</Text>
            <View style={styles.learningCard}>
              <Text style={styles.learningText}>{review.learning}</Text>
            </View>
          </View>

          {/* Next Steps */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next Steps</Text>
            {review.nextSteps?.map((step, idx) => (
              <View key={idx} style={styles.nextStepItem}>
                <Text style={styles.stepNumber}>{idx + 1}.</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.optimizeButton}
              onPress={() => setShowOptimizations(true)}
            >
              <Text style={styles.optimizeButtonText}>Get Optimizations</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setSelectedReview(null);
                setShowEditor(true);
              }}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Show Optimizations
  if (selectedReview && showOptimizations && selectedReview.optimizations) {
    const optimizations = selectedReview.optimizations;

    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Code Optimizations</Text>
            <Text style={styles.subtitle}>Focus: {optimizations.focusArea}</Text>
          </View>

          <View style={styles.benefitCard}>
            <Text style={styles.benefitLabel}>Expected Improvement</Text>
            <Text style={styles.benefitValue}>{optimizations.estimatedImprovement}</Text>
            <Text style={styles.benefitDifficulty}>Difficulty: {optimizations.difficulty}</Text>
          </View>

          {optimizations.improvements?.map((improvement, idx) => (
            <View key={idx} style={styles.improvementCard}>
              <Text style={styles.improvementTitle}>{improvement.title}</Text>
              <Text style={styles.improvementDesc}>{improvement.description}</Text>

              <Text style={styles.codeLabel}>Optimized Code:</Text>
              <Text style={styles.optimizedCode}>{improvement.optimizedCode}</Text>

              <View style={styles.benefitRow}>
                <Text style={styles.benefitLabel}>Benefits</Text>
                <Text style={styles.benefitText}>{improvement.benefit}</Text>
              </View>

              {improvement.tradeoff && (
                <View style={styles.tradeoffRow}>
                  <Text style={styles.tradeoffLabel}>Tradeoff</Text>
                  <Text style={styles.tradeoffText}>{improvement.tradeoff}</Text>
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowOptimizations(false)}
          >
            <Text style={styles.backButtonText}>← Back to Review</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

function ScoreRow({ label, score }) {
  const getScoreColor = (s) => {
    if (s >= 8) return COLORS.success;
    if (s >= 6) return COLORS.info;
    if (s >= 4) return COLORS.warning;
    return COLORS.danger;
  };

  return (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <View style={styles.scoreBarBg}>
        <View
          style={[
            styles.scoreBarFill,
            { width: `${score * 10}%`, backgroundColor: getScoreColor(score) }
          ]}
        />
      </View>
      <Text style={[styles.scoreNumber, { color: getScoreColor(score) }]}>
        {score}/10
      </Text>
    </View>
  );
}

function IssueCard({ issue }) {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return COLORS.danger;
      case 'high':
        return COLORS.warning;
      case 'medium':
        return COLORS.info;
      default:
        return COLORS.textSecondary;
    }
  };

  return (
    <View style={[styles.issueCard, { borderLeftColor: getSeverityColor(issue.severity) }]}>
      <Text style={[styles.issueSeverity, { color: getSeverityColor(issue.severity) }]}>
        {issue.severity.toUpperCase()}
      </Text>
      <Text style={styles.issueTitle}>{issue.issue}</Text>
      <Text style={styles.issueLine}>{issue.line}</Text>
      <View style={styles.issueFixContainer}>
        <Text style={styles.fixLabel}>Fix:</Text>
        <Text style={styles.fixText}>{issue.fix}</Text>
      </View>
    </View>
  );
}

function ComplexityRow({ label, value }) {
  return (
    <View style={styles.complexityRow}>
      <Text style={styles.complexityLabel}>{label}</Text>
      <Text style={styles.complexityValue}>{value}</Text>
    </View>
  );
}

function getVerdictColor(verdict) {
  switch (verdict) {
    case 'Excellent':
      return COLORS.success;
    case 'Good':
      return COLORS.info;
    case 'Fair':
      return COLORS.warning;
    default:
      return COLORS.danger;
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  picker: {
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  codeInput: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    color: COLORS.text,
    padding: 12,
    fontSize: 12,
    lineHeight: 16,
    minHeight: 250,
    textAlignVertical: 'top',
  },
  contextInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    color: COLORS.text,
    padding: 12,
    fontSize: 13,
  },
  submitButton: {
    backgroundColor: COLORS.info,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  submitButtonText: {
    color: COLORS.bg,
    fontSize: 15,
    fontWeight: '600',
  },
  reviewItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewLanguage: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  reviewScore: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  reviewDate: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  reviewArrow: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
  scoreCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scoreLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  scoreValue: {
    color: COLORS.text,
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 8,
  },
  verdictText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  scoreBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreNumber: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 40,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 8,
  },
  bullet: {
    color: COLORS.accent,
    fontSize: 14,
  },
  itemText: {
    color: COLORS.text,
    fontSize: 13,
  },
  itemCategory: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  issueCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  issueSeverity: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  issueTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  issueLine: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 6,
    fontFamily: 'monospace',
  },
  issueFixContainer: {
    backgroundColor: COLORS.surfaceLight,
    padding: 8,
    borderRadius: 6,
  },
  fixLabel: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  fixText: {
    color: COLORS.text,
    fontSize: 12,
  },
  complexityCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  complexityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  complexityLabel: {
    color: COLORS.text,
    fontSize: 13,
  },
  complexityValue: {
    color: COLORS.info,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  complexityExplanation: {
    color: COLORS.textSecondary,
    fontSize: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  practiceItem: {
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.success,
  },
  practiceText: {
    color: COLORS.text,
    fontSize: 12,
  },
  learningCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.info,
  },
  learningText: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
  },
  nextStepItem: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 8,
  },
  stepNumber: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  stepText: {
    color: COLORS.text,
    fontSize: 12,
    flex: 1,
  },
  actionButtons: {
    gap: 12,
  },
  optimizeButton: {
    backgroundColor: COLORS.info,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  optimizeButtonText: {
    color: COLORS.bg,
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  benefitCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  benefitLabel: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  benefitValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  benefitDifficulty: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  improvementCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  improvementTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  improvementDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  codeLabel: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  optimizedCode: {
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    padding: 10,
    borderRadius: 6,
    fontFamily: 'monospace',
    fontSize: 11,
    marginBottom: 10,
  },
  benefitRow: {
    marginBottom: 10,
  },
  benefitText: {
    color: COLORS.text,
    fontSize: 12,
    marginTop: 4,
  },
  tradeoffRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tradeoffLabel: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  tradeoffText: {
    color: COLORS.text,
    fontSize: 12,
    marginTop: 4,
  },
});

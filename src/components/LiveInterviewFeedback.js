import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, Animated
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
};

export default function LiveInterviewFeedback({ feedback, loading, isListening }) {
  const [scaleAnim] = React.useState(new Animated.Value(1));

  useEffect(() => {
    if (feedback) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [feedback]);

  if (!feedback && !loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholderText}>
          {isListening ? '🎤 Listening... Real-time feedback will appear here' : '👂 Feedback ready when you speak'}
        </Text>
      </View>
    );
  }

  return (
    <Animated.View
      style={[styles.container, { transform: [{ scale: scaleAnim }] }]}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.loadingSection}>
            <ActivityIndicator color={COLORS.info} size="small" />
            <Text style={styles.loadingText}>Analyzing your response...</Text>
          </View>
        )}

        {feedback && (
          <>
            {/* Coverage & Metrics Row */}
            <View style={styles.metricsRow}>
              <MetricBadge
                label="Coverage"
                value={feedback.coveragePercent}
                type="percentage"
                icon="📊"
              />
              <MetricBadge
                label="Clarity"
                value={feedback.clarity}
                type="score"
                icon="🗣️"
              />
              <MetricBadge
                label="Depth"
                value={feedback.depth}
                type="score"
                icon="🔍"
              />
            </View>

            {/* On Track Status */}
            {feedback.isOnTrack !== undefined && (
              <View
                style={[
                  styles.statusCard,
                  feedback.isOnTrack
                    ? styles.statusGood
                    : styles.statusWarning,
                ]}
              >
                <Text style={styles.statusEmoji}>
                  {feedback.isOnTrack ? '✅' : '⚠️'}
                </Text>
                <Text style={styles.statusText}>
                  {feedback.isOnTrack
                    ? 'You\'re on the right track!'
                    : 'Consider adjusting your approach'}
                </Text>
              </View>
            )}

            {/* Strengths */}
            {feedback.strengths && feedback.strengths.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>✅ What You\'re Doing Well</Text>
                {feedback.strengths.map((strength, idx) => (
                  <View key={idx} style={styles.item}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.itemText}>{strength}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Gaps */}
            {feedback.gaps && feedback.gaps.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: COLORS.warning }]}>
                  🎯 What to Add
                </Text>
                {feedback.gaps.map((gap, idx) => (
                  <View key={idx} style={styles.item}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.itemText}>{gap}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Tips */}
            {feedback.tips && feedback.tips.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💡 Quick Tip</Text>
                {feedback.tips.map((tip, idx) => (
                  <View key={idx} style={styles.tipCard}>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Suggested Additions */}
            {feedback.suggestedAdditions &&
              feedback.suggestedAdditions.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>💬 Consider Mentioning</Text>
                  {feedback.suggestedAdditions.map((addition, idx) => (
                    <View key={idx} style={styles.suggestionCard}>
                      <Text style={styles.suggestionText}>{addition}</Text>
                    </View>
                  ))}
                </View>
              )}

            {/* Next Step */}
            {feedback.nextStep && (
              <View style={styles.nextStepCard}>
                <Text style={styles.nextStepLabel}>Next Step</Text>
                <Text style={styles.nextStepText}>{feedback.nextStep}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Animated.View>
  );
}

function MetricBadge({ label, value, type, icon }) {
  const getColor = () => {
    if (type === 'percentage') {
      if (value >= 80) return COLORS.success;
      if (value >= 50) return COLORS.warning;
      return COLORS.danger;
    }
    if (type === 'score') {
      if (value >= 8) return COLORS.success;
      if (value >= 5) return COLORS.warning;
      return COLORS.danger;
    }
  };

  return (
    <View style={[styles.metricBadge, { borderColor: getColor() }]}>
      <Text style={styles.metricIcon}>{icon}</Text>
      <Text style={styles.metricValue}>
        {type === 'percentage' ? `${value}%` : `${value}/10`}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    maxHeight: 400,
  },
  scroll: {
    paddingBottom: 8,
  },
  placeholderText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
  },
  loadingSection: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  metricBadge: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 2,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  metricIcon: {
    fontSize: 18,
  },
  metricValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  metricLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  statusCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    gap: 10,
  },
  statusGood: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.success,
  },
  statusWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  statusEmoji: {
    fontSize: 20,
  },
  statusText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 8,
  },
  bullet: {
    color: COLORS.accent,
    fontSize: 12,
  },
  itemText: {
    color: COLORS.text,
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  tipCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.info,
    padding: 10,
    borderRadius: 6,
  },
  tipText: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 16,
  },
  suggestionCard: {
    backgroundColor: COLORS.surfaceLight,
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.info,
  },
  suggestionText: {
    color: COLORS.text,
    fontSize: 12,
  },
  nextStepCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  nextStepLabel: {
    color: COLORS.warning,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  nextStepText: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
  },
});

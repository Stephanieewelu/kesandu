import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView,
  Modal, Alert
} from 'react-native';
import useSpacedRepetition from '../hooks/useSpacedRepetition';

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

const QUALITY_SCALE = [
  { label: '❌ Forgot', value: 0, color: '#EF4444', description: 'Complete blackout' },
  { label: '😕 Difficult', value: 1, color: '#F97316', description: 'Very difficult' },
  { label: '🤔 Unsure', value: 2, color: '#F59E0B', description: 'Difficult' },
  { label: '👍 OK', value: 3, color: '#FBBF24', description: 'Acceptable' },
  { label: '😊 Good', value: 4, color: '#34D399', description: 'Well done' },
  { label: '🤩 Perfect', value: 5, color: '#22C55E', description: 'Perfect' },
];

export default function SpacedRepetitionScreen() {
  const sr = useSpacedRepetition();
  const [currentView, setCurrentView] = useState('overview'); // overview, review, stats
  const [selectedItem, setSelectedItem] = useState(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const intervals = sr.getItemsByInterval();
  const globalStats = sr.getGlobalStats();

  const startReview = (item) => {
    setSelectedItem(item);
    setReviewModalVisible(true);
  };

  const handleQualityResponse = async (quality) => {
    if (selectedItem) {
      await sr.recordReview(selectedItem.itemId, quality);
      setReviewModalVisible(false);
      setSelectedItem(null);
    }
  };

  // Overview Tab
  if (currentView === 'overview') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>🧠 Spaced Repetition</Text>
            <Text style={styles.subtitle}>Master through strategic review</Text>
          </View>

          {/* Key Stats */}
          <View style={styles.statsGrid}>
            <StatCard
              icon="📚"
              label="Items"
              value={sr.stats.totalItems}
              color={COLORS.info}
            />
            <StatCard
              icon="⏰"
              label="Due Today"
              value={sr.stats.dueToday}
              color={COLORS.danger}
            />
            <StatCard
              icon="📅"
              label="This Week"
              value={sr.stats.dueThisWeek}
              color={COLORS.warning}
            />
            <StatCard
              icon="📈"
              label="Avg Quality"
              value={`${globalStats.avgQuality}/5`}
              color={COLORS.success}
            />
          </View>

          {/* Action Card */}
          {sr.stats.dueToday > 0 && (
            <View style={styles.actionCard}>
              <Text style={styles.actionEmoji}>⏰</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>Ready to Review!</Text>
                <Text style={styles.actionText}>
                  {sr.stats.dueToday} items due today
                </Text>
              </View>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setCurrentView('review')}
              >
                <Text style={styles.actionButtonText}>Review</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Interval Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Learning Progress</Text>

            <IntervalCard
              icon="🌱"
              title="New Items"
              count={intervals.new.length}
              description="Start learning"
              color={COLORS.info}
            />
            <IntervalCard
              icon="📖"
              title="Learning"
              count={intervals.learning.length}
              description="Build strength"
              color={COLORS.warning}
            />
            <IntervalCard
              icon="🔄"
              title="Review"
              count={intervals.review.length}
              description="Maintain knowledge"
              color={COLORS.accent}
            />
            <IntervalCard
              icon="🏆"
              title="Mastered"
              count={intervals.mastered.length}
              description="Long-term retention"
              color={COLORS.success}
            />
          </View>

          {/* Global Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📈 Global Stats</Text>
            <View style={styles.statsTable}>
              <StatsRow
                label="Avg Repetitions"
                value={globalStats.avgRepetitions}
              />
              <StatsRow
                label="Avg Ease Factor"
                value={globalStats.avgEaseFactor}
              />
              <StatsRow
                label="Total Reviews"
                value={globalStats.totalReviews}
              />
            </View>
          </View>

          {/* Navigation */}
          <View style={styles.navButtons}>
            <NavButton
              icon="⏱️"
              label="Review"
              onPress={() => setCurrentView('review')}
              variant="primary"
            />
            <NavButton
              icon="📊"
              label="Statistics"
              onPress={() => setCurrentView('stats')}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Review Tab
  if (currentView === 'review') {
    const dueItems = sr.getDueItems();

    if (dueItems.length === 0) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.header}>
              <Text style={styles.title}>✅ All Caught Up!</Text>
              <Text style={styles.subtitle}>Great job staying on top of your reviews</Text>
            </View>

            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={styles.emptyText}>No items due today. Come back tomorrow!</Text>
            </View>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setCurrentView('overview')}
            >
              <Text style={styles.backButtonText}>← Overview</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title}>📖 Review Session</Text>
            <Text style={styles.subtitle}>{dueItems.length} items due</Text>
          </View>

          {dueItems.map((item, idx) => (
            <ReviewItemCard
              key={item.itemId}
              item={item}
              index={idx}
              total={dueItems.length}
              onReview={() => startReview(item)}
            />
          ))}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentView('overview')}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Stats Tab
  if (currentView === 'stats') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title}>📊 Your Statistics</Text>
            <Text style={styles.subtitle}>Track your learning progress</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overall Progress</Text>
            <ProgressBar
              label="Total Items"
              value={sr.stats.totalItems}
              max={sr.stats.totalItems || 1}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Review Distribution</Text>
            {Object.entries(intervals).map(([type, items]) => (
              <ProgressBar
                key={type}
                label={type.charAt(0).toUpperCase() + type.slice(1)}
                value={items.length}
                max={sr.stats.totalItems || 1}
                color={getIntervalColor(type)}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentView('overview')}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

// Review Modal
function ReviewModal({ visible, item, onQualitySelected, onDismiss }) {
  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.reviewModalOverlay}>
        <View style={styles.reviewModalContent}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewTitle}>How well did you remember?</Text>
            <TouchableOpacity onPress={onDismiss}>
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.itemPreview}>
            <Text style={styles.previewLabel}>Reviewing:</Text>
            <Text style={styles.previewTitle}>{item.title || 'Item'}</Text>
            <Text style={styles.previewText}>{item.description || 'Practice problem'}</Text>
          </View>

          <View style={styles.qualityGrid}>
            {QUALITY_SCALE.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[styles.qualityButton, { borderColor: option.color }]}
                onPress={() => onQualitySelected(option.value)}
              >
                <Text style={styles.qualityLabel}>{option.label}</Text>
                <Text style={styles.qualityDescription}>{option.description}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.skipButton} onPress={onDismiss}>
            <Text style={styles.skipButtonText}>Skip for Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Component Cards
function StatCard({ icon, label, value, color }) {
  return (
    <View style={[styles.statCard, { borderColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function IntervalCard({ icon, title, count, description, color }) {
  return (
    <View style={[styles.intervalCard, { borderLeftColor: color }]}>
      <Text style={styles.intervalIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.intervalTitle}>{title}</Text>
        <Text style={styles.intervalDescription}>{description}</Text>
      </View>
      <Text style={[styles.intervalCount, { color }]}>{count}</Text>
    </View>
  );
}

function StatsRow({ label, value }) {
  return (
    <View style={styles.statsRow}>
      <Text style={styles.statsLabel}>{label}</Text>
      <Text style={styles.statsValue}>{value}</Text>
    </View>
  );
}

function ReviewItemCard({ item, index, total, onReview }) {
  const daysUntilDue = item.nextReviewDate
    ? Math.ceil((new Date(item.nextReviewDate) - new Date()) / (24 * 60 * 60 * 1000))
    : 0;

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewCardHeader}>
        <Text style={styles.reviewIndex}>
          {index + 1} / {total}
        </Text>
        <Text style={styles.reviewTitle}>{item.title || 'Item'}</Text>
      </View>
      <Text style={styles.reviewDescription} numberOfLines={2}>
        {item.description || 'Practice problem'}
      </Text>
      <View style={styles.reviewMeta}>
        <Text style={styles.reviewMetaText}>
          Repetition: {item.repetitions} • Interval: {item.interval}d
        </Text>
      </View>
      <TouchableOpacity style={styles.reviewButton} onPress={onReview}>
        <Text style={styles.reviewButtonText}>Review Now →</Text>
      </TouchableOpacity>
    </View>
  );
}

function NavButton({ icon, label, onPress, variant }) {
  return (
    <TouchableOpacity
      style={[styles.navButton, variant === 'primary' && styles.navButtonPrimary]}
      onPress={onPress}
    >
      <Text style={styles.navIcon}>{icon}</Text>
      <Text style={styles.navLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function ProgressBar({ label, value, max, color = COLORS.info }) {
  const percentage = (value / max) * 100;
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressLabel}>
        <Text style={styles.progressLabelText}>{label}</Text>
        <Text style={styles.progressValue}>{value}</Text>
      </View>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function getIntervalColor(type) {
  const colors = {
    new: COLORS.info,
    learning: COLORS.warning,
    review: COLORS.accent,
    mastered: COLORS.success,
  };
  return colors[type] || COLORS.textSecondary;
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 2,
    padding: 14,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  actionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  actionEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  actionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  actionButton: {
    backgroundColor: COLORS.danger,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    marginLeft: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  intervalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  intervalIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  intervalTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  intervalDescription: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  intervalCount: {
    fontSize: 16,
    fontWeight: '700',
  },
  statsTable: {
    gap: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statsLabel: {
    color: COLORS.text,
    fontSize: 13,
  },
  statsValue: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '600',
  },
  navButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
  },
  navButtonPrimary: {
    backgroundColor: COLORS.info,
    borderColor: COLORS.info,
  },
  navIcon: {
    fontSize: 20,
  },
  navLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  reviewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewIndex: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginRight: 8,
  },
  reviewTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  reviewDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  reviewMeta: {
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  reviewMetaText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  reviewButton: {
    backgroundColor: COLORS.info,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: COLORS.bg,
    fontSize: 13,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 24,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  reviewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  reviewModalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  reviewTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  closeIcon: {
    color: COLORS.textMuted,
    fontSize: 28,
  },
  itemPreview: {
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  previewLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 4,
  },
  previewTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  previewText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  qualityGrid: {
    gap: 8,
    marginBottom: 16,
  },
  qualityButton: {
    borderWidth: 2,
    borderRadius: 10,
    padding: 12,
    backgroundColor: COLORS.bg,
  },
  qualityLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  qualityDescription: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  skipButton: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabelText: {
    color: COLORS.text,
    fontSize: 13,
  },
  progressValue: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});

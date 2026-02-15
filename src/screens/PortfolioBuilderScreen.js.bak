import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView,
  Alert, Dimensions, Share, Modal, TextInput
} from 'react-native';
import usePortfolioBuilder from '../hooks/usePortfolioBuilder';

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

export default function PortfolioBuilderScreen() {
  const portfolio = usePortfolioBuilder();
  const [showStats, setShowStats] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [notesModalVisible, setNotesModalVisible] = useState(false);

  const stats = portfolio.getPortfolioStats();

  const handleAddNotes = (item) => {
    setSelectedItem(item);
    setEditingNotes(item.notes || '');
    setNotesModalVisible(true);
  };

  const handleSaveNotes = async () => {
    if (selectedItem) {
      await portfolio.updatePortfolioItem(selectedItem.id, { notes: editingNotes });
      setNotesModalVisible(false);
      setSelectedItem(null);
      setEditingNotes('');
    }
  };

  const handleShare = async (item) => {
    try {
      const markdown = portfolio.exportAsMarkdown(item);
      await Share.share({
        message: `Check out this solution I created with Kesandu!\n\n${item.title}\nScore: ${item.score}%\n\n${markdown}`,
        title: item.title,
      });
    } catch (error) {
      Alert.alert('Share Error', error.message);
    }
  };

  const handleMakePublic = async (item) => {
    const shareLink = await portfolio.generateShareLink(item.id);
    Alert.alert(
      'Portfolio Item Shared',
      `Your solution is now public!\n\nShare link:\n${shareLink}`,
      [{ text: 'Copy Link', onPress: () => console.log('Copy link') }, { text: 'OK' }]
    );
  };

  const handleDelete = (itemId) => {
    Alert.alert(
      'Remove from Portfolio?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => portfolio.removeFromPortfolio(itemId),
        },
      ]
    );
  };

  if (portfolio.portfolioItems.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎯</Text>
          <Text style={styles.emptyTitle}>Your Portfolio is Empty</Text>
          <Text style={styles.emptyText}>
            Solve practice problems and add your best solutions to build your portfolio.
          </Text>
          <View style={styles.emptyHint}>
            <Text style={styles.hintText}>💡 After solving a problem with 70%+, you can add it to your portfolio!</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🎨 Your Portfolio</Text>
          <Text style={styles.subtitle}>Showcase your best work</Text>
        </View>

        {/* Stats Overview */}
        {showStats && (
          <View style={styles.statsContainer}>
            <View style={styles.statGrid}>
              <StatItem icon="📦" label="Items" value={stats.totalItems} />
              <StatItem icon="📈" label="Avg Score" value={`${stats.averageScore}%`} />
              <StatItem icon="⭐" label="Best" value={`${stats.bestScore}%`} />
              <StatItem icon="🌐" label="Public" value={stats.publicCount} />
            </View>
          </View>
        )}

        {/* Filter/Sort Options */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowStats(!showStats)}
          >
            <Text style={styles.filterButtonText}>{showStats ? 'Hide' : 'Show'} Stats</Text>
          </TouchableOpacity>
        </View>

        {/* Portfolio Items */}
        <View style={styles.itemsContainer}>
          {portfolio.portfolioItems.map((item, idx) => (
            <PortfolioItemCard
              key={item.id}
              item={item}
              onAddNotes={() => handleAddNotes(item)}
              onShare={() => handleShare(item)}
              onMakePublic={() => handleMakePublic(item)}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Notes Modal */}
      <Modal
        visible={notesModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNotesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📝 Notes</Text>
              <TouchableOpacity onPress={() => setNotesModalVisible(false)}>
                <Text style={styles.closeIcon}>×</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.notesInput}
              placeholder="Add notes about your solution..."
              placeholderTextColor={COLORS.textMuted}
              value={editingNotes}
              onChangeText={setEditingNotes}
              multiline
              numberOfLines={6}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveNotes}>
              <Text style={styles.saveButtonText}>💾 Save Notes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function PortfolioItemCard({
  item, onAddNotes, onShare, onMakePublic, onDelete
}) {
  const getScoreColor = (score) => {
    if (score >= 90) return COLORS.success;
    if (score >= 70) return COLORS.info;
    return COLORS.warning;
  };

  return (
    <View style={styles.itemCard}>
      {/* Header */}
      <View style={styles.itemHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemMeta}>
            {item.problemType} • {item.difficulty}
          </Text>
        </View>
        <View style={[styles.scoreBox, { borderColor: getScoreColor(item.score) }]}>
          <Text style={[styles.scoreText, { color: getScoreColor(item.score) }]}>
            {item.score}%
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.itemDescription} numberOfLines={2}>
        {item.problem.description}
      </Text>

      {/* Level Badge */}
      <View style={styles.levelBadge}>
        <Text style={styles.levelBadgeText}>Level: {item.level}</Text>
      </View>

      {/* Notes Preview */}
      {item.notes && (
        <View style={styles.notesPreview}>
          <Text style={styles.notesLabel}>📝 Notes</Text>
          <Text style={styles.notesPreviewText} numberOfLines={2}>
            {item.notes}
          </Text>
        </View>
      )}

      {/* Evaluation Summary */}
      <View style={styles.evaluationSummary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>✅ Strengths</Text>
          <Text style={styles.summaryValue} numberOfLines={1}>
            {item.evaluation.strengths?.[0] || 'N/A'}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>📈 Focus</Text>
          <Text style={styles.summaryValue} numberOfLines={1}>
            {item.evaluation.improvements?.[0] || 'N/A'}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <ActionButton
          icon="📝"
          label="Notes"
          onPress={onAddNotes}
          style={{ flex: 1 }}
        />
        <ActionButton
          icon="🔗"
          label={item.isPublic ? 'Public' : 'Share'}
          onPress={item.isPublic ? onShare : onMakePublic}
          style={{ flex: 1 }}
          secondary={item.isPublic}
        />
        <ActionButton
          icon="🗑️"
          label="Delete"
          onPress={onDelete}
          style={{ flex: 1 }}
          danger
        />
      </View>

      {/* Metadata */}
      <Text style={styles.itemDate}>
        Added {new Date(item.addedAt).toLocaleDateString()}
      </Text>
    </View>
  );
}

function StatItem({ icon, label, value }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionButton({ icon, label, onPress, style, secondary, danger }) {
  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        secondary && styles.actionButtonSecondary,
        danger && styles.actionButtonDanger,
        style,
      ]}
      onPress={onPress}
    >
      <Text style={styles.actionButtonIcon}>{icon}</Text>
      <Text style={styles.actionButtonLabel}>{label}</Text>
    </TouchableOpacity>
  );
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
    lineHeight: 20,
  },
  emptyHint: {
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.info,
  },
  hintText: {
    color: COLORS.text,
    fontSize: 12,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  filterRow: {
    marginBottom: 16,
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    backgroundColor: COLORS.surface,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonText: {
    color: COLORS.text,
    fontSize: 12,
  },
  itemsContainer: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemMeta: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  scoreBox: {
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  scoreText: {
    fontWeight: '700',
    fontSize: 14,
  },
  itemDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  levelBadge: {
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  levelBadgeText: {
    color: COLORS.warning,
    fontSize: 11,
    fontWeight: '600',
  },
  notesPreview: {
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.info,
    marginBottom: 12,
  },
  notesLabel: {
    color: COLORS.info,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  notesPreviewText: {
    color: COLORS.text,
    fontSize: 12,
  },
  evaluationSummary: {
    gap: 8,
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  summaryValue: {
    color: COLORS.text,
    fontSize: 11,
    flex: 1,
    marginLeft: 8,
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionButtonSecondary: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  actionButtonDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  actionButtonIcon: {
    fontSize: 14,
  },
  actionButtonLabel: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '600',
  },
  itemDate: {
    color: COLORS.textMuted,
    fontSize: 10,
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  closeIcon: {
    color: COLORS.textMuted,
    fontSize: 28,
  },
  notesInput: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    color: COLORS.text,
    padding: 12,
    fontSize: 13,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: COLORS.info,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.bg,
    fontSize: 14,
    fontWeight: '600',
  },
});

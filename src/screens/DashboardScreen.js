import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView,
  TextInput, Modal, Alert, ActivityIndicator, FlatList, RefreshControl
} from 'react-native';
import { supabase, TABLES } from '../config/supabase';

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

export default function DashboardScreen({ userProfile, onNavigate }) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all'); // all, easy, medium, hard

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from(TABLES.PRACTICE_PROBLEMS)
        .select('*')
        .eq('user_id', userProfile.userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProblems(data || []);
    } catch (e) {
      console.error('Load problems error:', e);
      Alert.alert('Error', 'Failed to load practice problems');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProblems();
  };

  const filteredProblems = problems.filter(p => {
    const matchesSearch = !searchQuery.trim() ||
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDifficulty = filterDifficulty === 'all' || p.difficulty === filterDifficulty;

    return matchesSearch && matchesDifficulty;
  });

  const deleteProblem = (problemId) => {
    Alert.alert(
      'Delete Problem',
      'Are you sure you want to delete this practice problem?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from(TABLES.PRACTICE_PROBLEMS)
                .delete()
                .eq('id', problemId)
                .eq('user_id', userProfile.userId);

              if (error) throw error;
              setProblems(prev => prev.filter(p => p.id !== problemId));
              setShowProblemModal(false);
              Alert.alert('Success', 'Problem deleted successfully');
            } catch (e) {
              Alert.alert('Error', 'Failed to delete problem');
            }
          },
        },
      ]
    );
  };

  const stats = {
    total: problems.length,
    easy: problems.filter(p => p.difficulty === 'easy').length,
    medium: problems.filter(p => p.difficulty === 'medium').length,
    hard: problems.filter(p => p.difficulty === 'hard').length,
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Welcome back, {userProfile?.name}!</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => onNavigate?.('settings')}
        >
          <Text style={styles.logoutBtnText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { flex: 1 }]}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Problems</Text>
        </View>
        <View style={[styles.statCard, { flex: 1, marginLeft: 8 }]}>
          <Text style={[styles.statNumber, { color: COLORS.success }]}>{stats.easy}</Text>
          <Text style={styles.statLabel}>Easy</Text>
        </View>
        <View style={[styles.statCard, { flex: 1, marginLeft: 8 }]}>
          <Text style={[styles.statNumber, { color: COLORS.warning }]}>{stats.medium}</Text>
          <Text style={styles.statLabel}>Medium</Text>
        </View>
        <View style={[styles.statCard, { flex: 1, marginLeft: 8 }]}>
          <Text style={[styles.statNumber, { color: COLORS.danger }]}>{stats.hard}</Text>
          <Text style={styles.statLabel}>Hard</Text>
        </View>
      </View>

      {/* Search and Filter */}
      <View style={styles.filterSection}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search problems..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.difficultyFilter}>
          {['all', 'easy', 'medium', 'hard'].map(level => (
            <TouchableOpacity
              key={level}
              style={[
                styles.filterChip,
                filterDifficulty === level && styles.filterChipActive,
              ]}
              onPress={() => setFilterDifficulty(level)}
            >
              <Text style={[
                styles.filterChipText,
                filterDifficulty === level && styles.filterChipTextActive,
              ]}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Problems List */}
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : filteredProblems.length === 0 ? (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.centerContent}
        >
          <Text style={styles.emptyText}>No practice problems yet</Text>
          <Text style={styles.emptySubtext}>Create one through the Practice tab</Text>
        </ScrollView>
      ) : (
        <FlatList
          data={filteredProblems}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.problemCard}
              onPress={() => {
                setSelectedProblem(item);
                setShowProblemModal(true);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.problemHeader}>
                <Text style={styles.problemTitle} numberOfLines={2}>{item.title}</Text>
                <View style={[styles.difficultyBadge, getDifficultyStyle(item.difficulty)]}>
                  <Text style={styles.difficultyText}>{item.difficulty}</Text>
                </View>
              </View>

              <Text style={styles.problemDescription} numberOfLines={2}>
                {item.description}
              </Text>

              {item.tags && item.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {item.tags.slice(0, 3).map((tag, idx) => (
                    <View key={idx} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                  {item.tags.length > 3 && (
                    <Text style={styles.moreTagsText}>+{item.tags.length - 3}</Text>
                  )}
                </View>
              )}

              <Text style={styles.problemMeta}>
                Created {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          scrollEnabled
        />
      )}

      {/* Problem Detail Modal */}
      <Modal visible={showProblemModal} animationType="slide" transparent>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowProblemModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Problem Details</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedProblem && (
              <>
                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>{selectedProblem.title}</Text>
                  <View style={[styles.difficultyBadge, getDifficultyStyle(selectedProblem.difficulty), { alignSelf: 'flex-start', marginTop: 8 }]}>
                    <Text style={styles.difficultyText}>{selectedProblem.difficulty}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionLabel}>Description</Text>
                  <Text style={styles.sectionContent}>{selectedProblem.description}</Text>
                </View>

                {selectedProblem.constraints && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionLabel}>Constraints</Text>
                    <Text style={styles.sectionContent}>{selectedProblem.constraints}</Text>
                  </View>
                )}

                {selectedProblem.examples && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionLabel}>Examples</Text>
                    <Text style={styles.sectionContent}>{selectedProblem.examples}</Text>
                  </View>
                )}

                {selectedProblem.tags && selectedProblem.tags.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionLabel}>Tags</Text>
                    <View style={styles.tagsContainer}>
                      {selectedProblem.tags.map((tag, idx) => (
                        <View key={idx} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.sectionLabel}>Created</Text>
                  <Text style={styles.sectionContent}>
                    {new Date(selectedProblem.created_at).toLocaleString()}
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => {
                      setShowProblemModal(false);
                      onNavigate?.('editProblem', selectedProblem);
                    }}
                  >
                    <Text style={styles.actionButtonText}>✏️ Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => {
                      deleteProblem(selectedProblem.id);
                    }}
                  >
                    <Text style={styles.actionButtonText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function getDifficultyStyle(difficulty) {
  switch (difficulty) {
    case 'easy':
      return { backgroundColor: COLORS.success + '20', borderColor: COLORS.success + '40' };
    case 'medium':
      return { backgroundColor: COLORS.warning + '20', borderColor: COLORS.warning + '40' };
    case 'hard':
      return { backgroundColor: COLORS.danger + '20', borderColor: COLORS.danger + '40' };
    default:
      return { backgroundColor: COLORS.border + '20', borderColor: COLORS.border + '40' };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoutBtnText: {
    fontSize: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.accent,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  difficultyFilter: {
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  filterChipText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: COLORS.bg,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  listContent: {
    padding: 16,
  },
  problemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  problemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  problemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 8,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  problemDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 6,
  },
  tag: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  moreTagsText: {
    fontSize: 11,
    color: COLORS.textMuted,
    alignSelf: 'center',
  },
  problemMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    fontSize: 24,
    color: COLORS.textSecondary,
    fontWeight: '600',
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
    marginBottom: 6,
  },
  sectionContent: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  editButton: {
    backgroundColor: COLORS.info + '20',
    borderColor: COLORS.info,
  },
  deleteButton: {
    backgroundColor: COLORS.danger + '20',
    borderColor: COLORS.danger,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
});

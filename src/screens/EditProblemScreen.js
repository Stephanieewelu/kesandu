import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView,
  TextInput, Modal, Alert, ActivityIndicator, KeyboardAvoidingView
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

export default function EditProblemScreen({ problem, userProfile, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: problem?.title || '',
    description: problem?.description || '',
    difficulty: problem?.difficulty || 'medium',
    constraints: problem?.constraints || '',
    examples: problem?.examples || '',
    tags: problem?.tags?.join(', ') || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      Alert.alert('Required Fields', 'Title and Description are required');
      return;
    }

    setSaving(true);
    try {
      const tags = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const { error } = await supabase
        .from(TABLES.PRACTICE_PROBLEMS)
        .update({
          title: formData.title.trim(),
          description: formData.description.trim(),
          difficulty: formData.difficulty,
          constraints: formData.constraints.trim() || null,
          examples: formData.examples.trim() || null,
          tags: tags,
          updated_at: new Date().toISOString(),
        })
        .eq('id', problem.id)
        .eq('user_id', userProfile.userId);

      if (error) throw error;

      Alert.alert('Success', 'Problem updated successfully');
      onSave?.();
    } catch (e) {
      console.error('Update error:', e);
      Alert.alert('Error', 'Failed to update problem: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Problem</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Problem title"
              placeholderTextColor={COLORS.textMuted}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              editable={!saving}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.largeInput]}
              placeholder="Detailed problem description"
              placeholderTextColor={COLORS.textMuted}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={5}
              editable={!saving}
            />
          </View>

          {/* Difficulty */}
          <View style={styles.section}>
            <Text style={styles.label}>Difficulty</Text>
            <View style={styles.difficultyButtons}>
              {['easy', 'medium', 'hard'].map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.difficultyButton,
                    formData.difficulty === level && styles.difficultyButtonActive,
                    getDifficultyButtonStyle(level, formData.difficulty === level),
                  ]}
                  onPress={() => setFormData({ ...formData, difficulty: level })}
                  disabled={saving}
                >
                  <Text style={[
                    styles.difficultyButtonText,
                    formData.difficulty === level && styles.difficultyButtonTextActive,
                  ]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Constraints */}
          <View style={styles.section}>
            <Text style={styles.label}>Constraints (Optional)</Text>
            <TextInput
              style={[styles.input, styles.largeInput]}
              placeholder="Problem constraints"
              placeholderTextColor={COLORS.textMuted}
              value={formData.constraints}
              onChangeText={(text) => setFormData({ ...formData, constraints: text })}
              multiline
              numberOfLines={3}
              editable={!saving}
            />
          </View>

          {/* Examples */}
          <View style={styles.section}>
            <Text style={styles.label}>Examples (Optional)</Text>
            <TextInput
              style={[styles.input, styles.largeInput]}
              placeholder="Examples and test cases"
              placeholderTextColor={COLORS.textMuted}
              value={formData.examples}
              onChangeText={(text) => setFormData({ ...formData, examples: text })}
              multiline
              numberOfLines={3}
              editable={!saving}
            />
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.label}>Tags (comma separated)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., array, sorting, recursion"
              placeholderTextColor={COLORS.textMuted}
              value={formData.tags}
              onChangeText={(text) => setFormData({ ...formData, tags: text })}
              editable={!saving}
            />
            {formData.tags && (
              <View style={styles.tagsPreview}>
                {formData.tags
                  .split(',')
                  .map(t => t.trim())
                  .filter(t => t.length > 0)
                  .map((tag, idx) => (
                    <View key={idx} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
            disabled={saving}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.bg} />
            ) : (
              <Text style={[styles.buttonText, styles.saveButtonText]}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getDifficultyButtonStyle(difficulty, isActive) {
  let bgColor = COLORS.surfaceLight;
  let borderColor = COLORS.border;

  if (difficulty === 'easy') {
    bgColor = isActive ? COLORS.success + '40' : COLORS.success + '10';
    borderColor = COLORS.success;
  } else if (difficulty === 'medium') {
    bgColor = isActive ? COLORS.warning + '40' : COLORS.warning + '10';
    borderColor = COLORS.warning;
  } else if (difficulty === 'hard') {
    bgColor = isActive ? COLORS.danger + '40' : COLORS.danger + '10';
    borderColor = COLORS.danger;
  }

  return {
    backgroundColor: bgColor,
    borderColor: isActive ? borderColor : COLORS.border,
  };
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
  closeButton: {
    fontSize: 24,
    color: COLORS.textSecondary,
    fontWeight: '600',
    width: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  largeInput: {
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  difficultyButtonActive: {
    borderWidth: 2,
  },
  difficultyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  difficultyButtonTextActive: {
    color: COLORS.text,
    fontWeight: '700',
  },
  tagsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  tag: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.accent,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  saveButtonText: {
    color: COLORS.bg,
  },
});

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Alert, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@kesandu_guru_xp';
const ONBOARDING_KEY = '@kesandu_onboarding_done';

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
  danger: '#EF4444',
};

export default function SettingsScreen({ onClose, onBack, userProfile, onLogout, totalXP = 0, level = 0, streak = 0, achievements = 0, onOpenStreamlit }) {
  const [resetting, setResetting] = useState(false);

  const handleResetProgress = () => {
    Alert.alert(
      'Reset All Progress',
      'This will permanently erase all your XP, completed challenges, and guru titles. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            try {
              await AsyncStorage.removeItem(STORAGE_KEY);
              await AsyncStorage.removeItem(ONBOARDING_KEY);
              Alert.alert('Done', 'All progress has been reset. Restart the app to begin fresh.', [
                { text: 'OK' },
              ]);
            } catch (e) {
              Alert.alert('Error', 'Failed to reset progress. Please try again.');
            }
            setResetting(false);
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const data = stored ? JSON.parse(stored) : { totalXP: 0, completedChallenges: [] };
      const exportStr = JSON.stringify({
        app: 'Kesandu Guru',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        ...data,
      }, null, 2);
      Alert.alert('Your Data', exportStr);
    } catch (e) {
      Alert.alert('Error', 'Failed to export data.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            onLogout?.();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bg }]}>
      <View style={[styles.header, { borderBottomColor: COLORS.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: COLORS.text }]}>Settings</Text>
          {userProfile && <Text style={[styles.headerSubtitle, { color: COLORS.textMuted }]}>{userProfile.email}</Text>}
        </View>
        <TouchableOpacity
          onPress={onBack || onClose}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={[styles.closeText, { color: COLORS.accent }]}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* User Profile Section */}
        {userProfile && (
          <View style={[styles.profileCard, { backgroundColor: COLORS.surface, borderColor: COLORS.border }]}>
            <View style={styles.profileHeader}>
              <View style={[styles.profileAvatar, { backgroundColor: COLORS.accent }]}>
                <Text style={{ fontSize: 28, fontWeight: '700' }}>
                  {(userProfile.name || 'U')[0].toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.profileName, { color: COLORS.text }]}>{userProfile.name}</Text>
                <Text style={[styles.profileEmail, { color: COLORS.textMuted }]}>{userProfile.email}</Text>
                {userProfile.tier && (
                  <View style={[styles.tierBadge, { backgroundColor: COLORS.accent + '20' }]}>
                    <Text style={[styles.tierText, { color: COLORS.accent }]}>
                      {userProfile.tier.charAt(0).toUpperCase() + userProfile.tier.slice(1)} Tier
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        <View style={[styles.statsCard, { backgroundColor: COLORS.surface, borderColor: COLORS.border }]}>
          <Text style={styles.statsTitle}>YOUR STATS</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalXP}</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{level}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{achievements}</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>DATA</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleExportData}
          accessibilityRole="button"
          accessibilityLabel="Export your progress data"
        >
          <Text style={styles.menuText}>Export Progress Data</Text>
          <Text style={styles.menuArrow}>{'>'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, styles.dangerItem]}
          onPress={handleResetProgress}
          disabled={resetting}
          accessibilityRole="button"
          accessibilityLabel="Reset all progress"
        >
          <Text style={[styles.menuText, styles.dangerText]}>
            {resetting ? 'Resetting...' : 'Reset All Progress'}
          </Text>
          <Text style={[styles.menuArrow, styles.dangerText]}>{'>'}</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>INTEGRATIONS</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={onOpenStreamlit}
          accessibilityRole="button"
          accessibilityLabel="Open Streamlit dashboard"
        >
          <Text style={styles.menuText}>Open Streamlit Dashboard</Text>
          <Text style={styles.menuArrow}>{'>'}</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>ABOUT</Text>

        <View style={styles.menuItem}>
          <Text style={styles.menuText}>Version</Text>
          <Text style={styles.menuValue}>1.0.0</Text>
        </View>

        <View style={styles.menuItem}>
          <Text style={styles.menuText}>Built with</Text>
          <Text style={styles.menuValue}>React Native + Expo</Text>
        </View>

        {/* Account Actions */}
        <Text style={[styles.sectionTitle, { color: COLORS.accent, marginTop: 28 }]}>ACCOUNT</Text>

        <TouchableOpacity
          style={[styles.menuItem, styles.dangerItem, { backgroundColor: COLORS.danger + '20', borderColor: COLORS.danger + '40' }]}
          onPress={handleLogout}
          accessibilityRole="button"
          accessibilityLabel="Logout from account"
        >
          <Text style={[styles.menuText, styles.dangerText, { color: COLORS.danger }]}>
            Logout
          </Text>
          <Text style={[styles.menuArrow, { color: COLORS.danger }]}>→</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: COLORS.text }]}>Kesandu</Text>
          <Text style={[styles.footerSub, { color: COLORS.textMuted }]}>AI Education Platform</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
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
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 24,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    marginBottom: 6,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  tierText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  statsTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
    color: COLORS.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.accent,
    fontSize: 28,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
    color: COLORS.textMuted,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  menuText: {
    fontSize: 15,
  },
  menuArrow: {
    fontSize: 16,
  },
  menuValue: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  dangerItem: {},
  dangerText: {},
  footer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  footerSub: {
    fontSize: 11,
    marginTop: 4,
  },
});

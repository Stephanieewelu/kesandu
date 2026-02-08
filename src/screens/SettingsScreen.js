import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Alert, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@kesandu_guru_xp';
const ONBOARDING_KEY = '@kesandu_onboarding_done';

export default function SettingsScreen({ onClose, totalXP, level, streak = 0, achievements = 0, onOpenStreamlit }) {
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SETTINGS</Text>
        <TouchableOpacity
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close settings"
        >
          <Text style={styles.closeText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsCard}>
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

        <View style={styles.footer}>
          <Text style={styles.footerText}>Kesandu Guru</Text>
          <Text style={styles.footerSub}>AI Education Platform</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
    borderBottomWidth: 1,
    borderColor: '#222',
  },
  headerTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  closeText: {
    color: '#00D9FF',
    fontSize: 16,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  statsCard: {
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#222',
  },
  statsTitle: {
    color: '#666',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#FFD700',
    fontSize: 32,
    fontWeight: '900',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: '#00D9FF',
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  menuText: {
    color: '#FFF',
    fontSize: 15,
  },
  menuArrow: {
    color: '#666',
    fontSize: 16,
  },
  menuValue: {
    color: '#888',
    fontSize: 14,
  },
  dangerItem: {
    borderColor: 'rgba(255, 77, 77, 0.3)',
  },
  dangerText: {
    color: '#FF4D4D',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  footerText: {
    color: '#444',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  footerSub: {
    color: '#333',
    fontSize: 11,
    marginTop: 4,
  },
});

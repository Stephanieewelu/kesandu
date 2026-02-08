import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet, Text, View, Dimensions, TouchableOpacity,
  Modal, ScrollView, SafeAreaView, FlatList,
  ActivityIndicator, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import {
  CheckCircle, Zap, X, ChevronRight, Briefcase, Target,
  Award, TrendingUp,
} from 'lucide-react-native';
import THEME from './src/constants/theme';
import CONTENT_DATA from './src/constants/content';
import { getGuruRank, getNextRank } from './utils';

// Hooks
import useOnboarding from './src/hooks/useOnboarding';
import useXP from './src/hooks/useXP';
import useStreak from './src/hooks/useStreak';
import useAchievements from './src/hooks/useAchievements';

// Components
import ErrorBoundary from './src/components/ErrorBoundary';
import OnboardingScreen from './src/screens/OnboardingScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CertificateScreen from './src/components/CertificateScreen';
import ChatEngine from './src/components/ChatEngine';
import VideoFeedItem from './src/components/VideoFeedItem';
import GuruCelebration from './src/components/GuruCelebration';
import AchievementToast from './src/components/AchievementToast';
import StreakBadge from './src/components/StreakBadge';

const { width, height } = Dimensions.get('window');
const IS_IOS = Platform.OS === 'ios';

// ============================================================================
// MAIN APP
// ============================================================================

function AppContent() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeModule, setActiveModule] = useState(null);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [showCelebration, setShowCelebration] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [certificateModule, setCertificateModule] = useState(null);
  const { totalXP, level, currentLevelXP, nextLevelXP, awardXP, isComplete, loaded, getModuleProgress, completedChallenges } = useXP();
  const { hasOnboarded, completeOnboarding } = useOnboarding();
  const { streakInfo, streakBonus, recordActivity, streakLoaded } = useStreak();
  const { unlockedIds, newAchievement, checkAndUnlock, dismissAchievement } = useAchievements();

  const guruRank = getGuruRank(totalXP);
  const nextRank = getNextRank(totalXP);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 70,
    minimumViewTime: 300,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const getItemLayout = useCallback((_, index) => ({
    length: height,
    offset: height * index,
    index,
  }), []);

  const handleOpenModule = useCallback((m) => setActiveModule(m), []);
  const handleCloseModule = useCallback(() => setActiveModule(null), []);

  const handleOpenChallenge = useCallback((c) => {
    setActiveModule(null);
    setTimeout(() => setActiveChallenge(c), 350);
  }, []);

  const handleChallengeComplete = useCallback((xp, challengeId) => {
    if (!isComplete(challengeId)) {
      awardXP(xp, challengeId);
    }
    setActiveChallenge(null);
    recordActivity();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setTimeout(() => {
      const guruCount = CONTENT_DATA.filter(m => getModuleProgress(m).isGuru).length;
      const allChallenges = CONTENT_DATA.flatMap(m => m.challenges);
      const passedIds = [...completedChallenges, challengeId];
      const teachBackPasses = allChallenges.filter(c => c.type === 'TEACH_BACK' && passedIds.includes(c.id)).length;
      const applyPasses = allChallenges.filter(c => c.type === 'APPLY' && passedIds.includes(c.id)).length;
      const modulesAttempted = CONTENT_DATA.filter(m => m.challenges.some(c => passedIds.includes(c.id))).length;

      checkAndUnlock({
        totalPasses: passedIds.length,
        currentStreak: streakInfo.current + (streakInfo.isActiveToday ? 0 : 1),
        guruCount,
        highestScore: 0,
        modulesAttempted,
        teachBackPasses,
        applyPasses,
        totalAnalogies: 0,
      });

      for (const mod of CONTENT_DATA) {
        const allDone = mod.challenges.every(
          c => c.id === challengeId || isComplete(c.id)
        );
        if (allDone && mod.challenges.some(c => c.id === challengeId)) {
          setShowCelebration(mod.guruTitle);
          setCertificateModule(mod);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        }
      }
    }, 500);
  }, [awardXP, isComplete, recordActivity, completedChallenges, getModuleProgress, streakInfo, checkAndUnlock]);

  const handleChallengeExit = useCallback(() => setActiveChallenge(null), []);

  const renderFeedItem = useCallback(({ item, index }) => (
    <VideoFeedItem
      item={item}
      isActive={index === activeIndex && !activeModule && !activeChallenge}
      onEnter={handleOpenModule}
      moduleProgress={getModuleProgress(item)}
    />
  ), [activeIndex, activeModule, activeChallenge, handleOpenModule, getModuleProgress]);

  const levelProgress = nextLevelXP > 0 ? Math.min(1, currentLevelXP / nextLevelXP) : 0;
  const guruCount = CONTENT_DATA.filter(m => getModuleProgress(m).isGuru).length;

  if (hasOnboarded === null || !loaded || !streakLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00D9FF" />
      </View>
    );
  }

  if (!hasOnboarded) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* VIDEO FEED */}
      <FlatList
        data={CONTENT_DATA}
        keyExtractor={item => item.id}
        pagingEnabled
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={getItemLayout}
        renderItem={renderFeedItem}
        windowSize={3}
        maxToRenderPerBatch={2}
        removeClippedSubviews
        initialNumToRender={1}
      />

      {/* HUD OVERLAY */}
      <SafeAreaView style={styles.hud} pointerEvents="box-none">
        <View style={styles.hudLeft}>
          <TouchableOpacity
            onPress={() => setShowSettings(true)}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <Text style={styles.logo}>KESANDU</Text>
            <Text style={styles.logoSubtitle}>GURU</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.hudRight}>
          <StreakBadge current={streakInfo.current} isActiveToday={streakInfo.isActiveToday} />
          <View style={[styles.rankBadge, { borderColor: guruRank.color }]}>
            <Text style={[styles.rankText, { color: guruRank.color }]}>
              {guruRank.title}
            </Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelNumber}>{level}</Text>
          </View>
          <View style={styles.xpSection}>
            <View style={styles.xpBarTrack}>
              <View style={[styles.xpBarFill, { width: `${levelProgress * 100}%` }]} />
            </View>
            <View style={styles.xpPill}>
              <Zap size={12} color={THEME.guru} fill={THEME.guru} />
              <Text style={styles.xpText}>{totalXP}</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Guru count indicator */}
      {guruCount > 0 && (
        <View style={styles.guruCountBadge}>
          <Award size={14} color={THEME.guru} />
          <Text style={styles.guruCountText}>{guruCount}/{CONTENT_DATA.length}</Text>
        </View>
      )}

      {/* MODULE DETAIL MODAL */}
      <Modal visible={!!activeModule} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>TRAINING MODULE</Text>
            <TouchableOpacity onPress={handleCloseModule} accessibilityRole="button" accessibilityLabel="Close training module">
              <X size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 20 }}>
            {activeModule && (
              <View style={styles.moduleGuruHeader}>
                <Award
                  size={20}
                  color={getModuleProgress(activeModule).isGuru ? THEME.guru : THEME.muted}
                />
                <Text style={[
                  styles.moduleGuruTitle,
                  getModuleProgress(activeModule).isGuru && { color: THEME.guru },
                ]}>
                  {activeModule.guruTitle}
                </Text>
                <Text style={styles.moduleGuruStatus}>
                  {getModuleProgress(activeModule).isGuru
                    ? 'MASTERED'
                    : `${getModuleProgress(activeModule).done}/${getModuleProgress(activeModule).total} complete`}
                </Text>
              </View>
            )}

            <View style={styles.scenarioCard}>
              <View style={styles.scenarioHeader}>
                <Briefcase size={16} color={THEME.warning} />
                <Text style={styles.scenarioRole}>{activeModule?.applicationScenario.role}</Text>
              </View>
              <Text style={styles.scenarioContext}>{activeModule?.applicationScenario.context}</Text>
            </View>

            <Text style={styles.sectionTitle}>CHALLENGES</Text>
            {activeModule?.challenges.map((c, i) => {
              const completed = isComplete(c.id);
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.challengeRow, completed && styles.challengeRowComplete]}
                  onPress={() => handleOpenChallenge(c)}
                >
                  <View style={[styles.indexCircle, completed && styles.indexCircleComplete]}>
                    {completed ? (
                      <CheckCircle size={16} color={THEME.success} />
                    ) : (
                      <Text style={styles.indexNumber}>{i + 1}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.challengeTitle}>{c.title}</Text>
                    <Text style={styles.challengeType}>
                      {c.type === 'TEACH_BACK' ? '\uD83C\uDF93 Teach Back' : c.type === 'APPLY' ? '\uD83D\uDCBC Apply It' : '\uD83E\uDDEA Concept Check'}
                      {' \u2022 '}+{c.xp_reward} XP
                    </Text>
                  </View>
                  <ChevronRight size={20} color={completed ? THEME.success : THEME.primary} />
                </TouchableOpacity>
              );
            })}

            {nextRank && (
              <View style={styles.nextRankCard}>
                <TrendingUp size={16} color={nextRank.color} />
                <Text style={styles.nextRankText}>
                  Next rank: <Text style={{ color: nextRank.color, fontWeight: 'bold' }}>{nextRank.title}</Text> at {nextRank.minXP} XP
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* CHAT ARENA MODAL */}
      <Modal visible={!!activeChallenge} animationType="slide">
        {activeChallenge && (
          <ChatEngine
            challenge={activeChallenge}
            onExit={handleChallengeExit}
            onComplete={handleChallengeComplete}
            isAlreadyComplete={isComplete(activeChallenge?.id)}
          />
        )}
      </Modal>

      {/* GURU CELEBRATION OVERLAY */}
      <GuruCelebration
        visible={!!showCelebration}
        guruTitle={showCelebration || ''}
        onDismiss={() => setShowCelebration(null)}
      />

      {/* SETTINGS MODAL */}
      <Modal visible={showSettings} animationType="slide">
        <SettingsScreen
          onClose={() => setShowSettings(false)}
          totalXP={totalXP}
          level={level}
          streak={streakInfo.current}
          achievements={unlockedIds.length}
        />
      </Modal>

      {/* ACHIEVEMENT TOAST */}
      <AchievementToast achievement={newAchievement} onDismiss={dismissAchievement} />

      {/* COMPLETION CERTIFICATE */}
      <CertificateScreen
        visible={!!certificateModule && !showCelebration}
        module={certificateModule}
        onClose={() => setCertificateModule(null)}
      />
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // -- HUD --
  hud: {
    position: 'absolute',
    top: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: IS_IOS ? 8 : 12,
  },
  hudLeft: {},
  hudRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 3,
  },
  logoSubtitle: {
    color: THEME.guru,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 4,
    marginTop: -2,
  },
  rankBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rankText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  levelBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelNumber: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },
  xpSection: { alignItems: 'flex-end' },
  xpBarTrack: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 3,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: THEME.guru,
    borderRadius: 2,
  },
  xpPill: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  xpText: {
    color: THEME.guru,
    fontWeight: 'bold',
    fontSize: 13,
  },

  // -- Guru count badge --
  guruCountBadge: {
    position: 'absolute',
    bottom: 30,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  guruCountText: {
    color: THEME.guru,
    fontWeight: '700',
    fontSize: 13,
  },

  // -- Module Modal --
  modalContainer: { flex: 1, backgroundColor: '#000' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: IS_IOS ? 8 : 16,
    borderBottomWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
  },
  modalHeaderTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  moduleGuruHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: THEME.border,
  },
  moduleGuruTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  moduleGuruStatus: {
    color: THEME.muted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  scenarioCard: {
    backgroundColor: 'rgba(255, 214, 0, 0.06)',
    padding: 18,
    borderRadius: 14,
    borderColor: 'rgba(255, 214, 0, 0.3)',
    borderWidth: 1,
    marginBottom: 28,
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  scenarioRole: {
    color: THEME.warning,
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scenarioContext: { color: '#EEE', fontSize: 15, lineHeight: 22 },
  sectionTitle: {
    color: THEME.primary,
    fontWeight: 'bold',
    marginBottom: 12,
    fontSize: 12,
    letterSpacing: 1,
  },
  challengeRow: {
    flexDirection: 'row',
    backgroundColor: THEME.surface,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  challengeRowComplete: {
    borderColor: 'rgba(0, 255, 157, 0.2)',
    backgroundColor: 'rgba(0, 255, 157, 0.04)',
  },
  indexCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexCircleComplete: {
    backgroundColor: 'rgba(0, 255, 157, 0.15)',
  },
  indexNumber: { fontWeight: 'bold', fontSize: 14 },
  challengeTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  challengeType: { color: '#888', fontSize: 12, marginTop: 2 },
  nextRankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 16,
    borderRadius: 14,
    marginTop: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  nextRankText: {
    color: '#AAA',
    fontSize: 13,
    flex: 1,
  },
});

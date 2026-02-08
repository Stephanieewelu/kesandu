import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Award } from 'lucide-react-native';
import THEME from '../constants/theme';

const GuruBadge = React.memo(({ guruTitle, isGuru, progress }) => {
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (isGuru) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0.4, duration: 1200, useNativeDriver: false }),
        ])
      ).start();
    }
  }, [isGuru, glowAnim]);

  if (isGuru) {
    return (
      <Animated.View style={[styles.guruBadge, { opacity: glowAnim }]}>
        <Award size={12} color={THEME.guru} />
        <Text style={styles.guruBadgeText}>{guruTitle}</Text>
      </Animated.View>
    );
  }

  return (
    <View style={styles.progressBadge}>
      <Text style={styles.progressBadgeText}>
        {progress.done}/{progress.total} mastered
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  guruBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  guruBadgeText: {
    color: THEME.guru,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  progressBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  progressBadgeText: {
    color: '#999',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default GuruBadge;

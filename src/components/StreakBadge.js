import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame } from 'lucide-react-native';

const StreakBadge = React.memo(({ current, isActiveToday }) => {
  if (current <= 0) return null;

  return (
    <View style={[styles.badge, isActiveToday && styles.badgeActive]}>
      <Flame size={12} color={isActiveToday ? '#FF6B35' : '#666'} fill={isActiveToday ? '#FF6B35' : 'transparent'} />
      <Text style={[styles.text, isActiveToday && styles.textActive]}>{current}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeActive: {
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  text: {
    color: '#666',
    fontSize: 11,
    fontWeight: '700',
  },
  textActive: {
    color: '#FF6B35',
  },
});

export default StreakBadge;

import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet, Platform } from 'react-native';
import { Star } from 'lucide-react-native';
import THEME from '../constants/theme';

const IS_IOS = Platform.OS === 'ios';

const AchievementToast = React.memo(({ achievement, onDismiss }) => {
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (achievement) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, { toValue: -120, duration: 300, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => onDismiss());
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [achievement, slideAnim, opacityAnim, onDismiss]);

  if (!achievement) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
    >
      <View style={styles.icon}>
        <Star size={18} color={THEME.guru} fill={THEME.guru} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Achievement Unlocked!</Text>
        <Text style={styles.name}>{achievement.title}</Text>
        <Text style={styles.desc}>{achievement.description}</Text>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: IS_IOS ? 60 : 40,
    left: 16,
    right: 16,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    zIndex: 200,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: THEME.guru,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  name: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 2,
  },
  desc: {
    color: '#AAA',
    fontSize: 12,
    marginTop: 1,
  },
});

export default AchievementToast;

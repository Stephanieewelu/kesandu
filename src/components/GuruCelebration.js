import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';
import { Award } from 'lucide-react-native';
import THEME from '../constants/theme';

const { width } = Dimensions.get('window');

const GuruCelebration = React.memo(({ visible, guruTitle, onDismiss }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 3, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <Award size={48} color={THEME.guru} />
        <Text style={styles.title}>GURU UNLOCKED</Text>
        <Text style={styles.subtitle}>{guruTitle}</Text>
        <Text style={styles.desc}>
          You've mastered all challenges for this topic. You are now a certified guru!
        </Text>
        <TouchableOpacity style={styles.btn} onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Continue after guru unlock">
          <Text style={styles.btnText}>CONTINUE</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: width * 0.85,
    borderWidth: 2,
    borderColor: THEME.guru,
  },
  title: {
    color: THEME.guru,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 16,
  },
  subtitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  desc: {
    color: '#AAA',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 12,
  },
  btn: {
    backgroundColor: THEME.guru,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 24,
  },
  btnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
});

export default GuruCelebration;

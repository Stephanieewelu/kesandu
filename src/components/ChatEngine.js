import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, FlatList,
  SafeAreaView, ActivityIndicator, KeyboardAvoidingView,
  Keyboard, StyleSheet, Platform, Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { X, Send, Target, CheckCircle, RotateCcw, Zap } from 'lucide-react-native';
import THEME from '../constants/theme';
import { evaluateAnswer, analyzePerformancePattern, generateAdaptiveFeedback } from '../../utils';
import ScoreBar from './ScoreBar';
import ConceptBreakdown from './ConceptBreakdown';

const IS_IOS = Platform.OS === 'ios';

const ChatEngine = ({ challenge, onComplete, onExit, isAlreadyComplete }) => {
  const [history, setHistory] = useState([
    { id: 'init', text: challenge.initialAiMessage, sender: 'ai' },
  ]);
  const [input, setInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [status, setStatus] = useState('ACTIVE');
  const [attemptHistory, setAttemptHistory] = useState([]);
  const listRef = useRef(null);

  const handleSend = useCallback(() => {
    if (!input.trim() || isAiTyping) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const userMsg = { id: Date.now().toString(), text: input, sender: 'user' };
    setHistory(prev => [...prev, userMsg]);
    const userInput = input;
    setInput('');
    setIsAiTyping(true);
    Keyboard.dismiss();

    setTimeout(() => {
      const result = evaluateAnswer(userInput, challenge);
      setLastResult(result);

      const newAttemptHistory = [...attemptHistory, { score: result.score }];
      setAttemptHistory(newAttemptHistory);

      const pattern = analyzePerformancePattern(newAttemptHistory);
      const adaptiveTips = generateAdaptiveFeedback(pattern, challenge.type, result.score);

      const feedbackText = result.feedback.join('\n');
      const coachingText = adaptiveTips.length > 0
        ? '\n\n' + adaptiveTips.map(t => `\u{1F4AC} ${t}`).join('\n')
        : '';

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        text: feedbackText + coachingText,
        sender: 'ai',
        result,
      };

      setHistory(prev => [...prev, aiMsg]);
      setIsAiTyping(false);

      if (result.passed) {
        setStatus('SUCCESS');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (result.status === 'PARTIAL') {
        setStatus('PARTIAL');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        setStatus('FAIL');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }, 1000);
  }, [input, isAiTyping, challenge, attemptHistory]);

  const handleRetry = useCallback(() => {
    setStatus('ACTIVE');
    setLastResult(null);
    setHistory(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        text: '\uD83D\uDD04 Give it another shot. Think about the feedback above.',
        sender: 'ai',
      },
    ]);
  }, []);

  const renderMessage = useCallback(({ item }) => {
    const isAi = item.sender === 'ai';
    return (
      <View style={{ marginBottom: 16 }}>
        <View style={[styles.bubble, isAi ? styles.bubbleAi : styles.bubbleUser]}>
          <Text style={styles.bubbleText}>{item.text}</Text>
        </View>
        {item.result && (
          <View style={{ marginTop: 8 }}>
            <ScoreBar score={item.result.score} status={item.result.status} />
            <ConceptBreakdown breakdown={item.result.breakdown} />
            {item.result.xpEarned > 0 && (
              <View style={styles.xpEarnedBadge}>
                <Zap size={14} color={THEME.guru} fill={THEME.guru} />
                <Text style={styles.xpEarnedText}>+{item.result.xpEarned} XP</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={onExit} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Close challenge">
          <X size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{challenge.type.replace('_', ' ')}</Text>
          <Text style={styles.headerSubtitle}>
            {challenge.type === 'TEACH_BACK' ? '\uD83C\uDF93 Feynman Mode' : challenge.type === 'APPLY' ? '\uD83D\uDCBC Apply Mode' : '\uD83E\uDDEA Accuracy Mode'}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.briefBox}>
        <Target size={14} color={THEME.primary} />
        <Text style={styles.briefText}>{challenge.prompt}</Text>
      </View>

      {isAlreadyComplete && (
        <View style={styles.completeBanner}>
          <CheckCircle size={14} color={THEME.success} />
          <Text style={styles.completeBannerText}>Already completed \u2014 practice mode (no XP)</Text>
        </View>
      )}

      <FlatList
        ref={listRef}
        data={history}
        keyExtractor={i => i.id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={renderMessage}
      />

      {isAiTyping && (
        <View style={styles.typingIndicator}>
          <ActivityIndicator size="small" color={THEME.primary} />
          <Text style={styles.typingText}>Evaluating your knowledge...</Text>
        </View>
      )}

      <KeyboardAvoidingView behavior={IS_IOS ? 'padding' : 'height'}>
        {status === 'ACTIVE' ? (
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Prove your understanding..."
              placeholderTextColor={THEME.muted}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || isAiTyping}
              accessibilityRole="button"
              accessibilityLabel="Send your answer"
            >
              <Send size={20} color={input.trim() ? '#000' : '#666'} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionBar}>
            {(status === 'FAIL' || status === 'PARTIAL') && (
              <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} accessibilityRole="button" accessibilityLabel="Try challenge again">
                <RotateCcw size={18} color={THEME.textSoft} />
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.collectBtn,
                {
                  backgroundColor: status === 'SUCCESS'
                    ? THEME.success
                    : status === 'PARTIAL'
                      ? THEME.partial
                      : THEME.muted,
                },
              ]}
              onPress={() => {
                if (lastResult && lastResult.xpEarned > 0) {
                  onComplete(lastResult.xpEarned, challenge.id);
                } else {
                  onExit();
                }
              }}
            >
              <Text style={styles.collectBtnText}>
                {lastResult?.xpEarned > 0 ? `COLLECT +${lastResult.xpEarned} XP` : 'CLOSE'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: IS_IOS ? 8 : 16,
    borderBottomWidth: 1,
    borderColor: '#222',
    alignItems: 'center',
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerSubtitle: { color: '#666', fontSize: 11, marginTop: 2 },
  briefBox: {
    backgroundColor: '#111',
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    borderBottomWidth: 1,
    borderColor: '#222',
  },
  briefText: { color: '#DDD', flex: 1, fontSize: 14, lineHeight: 20 },
  completeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 255, 157, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderColor: '#222',
  },
  completeBannerText: { color: THEME.success, fontSize: 12 },
  bubble: { maxWidth: '88%', padding: 14, borderRadius: 18, marginBottom: 4 },
  bubbleAi: { alignSelf: 'flex-start', backgroundColor: '#1A1A2E', borderTopLeftRadius: 4 },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 217, 255, 0.12)',
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.3)',
  },
  bubbleText: { color: '#FFF', fontSize: 14, lineHeight: 21 },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  typingText: { color: '#666', fontSize: 12 },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#222',
    gap: 10,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#111',
    color: '#FFF',
    borderRadius: 20,
    padding: 12,
    paddingTop: 12,
    minHeight: 48,
    maxHeight: 120,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#222',
  },
  sendBtn: {
    backgroundColor: THEME.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#111' },
  actionBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    borderTopWidth: 1,
    borderColor: '#222',
  },
  retryBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  retryBtnText: { color: '#CCC', fontWeight: '600', fontSize: 15 },
  collectBtn: {
    flex: 1.5,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectBtnText: { fontWeight: 'bold', fontSize: 15, color: '#000' },
  xpEarnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  xpEarnedText: { color: THEME.guru, fontWeight: '700', fontSize: 14 },
});

export default ChatEngine;

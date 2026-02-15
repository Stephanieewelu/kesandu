import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Platform, Animated
} from 'react-native';
import useVoiceInput from '../hooks/useVoiceInput';
import useVoiceOutput from '../hooks/useVoiceOutput';
import useLiveInterviewFeedback from '../hooks/useLiveInterviewFeedback';
import LiveInterviewFeedback from './LiveInterviewFeedback';

const COLORS = {
  bg: '#09090B',
  surface: '#18181B',
  surfaceLight: '#27272A',
  border: '#3F3F46',
  text: '#FAFAFA',
  textSecondary: '#A1A1AA',
  accent: '#E4E4E7',
  success: '#22C55E',
  info: '#3B82F6',
};

export default function VoiceSocraticChat({ question, onAnswer, loading, score }) {
  const voiceInput = useVoiceInput();
  const voiceOutput = useVoiceOutput();
  const liveInterviewFeedback = useLiveInterviewFeedback();
  const [transientText, setTransientText] = useState('');
  const [pulseAnim] = useState(new Animated.Value(1));

  // Auto-speak question when it changes
  useEffect(() => {
    if (question && Platform.OS === 'web') {
      voiceOutput.speak(question);
    }
  }, [question]);

  // Update transient text while listening
  useEffect(() => {
    setTransientText(voiceInput.transcript);
    // Trigger live feedback analysis
    if (voiceInput.transcript && question) {
      const expectedTopics = question.expectedTopics || [];
      liveInterviewFeedback.analyzeLiveTranscript(
        voiceInput.transcript,
        question.question || question,
        expectedTopics
      );
    }
  }, [voiceInput.transcript, question]);

  // Pulse animation for listening indicator
  useEffect(() => {
    if (voiceInput.isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [voiceInput.isListening]);

  const handleStart = () => {
    voiceInput.resetTranscript();
    voiceOutput.stop();
    voiceInput.startListening();
  };

  const handleStop = () => {
    voiceInput.stopListening();
    if (voiceInput.transcript) {
      onAnswer(voiceInput.transcript);
      voiceInput.resetTranscript();
    }
  };

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.unsupported}>
        <Text style={styles.unsupportedText}>Voice mode only available on web</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Score Display */}
        {score !== null && (
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Current Score</Text>
            <Text style={styles.scoreValue}>{score}%</Text>
          </View>
        )}

        {/* Question Display */}
        {question && (
          <View style={styles.questionCard}>
            <Text style={styles.questionLabel}>Interviewer Question</Text>
            <Text style={styles.questionText}>{typeof question === 'string' ? question : question.question}</Text>
          </View>
        )}

        {/* Live Interview Feedback */}
        {transientText && (
          <View style={styles.feedbackSection}>
            <LiveInterviewFeedback
              feedback={liveInterviewFeedback.feedback}
              loading={liveInterviewFeedback.loading}
              isListening={voiceInput.isListening}
            />
          </View>
        )}

        {/* Transient/Interim Text */}
        {transientText && (
          <View style={styles.transcriptCard}>
            <Text style={styles.transcriptLabel}>You're saying...</Text>
            <Text style={styles.transcriptText}>{transientText}</Text>
          </View>
        )}

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={COLORS.info} size="large" />
            <Text style={styles.loadingText}>Analyzing your response...</Text>
          </View>
        )}

        {/* Error Display */}
        {voiceInput.error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>🎙️ Error: {voiceInput.error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Voice Controls */}
      <View style={styles.controls}>
        {!voiceInput.isListening ? (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={handleStart}
            disabled={loading}
          >
            <Text style={styles.buttonText}>🎙️ Start Speaking</Text>
          </TouchableOpacity>
        ) : (
          <>
            <Animated.View
              style={[styles.listeningIndicator, {
                transform: [{ scale: pulseAnim }]
              }]}
            >
              <View style={styles.pulse} />
            </Animated.View>
            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={handleStop}
            >
              <Text style={styles.buttonText}>⏸️ Stop & Submit</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 16,
  },
  scroll: {
    paddingBottom: 120,
  },
  scoreCard: {
    backgroundColor: COLORS.surfaceLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  scoreLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  scoreValue: {
    color: COLORS.success,
    fontSize: 32,
    fontWeight: '700',
  },
  questionCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  questionLabel: {
    color: COLORS.info,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  questionText: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 24,
  },
  feedbackSection: {
    marginBottom: 16,
  },
  transcriptCard: {
    backgroundColor: COLORS.surfaceLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  transcriptLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 8,
  },
  transcriptText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  loadingCard: {
    backgroundColor: COLORS.surfaceLight,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  errorCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 14,
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    alignItems: 'center',
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: '80%',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: COLORS.info,
  },
  stopButton: {
    backgroundColor: COLORS.success,
  },
  buttonText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: '600',
  },
  listeningIndicator: {
    alignItems: 'center',
    marginBottom: 12,
  },
  pulse: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.success,
  },
  unsupported: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  unsupportedText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});

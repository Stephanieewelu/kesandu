import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, SafeAreaView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { supabase } from '../config/supabase';

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
  danger: '#EF4444',
};

export default function PasswordResetScreen({ onBack, onSuccess }) {
  const [step, setStep] = useState('email'); // email, code, newPassword
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');

  const handleRequestReset = async () => {
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'kesandu://reset-password', // Deep link for mobile app
      });

      if (error) throw error;

      setMessage('Reset code sent to your email. Check your inbox.');
      setStep('code');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert('Required', 'Please enter a new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      Alert.alert('Success', 'Your password has been reset');
      onSuccess?.();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Reset Password</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Step 1: Email */}
          {step === 'email' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Enter Your Email</Text>
              <Text style={styles.description}>
                We'll send you a password reset link to your email address.
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRequestReset}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={COLORS.bg} />
                ) : (
                  <Text style={styles.buttonText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: Code (shown but optional for email reset flow) */}
          {step === 'code' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Check Your Email</Text>
              <Text style={styles.description}>
                A password reset link has been sent to {email}. Click the link in your email to reset your password.
              </Text>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  📧 Check your email inbox and spam folder. Click the password reset link to continue.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  setStep('newPassword');
                  setMessage('');
                }}
              >
                <Text style={styles.buttonText}>I've Reset My Password</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => {
                  setStep('email');
                  setMessage('');
                }}
              >
                <Text style={styles.secondaryButtonText}>Send Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3: New Password */}
          {step === 'newPassword' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Create New Password</Text>
              <Text style={styles.description}>
                Enter a strong password with at least 8 characters.
              </Text>

              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="New password"
                  placeholderTextColor={COLORS.textMuted}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.showPasswordButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.showPasswordButtonText}>
                    {showPassword ? '👁️' : '🔒'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                placeholderTextColor={COLORS.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />

              {newPassword && newPassword.length < 8 && (
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>
                    ⚠️ Password must be at least 8 characters
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={loading || newPassword.length < 8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={COLORS.bg} />
                ) : (
                  <Text style={styles.buttonText}>Reset Password</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {message && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>✓ {message}</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: '600',
    width: 60,
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
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  passwordInputWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  showPasswordButton: {
    position: 'absolute',
    right: 12,
    top: 14,
    padding: 4,
  },
  showPasswordButtonText: {
    fontSize: 18,
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.bg,
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  infoBox: {
    backgroundColor: COLORS.info + '20',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.info,
    lineHeight: 20,
  },
  warningBox: {
    backgroundColor: COLORS.danger + '20',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 13,
    color: COLORS.danger,
  },
  successBox: {
    backgroundColor: COLORS.success + '20',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  successText: {
    fontSize: 14,
    color: COLORS.success,
  },
});

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView,
  TextInput, Modal, Alert, ActivityIndicator
} from 'react-native';
import useMobileSync from '../hooks/useMobileSyncSupabase';
import PasswordResetScreen from './PasswordResetScreen';


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
  warning: '#F59E0B',
  danger: '#EF4444',
};

export default function CloudSyncScreen() {
  const sync = useMobileSync();
  const [showLoginModal, setShowLoginModal] = useState(!sync.isAuthenticated);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [deviceName, setDeviceName] = useState('My Device');
  const [syncProgress, setSyncProgress] = useState(null);
  const [isSignUp, setIsSignUp] = useState(true);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Required Fields', 'Please enter email and password');
      return;
    }

    if (isSignUp && !name) {
      Alert.alert('Required Fields', 'Please enter your name');
      return;
    }

    if (isSignUp) {
      const user = await sync.registerUser(email, password, name);
      if (user) {
        await sync.registerDevice(deviceName);
        setShowLoginModal(false);
      }
    } else {
      const user = await sync.loginUser(email, password);
      if (user) {
        setShowLoginModal(false);
      }
    }
  };

  const handleSync = async () => {
    setSyncProgress({ current: 0, total: sync.pendingChanges.length });

    const result = await sync.performSync((progress) => {
      setSyncProgress(progress);
    });

    Alert.alert(
      'Sync Complete',
      `${result.success} items synced successfully${result.failed > 0 ? `\n${result.failed} items failed` : ''}`
    );

    setSyncProgress(null);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure? You\'ll need to login again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            sync.logout();
            setShowLoginModal(true);
          },
        },
      ]
    );
  };

  if (showPasswordReset) {
    return (
      <PasswordResetScreen
        onBack={() => setShowPasswordReset(false)}
        onSuccess={() => {
          setShowPasswordReset(false);
          setIsSignUp(false);
          setPassword('');
          Alert.alert('Success', 'Your password has been reset. You can now sign in with your new password.');
        }}
      />
    );
  }

  if (!sync.isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Cloud Sync</Text>
            <Text style={styles.subtitle}>Keep your progress everywhere</Text>
          </View>

          <View style={styles.loginCard}>
            <Text style={styles.loginTitle}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              editable={!sync.loading}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!sync.loading}
            />
            {isSignUp && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={COLORS.textMuted}
                  value={name}
                  onChangeText={setName}
                  editable={!sync.loading}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Device Name (e.g., My iPhone)"
                  placeholderTextColor={COLORS.textMuted}
                  value={deviceName}
                  onChangeText={setDeviceName}
                  editable={!sync.loading}
                />
              </>
            )}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={sync.loading}
            >
              <Text style={styles.loginButtonText}>
                {sync.loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </Text>
            </TouchableOpacity>

            {sync.syncError && (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{sync.syncError}</Text>
              </View>
            )}

            <View style={styles.footerLinks}>
              <TouchableOpacity
                onPress={() => {
                  setIsSignUp(!isSignUp);
                  setEmail('');
                  setPassword('');
                  setName('');
                }}
              >
                <Text style={styles.toggleAuthText}>
                  {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                </Text>
              </TouchableOpacity>

              {!isSignUp && (
                <TouchableOpacity onPress={() => setShowPasswordReset(true)}>
                  <Text style={[styles.toggleAuthText, { color: COLORS.info, marginTop: 12 }]}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>Benefits of Cloud Sync</Text>
            <BenefitItem icon="cloud" text="Access anywhere on any device" />
            <BenefitItem icon="refresh" text="Automatic sync when online" />
            <BenefitItem icon="device" text="Work offline, sync later" />
            <BenefitItem icon="Security" text="Your data is secure" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Cloud Sync</Text>
          <Text style={styles.subtitle}>Manage your account & devices</Text>
        </View>

        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileIcon}>
            <Text style={styles.profileIconText}>User</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{sync.userProfile?.name}</Text>
            <Text style={styles.profileEmail}>{sync.userProfile?.email}</Text>
            <Text style={styles.profileTier}>
              Tier: {sync.userProfile?.tier?.toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Synchronization Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Synchronization Status</Text>

          {/* Status Indicator */}
          <View style={styles.statusCard}>
            <StatusIndicator status={sync.syncStatus} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.statusText}>
                {sync.syncStatus === 'idle' && 'Ready to sync'}
                {sync.syncStatus === 'syncing' && 'Syncing...'}
                {sync.syncStatus === 'success' && 'Synced successfully!'}
                {sync.syncStatus === 'error' && 'Sync failed'}
              </Text>
              {sync.lastSyncTime && (
                <Text style={styles.lastSyncText}>
                  Last sync: {sync.lastSyncTime.toLocaleTimeString()}
                </Text>
              )}
            </View>
          </View>

          {/* Pending Changes */}
          {sync.pendingChanges.length > 0 && (
            <View style={styles.pendingCard}>
              <Text style={styles.pendingTitle}>
                {sync.pendingChanges.length} pending changes
              </Text>
              <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
                {syncProgress ? (
                  <>
                    <ActivityIndicator color={COLORS.bg} size="small" />
                    <Text style={styles.syncButtonText}>
                      {syncProgress.current} / {syncProgress.total}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.syncButtonText}>Sync Now</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {sync.syncError && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>Warning {sync.syncError}</Text>
            </View>
          )}
        </View>

        {/* Devices */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Devices</Text>

          {sync.devices.length === 0 ? (
            <Text style={styles.emptyText}>No devices registered yet</Text>
          ) : (
            sync.devices.map((device, idx) => (
              <DeviceCard
                key={idx}
                device={device}
                onRemove={() => {
                  Alert.alert(
                    'Remove Device?',
                    `Remove "${device.name}" from your account?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: () => sync.removeDevice(device.deviceId),
                      },
                    ]
                  );
                }}
              />
            ))
          )}

          <TouchableOpacity
            style={styles.addDeviceButton}
            onPress={() => {
              sync.registerDevice('New Device');
              Alert.alert('Device Registered', 'New device has been added to your account');
            }}
          >
            <Text style={styles.addDeviceButtonText}>+ Add This Device</Text>
          </TouchableOpacity>
        </View>

        {/* Sync Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync History</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Total Devices</Text>
            <Text style={styles.statsValue}>{sync.devices.length}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Pending Changes</Text>
            <Text style={styles.statsValue}>{sync.pendingChanges.length}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Last Sync</Text>
            <Text style={styles.statsValue}>
              {sync.lastSyncTime ? sync.lastSyncTime.toLocaleDateString() : 'Never'}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              Alert.alert(
                'Clear Sync History?',
                'This will remove all sync history but keep your data.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: () => {
                      sync.clearSyncHistory();
                      Alert.alert('Cleared', 'Sync history has been cleared');
                    },
                  },
                ]
              );
            }}
          >
            <Text style={styles.clearButtonText}>Clear Sync History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function StatusIndicator({ status }) {
  const getStatusColor = () => {
    switch (status) {
      case 'syncing':
        return COLORS.info;
      case 'success':
        return COLORS.success;
      case 'error':
        return COLORS.danger;
      default:
        return COLORS.textSecondary;
    }
  };

  return (
    <View
      style={[
        styles.statusIndicator,
        { borderColor: getStatusColor() },
      ]}
    >
      <View
        style={[
          styles.statusDot,
          { backgroundColor: getStatusColor() },
        ]}
      />
    </View>
  );
}

function BenefitItem({ icon, text }) {
  return (
    <View style={styles.benefitItem}>
      <Text style={styles.benefitIcon}>{icon}</Text>
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

function DeviceCard({ device, onRemove }) {
  return (
    <View style={styles.deviceCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.deviceName}>{device.name}</Text>
        <Text style={styles.deviceMeta}>
          Added: {new Date(device.registeredAt).toLocaleDateString()}
        </Text>
        <Text style={styles.deviceSync}>
          Last sync: {new Date(device.lastSync).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity onPress={onRemove}>
        <Text style={styles.removeButton}>Remove</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  loginCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  loginTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    color: COLORS.text,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: COLORS.info,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: '600',
  },
  benefitsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  benefitsTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    gap: 12,
  },
  benefitIcon: {
    fontSize: 20,
  },
  benefitText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileIconText: {
    fontSize: 24,
  },
  profileName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  profileEmail: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 2,
  },
  profileTier: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '600',
  },
  logoutButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  logoutButtonText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  lastSyncText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  pendingCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  pendingTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  syncButton: {
    backgroundColor: COLORS.info,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  syncButtonText: {
    color: COLORS.bg,
    fontSize: 13,
    fontWeight: '600',
  },
  errorCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.danger,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
  },
  deviceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deviceName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  deviceMeta: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  deviceSync: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  removeButton: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  addDeviceButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 2,
    borderColor: COLORS.info,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addDeviceButtonText: {
    color: COLORS.info,
    fontSize: 13,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statsLabel: {
    color: COLORS.text,
    fontSize: 13,
  },
  statsValue: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 12,
  },
  clearButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 2,
    borderColor: COLORS.danger,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  toggleAuthText: {
    color: COLORS.info,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
  },
  footerLinks: {
    marginTop: 4,
  },
});

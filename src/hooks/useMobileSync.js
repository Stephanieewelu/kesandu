import { useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CLOUD_SYNC_KEY = '@kesandu_cloud_sync';
const USER_PROFILE_KEY = '@kesandu_user_profile';
const SYNC_METADATA_KEY = '@kesandu_sync_metadata';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export default function useMobileSync() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [devices, setDevices] = useState([]);
  const [syncError, setSyncError] = useState(null);
  const [pendingChanges, setPendingChanges] = useState([]);
  const syncQueueRef = useRef([]);
  const userRef = useRef(null);

  // Initialize auth state
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(USER_PROFILE_KEY);
        if (stored) {
          const profile = JSON.parse(stored);
          userRef.current = profile;
          setUserProfile(profile);
          setIsAuthenticated(true);

          // Load last sync time
          const lastSync = await AsyncStorage.getItem(SYNC_METADATA_KEY);
          if (lastSync) {
            const metadata = JSON.parse(lastSync);
            setLastSyncTime(new Date(metadata.lastSyncTime));
            setDevices(metadata.devices || []);
          }
        }
      } catch (e) {
        console.warn('Failed to load auth state:', e);
      }
    })();
  }, []);

  // Register/Login user
  const registerUser = useCallback(async (email, name) => {
    try {
      // In a real app, this would call a backend API
      // For now, we'll use email as a simple identifier
      const userId = `user_${Date.now()}`;
      const userProfile = {
        userId,
        email,
        name,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        tier: 'free', // free, pro, premium
      };

      userRef.current = userProfile;
      setUserProfile(userProfile);
      setIsAuthenticated(true);

      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userProfile));
      return userProfile;
    } catch (e) {
      setSyncError(e.message);
      return null;
    }
  }, []);

  // Logout user
  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(USER_PROFILE_KEY);
      await AsyncStorage.removeItem(SYNC_METADATA_KEY);
      setUserProfile(null);
      setIsAuthenticated(false);
      userRef.current = null;
    } catch (e) {
      console.error('Logout error:', e);
    }
  }, []);

  // Register current device
  const registerDevice = useCallback(async (deviceName = 'Device') => {
    if (!userRef.current) return null;

    try {
      const deviceId = `device_${Date.now()}`;
      const device = {
        deviceId,
        name: deviceName,
        platform: 'mobile', // mobile, web
        registeredAt: new Date().toISOString(),
        lastSync: new Date().toISOString(),
      };

      const updatedDevices = [...devices, device];
      setDevices(updatedDevices);

      const metadata = {
        lastSyncTime: new Date().toISOString(),
        devices: updatedDevices,
        userId: userRef.current.userId,
      };

      await AsyncStorage.setItem(SYNC_METADATA_KEY, JSON.stringify(metadata));
      return device;
    } catch (e) {
      setSyncError(e.message);
      return null;
    }
  }, [devices]);

  // Queue data for sync
  const queueSync = useCallback(async (dataType, action, data) => {
    try {
      const syncItem = {
        id: `sync_${Date.now()}_${Math.random()}`,
        dataType, // problems, portfolio, spaced_rep, lessons, interview
        action, // create, update, delete
        data,
        timestamp: new Date().toISOString(),
        synced: false,
      };

      syncQueueRef.current.push(syncItem);
      setPendingChanges([...syncQueueRef.current.filter(item => !item.synced)]);

      // Persist queue
      await AsyncStorage.setItem(
        `${CLOUD_SYNC_KEY}_queue`,
        JSON.stringify(syncQueueRef.current)
      );

      return syncItem.id;
    } catch (e) {
      setSyncError(e.message);
      return null;
    }
  }, []);

  // Perform cloud sync
  const performSync = useCallback(async (onProgress) => {
    if (!userRef.current || syncQueueRef.current.length === 0) {
      setSyncStatus('idle');
      return { success: 0, failed: 0 };
    }

    setSyncStatus('syncing');
    setSyncError(null);
    let success = 0;
    let failed = 0;

    try {
      // In a real app, this would make API calls to sync
      // For now, we simulate the sync process
      for (let i = 0; i < syncQueueRef.current.length; i++) {
        const syncItem = syncQueueRef.current[i];

        try {
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 500));

          // Mark as synced
          syncItem.synced = true;
          success += 1;
          onProgress?.({
            current: i + 1,
            total: syncQueueRef.current.length,
            item: syncItem,
          });
        } catch (e) {
          console.error('Sync item error:', e);
          failed += 1;
        }
      }

      // Save synced state
      await AsyncStorage.setItem(
        `${CLOUD_SYNC_KEY}_queue`,
        JSON.stringify(syncQueueRef.current)
      );

      // Update last sync time
      const metadata = {
        lastSyncTime: new Date().toISOString(),
        devices,
        userId: userRef.current.userId,
      };
      await AsyncStorage.setItem(SYNC_METADATA_KEY, JSON.stringify(metadata));
      setLastSyncTime(new Date());

      setSyncStatus('success');
      setPendingChanges([]);

      // Reset success message after 2 seconds
      setTimeout(() => setSyncStatus('idle'), 2000);

      return { success, failed };
    } catch (e) {
      setSyncError(e.message);
      setSyncStatus('error');
      return { success, failed };
    }
  }, [devices]);

  // Get sync stats
  const getSyncStats = useCallback(async () => {
    try {
      const metadataStr = await AsyncStorage.getItem(SYNC_METADATA_KEY);
      const metadata = metadataStr ? JSON.parse(metadataStr) : null;

      return {
        lastSyncTime: metadata?.lastSyncTime || null,
        deviceCount: devices.length,
        pendingChanges: pendingChanges.length,
        syncedItems: syncQueueRef.current.filter(item => item.synced).length,
        totalSyncs: syncQueueRef.current.length,
      };
    } catch (e) {
      console.error('Sync stats error:', e);
      return {
        lastSyncTime: null,
        deviceCount: 0,
        pendingChanges: 0,
        syncedItems: 0,
        totalSyncs: 0,
      };
    }
  }, [devices, pendingChanges]);

  // Remove device from sync
  const removeDevice = useCallback(async (deviceId) => {
    try {
      const updatedDevices = devices.filter(d => d.deviceId !== deviceId);
      setDevices(updatedDevices);

      const metadata = {
        lastSyncTime: new Date().toISOString(),
        devices: updatedDevices,
        userId: userRef.current.userId,
      };

      await AsyncStorage.setItem(SYNC_METADATA_KEY, JSON.stringify(metadata));
    } catch (e) {
      setSyncError(e.message);
    }
  }, [devices]);

  // Clear sync history
  const clearSyncHistory = useCallback(async () => {
    try {
      syncQueueRef.current = [];
      setPendingChanges([]);
      await AsyncStorage.removeItem(`${CLOUD_SYNC_KEY}_queue`);
    } catch (e) {
      setSyncError(e.message);
    }
  }, []);

  return {
    // Auth
    isAuthenticated,
    userProfile,
    registerUser,
    logout,

    // Devices
    devices,
    registerDevice,
    removeDevice,

    // Sync
    syncStatus,
    lastSyncTime,
    syncError,
    pendingChanges,
    queueSync,
    performSync,
    getSyncStats,
    clearSyncHistory,
  };
}

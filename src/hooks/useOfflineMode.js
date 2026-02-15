import { useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const OFFLINE_CACHE_KEY = '@kesandu_offline_cache';
const SYNC_STATE_KEY = '@kesandu_sync_state';
const CACHE_METADATA_KEY = '@kesandu_cache_metadata';

export default function useOfflineMode() {
  const [isOnline, setIsOnline] = useState(true);
  const [cacheStatus, setCacheStatus] = useState('ready');
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [pendingSyncs, setPendingSyncs] = useState(0);
  const syncQueueRef = useRef([]);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });

    return unsubscribe;
  }, []);

  // Load sync state
  useEffect(() => {
    (async () => {
      try {
        const lastSync = await AsyncStorage.getItem(SYNC_STATE_KEY);
        if (lastSync) {
          setLastSyncTime(new Date(lastSync));
        }

        const pendingData = await AsyncStorage.getItem('@kesandu_pending_syncs');
        if (pendingData) {
          const pending = JSON.parse(pendingData);
          setPendingSyncs(pending.length);
          syncQueueRef.current = pending;
        }
      } catch (e) {
        console.warn('Failed to load sync state:', e);
      }
    })();
  }, []);

  // Cache content for offline access
  const cacheContent = useCallback(async (key, content, metadata = {}) => {
    try {
      const cacheEntry = {
        key,
        content,
        cachedAt: new Date().toISOString(),
        size: JSON.stringify(content).length,
        ...metadata,
      };

      // Store actual content
      await AsyncStorage.setItem(
        `${OFFLINE_CACHE_KEY}_${key}`,
        JSON.stringify(cacheEntry)
      );

      // Update metadata
      const metadataStr = await AsyncStorage.getItem(CACHE_METADATA_KEY);
      const allMetadata = metadataStr ? JSON.parse(metadataStr) : {};

      allMetadata[key] = {
        cachedAt: cacheEntry.cachedAt,
        size: cacheEntry.size,
        ...metadata,
      };

      await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(allMetadata));

      return cacheEntry;
    } catch (e) {
      console.error('Cache error:', e);
      throw e;
    }
  }, []);

  // Retrieve cached content
  const getCachedContent = useCallback(async (key) => {
    try {
      const cached = await AsyncStorage.getItem(`${OFFLINE_CACHE_KEY}_${key}`);
      if (cached) {
        const cacheEntry = JSON.parse(cached);
        return cacheEntry.content;
      }
      return null;
    } catch (e) {
      console.error('Cache retrieval error:', e);
      return null;
    }
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(async () => {
    try {
      const metadataStr = await AsyncStorage.getItem(CACHE_METADATA_KEY);
      const metadata = metadataStr ? JSON.parse(metadataStr) : {};

      let totalSize = 0;
      let totalItems = 0;
      const cacheBreakdown = {};

      Object.entries(metadata).forEach(([key, data]) => {
        totalSize += data.size || 0;
        totalItems += 1;
        const category = data.category || 'other';
        cacheBreakdown[category] = (cacheBreakdown[category] || 0) + 1;
      });

      return {
        totalSize: Math.round(totalSize / 1024), // KB
        totalItems,
        breakdown: cacheBreakdown,
        items: Object.keys(metadata),
      };
    } catch (e) {
      console.error('Cache stats error:', e);
      return { totalSize: 0, totalItems: 0, breakdown: {}, items: [] };
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(async () => {
    try {
      setCacheStatus('clearing');

      const metadataStr = await AsyncStorage.getItem(CACHE_METADATA_KEY);
      const metadata = metadataStr ? JSON.parse(metadataStr) : {};

      // Delete all cache entries
      const deletePromises = Object.keys(metadata).map(key =>
        AsyncStorage.removeItem(`${OFFLINE_CACHE_KEY}_${key}`)
      );

      await Promise.all(deletePromises);
      await AsyncStorage.removeItem(CACHE_METADATA_KEY);

      setCacheStatus('ready');
      return true;
    } catch (e) {
      console.error('Cache clear error:', e);
      setCacheStatus('error');
      return false;
    }
  }, []);

  // Queue item for sync when online
  const queueForSync = useCallback(async (action, data) => {
    try {
      const syncItem = {
        id: `sync_${Date.now()}_${Math.random()}`,
        action,
        data,
        queuedAt: new Date().toISOString(),
        retries: 0,
      };

      syncQueueRef.current.push(syncItem);
      setPendingSyncs(syncQueueRef.current.length);

      // Persist queue
      await AsyncStorage.setItem(
        '@kesandu_pending_syncs',
        JSON.stringify(syncQueueRef.current)
      );

      return syncItem.id;
    } catch (e) {
      console.error('Queue sync error:', e);
      return null;
    }
  }, []);

  // Sync pending items
  const syncPendingItems = useCallback(async (onProgress) => {
    if (!isOnline || syncQueueRef.current.length === 0) {
      return { success: 0, failed: 0 };
    }

    setCacheStatus('syncing');
    let success = 0;
    let failed = 0;

    for (let i = 0; i < syncQueueRef.current.length; i++) {
      const syncItem = syncQueueRef.current[i];

      try {
        // Simulate sync (in real app, would call API)
        onProgress?.({ current: i + 1, total: syncQueueRef.current.length });

        // Mark as synced
        success += 1;
        syncQueueRef.current.splice(i, 1);
        i -= 1;
      } catch (e) {
        console.error('Sync item error:', e);
        failed += 1;
        syncItem.retries = (syncItem.retries || 0) + 1;

        // Remove after 3 failed retries
        if (syncItem.retries >= 3) {
          syncQueueRef.current.splice(i, 1);
          i -= 1;
        }
      }
    }

    // Update persist storage
    await AsyncStorage.setItem(
      '@kesandu_pending_syncs',
      JSON.stringify(syncQueueRef.current)
    );

    setPendingSyncs(syncQueueRef.current.length);
    setLastSyncTime(new Date());

    await AsyncStorage.setItem(SYNC_STATE_KEY, new Date().toISOString());

    setCacheStatus('ready');
    return { success, failed };
  }, [isOnline]);

  // Mark content as stale
  const invalidateCache = useCallback(async (key) => {
    try {
      const cached = await AsyncStorage.getItem(`${OFFLINE_CACHE_KEY}_${key}`);
      if (cached) {
        const cacheEntry = JSON.parse(cached);
        cacheEntry.isStale = true;
        cacheEntry.invalidatedAt = new Date().toISOString();
        await AsyncStorage.setItem(
          `${OFFLINE_CACHE_KEY}_${key}`,
          JSON.stringify(cacheEntry)
        );
      }
    } catch (e) {
      console.error('Invalidate cache error:', e);
    }
  }, []);

  return {
    // State
    isOnline,
    cacheStatus,
    lastSyncTime,
    pendingSyncs,

    // Methods
    cacheContent,
    getCachedContent,
    getCacheStats,
    clearCache,
    queueForSync,
    syncPendingItems,
    invalidateCache,
  };
}

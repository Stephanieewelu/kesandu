import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase, TABLES } from '../config/supabase';

export default function useMobileSync() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [devices, setDevices] = useState([]);
  const [syncError, setSyncError] = useState(null);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        loadUserProfile(session.user);
      } else {
        setIsAuthenticated(false);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsAuthenticated(true);
        loadUserProfile(session.user);
      } else {
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.error('Auth check error:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (user) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setUserProfile({
          userId: data.id,
          email: user.email,
          name: data.name || user.email?.split('@')[0] || 'User',
          tier: data.tier || 'free',
          createdAt: data.created_at,
        });
      } else {
        setUserProfile({
          userId: user.id,
          email: user.email,
          name: user.email?.split('@')[0] || 'User',
          tier: 'free',
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('Load profile error:', e);
    }
  };

  const registerUser = useCallback(async (email, password, name) => {
    try {
      setLoading(true);

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // Create user profile
      const { data, error: profileError } = await supabase
        .from(TABLES.USERS)
        .insert([
          {
            id: authData.user.id,
            email,
            name,
            tier: 'free',
          },
        ])
        .select()
        .single();

      if (profileError) throw profileError;

      setIsAuthenticated(true);
      setUserProfile({
        userId: data.id,
        email: data.email,
        name: data.name,
        tier: data.tier,
        createdAt: data.created_at,
      });

      return data;
    } catch (e) {
      setSyncError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginUser = useCallback(async (email, password) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setIsAuthenticated(true);
      loadUserProfile(data.user);
      return data.user;
    } catch (e) {
      setSyncError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setUserProfile(null);
      setDevices([]);
    } catch (e) {
      console.error('Logout error:', e);
    }
  }, []);

  const registerDevice = useCallback(async (deviceName = 'Device') => {
    if (!userProfile) return null;

    try {
      const deviceId = `device_${Date.now()}`;
      const device = {
        deviceId,
        name: deviceName,
        platform: 'mobile',
        registeredAt: new Date().toISOString(),
        lastSync: new Date().toISOString(),
      };

      const updatedDevices = [...devices, device];
      setDevices(updatedDevices);

      return device;
    } catch (e) {
      setSyncError(e.message);
      return null;
    }
  }, [userProfile, devices]);

  const queueSync = useCallback(async (dataType, action, data) => {
    if (!userProfile) return null;

    try {
      const syncItem = {
        id: `sync_${Date.now()}_${Math.random()}`,
        dataType,
        action,
        data,
        timestamp: new Date().toISOString(),
        synced: false,
      };

      // Log to sync_log table
      await supabase.from(TABLES.SYNC_LOG).insert([
        {
          user_id: userProfile.userId,
          action,
          table_name: dataType,
          item_id: data?.id,
          status: 'pending',
        },
      ]);

      setPendingChanges(prev => [...prev, syncItem]);
      return syncItem.id;
    } catch (e) {
      setSyncError(e.message);
      return null;
    }
  }, [userProfile]);

  const performSync = useCallback(async (onProgress) => {
    if (!userProfile) return { success: 0, failed: 0 };

    setSyncStatus('syncing');
    setSyncError(null);
    let success = 0;
    let failed = 0;

    try {
      for (let i = 0; i < pendingChanges.length; i++) {
        const syncItem = pendingChanges[i];

        try {
          // Sync to appropriate table
          await syncToSupabase(syncItem);
          success += 1;

          onProgress?.({
            current: i + 1,
            total: pendingChanges.length,
            item: syncItem,
          });
        } catch (e) {
          console.error('Sync error:', e);
          failed += 1;
        }
      }

      setPendingChanges([]);
      setLastSyncTime(new Date());
      setSyncStatus('success');

      // Reset status after 2 seconds
      setTimeout(() => setSyncStatus('idle'), 2000);

      return { success, failed };
    } catch (e) {
      setSyncError(e.message);
      setSyncStatus('error');
      return { success, failed };
    }
  }, [userProfile, pendingChanges]);

  const syncToSupabase = async (syncItem) => {
    if (!userProfile) throw new Error('Not authenticated');

    const { dataType, action, data } = syncItem;

    switch (dataType) {
      case 'interviews':
        await supabase.from(TABLES.INTERVIEWS).insert([
          { user_id: userProfile.userId, ...data },
        ]);
        break;

      case 'practice_problems':
        await supabase.from(TABLES.PRACTICE_PROBLEMS).insert([
          { user_id: userProfile.userId, ...data },
        ]);
        break;

      case 'code_reviews':
        await supabase.from(TABLES.CODE_REVIEWS).insert([
          { user_id: userProfile.userId, ...data },
        ]);
        break;

      case 'portfolio_items':
        await supabase.from(TABLES.PORTFOLIO_ITEMS).insert([
          { user_id: userProfile.userId, ...data },
        ]);
        break;

      case 'spaced_repetition':
        await supabase.from(TABLES.SPACED_REPETITION).insert([
          { user_id: userProfile.userId, ...data },
        ]);
        break;

      default:
        throw new Error(`Unknown data type: ${dataType}`);
    }
  };

  const getSyncStats = useCallback(async () => {
    if (!userProfile) {
      return {
        lastSyncTime: null,
        deviceCount: 0,
        pendingChanges: 0,
        syncedItems: 0,
        totalSyncs: 0,
      };
    }

    try {
      const { count } = await supabase
        .from(TABLES.SYNC_LOG)
        .select('*', { count: 'exact' })
        .eq('user_id', userProfile.userId)
        .eq('status', 'completed');

      return {
        lastSyncTime,
        deviceCount: devices.length,
        pendingChanges: pendingChanges.length,
        syncedItems: count || 0,
        totalSyncs: pendingChanges.length + (count || 0),
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
  }, [userProfile, lastSyncTime, devices, pendingChanges]);

  const removeDevice = useCallback(async (deviceId) => {
    try {
      const updatedDevices = devices.filter(d => d.deviceId !== deviceId);
      setDevices(updatedDevices);
    } catch (e) {
      setSyncError(e.message);
    }
  }, [devices]);

  const clearSyncHistory = useCallback(async () => {
    if (!userProfile) return;

    try {
      await supabase
        .from(TABLES.SYNC_LOG)
        .delete()
        .eq('user_id', userProfile.userId);

      setPendingChanges([]);
    } catch (e) {
      setSyncError(e.message);
    }
  }, [userProfile]);

  return {
    // Auth
    isAuthenticated,
    userProfile,
    loading,
    registerUser,
    loginUser,
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

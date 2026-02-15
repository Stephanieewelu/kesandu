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
    // Initialize auth state from Supabase
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Attempting to restore session...');

        // First try to restore session from localStorage/AsyncStorage with timeout
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session restore timeout')), 5000)
        );

        const { data: { session }, error } = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ]);

        if (isMounted) {
          if (error) {
            console.warn('⚠️  Session restore error (will retry with auth state):', error.message);
            // Don't fail immediately - let auth state listener try
            setLoading(false);
          } else if (session?.user) {
            console.log('✅ Session restored from storage:', session.user.email);
            setIsAuthenticated(true);
            await loadUserProfile(session.user);
            setLoading(false);
          } else {
            console.log('ℹ️  No session found');
            setIsAuthenticated(false);
            setLoading(false);
          }
        }
      } catch (e) {
        console.error('❌ Auth initialization error:', e.message);
        if (isMounted) {
          // Don't immediately fail - auth state change listener will handle it
          console.log('⏱️  Moving to auth state listener...');
          setLoading(false);
        }
      }
    };

    // Start initialization
    initializeAuth();

    // Also subscribe to auth changes for real-time updates
    // This listener will catch auth state changes that might be missed by getSession
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth state changed:', event, session?.user?.email);
      if (isMounted) {
        if (session?.user) {
          setIsAuthenticated(true);
          loadUserProfile(session.user);
        } else {
          setIsAuthenticated(false);
          setUserProfile(null);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (session?.user) {
        setIsAuthenticated(true);
        await loadUserProfile(session.user);
      } else {
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.error('Auth check error:', e);
      setIsAuthenticated(false);
    }
  };

  const loadUserProfile = async (user) => {
    try {
      console.log('📝 Loading user profile for:', user.email);

      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', user.id)
        .single();

      // PGRST116 = not found, 406 = not acceptable/RLS issue
      // In both cases, create a basic profile from auth user
      if (error && error.code !== 'PGRST116' && error.status !== 406) {
        console.error('❌ Profile load error:', error.code, error.message);
        throw error;
      }

      if (data) {
        console.log('✅ Profile found in database');
        setUserProfile({
          userId: data.id,
          email: user.email,
          name: data.name || user.email?.split('@')[0] || 'User',
          tier: data.tier || 'free',
          createdAt: data.created_at,
        });
      } else {
        console.log('ℹ️  Profile not found, using auth data as fallback');
        setUserProfile({
          userId: user.id,
          email: user.email,
          name: user.email?.split('@')[0] || 'User',
          tier: 'free',
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('❌ Load profile error:', e.message);
      // Even if profile load fails, set a minimal profile so app can proceed
      console.log('⚠️  Setting fallback profile');
      setUserProfile({
        userId: user.id,
        email: user.email,
        name: user.email?.split('@')[0] || 'User',
        tier: 'free',
        createdAt: new Date().toISOString(),
      });
    }
  };

  const registerUser = useCallback(async (email, password, name) => {
    try {
      setLoading(true);
      setSyncError(null);

      // Sign up with Supabase Auth - name will be stored in metadata
      // The database trigger will automatically create the user profile
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
          },
        },
      });

      if (authError) throw authError;

      // Wait a moment for trigger to create profile
      await new Promise(resolve => setTimeout(resolve, 500));

      // Load the auto-created profile
      const { data: profileData, error: profileError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.warn('Profile not found immediately, will be created by trigger');
      }

      setIsAuthenticated(true);
      setUserProfile({
        userId: authData.user.id,
        email: authData.user.email,
        name: profileData?.name || name || email.split('@')[0],
        tier: profileData?.tier || 'free',
        createdAt: profileData?.created_at || new Date().toISOString(),
      });

      return authData.user;
    } catch (e) {
      setSyncError(e.message);
      console.error('Registration error:', e);
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

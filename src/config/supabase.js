import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Use environment variables from .env with fallbacks for backward compatibility
const SUPABASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://mqgmknhvartnuyjcqiwk.supabase.co';

const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xZ21rbmh2YXJ0bnV5amNxaXdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNDgwMDAsImV4cCI6MjA4NDYyNDAwMH0.LtC0xcpMgzX-y0TRGuFjkFwgw9QjfzPryUqWirw7IGs';

// Configure storage for session persistence
// On web, use browser localStorage (default), on native use AsyncStorage
const supabaseConfig = {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfig);

// Kesandu tables
export const TABLES = {
  USERS: 'users',
  INTERVIEWS: 'interviews',
  PRACTICE_PROBLEMS: 'practice_problems',
  CODE_REVIEWS: 'code_reviews',
  PORTFOLIO_ITEMS: 'portfolio_items',
  SPACED_REPETITION: 'spaced_repetition',
  SYNC_LOG: 'sync_log',
};

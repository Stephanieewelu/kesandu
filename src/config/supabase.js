import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mqgmknhvartnuyjcqiwk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xZ21rbmh2YXJ0bnV5amNxaXdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNDgwMDAsImV4cCI6MjA4NDYyNDAwMH0.LtC0xcpMgzX-y0TRGuFjkFwgw9QjfzPryUqWirw7IGs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

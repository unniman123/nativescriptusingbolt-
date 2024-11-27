import { createClient } from '@supabase/supabase-js';
import fetch from 'cross-fetch';
import { alert } from '@nativescript/core';

const supabaseUrl = 'https://juouxhxiyxmwyhkupvca.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1b3V4aHhpeXhtd3loa3VwdmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2MjkwMzcsImV4cCI6MjA0ODIwNTAzN30.q26TZuw-kbIWFt5WsR7f8ZqE0fXT-ZAss98GuRI_-bM';

const options = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  },
  global: {
    fetch: fetch
  }
};

export function initializeSupabase() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, options);
    return supabase;
  } catch (error) {
    console.error('Supabase initialization error:', error);
    alert({
      title: 'Initialization Error',
      message: 'Failed to initialize Supabase client',
      okButtonText: 'OK'
    });
    throw error;
  }
}

// Initialize Supabase client
export const supabase = initializeSupabase();

// Add a null check function
export function getSupabase() {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  return supabase;
}

// Database types
export type Profile = {
  id: string;
  username: string;
  game_id?: string;
  avatar_url?: string;
  wallet_balance: number;
  created_at: string;
};

export type Tournament = {
  id: string;
  title: string;
  game_type: string;
  entry_fee: number;
  prize_pool: number;
  max_participants: number;
  current_participants: number;
  status: 'open' | 'in_progress' | 'completed';
  start_time: string;
  created_at: string;
  rules?: string;
};

export type Match = {
  id: string;
  tournament_id: string;
  player1_id: string;
  player2_id: string;
  player1_score?: number;
  player2_score?: number;
  winner_id?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'disputed';
  scheduled_time: string;
  created_at: string;
  round?: number;
  match_number?: number;
  duration?: number;
  player1?: { username: string, game_id?: string };
  player2?: { username: string, game_id?: string };
};

export type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'entry_fee' | 'prize';
  status: 'pending' | 'completed' | 'failed';
  reference_id?: string;
  created_at: string;
};
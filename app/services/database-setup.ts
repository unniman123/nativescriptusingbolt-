import { supabase } from './supabase';

export async function setupDatabase() {
  if (!supabase) return;

  try {
    // Create profiles table
    await supabase.rpc('setup_profiles_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID REFERENCES auth.users(id) PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          game_id TEXT,
          avatar_url TEXT,
          wallet_balance DECIMAL(10,2) DEFAULT 0.00,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          CONSTRAINT username_length CHECK (char_length(username) >= 3)
        );
        
        CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);
      `
    });

    // Create tournaments table
    await supabase.rpc('setup_tournaments_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS tournaments (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          title TEXT NOT NULL,
          game_type TEXT NOT NULL,
          entry_fee DECIMAL(10,2) NOT NULL,
          prize_pool DECIMAL(10,2) NOT NULL,
          max_participants INTEGER NOT NULL,
          current_participants INTEGER DEFAULT 0,
          status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed')),
          start_time TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS tournaments_status_idx ON tournaments(status);
      `
    });

    // Create matches table
    await supabase.rpc('setup_matches_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS matches (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          tournament_id UUID REFERENCES tournaments(id),
          player1_id UUID REFERENCES profiles(id),
          player2_id UUID REFERENCES profiles(id),
          player1_score INTEGER,
          player2_score INTEGER,
          winner_id UUID REFERENCES profiles(id),
          status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'disputed')),
          scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS matches_tournament_idx ON matches(tournament_id);
        CREATE INDEX IF NOT EXISTS matches_players_idx ON matches(player1_id, player2_id);
      `
    });

    // Create transactions table
    await supabase.rpc('setup_transactions_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS transactions (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES profiles(id),
          amount DECIMAL(10,2) NOT NULL,
          type TEXT CHECK (type IN ('deposit', 'withdrawal', 'entry_fee', 'prize')),
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
          reference_id TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS transactions_user_idx ON transactions(user_id);
        CREATE INDEX IF NOT EXISTS transactions_status_idx ON transactions(status);
      `
    });

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}
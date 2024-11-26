import { supabase } from './supabase';
import type { Tournament } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export class TournamentService {
  private static tournamentChannel: RealtimeChannel | null = null;

  static async listTournaments(filters?: {
    status?: 'open' | 'in_progress' | 'completed';
    gameType?: string;
  }): Promise<Tournament[]> {
    let query = supabase.from('tournaments').select(`
      *,
      participants:tournament_participants(count)
    `);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.gameType) {
      query = query.eq('game_type', filters.gameType);
    }

    const { data, error } = await query.order('start_time', { ascending: true });
    if (error) throw new Error(`Failed to list tournaments: ${error.message}`);
    return data;
  }

  static async createTournament(tournament: Partial<Tournament>): Promise<Tournament> {
    // Validate tournament data
    if (!tournament.title || !tournament.game_type || !tournament.entry_fee || !tournament.max_participants) {
      throw new Error('Missing required tournament fields');
    }

    const { data, error } = await supabase
      .from('tournaments')
      .insert([{
        ...tournament,
        prize_pool: tournament.entry_fee * tournament.max_participants * 0.9, // 90% of total entry fees
        status: 'open'
      }])
      .select()
      .single();

    if (error) throw new Error(`Failed to create tournament: ${error.message}`);
    return data;
  }

  static async joinTournament(tournamentId: string, userId: string): Promise<void> {
    // First check if user can join
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (!tournament) throw new Error('Tournament not found');
    if (tournament.status !== 'open') throw new Error('Tournament is not open for joining');
    if (tournament.current_participants >= tournament.max_participants) {
      throw new Error('Tournament is full');
    }

    const { error } = await supabase.rpc('join_tournament', {
      p_tournament_id: tournamentId,
      p_user_id: userId
    });

    if (error) throw new Error(`Failed to join tournament: ${error.message}`);
  }

  static async getTournamentDetails(tournamentId: string): Promise<Tournament & { participants: any[] }> {
    const { data, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        participants:tournament_participants(
          user:profiles(id, username, game_id)
        )
      `)
      .eq('id', tournamentId)
      .single();

    if (error) throw new Error(`Failed to get tournament details: ${error.message}`);
    return data;
  }

  static subscribeToTournament(tournamentId: string, callback: (tournament: Tournament) => void): void {
    this.tournamentChannel?.unsubscribe();
    
    this.tournamentChannel = supabase
      .channel(`tournament:${tournamentId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tournaments',
          filter: `id=eq.${tournamentId}`
        }, 
        payload => {
          callback(payload.new as Tournament);
        }
      )
      .subscribe();
  }

  static async checkTournamentEligibility(userId: string, tournamentId: string): Promise<{ eligible: boolean; reason?: string }> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_balance, game_id')
      .eq('id', userId)
      .single();

    const { data: tournament } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (!profile.game_id) {
      return { eligible: false, reason: 'Game ID not set' };
    }

    if (profile.wallet_balance < tournament.entry_fee) {
      return { eligible: false, reason: 'Insufficient balance' };
    }

    return { eligible: true };
  }

  static unsubscribeFromTournament(): void {
    this.tournamentChannel?.unsubscribe();
    this.tournamentChannel = null;
  }
}
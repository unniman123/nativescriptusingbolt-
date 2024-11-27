import { supabase } from './supabase';
import type { Match, Tournament } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export class MatchService {
  private static matchChannel: RealtimeChannel | null = null;

  static async getMatchesByTournament(tournamentId: string): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        player1:player1_id(username, game_id),
        player2:player2_id(username, game_id),
        tournament:tournament_id(*)
      `)
      .eq('tournament_id', tournamentId)
      .order('scheduled_time', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async getUserMatches(userId: string, filter?: 'upcoming' | 'active' | 'completed'): Promise<Match[]> {
    let query = supabase
      .from('matches')
      .select(`
        *,
        player1:player1_id(username, game_id),
        player2:player2_id(username, game_id),
        tournament:tournament_id(*)
      `)
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`);

    if (filter) {
      switch (filter) {
        case 'upcoming':
          query = query.eq('status', 'scheduled');
          break;
        case 'active':
          query = query.eq('status', 'in_progress');
          break;
        case 'completed':
          query = query.eq('status', 'completed');
          break;
      }
    }

    const { data, error } = await query.order('scheduled_time', { ascending: filter === 'upcoming' });
    if (error) throw error;
    return data;
  }

  static async submitMatchResult(
    matchId: string,
    player1Score: number,
    player2Score: number,
    winnerId: string,
    submitterId: string
  ): Promise<Match> {
    // Validate match submission
    const { data: match } = await supabase
      .from('matches')
      .select('*, tournament:tournament_id(*)')
      .eq('id', matchId)
      .single();

    if (!match) throw new Error('Match not found');
    if (match.status === 'completed') throw new Error('Match already completed');
    if (match.player1_id !== submitterId && match.player2_id !== submitterId) {
      throw new Error('Not authorized to submit match result');
    }

    // Start a transaction
    const { data, error } = await supabase.rpc('submit_match_result', {
      p_match_id: matchId,
      p_player1_score: player1Score,
      p_player2_score: player2Score,
      p_winner_id: winnerId,
      p_submitter_id: submitterId
    });

    if (error) throw error;
    return data;
  }

  static async disputeMatch(
    matchId: string, 
    disputedBy: string, 
    reason: string
  ): Promise<Match> {
    const { data: match } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (!match) throw new Error('Match not found');
    if (match.status === 'disputed') throw new Error('Match already disputed');
    if (match.player1_id !== disputedBy && match.player2_id !== disputedBy) {
      throw new Error('Not authorized to dispute match');
    }

    const { data, error } = await supabase
      .from('matches')
      .update({ 
        status: 'disputed',
        disputed_by: disputedBy,
        dispute_reason: reason,
        disputed_at: new Date().toISOString()
      })
      .eq('id', matchId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Tournament Integration Methods
  static async generateTournamentMatches(tournamentId: string): Promise<void> {
    const { error } = await supabase.rpc('generate_tournament_matches', {
      p_tournament_id: tournamentId
    });

    if (error) throw error;
  }

  static async updateTournamentProgress(tournamentId: string): Promise<void> {
    const { error } = await supabase.rpc('update_tournament_progress', {
      p_tournament_id: tournamentId
    });

    if (error) throw error;
  }

  // Admin Features
  static async adminOverrideMatchResult(
    matchId: string,
    winnerId: string,
    adminId: string,
    reason: string
  ): Promise<Match> {
    const { data, error } = await supabase.rpc('admin_override_match_result', {
      p_match_id: matchId,
      p_winner_id: winnerId,
      p_admin_id: adminId,
      p_reason: reason
    });

    if (error) throw error;
    return data;
  }

  static async adminResolveDispute(
    matchId: string,
    resolution: 'upheld' | 'rejected',
    winnerId: string | null,
    adminId: string,
    resolution_notes: string
  ): Promise<Match> {
    const { data, error } = await supabase.rpc('admin_resolve_dispute', {
      p_match_id: matchId,
      p_resolution: resolution,
      p_winner_id: winnerId,
      p_admin_id: adminId,
      p_resolution_notes: resolution_notes
    });

    if (error) throw error;
    return data;
  }

  // Real-time Subscriptions
  static subscribeToMatch(matchId: string, callback: (match: Match) => void): void {
    this.matchChannel?.unsubscribe();
    
    this.matchChannel = supabase
      .channel(`match:${matchId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'matches',
          filter: `id=eq.${matchId}`
        }, 
        payload => {
          callback(payload.new as Match);
        }
      )
      .subscribe();
  }

  static subscribeToUserMatches(userId: string, callback: (match: Match) => void): void {
    this.matchChannel?.unsubscribe();
    
    this.matchChannel = supabase
      .channel(`user_matches:${userId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'matches',
          filter: `or(player1_id.eq.${userId},player2_id.eq.${userId})`
        }, 
        payload => {
          callback(payload.new as Match);
        }
      )
      .subscribe();
  }

  static unsubscribeFromMatch(): void {
    this.matchChannel?.unsubscribe();
    this.matchChannel = null;
  }
}
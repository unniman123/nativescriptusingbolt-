import { supabase } from './supabase';
import type { Match, Tournament } from './supabase';
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
    if (!tournament.title || !tournament.game_type || !tournament.max_participants) {
      throw new Error('Missing required tournament fields');
    }

    const { data, error } = await supabase
      .from('tournaments')
      .insert([{
        ...tournament,
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

    if (!profile) {
      return { eligible: false, reason: 'User profile not found' };
    }

    if (!profile.game_id) {
      return { eligible: false, reason: 'Game ID not set' };
    }

    return { eligible: true };
  }

  static unsubscribeFromTournament(): void {
    this.tournamentChannel?.unsubscribe();
    this.tournamentChannel = null;
  }

  static async getTournamentMatches(tournamentId: string): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        player1:player1_id(username),
        player2:player2_id(username)
      `)
      .eq('tournament_id', tournamentId)
      .order('match_number', { ascending: true });

    if (error) throw new Error(`Failed to get tournament matches: ${error.message}`);
    return data.map(match => ({
      ...match,
      player1_name: match.player1?.username || 'TBD',
      player2_name: match.player2?.username || 'TBD'
    }));
  }

  static async submitMatchResult(matchId: string, winnerId: string): Promise<void> {
    const { error } = await supabase
      .from('matches')
      .update({
        winner_id: winnerId,
        status: 'completed'
      })
      .eq('id', matchId);

    if (error) throw new Error(`Failed to submit match result: ${error.message}`);
  }

  static subscribeToMatches(tournamentId: string, callback: (match: Match) => void): void {
    this.tournamentChannel = supabase
      .channel(`tournament-${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `tournament_id=eq.${tournamentId}`
        },
        (payload) => {
          callback(payload.new as Match);
        }
      )
      .subscribe();
  }

  static unsubscribeFromMatches(tournamentId: string): void {
    if (this.tournamentChannel) {
      supabase.removeChannel(this.tournamentChannel);
      this.tournamentChannel = null;
    }
  }

  static async generateMatches(tournamentId: string): Promise<void> {
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*, participants:tournament_participants(user_id)')
      .eq('id', tournamentId)
      .single();

    if (tournamentError) throw new Error(`Failed to get tournament: ${tournamentError.message}`);

    const participants = tournament.participants.map(p => p.user_id);
    if (participants.length < 2) {
      throw new Error('Not enough participants to generate matches');
    }

    // Shuffle participants
    for (let i = participants.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [participants[i], participants[j]] = [participants[j], participants[i]];
    }

    const matches: Match[] = [];
    for (let i = 0; i < participants.length - 1; i += 2) {
      matches.push({
        tournament_id: tournamentId,
        player1_id: participants[i],
        player2_id: participants[i + 1],
        status: 'scheduled',
        scheduled_time: new Date().toISOString(),
        created_at: new Date().toISOString(),
        round: 1,
        match_number: Math.floor(i / 2) + 1
      } as Match);
    }

    // If odd number of participants, last player gets a bye
    if (participants.length % 2 !== 0) {
      matches.push({
        tournament_id: tournamentId,
        player1_id: participants[participants.length - 1],
        status: 'scheduled',
        scheduled_time: new Date().toISOString(),
        created_at: new Date().toISOString(),
        round: 1,
        match_number: Math.ceil(participants.length / 2)
      } as Match);
    }

    const { error: matchError } = await supabase
      .from('matches')
      .insert(matches);

    if (matchError) throw new Error(`Failed to generate matches: ${matchError.message}`);

    // Update tournament status
    const { error: updateError } = await supabase
      .from('tournaments')
      .update({ status: 'in_progress' })
      .eq('id', tournamentId);

    if (updateError) throw new Error(`Failed to update tournament status: ${updateError.message}`);
  }

  static async distributePrizes(tournamentId: string): Promise<void> {
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*, matches(winner_id)')
      .eq('id', tournamentId)
      .single();

    if (tournamentError) throw new Error(`Failed to get tournament: ${tournamentError.message}`);

    // Get unique winners
    const winners = new Set(tournament.matches.map(m => m.winner_id).filter(Boolean));

    // Create transactions for prize distribution
    const transactions = Array.from(winners).map((winnerId) => ({
      user_id: winnerId,
      type: 'prize',
      status: 'pending',
      reference_id: `tournament_${tournamentId}_prize`
    }));

    const { error: transactionError } = await supabase
      .from('transactions')
      .insert(transactions);

    if (transactionError) throw new Error(`Failed to create prize transactions: ${transactionError.message}`);

    // Update tournament status
    const { error: updateError } = await supabase
      .from('tournaments')
      .update({ status: 'completed' })
      .eq('id', tournamentId);

    if (updateError) throw new Error(`Failed to update tournament status: ${updateError.message}`);
  }

  static async verifyUserEligibility(tournamentId: string, userId: string): Promise<{ eligible: boolean, reason?: string }> {
    // Get user and tournament details
    const [{ data: user, error: userError }, { data: tournament, error: tournamentError }] = await Promise.all([
      supabase.from('users').select('wallet_balance, game_id').eq('id', userId).single(),
      supabase.from('tournaments').select('game_type').eq('id', tournamentId).single()
    ]);

    // Check for errors or missing user
    if (userError || !user) {
      return { 
        eligible: false, 
        reason: userError ? 
          `User lookup failed: ${userError.message}` : 
          'User not found. Please check your account.'
      };
    }

    if (!user.game_id) {
      return { eligible: false, reason: 'Game ID not set. Please update your profile.' };
    }

    // Check for tournament errors
    if (tournamentError || !tournament) {
      return {
        eligible: false,
        reason: tournamentError ?
          `Tournament lookup failed: ${tournamentError.message}` :
          'Tournament not found.'
      };
    }

    return { eligible: true };
  }

  static async cancelTournament(tournamentId: string, reason: string): Promise<void> {
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*, tournament_participants(user_id)')
      .eq('id', tournamentId)
      .single();

    if (tournamentError) throw new Error(`Failed to get tournament: ${tournamentError.message}`);

    // Create refund transactions for all participants
    const refundTransactions = tournament.tournament_participants.map(participant => ({
      user_id: participant.user_id,
      type: 'refund',
      status: 'pending',
      reference_id: `tournament_${tournamentId}_refund`
    }));

    const { error: transactionError } = await supabase
      .from('transactions')
      .insert(refundTransactions);

    if (transactionError) throw new Error(`Failed to create refund transactions: ${transactionError.message}`);

    // Update tournament status
    const { error: updateError } = await supabase
      .from('tournaments')
      .update({ 
        status: 'cancelled',
        cancellation_reason: reason
      })
      .eq('id', tournamentId);

    if (updateError) throw new Error(`Failed to update tournament status: ${updateError.message}`);
  }

  static async reportMatchDispute(matchId: string, reporterId: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('match_disputes')
      .insert([{
        match_id: matchId,
        reporter_id: reporterId,
        reason: reason,
        status: 'pending'
      }]);

    if (error) throw new Error(`Failed to report dispute: ${error.message}`);

    // Update match status
    const { error: updateError } = await supabase
      .from('matches')
      .update({ status: 'disputed' })
      .eq('id', matchId);

    if (updateError) throw new Error(`Failed to update match status: ${updateError.message}`);
  }

  static async resolveMatchDispute(disputeId: string, resolution: 'upheld' | 'rejected', winnerId?: string): Promise<void> {
    const { data: dispute, error: disputeError } = await supabase
      .from('match_disputes')
      .select('*, match:match_id(*)')
      .eq('id', disputeId)
      .single();

    if (disputeError) throw new Error(`Failed to get dispute: ${disputeError.message}`);

    // Update dispute status
    const { error: updateDisputeError } = await supabase
      .from('match_disputes')
      .update({ 
        status: resolution,
        resolution_notes: resolution === 'upheld' ? 'Dispute upheld, match result updated' : 'Dispute rejected, original result stands'
      })
      .eq('id', disputeId);

    if (updateDisputeError) throw new Error(`Failed to update dispute: ${updateDisputeError.message}`);

    // If dispute is upheld and winner is specified, update match result
    if (resolution === 'upheld' && winnerId) {
      const { error: matchError } = await supabase
        .from('matches')
        .update({ 
          winner_id: winnerId,
          status: 'completed'
        })
        .eq('id', dispute.match.id);

      if (matchError) throw new Error(`Failed to update match result: ${matchError.message}`);
    } else {
      // If dispute is rejected, revert match status to completed
      const { error: matchError } = await supabase
        .from('matches')
        .update({ status: 'completed' })
        .eq('id', dispute.match.id);

      if (matchError) throw new Error(`Failed to update match status: ${matchError.message}`);
    }
  }
}
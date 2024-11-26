import { supabase } from './supabase';
import type { Match } from './supabase';

export class MatchService {
  static async getMatchesByTournament(tournamentId: string): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('scheduled_time', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async getUserMatches(userId: string): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .order('scheduled_time', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async submitMatchResult(
    matchId: string,
    player1Score: number,
    player2Score: number,
    winnerId: string
  ): Promise<Match> {
    const { data, error } = await supabase
      .from('matches')
      .update({
        player1_score: player1Score,
        player2_score: player2Score,
        winner_id: winnerId,
        status: 'completed'
      })
      .eq('id', matchId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async disputeMatch(matchId: string): Promise<Match> {
    const { data, error } = await supabase
      .from('matches')
      .update({ status: 'disputed' })
      .eq('id', matchId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
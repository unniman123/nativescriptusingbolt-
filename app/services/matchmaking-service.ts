import { supabase } from './supabase';
import { Observable } from '@nativescript/core';
import type { Profile, Match } from './supabase';

interface MatchmakingPreferences {
    gameMode: string;
    skillRange: number;
    regionPreference?: string;
    availabilityWindow: number; // in minutes
}

interface PlayerStats {
    userId: string;
    skillRating: number;
    recentWinRate: number;
    averageScore: number;
    gamesPlayed: number;
    preferredGameModes: string[];
    activeRegion: string;
}

export class MatchmakingService extends Observable {
    private static instance: MatchmakingService;
    private matchmakingQueue: Map<string, { 
        userId: string,
        preferences: MatchmakingPreferences,
        joinedAt: Date,
        stats: PlayerStats
    }> = new Map();

    private constructor() {
        super();
    }

    public static getInstance(): MatchmakingService {
        if (!MatchmakingService.instance) {
            MatchmakingService.instance = new MatchmakingService();
        }
        return MatchmakingService.instance;
    }

    async joinMatchmaking(
        userId: string, 
        preferences: MatchmakingPreferences
    ): Promise<void> {
        const stats = await this.getPlayerStats(userId);
        this.matchmakingQueue.set(userId, {
            userId,
            preferences,
            joinedAt: new Date(),
            stats
        });
        
        // Start matchmaking process
        this.processMatchmaking();
    }

    async leaveMatchmaking(userId: string): Promise<void> {
        this.matchmakingQueue.delete(userId);
    }

    private async getPlayerStats(userId: string): Promise<PlayerStats> {
        // Ensure Supabase is initialized
        if (!supabase) {
            console.error('Supabase client is not initialized');
            throw new Error('Supabase client is not available');
        }

        // Fetch player's match history
        const { data: matches, error } = await supabase
            .from('matches')
            .select('*')
            .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
            .order('completed_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('Error fetching player stats:', error);
            throw error;
        }

        // Calculate player statistics
        let wins = 0;
        let totalScore = 0;
        const gameModes = new Set<string>();

        matches?.forEach(match => {
            if (match.winner_id === userId) wins++;
            if (match.player1_id === userId) {
                totalScore += match.player1_score || 0;
            } else {
                totalScore += match.player2_score || 0;
            }
            if (match.game_mode) gameModes.add(match.game_mode);
        });

        // Get player's skill rating from the players table
        const { data: player, error: playerError } = await supabase
            .from('players')
            .select('skill_rating, active_region')
            .eq('id', userId)
            .single();

        if (playerError) {
            console.error('Error fetching player skill rating:', playerError);
            throw playerError;
        }

        return {
            userId,
            skillRating: player?.skill_rating || 1000,
            recentWinRate: matches ? wins / matches.length : 0,
            averageScore: matches ? totalScore / matches.length : 0,
            gamesPlayed: matches?.length || 0,
            preferredGameModes: Array.from(gameModes),
            activeRegion: player?.active_region || 'global'
        };
    }

    private async processMatchmaking(): Promise<void> {
        const players = Array.from(this.matchmakingQueue.values());
        
        // Sort by wait time to prioritize players waiting longer
        players.sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());

        for (let i = 0; i < players.length; i++) {
            const player1 = players[i];
            if (!this.matchmakingQueue.has(player1.userId)) continue;

            // Find best match for player1
            let bestMatch: typeof player1 | null = null;
            let bestScore = -1;

            for (let j = i + 1; j < players.length; j++) {
                const player2 = players[j];
                if (!this.matchmakingQueue.has(player2.userId)) continue;

                const matchScore = this.calculateMatchScore(player1, player2);
                if (matchScore > bestScore) {
                    bestScore = matchScore;
                    bestMatch = player2;
                }
            }

            // If we found a good match, create it
            if (bestMatch && bestScore >= 0.6) {
                await this.createMatch(player1, bestMatch);
                this.matchmakingQueue.delete(player1.userId);
                this.matchmakingQueue.delete(bestMatch.userId);
            }
        }

        // Check for timeout and notify players
        const now = new Date();
        players.forEach(player => {
            const waitTime = (now.getTime() - player.joinedAt.getTime()) / 1000 / 60; // minutes
            if (waitTime > player.preferences.availabilityWindow) {
                this.notifyMatchmakingTimeout(player.userId);
                this.matchmakingQueue.delete(player.userId);
            }
        });
    }

    private calculateMatchScore(
        player1: { stats: PlayerStats; preferences: MatchmakingPreferences },
        player2: { stats: PlayerStats; preferences: MatchmakingPreferences }
    ): number {
        // Skill Rating Difference (40% weight)
        const skillDiff = Math.abs(player1.stats.skillRating - player2.stats.skillRating);
        const skillScore = Math.max(0, 1 - skillDiff / player1.preferences.skillRange);

        // Region Compatibility (20% weight)
        const regionScore = player1.stats.activeRegion === player2.stats.activeRegion ? 1 : 0.5;

        // Game Mode Preference (20% weight)
        const gameModeScore = player1.preferences.gameMode === player2.preferences.gameMode ? 1 : 0;

        // Experience Level Compatibility (20% weight)
        const expDiff = Math.abs(player1.stats.gamesPlayed - player2.stats.gamesPlayed);
        const expScore = Math.max(0, 1 - expDiff / Math.max(player1.stats.gamesPlayed, player2.stats.gamesPlayed));

        // Weighted Average
        return (
            skillScore * 0.4 +
            regionScore * 0.2 +
            gameModeScore * 0.2 +
            expScore * 0.2
        );
    }

    private async createMatch(
        player1: { userId: string; preferences: MatchmakingPreferences },
        player2: { userId: string; preferences: MatchmakingPreferences }
    ): Promise<void> {
        const { data: match, error } = await supabase
            .from('matches')
            .insert({
                player1_id: player1.userId,
                player2_id: player2.userId,
                status: 'scheduled',
                game_mode: player1.preferences.gameMode,
                scheduled_time: new Date().toISOString(),
                matchmaking_data: {
                    player1_preferences: player1.preferences,
                    player2_preferences: player2.preferences
                }
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating match:', error);
            throw error;
        }

        // Notify players of the match
        this.notifyMatchCreated(match);
    }

    private notifyMatchCreated(match: Match): void {
        // Emit event for real-time notifications
        this.notify({
            eventName: 'matchCreated',
            object: this,
            match
        });
    }

    private notifyMatchmakingTimeout(userId: string): void {
        // Emit event for real-time notifications
        this.notify({
            eventName: 'matchmakingTimeout',
            object: this,
            userId
        });
    }

    // Matchmaking Analytics
    async getMatchmakingStats(): Promise<{
        averageWaitTime: number;
        matchQuality: number;
        activePlayersCount: number;
        regionDistribution: Record<string, number>;
    }> {
        const { data: matches, error } = await supabase
            .from('matches')
            .select('*')
            .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        if (error) {
            console.error('Error fetching matchmaking stats:', error);
            throw error;
        }

        const stats = {
            averageWaitTime: 0,
            matchQuality: 0,
            activePlayersCount: this.matchmakingQueue.size,
            regionDistribution: {} as Record<string, number>
        };

        if (matches) {
            // Calculate statistics
            matches.forEach(match => {
                if (match.matchmaking_data) {
                    stats.averageWaitTime += match.matchmaking_data.wait_time || 0;
                    stats.matchQuality += match.matchmaking_data.match_quality || 0;
                }
            });

            stats.averageWaitTime /= matches.length || 1;
            stats.matchQuality /= matches.length || 1;
        }

        // Calculate region distribution
        this.matchmakingQueue.forEach(player => {
            const region = player.stats.activeRegion;
            stats.regionDistribution[region] = (stats.regionDistribution[region] || 0) + 1;
        });

        return stats;
    }
}

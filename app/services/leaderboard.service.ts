import { Observable } from '@nativescript/core';
import { supabase } from './supabase';
import { realtime } from './realtime.service';

export interface LeaderboardEntry {
    id: string;
    user_id: string;
    points: number;
    wins: number;
    losses: number;
    tournaments_won: number;
    rank: number;
    updated_at: string;
    user?: {
        username: string;
        avatar_url?: string;
    };
}

export class LeaderboardService extends Observable {
    private static instance: LeaderboardService;
    private isWatching = false;

    private constructor() {
        super();
    }

    public static getInstance(): LeaderboardService {
        if (!LeaderboardService.instance) {
            LeaderboardService.instance = new LeaderboardService();
        }
        return LeaderboardService.instance;
    }

    public async getLeaderboard(limit = 100, offset = 0): Promise<LeaderboardEntry[]> {
        const { data, error } = await supabase
            .from('leaderboard_entries')
            .select(`
                *,
                user:profiles!user_id (
                    username,
                    avatar_url
                )
            `)
            .order('rank', { ascending: true })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return data;
    }

    public async getUserStats(userId: string): Promise<LeaderboardEntry | null> {
        const { data, error } = await supabase
            .from('leaderboard_entries')
            .select(`
                *,
                user:profiles!user_id (
                    username,
                    avatar_url
                )
            `)
            .eq('user_id', userId)
            .single();

        if (error) throw error;
        return data;
    }

    public watchLeaderboard() {
        if (this.isWatching) return;

        const channel = supabase
            .channel('leaderboard_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'leaderboard_entries'
            }, (payload) => {
                this.notify({
                    eventName: 'leaderboardUpdate',
                    object: this,
                    data: payload.new
                });
            })
            .subscribe();

        this.isWatching = true;
    }

    public unwatchLeaderboard() {
        if (this.isWatching) {
            supabase.channel('leaderboard_changes').unsubscribe();
            this.isWatching = false;
        }
    }

    public async getTopPlayers(count = 3): Promise<LeaderboardEntry[]> {
        const { data, error } = await supabase
            .from('leaderboard_entries')
            .select(`
                *,
                user:profiles!user_id (
                    username,
                    avatar_url
                )
            `)
            .order('points', { ascending: false })
            .limit(count);

        if (error) throw error;
        return data;
    }

    public cleanup() {
        this.unwatchLeaderboard();
    }
}

export const leaderboard = LeaderboardService.getInstance();

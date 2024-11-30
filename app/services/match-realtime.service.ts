import { Observable } from '@nativescript/core';
import { supabase } from './supabase';
import { realtime } from './realtime.service';
import { toast } from './toast.service';

export interface MatchUpdate {
    matchId: string;
    type: 'score_update' | 'status_change' | 'time_update';
    data: any;
}

export class MatchRealtimeService extends Observable {
    private static instance: MatchRealtimeService;
    private activeMatch: string | null = null;

    private constructor() {
        super();
    }

    public static getInstance(): MatchRealtimeService {
        if (!MatchRealtimeService.instance) {
            MatchRealtimeService.instance = new MatchRealtimeService();
        }
        return MatchRealtimeService.instance;
    }

    public startWatchingMatch(matchId: string) {
        if (this.activeMatch === matchId) return;
        
        if (this.activeMatch) {
            this.stopWatchingMatch();
        }

        this.activeMatch = matchId;
        realtime.subscribeMatch(matchId);

        realtime.on('matchDetailUpdate', (data: any) => {
            this.handleMatchUpdate(data);
        });
    }

    private handleMatchUpdate(update: any) {
        const matchUpdate: MatchUpdate = {
            matchId: update.id,
            type: this.determineUpdateType(update),
            data: update
        };

        this.notify({
            eventName: 'matchUpdate',
            object: this,
            data: matchUpdate
        });

        // Show relevant toast messages
        switch (matchUpdate.type) {
            case 'score_update':
                toast.info('Score updated!');
                break;
            case 'status_change':
                if (update.status === 'completed') {
                    toast.success('Match completed!');
                } else if (update.status === 'in_progress') {
                    toast.info('Match started!');
                }
                break;
        }
    }

    private determineUpdateType(update: any): MatchUpdate['type'] {
        if (update.player1_score !== undefined || update.player2_score !== undefined) {
            return 'score_update';
        }
        if (update.status !== undefined) {
            return 'status_change';
        }
        return 'time_update';
    }

    public stopWatchingMatch() {
        if (this.activeMatch) {
            realtime.unsubscribe(`match:${this.activeMatch}`);
            this.activeMatch = null;
        }
    }

    public async submitScore(matchId: string, player1Score: number, player2Score: number) {
        const { error } = await supabase
            .from('matches')
            .update({
                player1_score: player1Score,
                player2_score: player2Score,
                status: 'in_progress'
            })
            .eq('id', matchId);

        if (error) throw error;
    }

    public async finalizeMatch(matchId: string, winnerId: string) {
        const { error } = await supabase
            .from('matches')
            .update({
                winner_id: winnerId,
                status: 'completed'
            })
            .eq('id', matchId);

        if (error) throw error;
    }

    public cleanup() {
        this.stopWatchingMatch();
    }
}

export const matchRealtime = MatchRealtimeService.getInstance();

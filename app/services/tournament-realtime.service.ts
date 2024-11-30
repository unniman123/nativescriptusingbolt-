import { Observable } from '@nativescript/core';
import { supabase } from './supabase';
import { realtime } from './realtime.service';
import { toast } from './toast.service';

export interface TournamentUpdate {
    id: string;
    type: 'status_change' | 'player_count' | 'bracket_update' | 'prize_update';
    data: any;
}

export class TournamentRealtimeService extends Observable {
    private static instance: TournamentRealtimeService;
    private activeTournament: string | null = null;

    private constructor() {
        super();
    }

    public static getInstance(): TournamentRealtimeService {
        if (!TournamentRealtimeService.instance) {
            TournamentRealtimeService.instance = new TournamentRealtimeService();
        }
        return TournamentRealtimeService.instance;
    }

    public watchTournament(tournamentId: string) {
        if (this.activeTournament === tournamentId) return;

        if (this.activeTournament) {
            this.unwatchTournament();
        }

        this.activeTournament = tournamentId;
        realtime.subscribeTournament(tournamentId);

        realtime.on('tournamentUpdate', (data: any) => {
            this.handleTournamentUpdate(data);
        });

        realtime.on('matchUpdate', (data: any) => {
            this.handleMatchUpdate(data);
        });
    }

    private handleTournamentUpdate(update: any) {
        const tournamentUpdate: TournamentUpdate = {
            id: update.id,
            type: this.determineTournamentUpdateType(update),
            data: update
        };

        this.notify({
            eventName: 'tournamentUpdate',
            object: this,
            data: tournamentUpdate
        });

        // Show relevant toast messages
        switch (tournamentUpdate.type) {
            case 'status_change':
                if (update.status === 'in_progress') {
                    toast.info('Tournament has started!');
                } else if (update.status === 'completed') {
                    toast.success('Tournament has ended!');
                }
                break;
            case 'player_count':
                toast.info(`Player count updated: ${update.current_participants}/${update.max_participants}`);
                break;
        }
    }

    private handleMatchUpdate(update: any) {
        this.notify({
            eventName: 'bracketUpdate',
            object: this,
            data: update
        });
    }

    private determineTournamentUpdateType(update: any): TournamentUpdate['type'] {
        if (update.status !== undefined) return 'status_change';
        if (update.current_participants !== undefined) return 'player_count';
        if (update.prize_pool !== undefined) return 'prize_update';
        return 'bracket_update';
    }

    public unwatchTournament() {
        if (this.activeTournament) {
            realtime.unsubscribe(`tournament:${this.activeTournament}`);
            this.activeTournament = null;
        }
    }

    public async updateBracket(tournamentId: string, matches: any[]) {
        const { error } = await supabase
            .from('matches')
            .upsert(matches);

        if (error) throw error;
    }

    public cleanup() {
        this.unwatchTournament();
    }
}

export const tournamentRealtime = TournamentRealtimeService.getInstance();

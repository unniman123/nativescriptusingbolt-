import { Observable, EventData, alert, ItemEventData } from '@nativescript/core';
import { Tournament, Match } from '../../services/supabase';
import { TournamentService } from '../../services/tournament-service';

export class TournamentMatchesViewModel extends Observable {
    private _tournament: Tournament;
    private _matches: Match[] = [];
    private _isLoading: boolean = false;

    constructor(tournament: Tournament) {
        super();
        this._tournament = tournament;
        this.loadMatches();
    }

    get tournament(): Tournament {
        return this._tournament;
    }

    get matches(): Match[] {
        return this._matches;
    }

    get isLoading(): boolean {
        return this._isLoading;
    }

    set isLoading(value: boolean) {
        if (this._isLoading !== value) {
            this._isLoading = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'isLoading', value });
        }
    }

    async loadMatches() {
        if (this.isLoading) return;

        try {
            this.isLoading = true;
            this._matches = await TournamentService.getTournamentMatches(this._tournament.id);
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'matches', value: this._matches });
        } catch (error) {
            console.error('Failed to load matches:', error);
            alert({
                title: 'Error',
                message: error.message || 'Failed to load tournament matches',
                okButtonText: 'OK'
            });
        } finally {
            this.isLoading = false;
        }
    }

    async onMatchTap(args: ItemEventData) {
        const match = this._matches[args.index];
        // Navigate to match detail page
        // TODO: Implement match detail navigation
    }

    // Subscribe to real-time match updates
    subscribeToMatchUpdates() {
        TournamentService.subscribeToMatches(this._tournament.id, (match: Match) => {
            const index = this._matches.findIndex(m => m.id === match.id);
            if (index !== -1) {
                this._matches[index] = match;
                this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'matches', value: this._matches });
            }
        });
    }

    // Cleanup subscription on page unload
    unsubscribeFromMatchUpdates() {
        TournamentService.unsubscribeFromMatches(this._tournament.id);
    }
}

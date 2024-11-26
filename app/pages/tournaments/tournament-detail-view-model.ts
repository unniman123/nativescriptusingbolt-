import { Observable, EventData, alert } from '@nativescript/core';
import { Tournament } from '../../services/supabase';
import { TournamentService } from '../../services/tournament-service';

export class TournamentDetailViewModel extends Observable {
    private _tournament: Tournament;
    private _isLoading: boolean = false;

    constructor(tournament: Tournament) {
        super();
        this._tournament = tournament;
    }

    get tournament(): Tournament {
        return this._tournament;
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

    async joinTournament() {
        if (this.isLoading) return;

        try {
            this.isLoading = true;
            await TournamentService.joinTournament(this._tournament.id);
            alert({
                title: "Success",
                message: "Successfully joined the tournament!",
                okButtonText: "OK"
            });
        } catch (error) {
            console.error('Failed to join tournament:', error);
            alert({
                title: "Error",
                message: error.message || "Failed to join tournament",
                okButtonText: "OK"
            });
        } finally {
            this.isLoading = false;
        }
    }
}
import { Observable, alert } from '@nativescript/core';
import { TournamentService } from '../../services/tournament-service';
import type { Tournament } from '../../services/supabase';

export class TournamentsViewModel extends Observable {
    private _tournaments: Tournament[] = [];
    private _isLoading: boolean = false;
    private _currentFilter: string = 'open';

    constructor() {
        super();
        this.loadTournaments();
    }

    get tournaments(): Tournament[] {
        return this._tournaments;
    }

    get isLoading(): boolean {
        return this._isLoading;
    }

    set isLoading(value: boolean) {
        if (this._isLoading !== value) {
            this._isLoading = value;
            this.notifyPropertyChange('isLoading', value);
        }
    }

    async loadTournaments() {
        if (this.isLoading) return;

        try {
            this.isLoading = true;
            const filters = {
                status: this._currentFilter as 'open' | 'in_progress' | 'completed'
            };

            this._tournaments = await TournamentService.listTournaments(filters);
            this.notifyPropertyChange('tournaments', this._tournaments);
        } catch (error) {
            console.error('Failed to load tournaments:', error);
            alert({
                title: 'Error',
                message: error.message || 'Failed to load tournaments',
                okButtonText: 'OK'
            });
        } finally {
            this.isLoading = false;
        }
    }

    async filterByStatus(args: any) {
        const button = args.object;
        this._currentFilter = button.text.toLowerCase();
        await this.loadTournaments();
    }

    onPullToRefresh(args: any) {
        const pullRefresh = args.object;
        this.loadTournaments().then(() => {
            pullRefresh.refreshing = false;
        });
    }
}
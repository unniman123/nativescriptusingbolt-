import { Frame } from '@nativescript/core';
import { Observable, alert, EventData } from '@nativescript/core';
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
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'isLoading', value });
        }
    }

    async loadTournaments() {
        if (this.isLoading) return;

        try {
            this.isLoading = true;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'isLoading', value: true });

            const filters = {
                status: this._currentFilter as 'open' | 'in_progress' | 'completed'
            };

            const tournaments = await TournamentService.listTournaments(filters);
            this._tournaments = tournaments;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'tournaments', value: tournaments });
        } catch (error: unknown) {
            console.error('Failed to load tournaments:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to load tournaments';
            alert({
                title: 'Error',
                message: errorMessage,
                okButtonText: 'OK'
            });
        } finally {
            this.isLoading = false;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'isLoading', value: false });
        }
    }

    async filterByStatus(args: any) {
        const button = args.object;
        this._currentFilter = button.text.toLowerCase();
        await this.loadTournaments();
    }

    onTournamentTap(args: any) {
        const tournament = this._tournaments[args.index];
        const navigationEntry = {
            moduleName: "pages/tournaments/tournament-detail-page",
            context: {
                tournament: tournament
            },
            animated: true
        };
        const frame = Frame.topmost();
        frame.navigate(navigationEntry);
    }

    onPullToRefresh(args: any) {
        const pullRefresh = args.object;
        this.loadTournaments().then(() => {
            pullRefresh.refreshing = false;
        });
    }
}
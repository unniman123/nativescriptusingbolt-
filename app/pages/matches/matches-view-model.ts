import { Observable, EventData, Frame } from '@nativescript/core';
import { Match } from '../../services/supabase';
import { MatchService } from '../../services/match-service';
import { AuthService } from '../../services/auth-service';

export class MatchesViewModel extends Observable {
    private _matches: Match[] = [];
    private _isLoading: boolean = false;
    private _filter: 'upcoming' | 'active' | 'completed' = 'upcoming';
    private _currentUserId: string;

    constructor() {
        super();
        this._currentUserId = AuthService.getCurrentUser()?.id;
        this.loadMatches();
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
            this.notifyPropertyChange('isLoading', value);
        }
    }

    get filter(): string {
        return this._filter;
    }

    async filterMatches(args: EventData): Promise<void> {
        const button = args.object as any;
        const newFilter = button.get('data-filter');
        
        if (this._filter !== newFilter) {
            this._filter = newFilter;
            this.notifyPropertyChange('filter', newFilter);
            await this.loadMatches();
        }
    }

    async loadMatches(): Promise<void> {
        if (this.isLoading) return;

        try {
            this.isLoading = true;
            this._matches = await MatchService.getUserMatches(this._currentUserId, this._filter);
            this.notifyPropertyChange('matches', this._matches);
        } catch (error) {
            console.error('Failed to load matches:', error);
            alert({
                title: 'Error',
                message: error.message || 'Failed to load matches',
                okButtonText: 'OK'
            });
        } finally {
            this.isLoading = false;
        }
    }

    onMatchTap(args: any): void {
        const match = this._matches[args.index];
        const frame = Frame.topmost();
        frame.navigate({
            moduleName: 'pages/matches/match-detail-page',
            context: { match }
        });
    }

    onPullToRefresh(args: any): void {
        const pullRefresh = args.object;
        this.loadMatches().then(() => {
            pullRefresh.refreshing = false;
        });
    }

    // Subscribe to real-time match updates
    subscribeToMatchUpdates(): void {
        MatchService.subscribeToUserMatches(this._currentUserId, (updatedMatch: Match) => {
            const index = this._matches.findIndex(m => m.id === updatedMatch.id);
            if (index !== -1) {
                this._matches[index] = updatedMatch;
                this.notifyPropertyChange('matches', this._matches);
            }
        });
    }

    // Cleanup subscription on page unload
    unsubscribeFromMatchUpdates(): void {
        MatchService.unsubscribeFromMatch();
    }
}

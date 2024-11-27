import { Observable, EventData, Frame } from '@nativescript/core';
import { Match } from '../../services/supabase';
import { MatchService } from '../../services/match-service';
import { AuthService } from '../../services/auth-service';

export class AdminMatchesViewModel extends Observable {
    private _matches: Match[] = [];
    private _isLoading: boolean = false;
    private _filter: 'all' | 'disputed' | 'pending' = 'all';
    private _adminId: string;

    constructor() {
        super();
        this._adminId = AuthService.getCurrentUser()?.id;
        if (!this.validateAdmin()) {
            alert({
                title: 'Access Denied',
                message: 'You do not have administrator privileges',
                okButtonText: 'OK'
            });
            const frame = Frame.topmost();
            frame.goBack();
            return;
        }
        this.loadMatches();
    }

    private validateAdmin(): boolean {
        const user = AuthService.getCurrentUser();
        return user?.role === 'admin';
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
            
            // Get all matches with detailed information
            const { data: matches, error } = await supabase
                .from('matches')
                .select(`
                    *,
                    player1:player1_id(username),
                    player2:player2_id(username),
                    tournament:tournament_id(*),
                    disputed_by:disputed_by(username)
                `);

            if (error) throw error;

            // Filter matches based on current filter
            this._matches = matches.filter(match => {
                switch (this._filter) {
                    case 'disputed':
                        return match.status === 'disputed';
                    case 'pending':
                        return match.status === 'in_progress';
                    default:
                        return true;
                }
            });

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
            moduleName: 'pages/admin/admin-match-detail-page',
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
        MatchService.subscribeToMatch('all', (updatedMatch: Match) => {
            const index = this._matches.findIndex(m => m.id === updatedMatch.id);
            if (index !== -1) {
                // Update the match if it matches the current filter
                switch (this._filter) {
                    case 'disputed':
                        if (updatedMatch.status === 'disputed') {
                            this._matches[index] = updatedMatch;
                        } else {
                            this._matches.splice(index, 1);
                        }
                        break;
                    case 'pending':
                        if (updatedMatch.status === 'in_progress') {
                            this._matches[index] = updatedMatch;
                        } else {
                            this._matches.splice(index, 1);
                        }
                        break;
                    default:
                        this._matches[index] = updatedMatch;
                }
                this.notifyPropertyChange('matches', this._matches);
            } else if (
                (this._filter === 'disputed' && updatedMatch.status === 'disputed') ||
                (this._filter === 'pending' && updatedMatch.status === 'in_progress') ||
                this._filter === 'all'
            ) {
                // Add new match if it matches the filter
                this._matches.unshift(updatedMatch);
                this.notifyPropertyChange('matches', this._matches);
            }
        });
    }

    // Cleanup subscription on page unload
    unsubscribeFromMatchUpdates(): void {
        MatchService.unsubscribeFromMatch();
    }
}

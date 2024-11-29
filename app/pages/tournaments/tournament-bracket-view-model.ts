import { Observable } from '@nativescript/core';
import { Match, Tournament } from '../../services/supabase';
import { TournamentService } from '../../services/tournament-service';
import { MatchService } from '../../services/match-service';
import { Frame } from '@nativescript/core';

export class TournamentBracketViewModel extends Observable {
    private _tournament: Tournament;
    private _round1Matches: Match[] = [];
    private _round2Matches: Match[] = [];
    private _finalMatch: Match | null = null;
    private _isLoading = false;

    constructor(tournament: Tournament) {
        super();
        this._tournament = tournament;
        this.loadMatches();
    }

    get tournament(): Tournament {
        return this._tournament;
    }

    get round1Matches(): Match[] {
        return this._round1Matches;
    }

    get round2Matches(): Match[] {
        return this._round2Matches;
    }

    get finalMatch(): Match | null {
        return this._finalMatch;
    }

    get isLoading(): boolean {
        return this._isLoading;
    }

    async loadMatches() {
        try {
            this._isLoading = true;
            this.notifyPropertyChange('isLoading', true);

            // Get all matches for the tournament
            const matches = await MatchService.getMatchesByTournament(this._tournament.id);
            
            // Sort matches by round number
            this._round1Matches = matches.filter(m => m.round === 1);
            this._round2Matches = matches.filter(m => m.round === 2);
            this._finalMatch = matches.find(m => m.round === 3) ?? null;

            // Subscribe to match updates
            MatchService.subscribeToTournamentMatches(this._tournament.id, (updatedMatch) => {
                this.updateMatch(updatedMatch);
            });

            this.notifyPropertyChange('round1Matches', this._round1Matches);
            this.notifyPropertyChange('round2Matches', this._round2Matches);
            this.notifyPropertyChange('finalMatch', this._finalMatch);
        } catch (error) {
            console.error('Failed to load matches:', error);
        } finally {
            this._isLoading = false;
            this.notifyPropertyChange('isLoading', false);
        }
    }

    private updateMatch(updatedMatch: Match) {
        // Update the match in the appropriate round
        if (updatedMatch.round === 1) {
            const index = this._round1Matches.findIndex(m => m.id === updatedMatch.id);
            if (index !== -1) {
                this._round1Matches[index] = updatedMatch;
                this.notifyPropertyChange('round1Matches', this._round1Matches);
            }
        } else if (updatedMatch.round === 2) {
            const index = this._round2Matches.findIndex(m => m.id === updatedMatch.id);
            if (index !== -1) {
                this._round2Matches[index] = updatedMatch;
                this.notifyPropertyChange('round2Matches', this._round2Matches);
            }
        } else if (updatedMatch.round === 3) {
            this._finalMatch = updatedMatch;
            this.notifyPropertyChange('finalMatch', this._finalMatch);
        }
    }

    onMatchTap(args: any) {
        const match = args.object.bindingContext;
        Frame.topmost().navigate({
            moduleName: 'pages/tournaments/match-detail-page',
            context: { match }
        });
    }

    onUnloaded() {
        // Cleanup subscriptions
        MatchService.unsubscribeFromTournamentMatches();
    }
}

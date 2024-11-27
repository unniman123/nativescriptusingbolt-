import { Observable, Frame } from '@nativescript/core';
import { Tournament } from '../../services/supabase';
import { TournamentService } from '../../services/tournament-service';
import { MatchService } from '../../services/match-service';

interface PlayerResult {
    userId: string;
    username: string;
    position: number;
    prize: number;
    wins: number;
}

interface TournamentStats {
    totalMatches: number;
    totalPlayers: number;
}

export class TournamentResultsViewModel extends Observable {
    private _tournament: Tournament;
    private _results: PlayerResult[] = [];
    private _matches = [];
    private _stats: TournamentStats = {
        totalMatches: 0,
        totalPlayers: 0
    };
    private _isLoading = false;
    private _error = false;
    private _errorMessage = '';

    constructor(tournament: Tournament) {
        super();
        this._tournament = tournament;
        this.loadResults();
    }

    get tournament(): Tournament {
        return this._tournament;
    }

    get results(): PlayerResult[] {
        return this._results;
    }

    get matches() {
        return this._matches;
    }

    get stats(): TournamentStats {
        return this._stats;
    }

    get isLoading(): boolean {
        return this._isLoading;
    }

    get error(): boolean {
        return this._error;
    }

    get errorMessage(): string {
        return this._errorMessage;
    }

    async loadResults() {
        try {
            this._isLoading = true;
            this._error = false;
            this._errorMessage = '';
            this.notifyPropertyChange('isLoading', true);
            this.notifyPropertyChange('error', false);

            const matches = await MatchService.getMatchesByTournament(this._tournament.id);
            this._matches = matches;
            
            const playerStats = new Map<string, { wins: number, username: string }>();
            
            matches.forEach(match => {
                if (match.winner_id) {
                    const stats = playerStats.get(match.winner_id) || { wins: 0, username: match.winner?.username };
                    stats.wins++;
                    playerStats.set(match.winner_id, stats);
                }
            });

            const totalPrize = this._tournament.prize_pool;
            const prizes = [
                totalPrize * 0.5,
                totalPrize * 0.3,
                totalPrize * 0.2
            ];

            this._results = Array.from(playerStats.entries())
                .sort((a, b) => b[1].wins - a[1].wins)
                .map((entry, index) => ({
                    userId: entry[0],
                    username: entry[1].username,
                    position: index + 1,
                    prize: index < 3 ? prizes[index] : 0,
                    wins: entry[1].wins
                }));

            this._stats = {
                totalMatches: matches.length,
                totalPlayers: playerStats.size
            };

            this.notifyPropertyChange('matches', this._matches);
            this.notifyPropertyChange('results', this._results);
            this.notifyPropertyChange('stats', this._stats);
        } catch (error) {
            console.error('Failed to load tournament results:', error);
            this._error = true;
            this._errorMessage = error.message || 'Failed to load tournament results';
            this.notifyPropertyChange('error', true);
            this.notifyPropertyChange('errorMessage', this._errorMessage);
        } finally {
            this._isLoading = false;
            this.notifyPropertyChange('isLoading', false);
        }
    }

    viewMatchDetails(args) {
        const match = args.object.bindingContext;
        Frame.topmost().navigate({
            moduleName: 'pages/matches/match-detail-page',
            context: { match }
        });
    }
}

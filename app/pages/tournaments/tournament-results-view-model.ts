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

export interface Match {
    id: string;
    tournament_id: string;
    player1_id: string;
    player2_id?: string;
    winner_id?: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    scheduled_time?: string;
    completed_time?: string;
    players?: {
        player1: {
            id: string;
            username: string;
        };
        player2?: {
            id: string;
            username: string;
        };
    };
    winner?: {
        id: string;
        username: string;
    };
}

interface TournamentStats {
    totalMatches: number;
    totalPlayers: number;
}

export class TournamentResultsViewModel extends Observable {
    private _tournament: Tournament;
    private _results: PlayerResult[] = [];
    private _matches: Match[] = [];
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

    get matches(): Match[] {
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
            this.notifyPropertyChange('isLoading', true);
            this.notifyPropertyChange('error', false);

            const matches = await MatchService.getMatchesByTournament(this._tournament.id);
            this._matches = matches.map(match => ({
                ...match,
                players: {
                    player1: match.player1,
                    player2: match.player2
                },
                winner: match.winner_id ? {
                    id: match.winner_id,
                    username: match.winner_id === match.player1?.id ? match.player1?.username : match.player2?.username
                } : undefined
            }));
            
            const playerStats = new Map<string, { wins: number, username: string }>();
            
            matches.forEach(match => {
                if (match.winner_id && match.winner?.username) {
                    const stats = playerStats.get(match.winner_id) || { wins: 0, username: match.winner.username };
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
        } catch (error: unknown) {
            this._error = true;
            this._errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            this.notifyPropertyChange('error', true);
            this.notifyPropertyChange('errorMessage', this._errorMessage);
            console.error('Error loading tournament results:', error);
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

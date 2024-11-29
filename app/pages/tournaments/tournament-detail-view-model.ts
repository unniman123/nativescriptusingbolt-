import { Observable, EventData, alert, Frame } from '@nativescript/core';
import { Profile, Tournament } from '../../services/supabase';
import { TournamentService } from '../../services/tournament-service';
import { authService } from '../../services/auth-service';
import { tournamentRules } from '../../services/tournament-rules.service';
import { errorHandler } from '../../services/error-handling.service';

export class TournamentDetailViewModel extends Observable {
    private _tournament: Tournament | null = null;
    private _participants: Profile[] = [];
    private _isParticipant = false;
    private _canJoin = false;
    private _isLoading: boolean = false;
    private _showRules: boolean = false;
    private _formattedRules: string = '';

    constructor(private tournamentId: string) {
        super();
        this.loadTournamentDetails();
    }

    get tournament(): Tournament {
        return this._tournament as Tournament;
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

    get showRules(): boolean {
        return this._showRules;
    }

    get formattedRules(): string {
        if (!this._tournament) return '';
        return tournamentRules.getFormattedRules(this._tournament.game_type);
    }

    public toggleRules(): void {
        this._showRules = !this._showRules;
        this.notifyPropertyChange('showRules', this._showRules);
    }

    async joinTournament() {
        if (this.isLoading) return;

        try {
            const currentUser = authService.currentUser();
            if (!currentUser) {
                throw new Error('Please login to join tournaments');
            }

            this.isLoading = true;

            const { eligible, reason } = await TournamentService.verifyUserEligibility(
                this.tournamentId, 
                currentUser.id
            );

            if (!eligible) {
                throw new Error(reason || 'Not eligible to join tournament');
            }

            await TournamentService.joinTournament(this.tournamentId, currentUser.id);
            await this.loadTournamentDetails();

            alert({
                title: 'Success',
                message: 'Successfully joined tournament!',
                okButtonText: 'OK'
            });
        } catch (error: unknown) {
            console.error('Failed to join tournament:', error);
            alert({
                title: "Error",
                message: error instanceof Error ? error.message : "Failed to join tournament",
                okButtonText: "OK"
            });
        } finally {
            this.isLoading = false;
        }
    }

    viewMatches() {
        const frame = Frame.topmost();
        frame.navigate({
            moduleName: "pages/tournaments/tournament-matches-page",
            context: {
                tournament: this._tournament
            }
        });
    }

    viewBracket() {
        Frame.topmost().navigate({
            moduleName: 'pages/tournaments/tournament-bracket-page',
            context: { tournament: this._tournament }
        });
    }

    viewResults() {
        Frame.topmost().navigate({
            moduleName: 'pages/tournaments/tournament-results-page',
            context: { tournament: this._tournament }
        });
    }

    private async loadTournamentDetails(): Promise<void> {
        try {
            // Load tournament details
            this._tournament = await TournamentService.getTournamentDetails(this.tournamentId);
            this._formattedRules = tournamentRules.getFormattedRules(this._tournament.game_type);
            this.notifyPropertyChange('formattedRules', this._formattedRules);
        } catch (error) {
            errorHandler.handleError(error, 'Loading Tournament Details');
        }
    }
}
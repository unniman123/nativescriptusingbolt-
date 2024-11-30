import { Observable, EventData, alert, Frame, View } from '@nativescript/core';
import { Profile, Tournament } from '../../services/supabase';
import { TournamentService } from '../../services/tournament-service';
import { authService } from '../../services/auth-service';
import { tournamentRules } from '../../services/tournament-rules.service';
import { errorHandler } from '../../services/error-handling.service';
import { tournamentRealtime, TournamentUpdate } from '../../services/tournament-realtime.service';
import { chat } from '../../services/chat.service';
import { toast } from '../../services/toast.service';
import { AnimationService } from '../../services/animation.service';

export class TournamentDetailViewModel extends Observable {
    private _tournament: Tournament | null = null;
    private _participants: Profile[] = [];
    private _isParticipant = false;
    private _canJoin = false;
    private _isLoading: boolean = false;
    private _showRules: boolean = false;
    private _formattedRules: string = '';
    private chatRoomId: string | null = null;

    constructor(private tournamentId: string) {
        super();
        this.loadTournamentDetails();
        this.initializeTournament(tournamentId);
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

    private async initializeTournament(tournamentId: string) {
        try {
            // Start watching tournament updates
            tournamentRealtime.watchTournament(tournamentId);
            
            // Subscribe to tournament updates
            tournamentRealtime.on('tournamentUpdate', (eventData: EventData) => {
                // Type guard to ensure the object is a TournamentUpdate
                if (this.isTournamentUpdate(eventData.object)) {
                    this.handleTournamentUpdate(eventData.object);
                }
            });

            // Subscribe to bracket updates
            tournamentRealtime.on('bracketUpdate', (update: any) => {
                this.handleBracketUpdate(update);
            });

            // Initialize tournament chat
            this.chatRoomId = await chat.getOrCreateTournamentChat(tournamentId);

        } catch (error) {
            toast.error('Failed to initialize tournament');
            console.error('Tournament initialization error:', error);
        }
    }

    private isTournamentUpdate(object: any): object is TournamentUpdate {
        return 'type' in object && 'data' in object;
    }

    private async handleTournamentUpdate(update: TournamentUpdate) {
        // Update the tournament data
        this._tournament = { ...this._tournament, ...update.data };
        this.notifyPropertyChange('tournament', this._tournament);

        // Show relevant notifications
        switch (update.type) {
            case 'status_change':
                toast.info(`Tournament status changed to ${update.data.status}`);
                break;
            case 'player_count':
                toast.info(`Player count: ${update.data.current_participants}/${update.data.max_participants}`);
                // Animate the players count
                const playersElement = this.getViewById('playersCount');
                if (playersElement) {
                    await AnimationService.bounce(playersElement);
                }
                break;
            case 'prize_update':
                toast.info(`Prize pool updated: ₹${update.data.prize_pool}`);
                // Animate the prize pool
                const prizeElement = this.getViewById('prizePool');
                if (prizeElement) {
                    await AnimationService.bounce(prizeElement);
                }
                break;
        }
    }

    private handleBracketUpdate(update: any) {
        // Update the bracket data
        if (this._tournament && this._tournament.matches) {
            const matchIndex = this._tournament.matches.findIndex(m => m.id === update.id);
            if (matchIndex !== -1) {
                this._tournament.matches[matchIndex] = update;
                this.notifyPropertyChange('tournament', this._tournament);
            }
        }
    }

    openChat() {
        if (this.chatRoomId && this._tournament) {
            // Navigate to chat page
            const navigationEntry = {
                moduleName: "pages/chat/chat-page",
                context: {
                    roomId: this.chatRoomId,
                    type: 'tournament',
                    title: this._tournament.title
                },
                animated: true
            };
            const frame = require("@nativescript/core").Frame;
            frame.topmost().navigate(navigationEntry);
        }
    }

    onUnloaded() {
        tournamentRealtime.unwatchTournament();
    }

    private getViewById(id: string): View | null {
        const page = Frame.topmost()?.currentPage;
        return page ? page.getViewById(id) as View : null;
    }
}
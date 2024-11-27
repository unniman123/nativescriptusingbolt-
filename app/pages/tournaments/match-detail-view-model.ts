import { Observable, EventData, alert } from '@nativescript/core';
import { Match } from '../../services/supabase';
import { MatchService } from '../../services/match-service';
import { AuthService } from '../../services/auth-service';

export class MatchDetailViewModel extends Observable {
    private _match: Match;
    private _isLoading: boolean = false;
    private _player1Score: number = 0;
    private _player2Score: number = 0;
    private _currentUserId: string;
    private _isDisputeDialogVisible: boolean = false;
    private _disputeReason: string = '';
    private _canSubmitResult: boolean = false;
    private _isParticipant: boolean = false;

    constructor(match: Match) {
        super();
        this._match = match;
        this._currentUserId = AuthService.getCurrentUser()?.id;
        this.initializeMatch();
    }

    private async initializeMatch(): Promise<void> {
        this._isParticipant = await MatchService.validateMatchParticipants(this._match.id, this._currentUserId);
        this._canSubmitResult = this.calculateCanSubmitResult();
        this.notifyPropertyChange('canSubmitResult', this._canSubmitResult);
        
        // Subscribe to real-time match updates
        MatchService.subscribeToMatch(this._match.id, (updatedMatch) => {
            this._match = updatedMatch;
            this.notifyPropertyChange('match', this._match);
            this._canSubmitResult = this.calculateCanSubmitResult();
            this.notifyPropertyChange('canSubmitResult', this._canSubmitResult);
        });
    }

    get match(): Match {
        return this._match;
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

    get player1Score(): number {
        return this._player1Score;
    }

    set player1Score(value: number) {
        if (this._player1Score !== value) {
            this._player1Score = value;
            this.notifyPropertyChange('player1Score', value);
        }
    }

    get player2Score(): number {
        return this._player2Score;
    }

    set player2Score(value: number) {
        if (this._player2Score !== value) {
            this._player2Score = value;
            this.notifyPropertyChange('player2Score', value);
        }
    }

    get isDisputeDialogVisible(): boolean {
        return this._isDisputeDialogVisible;
    }

    set isDisputeDialogVisible(value: boolean) {
        if (this._isDisputeDialogVisible !== value) {
            this._isDisputeDialogVisible = value;
            this.notifyPropertyChange('isDisputeDialogVisible', value);
        }
    }

    get disputeReason(): string {
        return this._disputeReason;
    }

    set disputeReason(value: string) {
        if (this._disputeReason !== value) {
            this._disputeReason = value;
            this.notifyPropertyChange('disputeReason', value);
        }
    }

    get canSubmitResult(): boolean {
        return this._canSubmitResult;
    }

    private calculateCanSubmitResult(): boolean {
        return (
            this._isParticipant &&
            this._match.status === 'in_progress' &&
            !this._match.winner_id
        );
    }

    async submitResult(): Promise<void> {
        try {
            if (!this.canSubmitResult) {
                throw new Error('Not authorized to submit result');
            }

            this.isLoading = true;
            const winnerId = this._player1Score > this._player2Score 
                ? this._match.player1_id 
                : this._match.player2_id;

            await MatchService.submitMatchResult(
                this._match.id,
                this._player1Score,
                this._player2Score,
                winnerId,
                this._currentUserId
            );

            alert({
                title: 'Success',
                message: 'Match result submitted successfully',
                okButtonText: 'OK'
            });
        } catch (error) {
            alert({
                title: 'Error',
                message: error.message || 'Failed to submit match result',
                okButtonText: 'OK'
            });
        } finally {
            this.isLoading = false;
        }
    }

    async disputeMatch(): Promise<void> {
        try {
            if (!this._isParticipant) {
                throw new Error('Not authorized to dispute match');
            }
            if (!this._disputeReason) {
                throw new Error('Please provide a reason for the dispute');
            }

            this.isLoading = true;
            await MatchService.disputeMatch(
                this._match.id,
                this._currentUserId,
                this._disputeReason
            );

            this.isDisputeDialogVisible = false;
            alert({
                title: 'Success',
                message: 'Match dispute submitted successfully',
                okButtonText: 'OK'
            });
        } catch (error) {
            alert({
                title: 'Error',
                message: error.message || 'Failed to dispute match',
                okButtonText: 'OK'
            });
        } finally {
            this.isLoading = false;
        }
    }

    showDisputeDialog(): void {
        this.isDisputeDialogVisible = true;
    }

    hideDisputeDialog(): void {
        this.isDisputeDialogVisible = false;
        this.disputeReason = '';
    }

    onUnloaded(): void {
        MatchService.unsubscribeFromMatch();
    }
}

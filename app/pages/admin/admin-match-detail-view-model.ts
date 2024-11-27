import { Observable, EventData } from '@nativescript/core';
import { Match } from '../../services/supabase';
import { MatchService } from '../../services/match-service';
import { AuthService } from '../../services/auth-service';

export class AdminMatchDetailViewModel extends Observable {
    private _match: Match;
    private _selectedWinnerId: string | null = null;
    private _resolutionNotes: string = '';
    private _overrideReason: string = '';
    private _adminId: string;

    constructor(match: Match) {
        super();
        this._match = match;
        this._adminId = AuthService.getCurrentUser()?.id;
        if (!this.validateAdmin()) {
            alert({
                title: 'Access Denied',
                message: 'You do not have administrator privileges',
                okButtonText: 'OK'
            });
            return;
        }
    }

    private validateAdmin(): boolean {
        const user = AuthService.getCurrentUser();
        return user?.role === 'admin';
    }

    get match(): Match {
        return this._match;
    }

    get selectedWinnerId(): string | null {
        return this._selectedWinnerId;
    }

    get resolutionNotes(): string {
        return this._resolutionNotes;
    }

    set resolutionNotes(value: string) {
        if (this._resolutionNotes !== value) {
            this._resolutionNotes = value;
            this.notifyPropertyChange('resolutionNotes', value);
        }
    }

    get overrideReason(): string {
        return this._overrideReason;
    }

    set overrideReason(value: string) {
        if (this._overrideReason !== value) {
            this._overrideReason = value;
            this.notifyPropertyChange('overrideReason', value);
        }
    }

    selectWinner(args: EventData): void {
        const button = args.object as any;
        const playerId = button.get('data-player-id');
        
        if (this._selectedWinnerId !== playerId) {
            this._selectedWinnerId = playerId;
            this.notifyPropertyChange('selectedWinnerId', playerId);
        }
    }

    async resolveDispute(args: EventData): Promise<void> {
        const button = args.object as any;
        const resolution = button.get('data-resolution') as 'upheld' | 'rejected';

        if (!this._selectedWinnerId && resolution === 'upheld') {
            alert({
                title: 'Error',
                message: 'Please select a winner before upholding the dispute',
                okButtonText: 'OK'
            });
            return;
        }

        if (!this._resolutionNotes.trim()) {
            alert({
                title: 'Error',
                message: 'Please provide resolution notes',
                okButtonText: 'OK'
            });
            return;
        }

        try {
            await MatchService.adminResolveDispute(
                this._match.id,
                resolution,
                resolution === 'upheld' ? this._selectedWinnerId : null,
                this._adminId,
                this._resolutionNotes
            );

            alert({
                title: 'Success',
                message: 'Dispute has been resolved',
                okButtonText: 'OK'
            });

            // Navigate back to the admin matches list
            const frame = Frame.topmost();
            frame.goBack();
        } catch (error) {
            console.error('Failed to resolve dispute:', error);
            alert({
                title: 'Error',
                message: error.message || 'Failed to resolve dispute',
                okButtonText: 'OK'
            });
        }
    }

    async overrideMatch(): Promise<void> {
        if (!this._selectedWinnerId) {
            alert({
                title: 'Error',
                message: 'Please select a winner',
                okButtonText: 'OK'
            });
            return;
        }

        if (!this._overrideReason.trim()) {
            alert({
                title: 'Error',
                message: 'Please provide a reason for the override',
                okButtonText: 'OK'
            });
            return;
        }

        try {
            await MatchService.adminOverrideMatchResult(
                this._match.id,
                this._selectedWinnerId,
                this._adminId,
                this._overrideReason
            );

            alert({
                title: 'Success',
                message: 'Match result has been overridden',
                okButtonText: 'OK'
            });

            // Navigate back to the admin matches list
            const frame = Frame.topmost();
            frame.goBack();
        } catch (error) {
            console.error('Failed to override match:', error);
            alert({
                title: 'Error',
                message: error.message || 'Failed to override match',
                okButtonText: 'OK'
            });
        }
    }
}

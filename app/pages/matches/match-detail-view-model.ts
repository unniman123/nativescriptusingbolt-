import { Observable } from '@nativescript/core';
import { Match } from '../../services/supabase';
import { MatchService } from '../../services/match-service';
import { ProfileService } from '../../services/profile-service';
import { TournamentService } from '../../services/tournament-service';
import { matchTimer } from '../../services/match-timer.service';
import { errorHandler } from '../../services/error-handling.service';
import { scoreVerification, ScoreSubmission } from '../../services/score-verification.service';
import { AuthService } from '../../services/auth-service';

export class MatchDetailViewModel extends Observable {
    private _match: Match | null = null;
    private _tournament: Tournament | null = null;
    private _player1: Profile | null = null;
    private _player2: Profile | null = null;
    private _player1Score: number = 0;
    private _player2Score: number = 0;
    private _canSubmitScore: boolean = false;
    private _canDispute: boolean = false;
    private _remainingTime: string = '00:00';

    constructor(private matchId: string) {
        super();
        this.loadMatchDetails();

        // Subscribe to timer updates
        matchTimer.on('propertyChange', (data: any) => {
            if (data.propertyName === `timer_${this.matchId}`) {
                this._remainingTime = matchTimer.getRemainingTimeFormatted(this.matchId);
                this.notifyPropertyChange('remainingTime', this._remainingTime);
            }
        });

        // Subscribe to match time up event
        matchTimer.on('matchTimeUp', (data: any) => {
            if (data.matchId === this.matchId) {
                this.handleMatchTimeUp();
            }
        });

        // Subscribe to score dispute events
        scoreVerification.on('scoreDispute', (data: any) => {
            if (data.matchId === this.matchId) {
                this.handleScoreDispute(data.submissions);
            }
        });
    }

    // Getters and setters for observable properties
    get match(): Match | null {
        return this._match;
    }

    set match(value: Match | null) {
        if (this._match !== value) {
            this._match = value;
            this.notifyPropertyChange('match', value);
            this.updateActionStates();
        }
    }

    get tournament(): Tournament | null {
        return this._tournament;
    }

    set tournament(value: Tournament | null) {
        if (this._tournament !== value) {
            this._tournament = value;
            this.notifyPropertyChange('tournament', value);
        }
    }

    get player1(): Profile | null {
        return this._player1;
    }

    set player1(value: Profile | null) {
        if (this._player1 !== value) {
            this._player1 = value;
            this.notifyPropertyChange('player1', value);
        }
    }

    get player2(): Profile | null {
        return this._player2;
    }

    set player2(value: Profile | null) {
        if (this._player2 !== value) {
            this._player2 = value;
            this.notifyPropertyChange('player2', value);
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

    get canSubmitScore(): boolean {
        return this._canSubmitScore;
    }

    set canSubmitScore(value: boolean) {
        if (this._canSubmitScore !== value) {
            this._canSubmitScore = value;
            this.notifyPropertyChange('canSubmitScore', value);
        }
    }

    get canDispute(): boolean {
        return this._canDispute;
    }

    set canDispute(value: boolean) {
        if (this._canDispute !== value) {
            this._canDispute = value;
            this.notifyPropertyChange('canDispute', value);
        }
    }

    get remainingTime(): string {
        return this._remainingTime;
    }

    private updateActionStates() {
        if (!this._match) return;

        const currentUserId = 'current-user-id'; // Replace with actual user ID
        const isParticipant = 
            this._match.player1_id === currentUserId || 
            this._match.player2_id === currentUserId;

        this.canSubmitScore = 
            isParticipant && 
            this._match.status === 'in_progress';

        this.canDispute = 
            isParticipant && 
            this._match.status === 'completed';
    }

    private async loadMatchDetails(): Promise<void> {
        try {
            // Load match details
            const match = await MatchService.getMatchDetails(this.matchId);
            this._match = match;
            this.notifyPropertyChange('match', match);

            // Start timer if match is in progress
            if (match.status === 'in_progress') {
                const duration = match.duration || 30; // Default 30 minutes if not specified
                matchTimer.startTimer(this.matchId, duration);
            }

            // Load tournament details
            this.tournament = await TournamentService.getTournamentDetails(match.tournament_id);

            // Load player profiles
            this.player1 = await ProfileService.getProfile(match.player1_id);
            this.player2 = await ProfileService.getProfile(match.player2_id);

            // Set initial scores if available
            if (match.player1_score !== null) this.player1Score = match.player1_score;
            if (match.player2_score !== null) this.player2Score = match.player2_score;

        } catch (error) {
            errorHandler.handleError(error, 'Loading Match Details');
        }
    }

    private handleMatchTimeUp(): void {
        alert({
            title: 'Match Time Up',
            message: 'The match time has expired. Please submit your scores.',
            okButtonText: 'OK'
        });
    }

    async submitScore() {
        if (!this._match) return;

        try {
            const currentUserId = AuthService.getCurrentUser()?.id;
            if (!currentUserId) {
                throw new Error('User not authenticated');
            }

            const submission: ScoreSubmission = {
                matchId: this._match.id,
                player1Id: this._match.player1_id,
                player2Id: this._match.player2_id,
                player1Score: this.player1Score,
                player2Score: this.player2Score,
                submittedBy: currentUserId,
                timestamp: new Date()
            };

            const success = scoreVerification.submitScore(submission);
            
            if (success) {
                const submissions = scoreVerification.getSubmissions(this._match.id);
                if (submissions.length === 2) {
                    // Both players have submitted matching scores
                    const winnerId = this.player1Score > this.player2Score 
                        ? this._match.player1_id 
                        : this._match.player2_id;

                    await MatchService.submitMatchResult(
                        this._match.id,
                        this.player1Score,
                        this.player2Score,
                        winnerId
                    );

                    alert({
                        title: 'Success',
                        message: 'Match results verified and submitted successfully!',
                        okButtonText: 'OK'
                    });

                    scoreVerification.clearSubmissions(this._match.id);
                    await this.loadMatchDetails();
                } else {
                    alert({
                        title: 'Score Submitted',
                        message: 'Waiting for other player to submit their score.',
                        okButtonText: 'OK'
                    });
                }
            }
        } catch (error) {
            errorHandler.handleError(error, 'Submitting Match Score');
        }
    }

    private handleScoreDispute(submissions: ScoreSubmission[]): void {
        alert({
            title: 'Score Mismatch',
            message: 'The submitted scores do not match. The match will be marked as disputed.',
            okButtonText: 'OK'
        });

        this.disputeMatch();
    }

    async disputeMatch() {
        if (!this._match) return;

        try {
            await MatchService.disputeMatch(this._match.id);
            alert({
                title: 'Match Disputed',
                message: 'The match has been marked as disputed. An admin will review the case.',
                okButtonText: 'OK'
            });
            await this.loadMatchDetails(); // Refresh the data
        } catch (error) {
            console.error('Failed to dispute match:', error);
            alert({
                title: 'Error',
                message: error.message || 'Failed to dispute match. Please try again.',
                okButtonText: 'OK'
            });
        }
    }

    public onUnloaded(): void {
        // Clean up timer and score submissions when navigating away
        matchTimer.stopTimer(this.matchId);
        scoreVerification.clearSubmissions(this.matchId);
    }
}
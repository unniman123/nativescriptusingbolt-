import { Observable } from '@nativescript/core';
import { errorHandler } from './error-handling.service';

export interface ScoreSubmission {
    matchId: string;
    player1Id: string;
    player2Id: string;
    player1Score: number;
    player2Score: number;
    submittedBy: string;
    timestamp: Date;
}

export class ScoreVerificationService extends Observable {
    private static instance: ScoreVerificationService;
    private submissions: Map<string, ScoreSubmission[]> = new Map();

    private constructor() {
        super();
    }

    public static getInstance(): ScoreVerificationService {
        if (!ScoreVerificationService.instance) {
            ScoreVerificationService.instance = new ScoreVerificationService();
        }
        return ScoreVerificationService.instance;
    }

    public submitScore(submission: ScoreSubmission): boolean {
        try {
            const matchSubmissions = this.submissions.get(submission.matchId) || [];
            
            // Check if this player has already submitted
            if (matchSubmissions.some(s => s.submittedBy === submission.submittedBy)) {
                throw new Error('You have already submitted a score for this match');
            }

            // Add new submission
            matchSubmissions.push(submission);
            this.submissions.set(submission.matchId, matchSubmissions);

            // If both players have submitted, verify scores
            if (matchSubmissions.length === 2) {
                return this.verifyScores(submission.matchId);
            }

            return true;
        } catch (error) {
            errorHandler.handleError(error, 'Score Submission');
            return false;
        }
    }

    private verifyScores(matchId: string): boolean {
        const matchSubmissions = this.submissions.get(matchId);
        if (!matchSubmissions || matchSubmissions.length !== 2) return false;

        const [submission1, submission2] = matchSubmissions;

        // Scores match exactly
        if (submission1.player1Score === submission2.player1Score && 
            submission1.player2Score === submission2.player2Score) {
            return true;
        }

        // Scores are swapped (players submitted in different order)
        if (submission1.player1Score === submission2.player2Score && 
            submission1.player2Score === submission2.player1Score) {
            return true;
        }

        // Scores don't match - trigger dispute
        this.notify({
            eventName: 'scoreDispute',
            object: this,
            matchId,
            submissions: matchSubmissions
        });

        return false;
    }

    public getSubmissions(matchId: string): ScoreSubmission[] {
        return this.submissions.get(matchId) || [];
    }

    public clearSubmissions(matchId: string): void {
        this.submissions.delete(matchId);
    }
}

export const scoreVerification = ScoreVerificationService.getInstance();

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

interface ScoreDisputeEvent {
    eventName: 'scoreDispute';
    object: ScoreVerificationService;
    matchId: string;
    submissions: ScoreSubmission[];
}

export class ScoreVerificationService extends Observable {
    private static instance: ScoreVerificationService;
    private submissions: Map<string, ScoreSubmission[]> = new Map();
    private readonly MAX_SCORE_DIFFERENCE = 5; // Maximum allowed score difference before triggering dispute

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
            // Validate submission
            this.validateSubmission(submission);

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

    private validateSubmission(submission: ScoreSubmission): void {
        if (!submission.matchId || !submission.player1Id || !submission.player2Id) {
            throw new Error('Invalid submission: Missing required fields');
        }

        if (submission.player1Score < 0 || submission.player2Score < 0) {
            throw new Error('Invalid submission: Scores cannot be negative');
        }

        if (!submission.submittedBy) {
            throw new Error('Invalid submission: Missing submitter ID');
        }

        if (submission.submittedBy !== submission.player1Id && 
            submission.submittedBy !== submission.player2Id) {
            throw new Error('Invalid submission: Unauthorized to submit score');
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
            // Normalize the scores to match the first submission's player order
            submission2.player1Score = submission1.player1Score;
            submission2.player2Score = submission1.player2Score;
            return true;
        }

        // Check if score difference is within acceptable range
        const score1Diff = Math.abs(submission1.player1Score - submission2.player1Score);
        const score2Diff = Math.abs(submission1.player2Score - submission2.player2Score);
        
        if (score1Diff <= this.MAX_SCORE_DIFFERENCE && score2Diff <= this.MAX_SCORE_DIFFERENCE) {
            // Use average of submitted scores
            const finalScore1 = Math.round((submission1.player1Score + submission2.player1Score) / 2);
            const finalScore2 = Math.round((submission1.player2Score + submission2.player2Score) / 2);
            submission1.player1Score = submission2.player1Score = finalScore1;
            submission1.player2Score = submission2.player2Score = finalScore2;
            return true;
        }

        // Scores don't match - trigger dispute
        this.notify({
            eventName: 'scoreDispute',
            object: this,
            matchId,
            submissions: matchSubmissions
        } as ScoreDisputeEvent);

        return false;
    }

    public getSubmissions(matchId: string): ScoreSubmission[] {
        return this.submissions.get(matchId) || [];
    }

    public clearSubmissions(matchId: string): void {
        try {
            this.submissions.delete(matchId);
        } catch (error) {
            errorHandler.handleError(error, 'Clear Score Submissions');
        }
    }
}

export const scoreVerification = ScoreVerificationService.getInstance();

import { Observable } from '@nativescript/core';
import { errorHandler } from './error-handling.service';

export interface MatchTimer {
    matchId: string;
    startTime: Date;
    duration: number; // in minutes
    remainingTime: number; // in seconds
    isRunning: boolean;
}

export class MatchTimerService extends Observable {
    private static instance: MatchTimerService;
    private timers: Map<string, MatchTimer> = new Map();
    private intervals: Map<string, number> = new Map();

    private constructor() {
        super();
    }

    public static getInstance(): MatchTimerService {
        if (!MatchTimerService.instance) {
            MatchTimerService.instance = new MatchTimerService();
        }
        return MatchTimerService.instance;
    }

    public startTimer(matchId: string, duration: number): void {
        try {
            if (this.timers.has(matchId)) {
                throw new Error('Timer already exists for this match');
            }

            const timer: MatchTimer = {
                matchId,
                startTime: new Date(),
                duration,
                remainingTime: duration * 60, // convert to seconds
                isRunning: true
            };

            this.timers.set(matchId, timer);
            this.notifyPropertyChange(`timer_${matchId}`, timer);

            // Start interval
            const intervalId = setInterval(() => {
                this.updateTimer(matchId);
            }, 1000);

            this.intervals.set(matchId, intervalId);
        } catch (error) {
            errorHandler.handleError(error, 'Starting Match Timer');
        }
    }

    public stopTimer(matchId: string): void {
        try {
            const intervalId = this.intervals.get(matchId);
            if (intervalId) {
                clearInterval(intervalId);
                this.intervals.delete(matchId);
            }

            const timer = this.timers.get(matchId);
            if (timer) {
                timer.isRunning = false;
                this.notifyPropertyChange(`timer_${matchId}`, timer);
            }
        } catch (error) {
            errorHandler.handleError(error, 'Stopping Match Timer');
        }
    }

    public getTimer(matchId: string): MatchTimer | undefined {
        return this.timers.get(matchId);
    }

    public getRemainingTimeFormatted(matchId: string): string {
        const timer = this.timers.get(matchId);
        if (!timer) return '00:00';

        const minutes = Math.floor(timer.remainingTime / 60);
        const seconds = timer.remainingTime % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    private updateTimer(matchId: string): void {
        try {
            const timer = this.timers.get(matchId);
            if (!timer || !timer.isRunning) return;

            timer.remainingTime--;
            this.notifyPropertyChange(`timer_${matchId}`, timer);

            if (timer.remainingTime <= 0) {
                this.stopTimer(matchId);
                this.notifyMatchTimeUp(matchId);
            }
        } catch (error) {
            errorHandler.handleError(error, 'Updating Match Timer');
        }
    }

    private notifyMatchTimeUp(matchId: string): void {
        this.notify({
            eventName: 'matchTimeUp',
            object: this,
            matchId
        });
    }

    public resetTimer(matchId: string): void {
        try {
            const timer = this.timers.get(matchId);
            if (!timer) return;

            timer.remainingTime = timer.duration * 60;
            timer.isRunning = false;
            this.notifyPropertyChange(`timer_${matchId}`, timer);
        } catch (error) {
            errorHandler.handleError(error, 'Resetting Match Timer');
        }
    }

    public cleanup(): void {
        // Clean up all intervals when the app is closed or navigated away
        this.intervals.forEach((intervalId) => {
            clearInterval(intervalId);
        });
        this.intervals.clear();
        this.timers.clear();
    }
}

export const matchTimer = MatchTimerService.getInstance();

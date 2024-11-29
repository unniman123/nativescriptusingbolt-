import { Observable } from '@nativescript/core';
import { errorHandler } from './error-handling.service';

export interface MatchTimer {
    matchId: string;
    startTime: Date;
    duration: number; // in minutes
    remainingTime: number; // in seconds
    isRunning: boolean;
    isPaused: boolean;
    pausedTime?: number; // Time when the timer was paused
}

interface MatchTimeUpEvent {
    eventName: 'matchTimeUp';
    object: MatchTimerService;
    matchId: string;
}

interface TimerUpdateEvent {
    eventName: 'propertyChange';
    object: MatchTimerService;
    propertyName: string;
    value: MatchTimer;
}

export class MatchTimerService extends Observable {
    private static instance: MatchTimerService;
    private timers: Map<string, MatchTimer> = new Map();
    private intervals: Map<string, any> = new Map();
    private readonly MIN_DURATION = 1; // Minimum duration in minutes
    private readonly MAX_DURATION = 180; // Maximum duration in minutes (3 hours)

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
            // Validate inputs
            if (!matchId) {
                throw new Error('Invalid match ID');
            }
            if (duration < this.MIN_DURATION || duration > this.MAX_DURATION) {
                throw new Error(`Duration must be between ${this.MIN_DURATION} and ${this.MAX_DURATION} minutes`);
            }

            if (this.timers.has(matchId)) {
                const existingTimer = this.timers.get(matchId)!;
                if (existingTimer.isRunning) {
                    throw new Error('Timer already running for this match');
                }
                // Resume paused timer
                if (existingTimer.isPaused) {
                    return this.resumeTimer(matchId);
                }
            }

            const timer: MatchTimer = {
                matchId,
                startTime: new Date(),
                duration,
                remainingTime: duration * 60, // convert to seconds
                isRunning: true,
                isPaused: false
            };

            this.timers.set(matchId, timer);
            this.notifyTimerUpdate(matchId, timer);

            // Start interval
            const intervalId = setInterval(() => {
                this.updateTimer(matchId);
            }, 1000);

            this.intervals.set(matchId, intervalId);
        } catch (error) {
            errorHandler.handleError(error, 'Starting Match Timer');
        }
    }

    public pauseTimer(matchId: string): void {
        try {
            const timer = this.timers.get(matchId);
            if (!timer || !timer.isRunning) {
                throw new Error('No active timer found for this match');
            }

            const intervalId = this.intervals.get(matchId);
            if (intervalId) {
                clearInterval(intervalId);
                this.intervals.delete(matchId);
            }

            timer.isRunning = false;
            timer.isPaused = true;
            timer.pausedTime = timer.remainingTime;
            this.notifyTimerUpdate(matchId, timer);
        } catch (error) {
            errorHandler.handleError(error, 'Pausing Match Timer');
        }
    }

    public resumeTimer(matchId: string): void {
        try {
            const timer = this.timers.get(matchId);
            if (!timer || !timer.isPaused) {
                throw new Error('No paused timer found for this match');
            }

            timer.isRunning = true;
            timer.isPaused = false;
            delete timer.pausedTime;

            const intervalId = setInterval(() => {
                this.updateTimer(matchId);
            }, 1000);

            this.intervals.set(matchId, intervalId);
            this.notifyTimerUpdate(matchId, timer);
        } catch (error) {
            errorHandler.handleError(error, 'Resuming Match Timer');
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
                timer.isPaused = false;
                this.notifyTimerUpdate(matchId, timer);
            }

            // Clean up
            this.timers.delete(matchId);
        } catch (error) {
            errorHandler.handleError(error, 'Stopping Match Timer');
        }
    }

    public getTimer(matchId: string): MatchTimer | undefined {
        return this.timers.get(matchId);
    }

    public getRemainingTimeFormatted(matchId: string): string {
        try {
            const timer = this.timers.get(matchId);
            if (!timer) return '00:00';

            const minutes = Math.floor(timer.remainingTime / 60);
            const seconds = timer.remainingTime % 60;
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } catch (error) {
            errorHandler.handleError(error, 'Getting Formatted Time');
            return '00:00';
        }
    }

    private updateTimer(matchId: string): void {
        try {
            const timer = this.timers.get(matchId);
            if (!timer || !timer.isRunning) {
                // Clear interval if timer is not running to prevent memory leaks
                const intervalId = this.intervals.get(matchId);
                if (intervalId) {
                    clearInterval(intervalId);
                    this.intervals.delete(matchId);
                }
                return;
            }

            timer.remainingTime--;
            this.notifyTimerUpdate(matchId, timer);

            if (timer.remainingTime <= 0) {
                this.stopTimer(matchId);
                this.notifyMatchTimeUp(matchId);
            }
        } catch (error) {
            errorHandler.handleError(error, 'Updating Match Timer');
        }
    }

    private notifyTimerUpdate(matchId: string, timer: MatchTimer): void {
        this.notify({
            eventName: 'propertyChange',
            object: this,
            propertyName: `timer_${matchId}`,
            value: timer
        } as TimerUpdateEvent);
    }

    private notifyMatchTimeUp(matchId: string): void {
        this.notify({
            eventName: 'matchTimeUp',
            object: this,
            matchId
        } as MatchTimeUpEvent);
    }

    public resetTimer(matchId: string): void {
        try {
            const timer = this.timers.get(matchId);
            if (!timer) return;

            timer.remainingTime = timer.duration * 60;
            timer.isRunning = false;
            timer.isPaused = false;
            this.notifyTimerUpdate(matchId, timer);
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

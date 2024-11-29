import { Observable, ApplicationSettings } from '@nativescript/core';
import { authService } from './auth-service';

interface ErrorLog {
    id: string;
    timestamp: number;
    error: string;
    context: string;
    userId?: string;
    metadata?: any;
}

export class ErrorTrackingService extends Observable {
    private static instance: ErrorTrackingService;
    private readonly ERROR_LOG_KEY = 'error_logs';
    private readonly MAX_LOGS = 100;
    private logs: ErrorLog[] = [];

    private constructor() {
        super();
        this.loadLogs();
    }

    static getInstance(): ErrorTrackingService {
        if (!ErrorTrackingService.instance) {
            ErrorTrackingService.instance = new ErrorTrackingService();
        }
        return ErrorTrackingService.instance;
    }

    private loadLogs(): void {
        const logsStr = ApplicationSettings.getString(this.ERROR_LOG_KEY);
        if (logsStr) {
            try {
                this.logs = JSON.parse(logsStr);
            } catch (error) {
                console.error('Failed to load error logs:', error);
                this.logs = [];
            }
        }
    }

    private saveLogs(): void {
        // Keep only the latest MAX_LOGS entries
        if (this.logs.length > this.MAX_LOGS) {
            this.logs = this.logs.slice(-this.MAX_LOGS);
        }
        ApplicationSettings.setString(this.ERROR_LOG_KEY, JSON.stringify(this.logs));
    }

    trackError(error: Error | string, context: string, metadata?: any): void {
        const errorLog: ErrorLog = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            error: error instanceof Error ? error.message : error,
            context,
            userId: authService.currentUser()?.id,
            metadata
        };

        this.logs.push(errorLog);
        this.saveLogs();
        this.notifyPropertyChange('errorCount', this.logs.length);

        // Log to console for development
        console.error(`[${context}] Error:`, error);
        if (metadata) {
            console.error('Error metadata:', metadata);
        }
    }

    getRecentErrors(count: number = 10): ErrorLog[] {
        return this.logs.slice(-count).reverse();
    }

    clearLogs(): void {
        this.logs = [];
        this.saveLogs();
        this.notifyPropertyChange('errorCount', 0);
    }

    get errorCount(): number {
        return this.logs.length;
    }

    async uploadLogs(uploadFunction: (logs: ErrorLog[]) => Promise<void>): Promise<void> {
        if (this.logs.length === 0) return;

        try {
            await uploadFunction(this.logs);
            this.clearLogs();
        } catch (error) {
            console.error('Failed to upload error logs:', error);
        }
    }
}

export const errorTracking = ErrorTrackingService.getInstance();

import { alert, Observable } from '@nativescript/core';

export interface ErrorState {
    hasError: boolean;
    message: string;
    code?: string;
    context?: string;
    timestamp?: Date;
    severity: 'info' | 'warning' | 'error' | 'critical';
    retryable: boolean;
}

export interface ErrorEvent {
    eventName: 'error';
    object: ErrorHandlingService;
    error: ErrorState;
}

export interface RetryEvent {
    eventName: 'retry';
    object: ErrorHandlingService;
    error: ErrorState;
}

export class ErrorHandlingService extends Observable {
    private static instance: ErrorHandlingService;
    private currentError: ErrorState = {
        hasError: false,
        message: '',
        severity: 'info',
        retryable: false
    };
    private errorLog: ErrorState[] = [];
    private readonly MAX_LOG_SIZE = 100;

    private constructor() {
        super();
    }

    public static getInstance(): ErrorHandlingService {
        if (!ErrorHandlingService.instance) {
            ErrorHandlingService.instance = new ErrorHandlingService();
        }
        return ErrorHandlingService.instance;
    }

    public handleError(error: any, context: string = 'Operation'): void {
        console.error(`Error in ${context}:`, error);

        const errorState = this.createErrorState(error, context);
        this.currentError = errorState;
        this.logError(errorState);

        // Notify observers
        this.notify({
            eventName: 'error',
            object: this,
            error: errorState
        } as ErrorEvent);

        // Show error to user based on severity
        this.showErrorAlert(errorState);
    }

    private createErrorState(error: any, context: string): ErrorState {
        const message = this.formatErrorMessage(error);
        const code = this.getErrorCode(error);
        const severity = this.determineErrorSeverity(error, code);

        return {
            hasError: true,
            message,
            code,
            context,
            timestamp: new Date(),
            severity,
            retryable: this.isErrorRetryable(code)
        };
    }

    private getErrorCode(error: any): string {
        if (typeof error === 'string') return 'GENERIC_ERROR';
        if (error instanceof Error) return error.name;
        return error.code || 'UNKNOWN_ERROR';
    }

    private determineErrorSeverity(error: any, code: string): ErrorState['severity'] {
        // Critical errors
        if (code === 'AUTH_ERROR' || code === 'DATABASE_ERROR') {
            return 'critical';
        }

        // Warning level errors
        if (code === 'NETWORK_ERROR' || code === 'MATCH_IN_PROGRESS') {
            return 'warning';
        }

        // Info level messages
        if (code === 'TOURNAMENT_FULL') {
            return 'info';
        }

        // Default to error
        return 'error';
    }

    private isErrorRetryable(code: string): boolean {
        const retryableCodes = [
            'NETWORK_ERROR',
            'TIMEOUT_ERROR',
            'SERVER_ERROR',
            'DATABASE_ERROR'
        ];
        return retryableCodes.includes(code);
    }

    private formatErrorMessage(error: any): string {
        if (typeof error === 'string') return error;
        
        // Handle specific error types
        switch(error.code) {
            case 'TOURNAMENT_FULL':
                return 'This tournament is already full. Please try another tournament.';
            case 'MATCH_IN_PROGRESS':
                return 'You already have a match in progress. Please complete or forfeit it before starting a new one.';
            case 'NETWORK_ERROR':
                return 'Network connection error. Please check your internet connection and try again.';
            case 'AUTH_ERROR':
                return 'Your session has expired. Please log in again to continue.';
            case 'DATABASE_ERROR':
                return 'A database error occurred. Our team has been notified and is working on it.';
            case 'INVALID_SCORE':
                return 'The submitted score is invalid. Please check and try again.';
            case 'MATCH_EXPIRED':
                return 'This match has expired. Please contact support if you believe this is an error.';
            case 'TOURNAMENT_ENDED':
                return 'This tournament has already ended. Check the results in the tournament history.';
            default:
                return error.message || 'An unexpected error occurred. Please try again or contact support.';
        }
    }

    private showErrorAlert(error: ErrorState): void {
        const alertOptions: any = {
            title: this.getAlertTitle(error.severity),
            message: error.message,
            okButtonText: 'OK'
        };

        if (error.retryable) {
            alertOptions.cancelButtonText = 'Retry';
        }

        alert(alertOptions).then(() => {
            // This will always be called when the alert is dismissed
            if (error.retryable) {
                // Optionally, you might want to add a separate mechanism to track retry
                this.notify({
                    eventName: 'retry',
                    object: this,
                    error: error
                } as RetryEvent);
            }
        });
    }

    private getAlertTitle(severity: ErrorState['severity']): string {
        switch (severity) {
            case 'info':
                return 'Information';
            case 'warning':
                return 'Warning';
            case 'critical':
                return 'Critical Error';
            default:
                return 'Error';
        }
    }

    private logError(error: ErrorState): void {
        this.errorLog.unshift(error);
        if (this.errorLog.length > this.MAX_LOG_SIZE) {
            this.errorLog.pop();
        }
    }

    public clearError(): void {
        this.currentError = {
            hasError: false,
            message: '',
            severity: 'info',
            retryable: false
        };
        this.notify({
            eventName: 'error',
            object: this,
            error: this.currentError
        } as ErrorEvent);
    }

    public getCurrentError(): ErrorState {
        return this.currentError;
    }

    public getErrorLog(): ErrorState[] {
        return [...this.errorLog];
    }

    public clearErrorLog(): void {
        this.errorLog = [];
    }
}

export const errorHandler = ErrorHandlingService.getInstance();

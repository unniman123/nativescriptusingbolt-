import { alert } from '@nativescript/core';
import { Observable } from '@nativescript/core';

export interface ErrorState {
    hasError: boolean;
    message: string;
    code?: string;
    timestamp?: Date;
}

export class ErrorHandlingService extends Observable {
    private static instance: ErrorHandlingService;
    private currentError: ErrorState = {
        hasError: false,
        message: '',
    };

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

        const errorMessage = this.formatErrorMessage(error);
        this.currentError = {
            hasError: true,
            message: errorMessage,
            code: error.code,
            timestamp: new Date()
        };

        this.notifyPropertyChange('currentError', this.currentError);

        // Show error to user
        alert({
            title: 'Error',
            message: errorMessage,
            okButtonText: 'OK'
        });
    }

    private formatErrorMessage(error: any): string {
        if (typeof error === 'string') return error;
        
        // Handle specific error types
        switch(error.code) {
            case 'TOURNAMENT_FULL':
                return 'This tournament is already full. Please try another tournament.';
            case 'MATCH_IN_PROGRESS':
                return 'You already have a match in progress.';
            case 'INSUFFICIENT_BALANCE':
                return 'Insufficient balance in your wallet.';
            case 'NETWORK_ERROR':
                return 'Network connection error. Please check your internet connection.';
            case 'AUTH_ERROR':
                return 'Authentication error. Please log in again.';
            default:
                return error.message || 'An unexpected error occurred. Please try again.';
        }
    }

    public clearError(): void {
        this.currentError = {
            hasError: false,
            message: ''
        };
        this.notifyPropertyChange('currentError', this.currentError);
    }

    public getCurrentError(): ErrorState {
        return this.currentError;
    }
}

export const errorHandler = ErrorHandlingService.getInstance();

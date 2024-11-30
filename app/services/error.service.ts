import { Observable } from '@nativescript/core';
import { Dialogs } from '@nativescript/core';

interface ErrorConfig {
    showDialog?: boolean;
    retry?: boolean;
    maxRetries?: number;
}

class ErrorService extends Observable {
    private readonly DEFAULT_CONFIG: ErrorConfig = {
        showDialog: true,
        retry: false,
        maxRetries: 3
    };

    async handleError(error: any, config: ErrorConfig = {}) {
        const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
        
        // Log error
        console.error('Application error:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        // Notify observers
        this.notify({
            eventName: 'error',
            error,
            config: finalConfig
        });

        // Show dialog if configured
        if (finalConfig.showDialog) {
            await Dialogs.alert({
                title: 'Error',
                message: this.getUserFriendlyMessage(error),
                okButtonText: 'OK'
            });
        }

        // Handle specific error types
        if (error.name === 'AuthError') {
            // Handle authentication errors
            this.handleAuthError(error);
        } else if (error.name === 'NetworkError') {
            // Handle network errors
            await this.handleNetworkError(error, finalConfig);
        }
    }

    private getUserFriendlyMessage(error: any): string {
        // Map technical errors to user-friendly messages
        const errorMap: { [key: string]: string } = {
            'AuthError': 'Please sign in again to continue.',
            'NetworkError': 'Please check your internet connection.',
            'PermissionError': 'You don\'t have permission to perform this action.',
            'ValidationError': 'Please check your input and try again.'
        };

        return errorMap[error.name] || 'An unexpected error occurred. Please try again.';
    }

    private async handleAuthError(error: any) {
        // Clear auth state and redirect to login
        // Implementation depends on your auth service
    }

    private async handleNetworkError(error: any, config: ErrorConfig) {
        if (config.retry && config.maxRetries > 0) {
            // Implement retry logic with exponential backoff
            for (let attempt = 0; attempt < config.maxRetries; attempt++) {
                try {
                    // Retry the failed operation
                    // Implementation depends on your retry strategy
                    break;
                } catch (retryError) {
                    if (attempt === config.maxRetries - 1) {
                        throw retryError;
                    }
                    await this.delay(Math.pow(2, attempt) * 1000);
                }
            }
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Custom error classes
    createAuthError(message: string): Error {
        const error = new Error(message);
        error.name = 'AuthError';
        return error;
    }

    createNetworkError(message: string): Error {
        const error = new Error(message);
        error.name = 'NetworkError';
        return error;
    }

    createValidationError(message: string): Error {
        const error = new Error(message);
        error.name = 'ValidationError';
        return error;
    }

    createPermissionError(message: string): Error {
        const error = new Error(message);
        error.name = 'PermissionError';
        return error;
    }
}

export const errorService = new ErrorService();

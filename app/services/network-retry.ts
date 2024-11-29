import { Observable } from '@nativescript/core';

export class NetworkRetryService extends Observable {
    private static instance: NetworkRetryService;
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY = 1000; // 1 second

    private constructor() {
        super();
    }

    static getInstance(): NetworkRetryService {
        if (!NetworkRetryService.instance) {
            NetworkRetryService.instance = new NetworkRetryService();
        }
        return NetworkRetryService.instance;
    }

    async retry<T>(
        operation: () => Promise<T>,
        retries: number = this.MAX_RETRIES,
        delay: number = this.RETRY_DELAY
    ): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            if (retries === 0) {
                throw error;
            }

            console.log(`Operation failed, retrying... (${retries} attempts remaining)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            return this.retry(operation, retries - 1, delay * 2);
        }
    }

    async retryWithFallback<T>(
        operation: () => Promise<T>,
        fallback: () => Promise<T>,
        retries: number = this.MAX_RETRIES
    ): Promise<T> {
        try {
            return await this.retry(operation, retries);
        } catch (error) {
            console.log('All retries failed, using fallback');
            return fallback();
        }
    }
}

export const networkRetry = NetworkRetryService.getInstance();

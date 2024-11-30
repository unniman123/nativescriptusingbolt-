import { Observable } from '@nativescript/core';
import { Connectivity } from '@nativescript/core';
import { cacheService } from './cache.service';

interface NetworkConfig {
    retryAttempts: number;
    retryDelay: number;
    timeout: number;
    useCache: boolean;
}

class NetworkService extends Observable {
    private defaultConfig: NetworkConfig = {
        retryAttempts: 3,
        retryDelay: 1000,
        timeout: 10000,
        useCache: true
    };

    private connectionType: number = Connectivity.getConnectionType();

    constructor() {
        super();
        Connectivity.startMonitoring((newConnectionType) => {
            this.connectionType = newConnectionType;
            this.notify({
                eventName: 'connectionTypeChanged',
                connectionType: newConnectionType
            });
        });
    }

    async fetch<T>(url: string, options: RequestInit = {}, config?: Partial<NetworkConfig>): Promise<T> {
        const finalConfig = { ...this.defaultConfig, ...config };
        const cacheKey = `fetch_${url}`;

        // Check cache if enabled and offline
        if (finalConfig.useCache && this.connectionType === Connectivity.connectionType.none) {
            const cached = await cacheService.get<T>(cacheKey);
            if (cached) {
                return cached;
            }
            throw new Error('No network connection and no cached data available');
        }

        // Add timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout);
        options.signal = controller.signal;

        let lastError: Error | null = null;
        for (let attempt = 0; attempt < finalConfig.retryAttempts; attempt++) {
            try {
                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                // Cache successful response
                if (finalConfig.useCache) {
                    await cacheService.set(cacheKey, data);
                }

                return data;
            } catch (error: any) {
                if (error instanceof Error) {
                    lastError = error;
                } else {
                    lastError = new Error('Unknown error');
                }
                if (attempt < finalConfig.retryAttempts - 1) {
                    await this.delay(finalConfig.retryDelay * Math.pow(2, attempt));
                }
            }
        }

        throw lastError || new Error('Failed after all retry attempts');
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    isConnected(): boolean {
        return this.connectionType !== Connectivity.connectionType.none;
    }

    isWifi(): boolean {
        return this.connectionType === Connectivity.connectionType.wifi;
    }

    isMobile(): boolean {
        return this.connectionType === Connectivity.connectionType.mobile;
    }

    async optimizedImageLoad(url: string, quality: 'low' | 'medium' | 'high' = 'medium'): Promise<string> {
        // Add image optimization parameters based on connection type
        const imageUrl = new URL(url);
        
        if (this.isMobile() && !this.isWifi()) {
            switch (quality) {
                case 'low':
                    imageUrl.searchParams.set('w', '200');
                    break;
                case 'medium':
                    imageUrl.searchParams.set('w', '400');
                    break;
                case 'high':
                    imageUrl.searchParams.set('w', '800');
                    break;
            }
        }

        return imageUrl.toString();
    }

    // WebSocket optimization
    optimizeWebSocketConnection(): void {
        // Implement WebSocket connection optimization based on network conditions
        if (this.isMobile() && !this.isWifi()) {
            // Reduce ping frequency
            // Implement message batching
            // Add compression
        }
    }
}

export const networkService = new NetworkService();

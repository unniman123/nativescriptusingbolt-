import { Observable } from '@nativescript/core';
import { cacheService } from './cache.service';

interface PerformanceMetrics {
    componentLoadTime: number;
    networkRequestTime: number;
    memoryUsage: number;
}

class PerformanceService extends Observable {
    private readonly PERFORMANCE_THRESHOLD = {
        componentLoadTime: 300, // ms
        networkRequestTime: 1000, // ms
        memoryUsage: 50 // MB
    };

    private subscriptions: Map<string, any> = new Map();
    private componentLoadTimes: Map<string, number> = new Map();

    trackComponentLoad(componentId: string) {
        this.componentLoadTimes.set(componentId, Date.now());
    }

    trackComponentUnload(componentId: string) {
        const startTime = this.componentLoadTimes.get(componentId);
        if (startTime) {
            const loadTime = Date.now() - startTime;
            this.componentLoadTimes.delete(componentId);

            if (loadTime > this.PERFORMANCE_THRESHOLD.componentLoadTime) {
                console.warn(`Slow component load: ${componentId} took ${loadTime}ms`);
            }
        }
    }

    registerSubscription(componentId: string, subscription: any) {
        const existingSubscriptions = this.subscriptions.get(componentId) || [];
        existingSubscriptions.push(subscription);
        this.subscriptions.set(componentId, existingSubscriptions);
    }

    unregisterSubscriptions(componentId: string) {
        const subscriptions = this.subscriptions.get(componentId);
        if (subscriptions) {
            subscriptions.forEach((sub: any) => {
                if (sub && typeof sub.unsubscribe === 'function') {
                    sub.unsubscribe();
                }
            });
            this.subscriptions.delete(componentId);
        }
    }

    async optimizeImageLoad(url: string, maxWidth: number = 800): Promise<string> {
        // Add image optimization parameters
        const optimizedUrl = new URL(url);
        optimizedUrl.searchParams.set('width', maxWidth.toString());
        optimizedUrl.searchParams.set('quality', '80');
        return optimizedUrl.toString();
    }

    clearComponentCache(componentId: string) {
        // Clear component-specific cache
        cacheService.remove(`component_${componentId}`);
    }

    measureNetworkTime<T>(
        operation: () => Promise<T>,
        threshold: number = this.PERFORMANCE_THRESHOLD.networkRequestTime
    ): Promise<T> {
        const startTime = Date.now();
        
        return operation().then(result => {
            const duration = Date.now() - startTime;
            if (duration > threshold) {
                console.warn(`Slow network request: ${duration}ms`);
            }
            return result;
        });
    }

    async preloadData(componentId: string, dataLoader: () => Promise<any>) {
        try {
            const cachedData = await cacheService.get(`preload_${componentId}`);
            if (cachedData) return cachedData;

            const data = await this.measureNetworkTime(dataLoader);
            await cacheService.set(`preload_${componentId}`, data);
            return data;
        } catch (error) {
            console.error('Preload error:', error);
            throw error;
        }
    }

    optimizeList(items: any[], pageSize: number = 20): any[][] {
        // Split large lists into chunks for better performance
        const chunks: any[][] = [];
        for (let i = 0; i < items.length; i += pageSize) {
            chunks.push(items.slice(i, i + pageSize));
        }
        return chunks;
    }

    cleanup() {
        // Clean up all subscriptions
        this.subscriptions.forEach((subs, componentId) => {
            this.unregisterSubscriptions(componentId);
        });

        // Clear performance metrics
        this.componentLoadTimes.clear();
    }
}

export const performanceService = new PerformanceService();

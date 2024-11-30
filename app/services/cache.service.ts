import { Observable } from '@nativescript/core';
import { ApplicationSettings } from '@nativescript/core';

interface CacheItem<T> {
    data: T;
    expiry: number;
}

class CacheService extends Observable {
    private memoryCache: Map<string, CacheItem<any>> = new Map();
    private readonly DEFAULT_EXPIRY = 5 * 60 * 1000; // 5 minutes

    async get<T>(key: string): Promise<T | null> {
        // Check memory cache first
        const memoryItem = this.memoryCache.get(key);
        if (memoryItem && memoryItem.expiry > Date.now()) {
            return memoryItem.data;
        }
        this.memoryCache.delete(key);

        // Check persistent storage
        const stored = ApplicationSettings.getString(key);
        if (stored) {
            try {
                const item: CacheItem<T> = JSON.parse(stored);
                if (item.expiry > Date.now()) {
                    // Refresh memory cache
                    this.memoryCache.set(key, item);
                    return item.data;
                }
                // Remove expired item
                ApplicationSettings.remove(key);
            } catch (error) {
                console.error('Cache parse error:', error);
            }
        }
        return null;
    }

    async set<T>(key: string, data: T, expiryMs: number = this.DEFAULT_EXPIRY): Promise<void> {
        const item: CacheItem<T> = {
            data,
            expiry: Date.now() + expiryMs
        };

        // Update memory cache
        this.memoryCache.set(key, item);

        // Update persistent storage
        try {
            ApplicationSettings.setString(key, JSON.stringify(item));
        } catch (error) {
            console.error('Cache save error:', error);
        }
    }

    remove(key: string): void {
        this.memoryCache.delete(key);
        ApplicationSettings.remove(key);
    }

    clear(): void {
        this.memoryCache.clear();
        ApplicationSettings.clear();
    }

    async getOrSet<T>(
        key: string,
        fetchFn: () => Promise<T>,
        expiryMs: number = this.DEFAULT_EXPIRY
    ): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        const fresh = await fetchFn();
        await this.set(key, fresh, expiryMs);
        return fresh;
    }

    // Specialized methods for different types of data
    async getTournamentData(tournamentId: string) {
        return this.getOrSet(
            `tournament_${tournamentId}`,
            async () => {
                // Fetch tournament data
                return {};
            },
            30 * 60 * 1000 // 30 minutes cache
        );
    }

    async getUserProfile(userId: string) {
        return this.getOrSet(
            `user_${userId}`,
            async () => {
                // Fetch user profile
                return {};
            },
            60 * 60 * 1000 // 1 hour cache
        );
    }

    async getLeaderboard() {
        return this.getOrSet(
            'leaderboard',
            async () => {
                // Fetch leaderboard data
                return [];
            },
            5 * 60 * 1000 // 5 minutes cache
        );
    }
}

export const cacheService = new CacheService();

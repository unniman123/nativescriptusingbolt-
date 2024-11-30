import { Observable } from '@nativescript/core';
import { leaderboard, LeaderboardEntry } from '../../services/leaderboard.service';
import { loadingState } from '../../services/loading-state.service';
import { toast } from '../../services/toast.service';

export class LeaderboardViewModel extends Observable {
    private leaderboardEntries: LeaderboardEntry[] = [];
    private isLoading = false;

    constructor() {
        super();
        this.initializeLeaderboard();
    }

    private async initializeLeaderboard() {
        try {
            loadingState.startLoading('leaderboard');
            this.set('isLoading', true);

            // Load initial leaderboard data
            const entries = await leaderboard.getLeaderboard();
            this.set('leaderboardEntries', entries);

            // Watch for updates
            leaderboard.watchLeaderboard();
            leaderboard.on('leaderboardUpdate', (data: any) => {
                this.handleLeaderboardUpdate(data);
            });

        } catch (error) {
            toast.error('Failed to load leaderboard');
            console.error('Leaderboard initialization error:', error);
        } finally {
            loadingState.stopLoading('leaderboard');
            this.set('isLoading', false);
        }
    }

    private handleLeaderboardUpdate(update: LeaderboardEntry) {
        const entries = [...this.leaderboardEntries];
        const index = entries.findIndex(e => e.id === update.id);
        
        if (index !== -1) {
            entries[index] = update;
        } else {
            entries.push(update);
        }

        // Sort by rank
        entries.sort((a, b) => a.rank - b.rank);
        this.set('leaderboardEntries', entries);
    }

    async refreshLeaderboard() {
        await this.initializeLeaderboard();
        toast.success('Leaderboard refreshed');
    }

    onUnloaded() {
        leaderboard.unwatchLeaderboard();
    }
}

import { Observable } from '@nativescript/core';
import { MatchmakingService } from '../../services/matchmaking-service';
import { AuthService } from '../../services/auth-service';
import { Frame } from '@nativescript/core';

export class MatchmakingViewModel extends Observable {
    private matchmakingService: MatchmakingService;
    private searchStartTime: Date | null = null;
    private waitTimeInterval: number | null = null;

    private _isSearching: boolean = false;
    private _selectedGameMode: 'casual' | 'ranked' | 'custom' = 'casual';
    private _skillRange: number = 300;
    private _regions: string[] = ['Global', 'NA', 'EU', 'Asia', 'SA', 'OCE'];
    private _selectedRegionIndex: number = 0;
    private _maxWaitTime: number = 5;
    private _waitTimeText: string = '';
    private _stats: any = {
        activePlayersCount: 0,
        averageWaitTime: 0
    };

    constructor() {
        super();
        this.matchmakingService = MatchmakingService.getInstance();
        this.setupEventListeners();
        this.loadMatchmakingStats();
    }

    private setupEventListeners(): void {
        this.matchmakingService.on('matchCreated', (args: any) => {
            this.onMatchFound(args.match);
        });

        this.matchmakingService.on('matchmakingTimeout', (args: any) => {
            if (args.userId === AuthService.getCurrentUser()?.id) {
                this.onMatchmakingTimeout();
            }
        });
    }

    // Properties
    get isSearching(): boolean {
        return this._isSearching;
    }

    get selectedGameMode(): string {
        return this._selectedGameMode;
    }

    get skillRange(): number {
        return this._skillRange;
    }

    set skillRange(value: number) {
        if (this._skillRange !== value) {
            this._skillRange = value;
            this.notifyPropertyChange('skillRange', value);
        }
    }

    get regions(): string[] {
        return this._regions;
    }

    get selectedRegionIndex(): number {
        return this._selectedRegionIndex;
    }

    set selectedRegionIndex(value: number) {
        if (this._selectedRegionIndex !== value) {
            this._selectedRegionIndex = value;
            this.notifyPropertyChange('selectedRegionIndex', value);
        }
    }

    get maxWaitTime(): number {
        return this._maxWaitTime;
    }

    set maxWaitTime(value: number) {
        if (this._maxWaitTime !== value) {
            this._maxWaitTime = value;
            this.notifyPropertyChange('maxWaitTime', value);
        }
    }

    get waitTimeText(): string {
        return this._waitTimeText;
    }

    get stats(): any {
        return this._stats;
    }

    // Actions
    selectGameMode(args: any): void {
        const button = args.object;
        const mode = button.get('data-mode') as 'casual' | 'ranked' | 'custom';
        
        if (this._selectedGameMode !== mode) {
            this._selectedGameMode = mode;
            this.notifyPropertyChange('selectedGameMode', mode);
        }
    }

    async startMatchmaking(): Promise<void> {
        if (this._isSearching) return;

        const userId = AuthService.getCurrentUser()?.id;
        if (!userId) {
            alert({
                title: 'Error',
                message: 'You must be logged in to use matchmaking',
                okButtonText: 'OK'
            });
            return;
        }

        try {
            await this.matchmakingService.joinMatchmaking(userId, {
                gameMode: this._selectedGameMode,
                skillRange: this._skillRange,
                regionPreference: this._regions[this._selectedRegionIndex],
                availabilityWindow: this._maxWaitTime
            });

            this._isSearching = true;
            this.notifyPropertyChange('isSearching', true);
            this.searchStartTime = new Date();
            this.startWaitTimeCounter();
        } catch (error) {
            console.error('Failed to start matchmaking:', error);
            alert({
                title: 'Error',
                message: error.message || 'Failed to start matchmaking',
                okButtonText: 'OK'
            });
        }
    }

    async cancelSearch(): Promise<void> {
        if (!this._isSearching) return;

        const userId = AuthService.getCurrentUser()?.id;
        if (userId) {
            await this.matchmakingService.leaveMatchmaking(userId);
        }

        this.stopSearch();
    }

    private startWaitTimeCounter(): void {
        this.waitTimeInterval = setInterval(() => {
            if (this.searchStartTime) {
                const waitTime = Math.floor((new Date().getTime() - this.searchStartTime.getTime()) / 1000);
                this._waitTimeText = `Waiting for ${waitTime} seconds...`;
                this.notifyPropertyChange('waitTimeText', this._waitTimeText);
            }
        }, 1000);
    }

    private stopSearch(): void {
        this._isSearching = false;
        this.notifyPropertyChange('isSearching', false);
        this.searchStartTime = null;
        if (this.waitTimeInterval) {
            clearInterval(this.waitTimeInterval);
            this.waitTimeInterval = null;
        }
        this._waitTimeText = '';
        this.notifyPropertyChange('waitTimeText', '');
    }

    private onMatchFound(match: any): void {
        this.stopSearch();
        
        // Navigate to match detail page
        const frame = Frame.topmost();
        frame.navigate({
            moduleName: 'pages/tournaments/match-detail-page',
            context: { matchId: match.id }
        });
    }

    private onMatchmakingTimeout(): void {
        this.stopSearch();
        alert({
            title: 'Matchmaking Timeout',
            message: 'Could not find a suitable match within the specified time',
            okButtonText: 'OK'
        });
    }

    private async loadMatchmakingStats(): Promise<void> {
        try {
            const stats = await this.matchmakingService.getMatchmakingStats();
            this._stats = stats;
            this.notifyPropertyChange('stats', stats);
        } catch (error) {
            console.error('Failed to load matchmaking stats:', error);
        }
    }

    // Cleanup
    onUnloaded(): void {
        if (this.waitTimeInterval) {
            clearInterval(this.waitTimeInterval);
        }
        const userId = AuthService.getCurrentUser()?.id;
        if (userId && this._isSearching) {
            this.matchmakingService.leaveMatchmaking(userId);
        }
    }
}

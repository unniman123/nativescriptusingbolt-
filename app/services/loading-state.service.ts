import { Observable } from '@nativescript/core';

export class LoadingStateService extends Observable {
    private static instance: LoadingStateService;
    private loadingStates: Map<string, boolean> = new Map();

    private constructor() {
        super();
    }

    public static getInstance(): LoadingStateService {
        if (!LoadingStateService.instance) {
            LoadingStateService.instance = new LoadingStateService();
        }
        return LoadingStateService.instance;
    }

    public startLoading(key: string): void {
        this.loadingStates.set(key, true);
        this.notifyPropertyChange(key, true);
    }

    public stopLoading(key: string): void {
        this.loadingStates.set(key, false);
        this.notifyPropertyChange(key, false);
    }

    public isLoading(key: string): boolean {
        return this.loadingStates.get(key) || false;
    }
}

export const loadingState = LoadingStateService.getInstance();

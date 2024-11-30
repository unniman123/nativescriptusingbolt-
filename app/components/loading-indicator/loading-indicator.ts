import { Observable } from '@nativescript/core';
import { loadingState } from '../../services/loading-state.service';

export class LoadingIndicatorModel extends Observable {
    constructor(private loadingKey: string) {
        super();
        this.bindToLoadingState();
    }

    private bindToLoadingState() {
        const loadingStateInstance = loadingState;
        Object.defineProperty(this, 'isLoading', {
            get() {
                return loadingStateInstance.isLoading(this.loadingKey);
            },
            enumerable: true,
            configurable: true
        });
    }

    public setLoadingMessage(message: string) {
        this.set('loadingMessage', message);
    }
}

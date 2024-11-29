import { Observable, ApplicationSettings } from '@nativescript/core';

interface QueuedOperation {
    id: string;
    type: string;
    data: any;
    timestamp: number;
}

export class OfflineQueueService extends Observable {
    private static instance: OfflineQueueService;
    private readonly QUEUE_KEY = 'offline_operation_queue';
    private queue: QueuedOperation[] = [];
    private isProcessing: boolean = false;

    private constructor() {
        super();
        this.loadQueue();
    }

    static getInstance(): OfflineQueueService {
        if (!OfflineQueueService.instance) {
            OfflineQueueService.instance = new OfflineQueueService();
        }
        return OfflineQueueService.instance;
    }

    private loadQueue(): void {
        const queueStr = ApplicationSettings.getString(this.QUEUE_KEY);
        if (queueStr) {
            try {
                this.queue = JSON.parse(queueStr);
            } catch (error) {
                console.error('Failed to load offline queue:', error);
                this.queue = [];
            }
        }
    }

    private saveQueue(): void {
        ApplicationSettings.setString(this.QUEUE_KEY, JSON.stringify(this.queue));
    }

    addOperation(type: string, data: any): void {
        const operation: QueuedOperation = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            data,
            timestamp: Date.now()
        };

        this.queue.push(operation);
        this.saveQueue();
        this.notifyPropertyChange('queueLength', this.queue.length);
    }

    async processQueue(
        processors: { [key: string]: (data: any) => Promise<void> }
    ): Promise<void> {
        if (this.isProcessing || this.queue.length === 0) return;

        this.isProcessing = true;
        const failedOperations: QueuedOperation[] = [];

        try {
            for (const operation of this.queue) {
                const processor = processors[operation.type];
                if (processor) {
                    try {
                        await processor(operation.data);
                    } catch (error) {
                        console.error(`Failed to process operation ${operation.id}:`, error);
                        failedOperations.push(operation);
                    }
                } else {
                    console.warn(`No processor found for operation type: ${operation.type}`);
                    failedOperations.push(operation);
                }
            }
        } finally {
            this.queue = failedOperations;
            this.saveQueue();
            this.isProcessing = false;
            this.notifyPropertyChange('queueLength', this.queue.length);
        }
    }

    clearQueue(): void {
        this.queue = [];
        this.saveQueue();
        this.notifyPropertyChange('queueLength', 0);
    }

    get queueLength(): number {
        return this.queue.length;
    }
}

export const offlineQueue = OfflineQueueService.getInstance();

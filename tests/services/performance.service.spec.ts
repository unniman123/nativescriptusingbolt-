import { performanceService } from '../../app/services/performance.service';

describe('PerformanceService', () => {
    beforeEach(() => {
        performanceService.cleanup();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('component tracking', () => {
        it('should track component load times', () => {
            const componentId = 'test-component';
            performanceService.trackComponentLoad(componentId);
            
            jest.advanceTimersByTime(400); // Simulate slow load
            
            const consoleSpy = jest.spyOn(console, 'warn');
            performanceService.trackComponentUnload(componentId);
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Slow component load')
            );
        });
    });

    describe('subscription management', () => {
        it('should properly manage subscriptions', () => {
            const componentId = 'test-component';
            const mockSubscription = {
                unsubscribe: jest.fn()
            };

            performanceService.registerSubscription(componentId, mockSubscription);
            performanceService.unregisterSubscriptions(componentId);

            expect(mockSubscription.unsubscribe).toHaveBeenCalled();
        });
    });

    describe('network performance', () => {
        it('should measure network request time', async () => {
            const consoleSpy = jest.spyOn(console, 'warn');
            const slowOperation = () => new Promise(resolve => {
                setTimeout(() => resolve('data'), 1500);
            });

            jest.advanceTimersByTime(1500);
            await performanceService.measureNetworkTime(slowOperation);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Slow network request')
            );
        });
    });

    describe('list optimization', () => {
        it('should properly chunk large lists', () => {
            const items = Array.from({ length: 100 }, (_, i) => i);
            const chunks = performanceService.optimizeList(items, 20);

            expect(chunks.length).toBe(5);
            expect(chunks[0].length).toBe(20);
        });
    });

    describe('image optimization', () => {
        it('should add optimization parameters to image URLs', async () => {
            const originalUrl = 'https://example.com/image.jpg';
            const optimizedUrl = await performanceService.optimizeImageLoad(originalUrl);

            expect(optimizedUrl).toContain('width=800');
            expect(optimizedUrl).toContain('quality=80');
        });
    });
});

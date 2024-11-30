import { RealtimeChannel } from '@supabase/supabase-js';
import { Observable } from '@nativescript/core';
import { supabase } from './supabase';
import { toast } from './toast.service';

export class RealtimeService extends Observable {
    getCurrentUser() {
        throw new Error('Method not implemented.');
    }
    private static instance: RealtimeService;
    private channels: Map<string, RealtimeChannel> = new Map();

    private constructor() {
        super();
    }

    public static getInstance(): RealtimeService {
        if (!RealtimeService.instance) {
            RealtimeService.instance = new RealtimeService();
        }
        return RealtimeService.instance;
    }

    // Subscribe to tournament updates
    public subscribeTournament(tournamentId: string): RealtimeChannel {
        const channelKey = `tournament:${tournamentId}`;
        
        const existingChannel = this.channels.get(channelKey);
        if (existingChannel) {
            return existingChannel;
        }

        const channel = supabase
            .channel(channelKey)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'tournaments',
                filter: `id=eq.${tournamentId}`
            }, (payload) => {
                this.notify({
                    eventName: 'tournamentUpdate',
                    object: this,
                    data: payload.new
                });
            })
            .subscribe();

        if (!channel) {
            throw new Error('Failed to create realtime channel');
        }

        this.channels.set(channelKey, channel);
        return channel;
    }

    // Subscribe to match updates
    public subscribeMatch(matchId: string): RealtimeChannel {
        const channelKey = `match:${matchId}`;
        
        const existingChannel = this.channels.get(channelKey);
        if (existingChannel) {
            return existingChannel;
        }

        const channel = supabase
            .channel(channelKey)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'matches',
                filter: `id=eq.${matchId}`
            }, (payload) => {
                this.notify({
                    eventName: 'matchUpdate',
                    object: this,
                    data: payload.new
                });
            })
            .subscribe();

        if (!channel) {
            throw new Error('Failed to create realtime channel');
        }

        this.channels.set(channelKey, channel);
        return channel;
    }

    // Subscribe to user notifications
    public subscribeUserNotifications(userId: string): RealtimeChannel {
        const channelKey = `user:${userId}:notifications`;
        
        const existingChannel = this.channels.get(channelKey);
        if (existingChannel) {
            return existingChannel;
        }

        const channel = supabase
            .channel(channelKey)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            }, (payload) => {
                this.notify({
                    eventName: 'notificationUpdate',
                    object: this,
                    data: payload.new
                });
            })
            .subscribe();

        if (!channel) {
            throw new Error('Failed to create realtime channel');
        }

        this.channels.set(channelKey, channel);
        return channel;
    }

    // Unsubscribe from a channel
    public unsubscribe(channelKey: string): void {
        const channel = this.channels.get(channelKey);
        if (channel) {
            channel.unsubscribe();
            this.channels.delete(channelKey);
        }
    }

    // Unsubscribe from all channels
    public unsubscribeAll(): void {
        this.channels.forEach(channel => channel.unsubscribe());
        this.channels.clear();
    }
}

export const realtime = RealtimeService.getInstance();

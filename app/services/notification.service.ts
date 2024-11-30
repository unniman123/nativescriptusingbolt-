import { Observable } from '@nativescript/core';
import { supabase } from './supabase';
import { realtime } from './realtime.service';

export interface Notification {
    id: string;
    user_id: string;
    message: string;
    type: 'match_start' | 'match_result' | 'tournament_update' | 'system';
    read: boolean;
    created_at: string;
}

export class NotificationService extends Observable {
    private static instance: NotificationService;
    private unreadCount = 0;

    private constructor() {
        super();
        this.initialize();
    }

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    private async initialize() {
        const { data } = await supabase.auth.getUser();
        const user = data.user;
        if (user) {
            await this.loadUnreadCount();
            this.subscribeToNotifications(user.id);
        }
    }

    private async loadUnreadCount() {
        const { count } = await supabase
            .from('notifications')
            .select('id', { count: 'exact' })
            .eq('read', false);
        
        this.unreadCount = count || 0;
        this.notifyPropertyChange('unreadCount', this.unreadCount);
    }

    private subscribeToNotifications(userId: string) {
        realtime.on('newNotification', () => {
            this.unreadCount++;
            this.notifyPropertyChange('unreadCount', this.unreadCount);
        });

        realtime.subscribeUserNotifications(userId);
    }

    public async getNotifications(limit = 20, offset = 0): Promise<Notification[]> {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return data;
    }

    public async markAsRead(notificationId: string): Promise<void> {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);

        if (error) throw error;

        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.notifyPropertyChange('unreadCount', this.unreadCount);
    }

    public async markAllAsRead(): Promise<void> {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('read', false);

        if (error) throw error;

        this.unreadCount = 0;
        this.notifyPropertyChange('unreadCount', this.unreadCount);
    }

    public getUnreadCount(): number {
        return this.unreadCount;
    }

    public async cleanup() {
        const { data, error } = await supabase.auth.getUser();
        if (data.user) {
            realtime.unsubscribe(`user:${data.user.id}:notifications`);
        }
    }
}

export const notifications = NotificationService.getInstance();

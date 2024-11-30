import { Observable } from '@nativescript/core';
import { chat, ChatMessage } from '../../services/chat.service';
import { supabase } from '../../services/supabase';
import { toast } from '../../services/toast.service';

export class ChatViewModel extends Observable {
    private roomId: string;
    private messages: ChatMessage[] = [];
    private messageText: string = '';
    private currentUserId: string;
    private roomTitle: string = 'Chat';
    private _reconnectAttempts: number = 0;
    private _maxReconnectAttempts: number = 5;
    private _reconnectTimeout: any;
    private _unconfirmedMessages: Map<string, { message: string, timestamp: number }> = new Map();
    private subscription: any;
    private onlineUsers: string[] = [];

    constructor(roomId: string, type: 'direct' | 'match' | 'tournament', title: string) {
        super();
        this.roomId = roomId;
        this.currentUserId = supabase.auth.user()?.id;
        this.roomTitle = title;
        
        this.initializeChat();
        this.startMessageCleanup();
    }

    private async initializeChat() {
        try {
            // Load initial messages
            const messages = await chat.getMessages(this.roomId);
            this.set('messages', messages.reverse());

            // Watch for new messages
            this.setupWebSocket();
        } catch (error) {
            toast.error('Failed to load messages');
            console.error('Chat initialization error:', error);
        }
    }

    private setupWebSocket() {
        this.subscription = supabase
            .channel(`room:${this.roomId}`)
            .on('presence', { event: 'sync' }, () => {
                this.handlePresenceSync();
            })
            .on('broadcast', { event: 'message' }, payload => {
                this.handleNewMessage(payload.payload);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    this._reconnectAttempts = 0;
                    clearTimeout(this._reconnectTimeout);
                    await this.trackPresence();
                } else if (status === 'DISCONNECTED') {
                    this.handleDisconnection();
                }
            });
    }

    private async trackPresence() {
        try {
            await this.subscription.track({
                user_id: this.currentUserId,
                online_at: new Date().toISOString()
            });
        } catch (error) {
            console.error('Presence tracking error:', error);
        }
    }

    private handlePresenceSync() {
        const presence = this.subscription.presenceState();
        const onlineUsers = Object.values(presence).flat();
        this.set('onlineUsers', onlineUsers);
    }

    private handleDisconnection() {
        if (this._reconnectAttempts < this._maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, this._reconnectAttempts), 30000);
            this._reconnectTimeout = setTimeout(() => {
                this._reconnectAttempts++;
                this.setupWebSocket();
            }, delay);
        } else {
            toast.error('Connection lost. Please refresh the page.');
        }
    }

    private handleNewMessage(message: ChatMessage) {
        const messages = [...this.messages];
        messages.push(message);
        this.set('messages', messages);
    }

    async sendMessage() {
        if (!this.messageText.trim()) return;

        const messageId = generateUUID();
        this._unconfirmedMessages.set(messageId, {
            message: this.messageText.trim(),
            timestamp: Date.now()
        });

        try {
            const { data, error } = await supabase
                .from('messages')
                .insert([
                    {
                        id: messageId,
                        room_id: this.roomId,
                        content: this.messageText.trim(),
                        user_id: this.currentUserId
                    }
                ]);

            if (error) throw error;
            
            // Message confirmed
            this._unconfirmedMessages.delete(messageId);
            
        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error('Failed to send message. Please try again.');
            
            // Keep message in unconfirmed state
            setTimeout(() => {
                if (this._unconfirmedMessages.has(messageId)) {
                    // Message still unconfirmed after 5 seconds
                    toast.warning('Message delivery uncertain. Please check if received.');
                }
            }, 5000);
        }

        this.set('messageText', '');
    }

    private startMessageCleanup() {
        setInterval(() => {
            const now = Date.now();
            for (const [messageId, { timestamp }] of this._unconfirmedMessages) {
                if (now - timestamp > 30000) { // 30 seconds timeout
                    this._unconfirmedMessages.delete(messageId);
                }
            }
        }, 10000);
    }

    refreshMessages() {
        this.initializeChat();
    }

    onUnloaded() {
        this.subscription.unsubscribe();
    }
}

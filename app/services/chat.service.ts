import { Observable } from '@nativescript/core';
import { supabase } from './supabase';
import { toast } from './toast.service';

export interface ChatMessage {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
    room_id: string;
    sender?: {
        id: string;
        username: string;
    };
}

export interface ChatRoom {
    id: string;
    type: 'direct' | 'match' | 'tournament';
    reference_id?: string;
    created_at: string;
    last_message?: ChatMessage;
    unread_count?: number;
}

export class ChatService extends Observable {
    private static instance: ChatService;
    private activeRoom: string | null = null;

    private constructor() {
        super();
    }

    public static getInstance(): ChatService {
        if (!ChatService.instance) {
            ChatService.instance = new ChatService();
        }
        return ChatService.instance;
    }

    public async getCurrentUser() {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    }

    public async createDirectChat(otherUserId: string): Promise<string> {
        const user = await this.getCurrentUser();

        const { data: existingRoom } = await supabase
            .from('chat_rooms')
            .select('id')
            .eq('type', 'direct')
            .eq('reference_id', null)
            .or(`user_id.eq.${otherUserId},user_id.eq.${user?.id}`)
            .single();

        if (existingRoom) return existingRoom.id;

        const { data: newRoom, error } = await supabase
            .from('chat_rooms')
            .insert([{ type: 'direct' }])
            .select()
            .single();

        if (error) {
            toast.error('Error creating chat room');
            throw error;
        }

        if (!newRoom) {
            throw new Error('No chat room created');
        }

        await supabase.from('chat_participants').insert([
            { room_id: newRoom.id, user_id: user?.id },
            { room_id: newRoom.id, user_id: otherUserId }
        ]);

        return newRoom.id;
    }

    public async getOrCreateMatchChat(matchId: string): Promise<string> {
        const { data: existingRoom } = await supabase
            .from('chat_rooms')
            .select('id')
            .eq('type', 'match')
            .eq('reference_id', matchId)
            .single();

        if (existingRoom) return existingRoom.id;

        const { data: newRoom, error } = await supabase
            .from('chat_rooms')
            .insert([{ type: 'match', reference_id: matchId }])
            .select();

        if (error) throw error;
        if (!newRoom || newRoom.length === 0) throw new Error('Failed to create chat room');

        return newRoom[0].id;
    }

    public async getOrCreateTournamentChat(tournamentId: string): Promise<string> {
        const { data: existingRoom } = await supabase
            .from('chat_rooms')
            .select('id')
            .eq('type', 'tournament')
            .eq('reference_id', tournamentId)
            .single();

        if (existingRoom) return existingRoom.id;

        const { data: newRoom, error } = await supabase
            .from('chat_rooms')
            .insert([{ type: 'tournament', reference_id: tournamentId }])
            .select();

        if (error) throw error;
        if (!newRoom || newRoom.length === 0) throw new Error('Failed to create tournament chat room');

        return newRoom[0].id;
    }

    public async sendMessage(content: string, roomId: string): Promise<void> {
        try {
            const user = await this.getCurrentUser();
            if (!user?.id) {
                throw new Error('User not authenticated');
            }

            const { error } = await supabase
                .from('chat_messages')
                .insert({
                    content,
                    room_id: roomId,
                    sender_id: user.id
                });

            if (error) throw error;
            toast.success('Message sent');
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
            throw error;
        }
    }

    public async getMessages(roomId: string): Promise<ChatMessage[]> {
        try {
            const user = await this.getCurrentUser();
            if (!user?.id) {
                throw new Error('User not authenticated');
            }

            const { data, error } = await supabase
                .from('chat_messages')
                .select(`
                    *,
                    sender:profiles(id, username)
                `)
                .eq('room_id', roomId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting messages:', error);
            throw error;
        }
    }

    public async deleteMessage(messageId: string): Promise<void> {
        try {
            const user = await this.getCurrentUser();
            if (!user?.id) {
                throw new Error('User not authenticated');
            }

            const { error } = await supabase
                .from('chat_messages')
                .delete()
                .eq('id', messageId)
                .eq('sender_id', user.id);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting message:', error);
            throw error;
        }
    }

    public watchRoom(roomId: string) {
        if (this.activeRoom === roomId) return;

        if (this.activeRoom) {
            this.unwatchRoom();
        }

        this.activeRoom = roomId;
        const channel = supabase
            .channel(`room:${roomId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `room_id=eq.${roomId}`
            }, (payload) => {
                this.notify({
                    eventName: 'newMessage',
                    object: this,
                    data: payload.new
                });
            })
            .subscribe();

        // Mark messages as read
        this.markRoomAsRead(roomId);
    }

    public unwatchRoom() {
        if (this.activeRoom) {
            supabase.channel(`room:${this.activeRoom}`).unsubscribe();
            this.activeRoom = null;
        }
    }

    private async markRoomAsRead(roomId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase
            .from('chat_participants')
            .update({ last_read_at: new Date().toISOString() })
            .eq('room_id', roomId)
            .eq('user_id', user?.id);
    }

    public cleanup() {
        this.unwatchRoom();
    }
}

export const chat = ChatService.getInstance();

import { Observable } from '@nativescript/core';
import { supabase } from './supabase';
import { realtime } from './realtime.service';
import { toast } from './toast.service';

export interface ChatMessage {
    id: string;
    room_id: string;
    sender_id: string;
    message: string;
    created_at: string;
    sender?: {
        username: string;
        avatar_url?: string;
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

    public async createDirectChat(otherUserId: string): Promise<string> {
        const { data: { user } } = await supabase.auth.getUser();
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
            .single();

        if (error) throw error;

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
            .single();

        if (error) throw error;
        return newRoom.id;
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
            .single();

        if (error) throw error;
        return newRoom.id;
    }

    public async sendMessage(roomId: string, message: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
            .from('chat_messages')
            .insert([{
                room_id: roomId,
                sender_id: user?.id,
                message
            }]);

        if (error) throw error;
    }

    public async getMessages(roomId: string, limit = 50, offset = 0): Promise<ChatMessage[]> {
        const { data, error } = await supabase
            .from('chat_messages')
            .select(`
                *,
                sender:profiles!sender_id (
                    username,
                    avatar_url
                )
            `)
            .eq('room_id', roomId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return data;
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

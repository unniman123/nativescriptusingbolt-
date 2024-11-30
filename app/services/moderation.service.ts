import { Observable } from '@nativescript/core';
import { supabase } from './supabase';

class ModerationService extends Observable {
    async getReportedContent(filters?: any) {
        try {
            let query = supabase
                .from('reported_content')
                .select('*')
                .order('reportedAt', { ascending: false });

            if (filters) {
                if (filters.type) query = query.eq('type', filters.type);
                if (filters.status) query = query.eq('status', filters.status);
                if (filters.dateRange) {
                    query = query.gte('reportedAt', filters.dateRange.start)
                                .lte('reportedAt', filters.dateRange.end);
                }
            }

            const { data, error } = await query;
            if (error) throw error;
            return { data };
        } catch (error) {
            console.error('Error fetching reported content:', error);
            throw error;
        }
    }

    async getFlaggedChatMessages(filters?: any) {
        try {
            let query = supabase
                .from('flagged_messages')
                .select('*')
                .order('timestamp', { ascending: false });

            if (filters) {
                if (filters.channel) query = query.eq('channel', filters.channel);
                if (filters.severity) query = query.eq('severity', filters.severity);
                if (filters.dateRange) {
                    query = query.gte('timestamp', filters.dateRange.start)
                                .lte('timestamp', filters.dateRange.end);
                }
            }

            const { data, error } = await query;
            if (error) throw error;
            return { data };
        } catch (error) {
            console.error('Error fetching flagged messages:', error);
            throw error;
        }
    }

    async getPendingUserContent(filters?: any) {
        try {
            let query = supabase
                .from('user_content_moderation')
                .select('*')
                .eq('status', 'pending')
                .order('timestamp', { ascending: false });

            if (filters) {
                if (filters.contentType) query = query.eq('contentType', filters.contentType);
                if (filters.dateRange) {
                    query = query.gte('timestamp', filters.dateRange.start)
                                .lte('timestamp', filters.dateRange.end);
                }
            }

            const { data, error } = await query;
            if (error) throw error;
            return { data };
        } catch (error) {
            console.error('Error fetching pending user content:', error);
            throw error;
        }
    }

    async getPendingTournamentContent(filters?: any) {
        try {
            let query = supabase
                .from('tournament_content_moderation')
                .select('*')
                .eq('status', 'pending')
                .order('timestamp', { ascending: false });

            if (filters) {
                if (filters.contentType) query = query.eq('contentType', filters.contentType);
                if (filters.dateRange) {
                    query = query.gte('timestamp', filters.dateRange.start)
                                .lte('timestamp', filters.dateRange.end);
                }
            }

            const { data, error } = await query;
            if (error) throw error;
            return { data };
        } catch (error) {
            console.error('Error fetching pending tournament content:', error);
            throw error;
        }
    }

    async handleReport(reportId: string, action: string, reason: string) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase
                .from('reported_content')
                .update({
                    status: action,
                    moderationReason: reason,
                    moderatedAt: new Date(),
                    moderatedBy: user?.id
                })
                .eq('id', reportId);

            if (error) throw error;
        } catch (error) {
            console.error('Error handling report:', error);
            throw error;
        }
    }

    async handleChatMessage(messageId: string, action: string, reason: string) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase
                .from('flagged_messages')
                .update({
                    status: action,
                    moderationReason: reason,
                    moderatedAt: new Date(),
                    moderatedBy: user?.id
                })
                .eq('id', messageId);

            if (error) throw error;

            // If message is deleted, remove it from the chat history
            if (action === 'delete') {
                await supabase
                    .from('chat_messages')
                    .delete()
                    .eq('id', messageId);
            }
        } catch (error) {
            console.error('Error handling chat message:', error);
            throw error;
        }
    }

    async handleUserContent(contentId: string, action: string, reason: string) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase
                .from('user_content_moderation')
                .update({
                    status: action,
                    moderationReason: reason,
                    moderatedAt: new Date(),
                    moderatedBy: user?.id
                })
                .eq('id', contentId);

            if (error) throw error;

            // If content is approved or rejected, update the main content table
            if (action === 'approve' || action === 'reject') {
                await supabase
                    .from('user_content')
                    .update({
                        status: action === 'approve' ? 'active' : 'rejected',
                        moderationReason: reason
                    })
                    .eq('id', contentId);
            }
        } catch (error) {
            console.error('Error handling user content:', error);
            throw error;
        }
    }

    async handleTournamentContent(tournamentId: string, action: string, reason: string) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase
                .from('tournament_content_moderation')
                .update({
                    status: action,
                    moderationReason: reason,
                    moderatedAt: new Date(),
                    moderatedBy: user?.id
                })
                .eq('id', tournamentId);

            if (error) throw error;

            // If tournament is approved or rejected, update the main tournament table
            if (action === 'approve' || action === 'reject') {
                await supabase
                    .from('tournaments')
                    .update({
                        status: action === 'approve' ? 'active' : 'rejected',
                        moderationReason: reason
                    })
                    .eq('id', tournamentId);
            }
        } catch (error) {
            console.error('Error handling tournament content:', error);
            throw error;
        }
    }

    async getContentStats() {
        try {
            const { data, error } = await supabase.rpc('get_moderation_stats');
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching moderation stats:', error);
            throw error;
        }
    }

    async getAutoModerationSettings() {
        try {
            const { data, error } = await supabase
                .from('auto_moderation_settings')
                .select('*')
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching auto-moderation settings:', error);
            throw error;
        }
    }

    async updateAutoModerationSettings(settings: any) {
        try {
            const { error } = await supabase
                .from('auto_moderation_settings')
                .update(settings)
                .eq('id', settings.id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating auto-moderation settings:', error);
            throw error;
        }
    }
}

export const moderationService = new ModerationService();

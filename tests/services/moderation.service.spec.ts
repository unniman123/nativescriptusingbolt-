import { moderationService } from '../../app/services/moderation.service';
import { supabase } from '../../app/services/supabase';

jest.mock('../../app/services/supabase');

describe('ModerationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getReportedContent', () => {
        it('should fetch reported content with filters', async () => {
            const mockContent = [
                { id: 1, type: 'chat', status: 'pending' }
            ];

            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({ data: mockContent, error: null })
                })
            });

            const result = await moderationService.getReportedContent({
                type: 'chat',
                status: 'pending'
            });
            
            expect(result.data).toEqual(mockContent);
            expect(supabase.from).toHaveBeenCalledWith('reported_content');
        });
    });

    describe('handleReport', () => {
        it('should update report status', async () => {
            const reportId = 'test-report';
            const action = 'resolved';
            const reason = 'handled';

            (supabase.from as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ error: null })
                })
            });

            await moderationService.handleReport(reportId, action, reason);
            
            expect(supabase.from).toHaveBeenCalledWith('reported_content');
        });
    });

    describe('handleChatMessage', () => {
        it('should handle chat message moderation', async () => {
            const messageId = 'test-message';
            const action = 'delete';
            const reason = 'violation';

            (supabase.from as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ error: null })
                })
            });

            await moderationService.handleChatMessage(messageId, action, reason);
            
            expect(supabase.from).toHaveBeenCalledWith('flagged_messages');
        });
    });

    describe('getAutoModerationSettings', () => {
        it('should fetch auto-moderation settings', async () => {
            const mockSettings = {
                id: 1,
                enableAutoMod: true,
                sensitivityLevel: 'medium'
            };

            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({ data: mockSettings, error: null })
                })
            });

            const settings = await moderationService.getAutoModerationSettings();
            
            expect(settings).toEqual(mockSettings);
            expect(supabase.from).toHaveBeenCalledWith('auto_moderation_settings');
        });
    });
});

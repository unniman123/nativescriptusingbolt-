import { adminService } from '../../app/services/admin.service';
import { supabase } from '../../app/services/supabase';

jest.mock('../../app/services/supabase');

describe('AdminService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getDashboardStats', () => {
        it('should fetch and return dashboard statistics', async () => {
            const mockStats = {
                activeTournaments: 5,
                totalUsers: 100,
                totalRevenue: 1000
            };

            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ count: mockStats.activeTournaments })
                })
            });

            const stats = await adminService.getDashboardStats();
            
            expect(stats.activeTournaments).toBe(mockStats.activeTournaments);
            expect(supabase.from).toHaveBeenCalledWith('tournaments');
        });

        it('should handle errors gracefully', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockRejectedValue(new Error('Database error'))
            });

            await expect(adminService.getDashboardStats()).rejects.toThrow('Database error');
        });
    });

    describe('getSystemSettings', () => {
        it('should return system settings', async () => {
            const mockSettings = {
                maintenanceMode: false,
                allowNewRegistrations: true
            };

            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({ data: mockSettings })
                })
            });

            const settings = await adminService.getSystemSettings();
            
            expect(settings).toEqual(mockSettings);
            expect(supabase.from).toHaveBeenCalledWith('system_settings');
        });
    });

    describe('updateSystemSettings', () => {
        it('should update system settings', async () => {
            const mockSettings = {
                maintenanceMode: true
            };

            (supabase.from as jest.Mock).mockReturnValue({
                upsert: jest.fn().mockResolvedValue({ error: null })
            });

            await adminService.updateSystemSettings(mockSettings);
            
            expect(supabase.from).toHaveBeenCalledWith('system_settings');
        });
    });

    describe('banUser', () => {
        it('should ban a user', async () => {
            const userId = 'test-user';
            const reason = 'violation';
            
            (supabase.from as jest.Mock).mockReturnValue({
                insert: jest.fn().mockResolvedValue({ error: null })
            });

            await adminService.banUser(userId, reason);
            
            expect(supabase.from).toHaveBeenCalledWith('user_bans');
        });
    });
});

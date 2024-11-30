import { Observable } from '@nativescript/core';
import { Frame } from '@nativescript/core';
import { adminService } from '../../../services/admin.service';
import { toast } from '../../../services/toast.service';
import { ChartService } from '../../../services/chart.service';

export class ReportsDashboardViewModel extends Observable {
    private _startDate: Date;
    private _endDate: Date;
    private chartService: ChartService;

    constructor() {
        super();
        
        // Initialize dates to last 30 days
        this._endDate = new Date();
        this._startDate = new Date();
        this._startDate.setDate(this._startDate.getDate() - 30);

        this.chartService = new ChartService();
        this.loadAnalytics();
    }

    get startDate(): Date {
        return this._startDate;
    }

    set startDate(value: Date) {
        if (this._startDate !== value) {
            this._startDate = value;
            this.notifyPropertyChange('startDate', value);
            this.loadAnalytics();
        }
    }

    get endDate(): Date {
        return this._endDate;
    }

    set endDate(value: Date) {
        if (this._endDate !== value) {
            this._endDate = value;
            this.notifyPropertyChange('endDate', value);
            this.loadAnalytics();
        }
    }

    async loadAnalytics() {
        try {
            // Load revenue analytics
            const revenueData = await adminService.getRevenueAnalytics(
                this._startDate,
                this._endDate
            );
            
            this.set('totalRevenue', revenueData.total);
            this.set('revenueGrowth', revenueData.growth);
            this.set('revenueChartUrl', 
                this.chartService.generateRevenueChart(revenueData.timeline));

            // Load user analytics
            const userData = await adminService.getUserAnalytics(
                this._startDate,
                this._endDate
            );
            
            this.set('newUsers', userData.new);
            this.set('activeUsers', userData.active);
            this.set('userRetention', userData.retention);
            this.set('userChartUrl', 
                this.chartService.generateUserChart(userData.timeline));

            // Load tournament analytics
            const tournamentData = await adminService.getTournamentAnalytics(
                this._startDate,
                this._endDate
            );
            
            this.set('totalTournaments', tournamentData.total);
            this.set('avgPlayers', tournamentData.averagePlayers);
            this.set('completionRate', tournamentData.completionRate);
            this.set('tournamentChartUrl', 
                this.chartService.generateTournamentChart(tournamentData.timeline));

        } catch (error) {
            toast.error('Failed to load analytics');
            console.error('Error loading analytics:', error);
        }
    }

    async generateUserReport() {
        try {
            const report = await adminService.generateReport('user_activity', {
                startDate: this._startDate,
                endDate: this._endDate
            });
            
            await this.downloadReport(report, 'User_Activity_Report');
            toast.success('Report generated successfully');
        } catch (error) {
            toast.error('Failed to generate report');
            console.error('Error generating report:', error);
        }
    }

    async generateTournamentReport() {
        try {
            const report = await adminService.generateReport('tournament_summary', {
                startDate: this._startDate,
                endDate: this._endDate
            });
            
            await this.downloadReport(report, 'Tournament_Summary_Report');
            toast.success('Report generated successfully');
        } catch (error) {
            toast.error('Failed to generate report');
            console.error('Error generating report:', error);
        }
    }

    async generateFinancialReport() {
        try {
            const report = await adminService.generateReport('financial', {
                startDate: this._startDate,
                endDate: this._endDate
            });
            
            await this.downloadReport(report, 'Financial_Report');
            toast.success('Report generated successfully');
        } catch (error) {
            toast.error('Failed to generate report');
            console.error('Error generating report:', error);
        }
    }

    showCustomReportDialog() {
        Frame.topmost().showModal({
            moduleName: "pages/admin/reports/custom-report-dialog",
            context: {
                startDate: this._startDate,
                endDate: this._endDate,
                onGenerate: async (params) => {
                    try {
                        const report = await adminService.generateReport('custom', params);
                        await this.downloadReport(report, 'Custom_Report');
                        toast.success('Custom report generated successfully');
                    } catch (error) {
                        toast.error('Failed to generate custom report');
                        console.error('Error generating custom report:', error);
                    }
                }
            },
            fullscreen: false
        });
    }

    private async downloadReport(report: any, filename: string) {
        // Implementation for downloading/sharing report
        // This will depend on the platform (iOS/Android) and desired behavior
    }

    async exportReport() {
        const result = await Frame.topmost().showModal({
            moduleName: "pages/admin/reports/export-options",
            context: {
                startDate: this._startDate,
                endDate: this._endDate
            },
            fullscreen: false
        });

        if (result) {
            try {
                const report = await adminService.generateReport(result.type, {
                    startDate: this._startDate,
                    endDate: this._endDate,
                    format: result.format
                });
                
                await this.downloadReport(report, `${result.type}_Report`);
                toast.success('Report exported successfully');
            } catch (error) {
                toast.error('Failed to export report');
                console.error('Error exporting report:', error);
            }
        }
    }
}

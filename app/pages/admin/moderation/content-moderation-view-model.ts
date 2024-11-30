import { Observable } from '@nativescript/core';
import { Frame } from '@nativescript/core';
import { adminService } from '../../../services/admin.service';
import { moderationService } from '../../../services/moderation.service';
import { toast } from '../../../services/toast.service';

export class ContentModerationViewModel extends Observable {
    private _selectedTabIndex: number = 0;
    private _reportedContent: any[] = [];
    private _chatMessages: any[] = [];
    private _userContent: any[] = [];
    private _tournamentContent: any[] = [];
    private _isLoading: boolean = false;

    constructor() {
        super();
        this.loadContent();
    }

    get selectedTabIndex(): number {
        return this._selectedTabIndex;
    }

    set selectedTabIndex(value: number) {
        if (this._selectedTabIndex !== value) {
            this._selectedTabIndex = value;
            this.notifyPropertyChange('selectedTabIndex', value);
            this.loadContent();
        }
    }

    async loadContent() {
        try {
            this._isLoading = true;
            this.notifyPropertyChange('isLoading', true);

            switch (this._selectedTabIndex) {
                case 0:
                    await this.loadReportedContent();
                    break;
                case 1:
                    await this.loadChatMessages();
                    break;
                case 2:
                    await this.loadUserContent();
                    break;
                case 3:
                    await this.loadTournamentContent();
                    break;
            }
        } catch (error) {
            toast.error('Failed to load content');
            console.error('Error loading content:', error);
        } finally {
            this._isLoading = false;
            this.notifyPropertyChange('isLoading', false);
        }
    }

    private async loadReportedContent() {
        const { data } = await moderationService.getReportedContent();
        this._reportedContent = data;
        this.notifyPropertyChange('reportedContent', data);
    }

    private async loadChatMessages() {
        const { data } = await moderationService.getFlaggedChatMessages();
        this._chatMessages = data;
        this.notifyPropertyChange('chatMessages', data);
    }

    private async loadUserContent() {
        const { data } = await moderationService.getPendingUserContent();
        this._userContent = data;
        this.notifyPropertyChange('userContent', data);
    }

    private async loadTournamentContent() {
        const { data } = await moderationService.getPendingTournamentContent();
        this._tournamentContent = data;
        this.notifyPropertyChange('tournamentContent', data);
    }

    async onReportAction(args: any) {
        const report = args.object.bindingContext;
        const result = await Frame.topmost().showModal({
            moduleName: "pages/admin/moderation/report-action-dialog",
            context: { report },
            fullscreen: false
        });

        if (result) {
            try {
                await moderationService.handleReport(report.id, result.action, result.reason);
                toast.success('Report handled successfully');
                await this.loadReportedContent();
            } catch (error) {
                toast.error('Failed to handle report');
                console.error('Error handling report:', error);
            }
        }
    }

    async onChatAction(args: any) {
        const message = args.object.bindingContext;
        const result = await Frame.topmost().showModal({
            moduleName: "pages/admin/moderation/chat-action-dialog",
            context: { message },
            fullscreen: false
        });

        if (result) {
            try {
                await moderationService.handleChatMessage(message.id, result.action, result.reason);
                if (result.action === 'ban') {
                    await adminService.banUser(message.userId, result.reason, result.duration);
                }
                toast.success('Message handled successfully');
                await this.loadChatMessages();
            } catch (error) {
                toast.error('Failed to handle message');
                console.error('Error handling message:', error);
            }
        }
    }

    async onUserContentAction(args: any) {
        const content = args.object.bindingContext;
        const result = await Frame.topmost().showModal({
            moduleName: "pages/admin/moderation/user-content-action-dialog",
            context: { content },
            fullscreen: false
        });

        if (result) {
            try {
                await moderationService.handleUserContent(content.id, result.action, result.reason);
                toast.success('Content handled successfully');
                await this.loadUserContent();
            } catch (error) {
                toast.error('Failed to handle content');
                console.error('Error handling content:', error);
            }
        }
    }

    async onTournamentContentAction(args: any) {
        const tournament = args.object.bindingContext;
        const result = await Frame.topmost().showModal({
            moduleName: "pages/admin/moderation/tournament-action-dialog",
            context: { tournament },
            fullscreen: false
        });

        if (result) {
            try {
                await moderationService.handleTournamentContent(
                    tournament.id, 
                    result.action, 
                    result.reason
                );
                toast.success('Tournament content handled successfully');
                await this.loadTournamentContent();
            } catch (error) {
                toast.error('Failed to handle tournament content');
                console.error('Error handling tournament content:', error);
            }
        }
    }

    refreshContent() {
        this.loadContent();
    }

    showFilters() {
        Frame.topmost().showModal({
            moduleName: "pages/admin/moderation/filter-dialog",
            context: {
                filters: this.currentFilters,
                onApply: (filters) => {
                    this.applyFilters(filters);
                }
            },
            fullscreen: false
        });
    }

    private async applyFilters(filters: any) {
        try {
            this._isLoading = true;
            this.notifyPropertyChange('isLoading', true);

            // Apply filters based on current tab
            switch (this._selectedTabIndex) {
                case 0:
                    const { data: reportedContent } = await moderationService.getReportedContent(filters);
                    this._reportedContent = reportedContent;
                    this.notifyPropertyChange('reportedContent', reportedContent);
                    break;
                case 1:
                    const { data: chatMessages } = await moderationService.getFlaggedChatMessages(filters);
                    this._chatMessages = chatMessages;
                    this.notifyPropertyChange('chatMessages', chatMessages);
                    break;
                case 2:
                    const { data: userContent } = await moderationService.getPendingUserContent(filters);
                    this._userContent = userContent;
                    this.notifyPropertyChange('userContent', userContent);
                    break;
                case 3:
                    const { data: tournamentContent } = await moderationService.getPendingTournamentContent(filters);
                    this._tournamentContent = tournamentContent;
                    this.notifyPropertyChange('tournamentContent', tournamentContent);
                    break;
            }
        } catch (error) {
            toast.error('Failed to apply filters');
            console.error('Error applying filters:', error);
        } finally {
            this._isLoading = false;
            this.notifyPropertyChange('isLoading', false);
        }
    }
}

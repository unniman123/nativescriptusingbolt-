import { Observable } from '@nativescript/core';

export interface TournamentRule {
    id: string;
    title: string;
    description: string;
    category: 'GENERAL' | 'GAMEPLAY' | 'SCORING' | 'CONDUCT';
    priority: number;
}

export class TournamentRulesService extends Observable {
    private static instance: TournamentRulesService;

    private constructor() {
        super();
    }

    public static getInstance(): TournamentRulesService {
        if (!TournamentRulesService.instance) {
            TournamentRulesService.instance = new TournamentRulesService();
        }
        return TournamentRulesService.instance;
    }

    public getRules(gameType: string): TournamentRule[] {
        // Return rules based on game type
        const baseRules: TournamentRule[] = [
            {
                id: 'GENERAL_1',
                title: 'Tournament Schedule',
                description: 'All matches must be played within the scheduled tournament timeframe.',
                category: 'GENERAL',
                priority: 1
            },
            {
                id: 'GAMEPLAY_1',
                title: 'Match Duration',
                description: 'Each match has a maximum duration of 30 minutes.',
                category: 'GAMEPLAY',
                priority: 1
            },
            {
                id: 'SCORING_1',
                title: 'Score Submission',
                description: 'Both players must submit and confirm match scores within 5 minutes of match completion.',
                category: 'SCORING',
                priority: 1
            },
            {
                id: 'CONDUCT_1',
                title: 'Fair Play',
                description: 'Any form of cheating or unsportsmanlike conduct will result in immediate disqualification.',
                category: 'CONDUCT',
                priority: 1
            }
        ];

        // Add game-specific rules
        switch (gameType.toLowerCase()) {
            case 'chess':
                return [...baseRules, {
                    id: 'GAMEPLAY_CHESS_1',
                    title: 'Time Control',
                    description: 'Each player has 10 minutes with 5 seconds increment per move.',
                    category: 'GAMEPLAY',
                    priority: 2
                }];
            case 'pubg':
                return [...baseRules, {
                    id: 'GAMEPLAY_PUBG_1',
                    title: 'Match Settings',
                    description: 'TPP mode, Erangel map, Squad size as per tournament specifications.',
                    category: 'GAMEPLAY',
                    priority: 2
                }];
            default:
                return baseRules;
        }
    }

    public getFormattedRules(gameType: string): string {
        const rules = this.getRules(gameType);
        let formattedRules = '';

        // Group rules by category
        const categories = ['GENERAL', 'GAMEPLAY', 'SCORING', 'CONDUCT'];
        categories.forEach(category => {
            const categoryRules = rules.filter(rule => rule.category === category);
            if (categoryRules.length > 0) {
                formattedRules += `\n${category}\n`;
                categoryRules
                    .sort((a, b) => a.priority - b.priority)
                    .forEach(rule => {
                        formattedRules += `\n${rule.title}\n${rule.description}\n`;
                    });
            }
        });

        return formattedRules.trim();
    }
}

export const tournamentRules = TournamentRulesService.getInstance();

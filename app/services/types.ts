export interface Match {
    id: string;
    tournament_id: string;
    player1_id: string;
    player2_id: string;
    match_number: number;
    winner_id?: string;
    status: 'pending' | 'completed';
    player1?: { username: string };
    player2?: { username: string };
}

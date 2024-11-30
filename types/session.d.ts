export interface Session {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
    user: {
        id: string;
        email?: string;
        app_metadata: Record<string, any>;
        user_metadata: Record<string, any>;
        aud: string;
        created_at: string;
    };
}

import { config } from 'dotenv';
import { emailConfig } from './email-config';

// Load environment variables from .env file
config();

// Determine the current environment
const isDevelopment = process.env.NODE_ENV !== 'production';

export const environment = {
    supabase: {
        url: process.env.SUPABASE_URL || '',
        anonKey: process.env.SUPABASE_ANON_KEY || '',
    },
    email: {
        // Base URL for deep linking
        baseUrl: isDevelopment 
            ? emailConfig.urls.development.base 
            : emailConfig.urls.production.base,
        
        // Web fallback URL for devices without the app installed
        webFallbackUrl: isDevelopment
            ? emailConfig.urls.development.webFallback
            : emailConfig.urls.production.webFallback,
        
        // Redirect URLs for different auth flows
        redirectUrls: {
            confirmEmail: `${isDevelopment 
                ? emailConfig.urls.development.base 
                : emailConfig.urls.production.base}${emailConfig.paths.confirmEmail}`,
            resetPassword: `${isDevelopment 
                ? emailConfig.urls.development.base 
                : emailConfig.urls.production.base}${emailConfig.paths.resetPassword}`,
            magicLink: `${isDevelopment 
                ? emailConfig.urls.development.base 
                : emailConfig.urls.production.base}${emailConfig.paths.magicLink}`,
            invite: `${isDevelopment 
                ? emailConfig.urls.development.base 
                : emailConfig.urls.production.base}${emailConfig.paths.invite}`
        }
    }
};

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

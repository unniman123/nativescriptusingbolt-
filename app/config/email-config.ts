export const emailConfig = {
    urls: {
        development: {
            base: 'nativescriptapp://',
            webFallback: 'http://localhost:3000'
        },
        production: {
            base: 'com.boltapp://',
            webFallback: 'https://bolt-gaming.com'
        }
    },
    paths: {
        confirmEmail: '/confirm-email',
        resetPassword: '/reset-password',
        magicLink: '/magic-link',
        invite: '/invite'
    }
};

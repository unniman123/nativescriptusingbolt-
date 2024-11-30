export const emailTemplates = {
    // Base URLs for different environments
    urls: {
        development: {
            base: 'nativescriptapp://',
            webFallback: 'http://localhost:3000'
        },
        production: {
            base: 'com.yourdomain.boltapp://', // Update with your app's URL scheme
            webFallback: 'https://your-production-domain.com' // Update with your production domain
        }
    },

    // Redirect paths
    redirectPaths: {
        confirmEmail: '/confirm-email',
        resetPassword: '/reset-password',
        magicLink: '/magic-link',
        inviteUser: '/invite'
    },

    // Email templates
    templates: {
        confirmEmail: {
            subject: 'Welcome to Bolt Gaming - Confirm Your Email',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <img src="{{{ logo_url }}}" alt="Bolt Gaming Logo" style="max-width: 150px; margin-bottom: 20px;">
                    <h1 style="color: #2D3748; margin-bottom: 20px;">Welcome to Bolt Gaming!</h1>
                    <p style="color: #4A5568; line-height: 1.6;">
                        Thanks for signing up! We're excited to have you join our gaming community.
                    </p>
                    <p style="color: #4A5568; line-height: 1.6;">
                        Please confirm your email address by clicking the button below:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{ .ConfirmationURL }}" 
                           style="background-color: #4C51BF; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Confirm Email Address
                        </a>
                    </div>
                    <p style="color: #718096; font-size: 14px;">
                        If the button doesn't work, copy and paste this link into your browser:
                        <br>
                        <span style="color: #4A5568;">{{ .ConfirmationURL }}</span>
                    </p>
                    <hr style="border: 1px solid #E2E8F0; margin: 30px 0;">
                    <p style="color: #718096; font-size: 12px;">
                        If you didn't create an account with Bolt Gaming, you can safely ignore this email.
                    </p>
                </div>
            `
        },

        resetPassword: {
            subject: 'Reset Your Bolt Gaming Password',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <img src="{{{ logo_url }}}" alt="Bolt Gaming Logo" style="max-width: 150px; margin-bottom: 20px;">
                    <h1 style="color: #2D3748; margin-bottom: 20px;">Password Reset Request</h1>
                    <p style="color: #4A5568; line-height: 1.6;">
                        We received a request to reset your password for your Bolt Gaming account.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{ .ConfirmationURL }}" 
                           style="background-color: #4C51BF; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Reset Password
                        </a>
                    </div>
                    <p style="color: #718096; font-size: 14px;">
                        This link will expire in 24 hours. If you didn't request a password reset, 
                        please ignore this email or contact support if you have concerns.
                    </p>
                    <hr style="border: 1px solid #E2E8F0; margin: 30px 0;">
                    <p style="color: #718096; font-size: 12px;">
                        For security reasons, this link can only be used once.
                    </p>
                </div>
            `
        },

        magicLink: {
            subject: 'Your Magic Link for Bolt Gaming',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <img src="{{{ logo_url }}}" alt="Bolt Gaming Logo" style="max-width: 150px; margin-bottom: 20px;">
                    <h1 style="color: #2D3748; margin-bottom: 20px;">Login to Bolt Gaming</h1>
                    <p style="color: #4A5568; line-height: 1.6;">
                        Click the button below to securely log in to your Bolt Gaming account.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{ .ConfirmationURL }}" 
                           style="background-color: #4C51BF; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Login to Bolt Gaming
                        </a>
                    </div>
                    <p style="color: #718096; font-size: 14px;">
                        This magic link will expire in 24 hours and can only be used once.
                    </p>
                    <hr style="border: 1px solid #E2E8F0; margin: 30px 0;">
                    <p style="color: #718096; font-size: 12px;">
                        If you didn't request this login link, please ignore this email.
                    </p>
                </div>
            `
        }
    }
};

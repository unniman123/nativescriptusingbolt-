# Deployment Guide

## Overview
This guide covers the deployment process for the NativeScript Gaming Platform, including environment setup, build configurations, and deployment strategies.

## Prerequisites

### Development Environment
```bash
# Required software versions
Node.js: >= 14.0.0
NativeScript CLI: >= 8.0.0
Android Studio: Latest version
Xcode: Latest version (for iOS)
```

### Environment Variables
```bash
# .env.production
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
API_URL=your_api_url
ENVIRONMENT=production
```

## Build Configuration

### Android Build
```json
// App_Resources/Android/app.gradle
android {
    defaultConfig {
        applicationId "com.gaming.platform"
        minSdkVersion 21
        targetSdkVersion 31
        versionCode 1
        versionName "1.0.0"
    }

    signingConfigs {
        release {
            storeFile file("keystore.jks")
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### iOS Build
```xml
<!-- App_Resources/iOS/Info.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDisplayName</key>
    <string>Gaming Platform</string>
    <key>CFBundleIdentifier</key>
    <string>com.gaming.platform</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>UILaunchStoryboardName</key>
    <string>LaunchScreen</string>
    <key>UIRequiresFullScreen</key>
    <true/>
</dict>
</plist>
```

## Build Process

### Production Build
```bash
# Android Production Build
ns build android --release --key-store-path keystore.jks --key-store-password $KEYSTORE_PASSWORD --key-store-alias $KEY_ALIAS --key-store-alias-password $KEY_PASSWORD

# iOS Production Build
ns build ios --release --for-device --team-id $TEAM_ID
```

### Build Scripts
```json
// package.json
{
  "scripts": {
    "build:android": "ns build android --release",
    "build:ios": "ns build ios --release",
    "build:all": "npm run build:android && npm run build:ios",
    "deploy:android": "npm run build:android && npm run upload:android",
    "deploy:ios": "npm run build:ios && npm run upload:ios"
  }
}
```

## Deployment Strategies

### Continuous Integration
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '14'

      - name: Install dependencies
        run: npm install

      - name: Build Android
        run: npm run build:android
        env:
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}

      - name: Build iOS
        run: npm run build:ios
        env:
          TEAM_ID: ${{ secrets.TEAM_ID }}

      - name: Upload to App Store
        run: npm run upload:ios
        env:
          APP_STORE_CONNECT_API_KEY: ${{ secrets.APP_STORE_CONNECT_API_KEY }}

      - name: Upload to Play Store
        run: npm run upload:android
        env:
          PLAY_STORE_JSON_KEY: ${{ secrets.PLAY_STORE_JSON_KEY }}
```

## Environment Management

### Configuration Files
```typescript
// config/environment.ts
export const environment = {
    production: true,
    apiUrl: process.env.API_URL,
    supabase: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_KEY
    },
    firebase: {
        apiKey: process.env.FIREBASE_API_KEY,
        projectId: process.env.FIREBASE_PROJECT_ID
    }
};
```

### Feature Flags
```typescript
// config/features.ts
export const features = {
    enableChat: true,
    enablePayments: true,
    enableTournaments: true,
    enableSpectatorMode: false
};
```

## Performance Optimization

### Android
```groovy
// App_Resources/Android/app.gradle
android {
    defaultConfig {
        // Enable multidex
        multiDexEnabled true
        
        // Configure memory
        javaMaxHeapSize "4g"
    }
    
    dexOptions {
        javaMaxHeapSize "4g"
    }
}
```

### iOS
```xml
<!-- App_Resources/iOS/Info.plist -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
</dict>
```

## Monitoring

### Error Tracking
```typescript
// services/error-tracking.service.ts
export class ErrorTrackingService {
    initialize() {
        // Initialize error tracking
        if (environment.production) {
            Sentry.init({
                dsn: environment.sentryDsn,
                environment: 'production'
            });
        }
    }

    captureError(error: Error) {
        if (environment.production) {
            Sentry.captureException(error);
        }
    }
}
```

### Analytics
```typescript
// services/analytics.service.ts
export class AnalyticsService {
    trackEvent(name: string, params?: any) {
        if (environment.production) {
            firebase.analytics().logEvent(name, params);
        }
    }

    setUserProperties(properties: any) {
        if (environment.production) {
            firebase.analytics().setUserProperties(properties);
        }
    }
}
```

## Security Measures

### Code Obfuscation
```javascript
// webpack.config.js
module.exports = {
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        drop_console: true,
                    },
                    mangle: true
                }
            })
        ]
    }
};
```

### SSL Pinning
```typescript
// services/http.service.ts
export class HttpService {
    private readonly certificates = [
        'sha256/XXXX',
        'sha256/YYYY'
    ];

    constructor() {
        if (environment.production) {
            this.setupSSLPinning();
        }
    }

    private setupSSLPinning() {
        // Configure SSL pinning
    }
}
```

## Rollback Strategy

### Version Management
```typescript
interface Version {
    code: number;
    name: string;
    minSupported: number;
}

const versionConfig: Version = {
    code: 100,
    name: '1.0.0',
    minSupported: 90
};
```

### Database Migrations
```sql
-- migrations/001_initial.sql
BEGIN;

-- Create tables
CREATE TABLE IF NOT EXISTS users (...);
CREATE TABLE IF NOT EXISTS tournaments (...);

-- Add indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_tournaments_status ON tournaments(status);

COMMIT;

-- migrations/002_rollback.sql
BEGIN;

-- Remove indexes
DROP INDEX IF EXISTS idx_tournaments_status;
DROP INDEX IF EXISTS idx_users_email;

-- Remove tables
DROP TABLE IF EXISTS tournaments;
DROP TABLE IF EXISTS users;

COMMIT;
```

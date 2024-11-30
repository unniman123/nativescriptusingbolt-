# UI Components Documentation

## Overview
This document details the reusable UI components used throughout the NativeScript Gaming Platform, including their usage, props, and styling guidelines.

## Core Components

### Loading Indicator
```xml
<!-- loading-indicator.xml -->
<GridLayout class="loading-container">
    <ActivityIndicator busy="{{ isLoading }}" />
    <Label text="{{ loadingMessage }}" class="loading-text" />
</GridLayout>
```

```typescript
// loading-indicator.ts
export interface LoadingIndicatorProps {
    isLoading: boolean;
    message?: string;
}

export class LoadingIndicator extends ViewBase {
    constructor() {
        super();
        this.className = 'loading-indicator';
    }
}
```

```css
/* loading-indicator.css */
.loading-container {
    background-color: rgba(0, 0, 0, 0.5);
    align-items: center;
    justify-content: center;
}

.loading-text {
    color: white;
    font-size: 16;
    margin-top: 10;
}
```

### Toast Notifications
```typescript
// toast.service.ts
export class ToastService {
    public show(options: ToastOptions): void {
        const toast = new Toast(options);
        toast.show();
    }

    public success(message: string): void {
        this.show({
            text: message,
            duration: 3000,
            className: 'toast-success'
        });
    }

    public error(message: string): void {
        this.show({
            text: message,
            duration: 4000,
            className: 'toast-error'
        });
    }
}
```

```css
/* toast.css */
.toast-base {
    padding: 12;
    border-radius: 8;
    margin: 16;
}

.toast-success {
    background-color: #28a745;
    color: white;
}

.toast-error {
    background-color: #dc3545;
    color: white;
}
```

### Tournament Card
```xml
<!-- tournament-card.xml -->
<GridLayout rows="auto, auto" columns="*, auto" class="tournament-card">
    <Label row="0" col="0" text="{{ tournament.title }}" class="title" />
    <Label row="0" col="1" text="{{ tournament.status }}" class="status-badge" />
    
    <GridLayout row="1" col="0" colSpan="2" columns="*, *, *" class="stats">
        <Label col="0" text="{{ tournament.playerCount + '/' + tournament.maxPlayers }}" />
        <Label col="1" text="{{ '₹' + tournament.entryFee }}" />
        <Label col="2" text="{{ '₹' + tournament.prizePool }}" />
    </GridLayout>
</GridLayout>
```

```css
/* tournament-card.css */
.tournament-card {
    background-color: white;
    border-radius: 10;
    elevation: 2;
    margin: 8;
    padding: 16;
}

.title {
    font-size: 18;
    font-weight: bold;
}

.status-badge {
    background-color: #007bff;
    color: white;
    padding: 4 8;
    border-radius: 12;
}

.stats {
    margin-top: 8;
    font-size: 14;
}
```

### Chat Message
```xml
<!-- chat-message.xml -->
<GridLayout columns="auto, *" class="chat-message" class="{{ isSent ? 'sent' : 'received' }}">
    <Image col="0" src="{{ user.avatarUrl }}" class="avatar" />
    <StackLayout col="1" class="message-content">
        <Label text="{{ user.username }}" class="username" />
        <Label text="{{ message.content }}" class="message-text" textWrap="true" />
        <Label text="{{ message.timestamp | timeAgo }}" class="timestamp" />
    </StackLayout>
</GridLayout>
```

```css
/* chat-message.css */
.chat-message {
    margin: 8;
}

.avatar {
    width: 40;
    height: 40;
    border-radius: 20;
    margin-right: 8;
}

.message-content {
    background-color: #f8f9fa;
    padding: 8;
    border-radius: 8;
}

.sent .message-content {
    background-color: #007bff;
    color: white;
}

.username {
    font-size: 12;
    color: #6c757d;
}

.message-text {
    font-size: 16;
    margin-top: 4;
}

.timestamp {
    font-size: 10;
    color: #6c757d;
    text-align: right;
}
```

### Leaderboard Item
```xml
<!-- leaderboard-item.xml -->
<GridLayout columns="auto, auto, *, auto" class="leaderboard-item">
    <Label col="0" text="{{ rank }}" class="rank" />
    <Image col="1" src="{{ user.avatarUrl }}" class="avatar" />
    <StackLayout col="2">
        <Label text="{{ user.username }}" class="username" />
        <Label text="{{ wins + 'W ' + losses + 'L' }}" class="stats" />
    </StackLayout>
    <Label col="3" text="{{ points }}" class="points" />
</GridLayout>
```

```css
/* leaderboard-item.css */
.leaderboard-item {
    padding: 12;
    background-color: white;
    margin: 4 8;
}

.rank {
    font-size: 18;
    font-weight: bold;
    width: 30;
    text-align: center;
}

.avatar {
    width: 40;
    height: 40;
    border-radius: 20;
    margin: 0 8;
}

.username {
    font-size: 16;
    font-weight: bold;
}

.stats {
    font-size: 14;
    color: #6c757d;
}

.points {
    font-size: 18;
    font-weight: bold;
    color: #007bff;
}
```

## Animation Service
```typescript
// animation.service.ts
export class AnimationService {
    public static async fadeIn(view: View): Promise<void> {
        return view.animate({
            opacity: 1,
            duration: 200
        });
    }

    public static async slideIn(view: View): Promise<void> {
        return view.animate({
            translate: { x: 0, y: 0 },
            duration: 200,
            curve: AnimationCurve.easeOut
        });
    }

    public static async bounce(view: View): Promise<void> {
        return view.animate({
            scale: { x: 1.2, y: 1.2 },
            duration: 100
        }).then(() => {
            return view.animate({
                scale: { x: 1, y: 1 },
                duration: 100
            });
        });
    }
}
```

## Theme Variables
```css
/* _variables.scss */
:root {
    /* Colors */
    --primary: #007bff;
    --secondary: #6c757d;
    --success: #28a745;
    --danger: #dc3545;
    --warning: #ffc107;
    --info: #17a2b8;
    
    /* Typography */
    --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
    --font-size-base: 14;
    --font-size-lg: 16;
    --font-size-sm: 12;
    
    /* Spacing */
    --spacing-xs: 4;
    --spacing-sm: 8;
    --spacing-md: 16;
    --spacing-lg: 24;
    
    /* Border Radius */
    --border-radius-sm: 4;
    --border-radius-md: 8;
    --border-radius-lg: 12;
    
    /* Elevation */
    --elevation-1: 2;
    --elevation-2: 4;
    --elevation-3: 8;
}
```

## Usage Guidelines

### Component Best Practices
1. **Reusability**: Create components that are generic and reusable
2. **Props Validation**: Always validate component props
3. **Documentation**: Document component props and events
4. **Styling**: Use consistent class names and theme variables
5. **Accessibility**: Ensure components are accessible

### Animation Guidelines
1. **Performance**: Use hardware-accelerated properties
2. **Duration**: Keep animations short (200-300ms)
3. **Timing**: Use appropriate easing curves
4. **Feedback**: Provide visual feedback for user actions

### Responsive Design
1. **Grid System**: Use GridLayout for responsive layouts
2. **Units**: Use relative units (stars) instead of fixed
3. **Orientation**: Support both portrait and landscape
4. **Screen Sizes**: Test on various device sizes

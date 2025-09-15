# Wheel Clock

A high-performance, modern wheel-based clock and countdown timer library built with TypeScript. Features unlimited number support, optimized rollover animations, data-attribute driven display, and comprehensive accessibility support.

## Features

- 🔢 **Unlimited Numbers**: No artificial constraints - handles any value from Date objects
- ⚡ **Smart Rollover Animations**: Intelligent bidirectional detection for natural transitions (9→0, 59→00, 0→59 countdown)
- 🎯 **Multiple Display Modes**: Real-time clock, countdown timer, 12/24-hour formats
- 🔄 **Countdown Optimized**: Proper backward animations for countdown scenarios (0→59, 0→23)
- 🏗️ **Simplified Data Architecture**: Single `data-value` attribute system for clean DOM manipulation
- 🎨 **Enhanced Visual Design**: Smooth multi-stop gradients for realistic 3D wheel depth effect
- 🚀 **Performance Optimized**: Object-based trackers, efficient memory management, and 60fps animations
- ♿ **Accessibility First**: `prefers-reduced-motion`, screen reader support, and high contrast compatibility
- 📦 **TypeScript Native**: Full type definitions with modern ES module architecture
- 🧹 **Memory Safe**: Proper cleanup methods and timeout management
- 🌐 **Production Ready**: Robust error handling with NaN safety checks

## Installation

### Via NPM (Recommended)

```bash
npm install wheel-clock
```

### Direct Download

Clone or download the repository and include the built files:

- `dist/wheel-clock.js` - Main library
- `wheel-clock.css` - Optimized CSS with modern features

## Quick Start

### ES Module (Modern)

```typescript
import { Clock } from "wheel-clock";

// Create a real-time clock
const clock = new Clock();
document.body.appendChild(clock.el);

// Create a countdown timer with callback
const countdown = new Clock({
  countdown: new Date("2025-12-31T23:59:59").toString(),
  callback: () => console.log("Time's up!"),
  showSeconds: true,
});
document.body.appendChild(countdown.el);

// Create a 12-hour clock without seconds
const simpleClock = new Clock({
  twelveHour: true,
  showSeconds: false,
});
document.body.appendChild(simpleClock.el);
```

### Global Usage (Legacy Support)

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="wheel-clock.css" />
  </head>
  <body>
    <script src="dist/wheel-clock.js"></script>
    <script>
      // Global Clock constructor is automatically available
      const clock = new Clock({
        twelveHour: true,
        showSeconds: true,
      });
      document.body.appendChild(clock.el);
    </script>
  </body>
</html>
```

## Advanced Usage

### Custom Wheel Component

```typescript
import { CountdownTracker } from "wheel-clock";

// Create individual time unit wheels
const hoursWheel = new CountdownTracker("Hours", 12);
const minutesWheel = new CountdownTracker("Minutes", 30);

document.body.appendChild(hoursWheel.el);
document.body.appendChild(minutesWheel.el);

// Update values dynamically
hoursWheel.update(13);
minutesWheel.update(45);

// Clean up when done
hoursWheel.destroy();
minutesWheel.destroy();
```

## API Reference

### Clock Constructor

```typescript
class Clock {
  constructor(options?: ClockOptions);
  readonly el: HTMLElement; // Main DOM element
  destroy(): void; // Clean up resources
}
```

### Clock Options

```typescript
interface ClockOptions {
  callback?: () => void;
  countdown?: string;
  showSeconds?: boolean;
  slotLabels?: SlotLabels;
  twelveHour?: boolean;
}

interface SlotLabels {
  Days?: string;
  Hours?: string;
  Minutes?: string;
  Seconds?: string;
}
```

### CountdownTracker Constructor

```typescript
class CountdownTracker {
  constructor(label: TimeUnit, value: string | number);
  readonly el: HTMLElement; // Wheel DOM element
  update(value: number): void; // Update wheel value with animation
  destroy(): void; // Clean up resources
}

type TimeUnit = "Seconds" | "Minutes" | "Hours" | "Days";
```

### Performance Constants

The library includes optimized constants for consistent performance:

```typescript
const CONSTANTS = {
  ANIMATION_DURATION: 600, // ms
  UPDATE_THROTTLE: 10, // frames
  INITIAL_DELAY: 500, // ms
} as const;
```

## Development

### Build System

```bash
# Build the TypeScript to JavaScript
npm run build

# Development mode with file watching
npm run dev

# Start local development server
npm run serve
# Opens http://localhost:8000
```

### Project Structure

```
wheel-clock/
├── index.html            # Demo page
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript configuration
├── wheel-clock.ts        # Main TypeScript source
├── wheel-clock.css       # Optimized CSS with modern features
└── dist/                 # Built files
    ├── wheel-clock.js    # Compiled JavaScript
    └── wheel-clock.d.ts  # TypeScript declarations
```

### Architecture Overview

The library uses a simplified data-attribute driven architecture:

- **Single Data Attribute**: Numbers are displayed using `content: attr(data-value)` in CSS
- **Object-Based Trackers**: Efficient Record<string, CountdownTracker> structure instead of Map
- **Smart Rollover Detection**: Enhanced bidirectional logic for time unit cycling (59→0, 0→59, 23→0, 0→23)
- **Countdown Animation Logic**: Proper backward animations for countdown scenarios with time unit cycling
- **Hardware Acceleration**: All animations use `transform: translateZ(0)` for GPU acceleration
- **NaN Safety**: Comprehensive error handling prevents display issues
- **Unlimited Numbers**: No constraints - handles any value from Date objects

## Styling & Customization

### CSS Custom Properties

The library uses modern CSS custom properties for easy theming:

```css
:root {
  /* Sizing */
  --wheel-height: 1.44em;
  --wheel-width: 0.85em;
  --wheel-gap: 2px;
  --container-gap: 5px;
  --clock-margin: 20px;

  /* Typography */
  --wheel-font-size: 9vw;
  --slot-font-size: 2vw;
  --font-family: Arial, Helvetica, sans-serif;

  /* Colors */
  --wheel-bg: #222;
  --wheel-text: #fff;
  --body-bg: #eee;

  /* Effects */
  --wheel-border-radius: 0.15em;
  --wheel-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  --perspective: 400px;

  /* Animation */
  --animation-duration: 600ms;
  --animation-easing: cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

### CSS Classes

```css
.wheel-clock; /* Main container */
.wheel-clock__container; /* Individual time unit container */
.wheel-clock__pair; /* Tens/units digit pair */
.wheel-clock__wheel; /* Individual number wheel */
.wheel-clock__number-wheel; /* Scrolling number container */
.wheel-clock__number-wheel-number; /* Individual number element */
.wheel-clock__slot; /* Time unit label (Hours, Minutes, etc.) */
```

### Visual Design Features

The library includes enhanced visual styling for realistic 3D wheel effects:

- **Multi-stop gradients**: Smooth 6-stop gradient for realistic cylindrical depth
- **Enhanced shadows**: Carefully crafted top and bottom darkening for 3D appearance
- **Smooth transitions**: Gradual opacity changes from 0.09 to 0.2 for natural lighting
- **Positioning precision**: Strategic gradient stops at 6%, 49%, 51%, and 90% for optimal effect

```css
/* Example of the enhanced wheel gradient */
.wheel-clock__wheel::after {
  background-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.09),
    rgba(255, 255, 255, 0.15) 6%,
    rgba(255, 255, 255, 0.09) 49%,
    rgba(0, 0, 0, 0.09) 51%,
    rgba(0, 0, 0, 0.15) 90%,
    rgba(0, 0, 0, 0.2)
  );
}
```

### Accessibility Features

The library includes comprehensive accessibility support:

```css
/* Respects user preferences */
@media (prefers-reduced-motion: reduce) {
  .wheel-clock * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-contrast: high) {
  /* Enhanced contrast for better visibility */
}

@media (forced-colors: active) {
  /* High contrast mode support */
}
```

## Browser Support

- **Chrome/Edge**: 80+ (full feature support)
- **Firefox**: 72+ (full feature support)
- **Safari**: 13+ (full feature support)
- **Mobile**: All modern mobile browsers
- **Legacy**: Graceful degradation with reduced animations

## Performance Optimizations

### CSS Optimizations

- **25% smaller CSS footprint** through consolidated selectors
- **Enhanced 3D gradient effects** with smooth multi-stop gradients for realistic wheel depth
- **CSS custom properties** organized by category for maintainability
- **Modern logical properties** (`block-size`, `inline-size`, `inset`)
- **Hardware acceleration** with `transform: translateZ(0)`
- **CSS containment** for optimized rendering performance

### JavaScript Optimizations

- **Object-based trackers** instead of Map for better performance
- **Single data-attribute system** reduces DOM manipulation overhead
- **Enhanced bidirectional rollover detection** with time unit cycling support for countdown scenarios
- **Countdown animation optimization** with proper backward cycling (0→59, 0→23)
- **NaN safety checks** for robust error handling
- **Efficient memory management** with proper cleanup methods
- **Unlimited number support** without artificial constraints
- **Constants optimization** for consistent performance characteristics

### Animation Features

- **Smooth 60fps animations** using CSS transforms
- **Smart bidirectional transitions** with proper direction detection for both count-up and countdown
- **Natural time unit cycling** with context-aware animation direction:
  - **Forward cycles**: 59→0, 23→0 (normal time progression)
  - **Backward cycles**: 0→59, 0→23 (countdown scenarios)
- **Countdown-optimized animations** that animate backward when time values decrease
- **No flash artifacts** between animation states
- **Accessibility support** with `prefers-reduced-motion`
- **Hardware acceleration** for optimal performance

## License

ISC License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper TypeScript types
4. Ensure CSS follows the established custom property system
5. Test across different browsers and accessibility settings
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Development Guidelines

- Use TypeScript for all new JavaScript code
- Follow the established CSS custom property naming convention
- Ensure accessibility features are maintained
- Add performance optimizations where possible
- Include proper cleanup methods for memory management

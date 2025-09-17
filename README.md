# Wheel Clock

A high-performance, modern wheel-based clock and countdown timer library built with TypeScript. Features unlimited number support, enhanced timeout management, options-based constructors, optimized rollover animations, and comprehensive accessibility support with advanced memory management.

## Features

- 🔢 **Unlimited Numbers**: No artificial constraints - handles any value from Date objects
- 🎯 **Multiple Display Modes**: Real-time clock, countdown timer, 12/24-hour formats, exclude seconds
- 🏗️ **Enhanced Architecture**: Options-based constructors with comprehensive TypeScript interfaces
- 🎨 **Enhanced Visual Design**: Theme-aware gradients with CSS custom properties and utility classes for easy customization
- 🚀 **Performance Optimized**: Comprehensive timeout management with dual-layer tracking system for animations and initialization
- ♿ **Accessibility First**: `prefers-reduced-motion`, screen reader support, and high contrast compatibility
- 📦 **TypeScript Native**: Full type definitions with detailed JSDoc documentation
- 🧹 **Memory Safe**: Comprehensive cleanup methods with managed timeouts and instance safety mechanisms
- 🌐 **Production Ready**: Robust error handling with NaN safety checks and global exports
- 🔧 **Developer Experience**: Enhanced interfaces, better error messages, and improved debugging support

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

// Create a countdown timer with callback (using timestamp)
const countdown = new Clock({
  countdown: new Date("2025-12-31T23:59:59").getTime(),
  callback: () => console.log("Time's up!"),
  showSeconds: true,
});
document.body.appendChild(countdown.el);

// Create a countdown timer with callback (using ISO string)
const countdownString = new Clock({
  countdown: "2025-12-31T23:59:59Z",
  callback: () => console.log("Time's up!"),
  showSeconds: true,
});
document.body.appendChild(countdownString.el);

// Create a 12-hour clock without seconds
const simpleClock = new Clock({
  twelveHour: true,
  showSeconds: false,
});
document.body.appendChild(simpleClock.el);

// Custom slot labels
const customClock = new Clock({
  countdown: "2025-12-31T23:59:59Z",
  slotLabels: {
    Days: "Jours",
    Hours: "Heures",
    Minutes: "Minutes",
    Seconds: "Secondes",
  },
});
document.body.appendChild(customClock.el);
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

      // Using ISO string countdown
      const clock = new Clock({
        countdown: "2025-12-31T23:59:59Z",
        twelveHour: true,
        showSeconds: true,
      });
      document.body.appendChild(clock.el);

      // Using timestamp countdown
      const timestampClock = new Clock({
        countdown: new Date("2025-12-31T23:59:59").getTime(),
        callback: () => alert("New Year!"),
        showSeconds: true,
      });
      document.body.appendChild(timestampClock.el);
    </script>
  </body>
</html>
```

## Advanced Usage

### Custom Wheel Component

```typescript
import { CountdownTracker } from "wheel-clock";

// Create individual time unit wheels with enhanced options
const hoursWheel = new CountdownTracker({
  label: "Hours",
  value: 12,
  type: "clock",
});

const minutesWheel = new CountdownTracker({
  label: "Minutes",
  value: 30,
  type: "countdown",
});

document.body.appendChild(hoursWheel.el);
document.body.appendChild(minutesWheel.el);

// Update values dynamically with animation
hoursWheel.update(13);
minutesWheel.update(45);

// Clean up when done (includes timeout cleanup)
hoursWheel.destroy?.();
minutesWheel.destroy?.();
```

### React Hook Integration

```typescript
import { useWheelClock } from "your-hooks";

const CountdownComponent = ({ endDate, callback }) => {
  const { containerRef, isReady } = useWheelClock({
    countdown: endDate,
    callback,
    showSeconds: true,
    slotLabels: {
      Days: "Days",
      Hours: "Hours",
      Minutes: "Minutes",
      Seconds: "Seconds",
    },
  });

  return (
    <div
      ref={containerRef}
      className={`countdown-timer ${isReady ? "ready" : "loading"}`}
    />
  );
};
```

## API Reference

### Clock Constructor

```typescript
class Clock {
  constructor(options?: ClockOptions);
  readonly el: HTMLElement; // Main DOM element
  destroy(): void; // Clean up resources and managed timeouts
}
```

### Clock Options

```typescript
interface ClockOptions {
  callback?: () => void;
  countdown?: string | number; // ISO string or timestamp in milliseconds
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
  constructor(options: CountdownTrackerOptions);
  readonly el: HTMLElement; // Wheel DOM element
  update: (value: number) => void; // Update wheel value with animation
  destroy?: () => void; // Clean up resources and animation timeouts
}

interface CountdownTrackerOptions {
  label: TimeUnit;
  value: string | number;
  slotLabels?: SlotLabels;
  type: "clock" | "countdown";
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

## Input Format Support

### Countdown Input Types

The library accepts multiple input formats for maximum flexibility:

```typescript
// Unix timestamp in milliseconds (JavaScript standard)
const timestampMs = new Date("2025-12-31T23:59:59Z").getTime(); // 1735689599000
new Clock({ countdown: timestampMs });

// Unix timestamp in seconds (convert to milliseconds)
const timestampSec = 1735689599; // Convert: timestampSec * 1000
new Clock({ countdown: timestampSec * 1000 });

// ISO 8601 string formats
new Clock({ countdown: "2025-12-31T23:59:59Z" }); // UTC
new Clock({ countdown: "2025-12-31T15:59:59-08:00" }); // PST
new Clock({ countdown: "2025-12-31T18:59:59-05:00" }); // EST

// Note: All formats are converted to UTC internally for accurate countdown calculation
```

### Timezone Handling

```typescript
// All these represent the same moment in time:
const utc = "2025-12-31T23:59:59Z"; // UTC
const pst = "2025-12-31T15:59:59-08:00"; // Pacific
const est = "2025-12-31T18:59:59-05:00"; // Eastern

// All produce identical countdown results
new Clock({ countdown: utc });
new Clock({ countdown: pst });
new Clock({ countdown: est });
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

The library uses an enhanced data-attribute driven architecture with improved memory management:

- **Options-Based Constructors**: Enhanced interfaces for better TypeScript integration
- **Flexible Input Types**: Clock `countdown` parameter accepts both ISO strings and timestamps
- **Comprehensive Timeout Management**: Managed timeouts prevent memory leaks
- **Instance Safety**: `isDestroyed` flags prevent operations on destroyed instances
- **Single Data Attribute**: Numbers displayed using `content: attr(data-value)`
- **Smart Rollover Detection**: Enhanced bidirectional logic for time unit cycling
- **Hardware Acceleration**: All animations use `translate3d()` for GPU optimization
- **CSS Containment**: Strategic `contain: layout style paint` for isolated rendering
- **Theme-Aware Styling**: CSS custom properties enable automatic dark/light mode
- **Enhanced Memory Safety**: Automatic cleanup prevents memory leaks
- **Type-Safe Exports**: Full TypeScript support with both value and type exports

## Styling & Customization

### CSS Custom Properties

```css
:root {
  /* Layout & Spacing */
  --wheel-height: 1.25em;
  --wheel-width: 0.75em;
  --wheel-gap: 1rem;
  --container-gap: 1rem;
  --wheel-border-radius: 6px;
  --perspective: 400px;

  /* Typography */
  --wheel-font-size: 9vw;
  --slot-font-size: 2vw;
  --font-family: "Arial", sans-serif;
  --wheel-font-weight: 400;
  --line-height-base: 1;

  /* Colors */
  --wheel-bg: #444;
  --wheel-text: #fff;
  --body-bg: #eee;
  --gradient-highlight: rgba(255, 255, 255, 0.15);
  --gradient-shadow: rgba(0, 0, 0, 0.2);

  /* Animation */
  --animation-duration: 600ms;
  --animation-easing: cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

### Theme Customization

```html
<!-- Default theme -->
<div class="wheel-clock" id="clock1"></div>

<!-- Dark theme -->
<div class="wheel-clock wheel-clock--dark" id="clock2"></div>

<!-- Light theme -->
<div class="wheel-clock wheel-clock--light" id="clock3"></div>
```

### Accessibility Features

```css
/* Motion reduction support */
@media (prefers-reduced-motion: reduce) {
  :root {
    --animation-duration: 0.01ms;
  }
  .wheel-clock * {
    animation: none !important;
    transition: none !important;
  }
}

/* High contrast support */
@media (prefers-contrast: high) {
  :root {
    --wheel-bg: #000;
    --wheel-text: #fff;
    --wheel-border: #fff;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  :root {
    --wheel-bg: #222;
    --wheel-text: #fff;
    --body-bg: #111;
  }
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

- **Organized CSS variables** grouped by category
- **Hardware acceleration** with `translate3d()` transforms
- **CSS containment** for optimized rendering
- **Modern accessibility** support
- **Responsive typography** using `clamp()`
- **Theme utility classes** for easy switching

### JavaScript Optimizations

- **Comprehensive timeout management** with precise tracking
- **Instance safety mechanisms** preventing memory leaks
- **Flexible input handling** for strings and numbers
- **Enhanced memory management** with automatic cleanup
- **Type-safe interfaces** with JSDoc documentation
- **Performance-optimized** 60fps animations

### Early Completion Feature

When `showSeconds` is false, the countdown completes 1 minute early to prevent displaying "00:00" for a full minute:

```typescript
// Countdown completes when Total < 60000ms (1 minute) if showSeconds is false
// Countdown completes when Total < 0ms if showSeconds is true
const shouldComplete = showSeconds ? totalMs < 0 : totalMs < 60000;
```

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

- Use TypeScript for all new JavaScript code with comprehensive JSDoc
- Follow the options-based constructor pattern for type safety
- Follow established CSS custom property naming conventions
- Ensure accessibility features are maintained
- Include proper cleanup methods for memory management
- Maintain compatibility with both ES modules and global browser usage
- Test with various input formats (ISO strings, timestamps)
- Verify timezone handling works correctly across different zones

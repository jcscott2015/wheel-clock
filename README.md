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

// Create a countdown timer with callback (using string)
const countdownString = new Clock({
  countdown: "2025-12-31T23:59:59",
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

      // using string countdown
      const clock = new Clock({
        countdown: "2025-12-31T23:59:59",
        twelveHour: true,
        showSeconds: true,
      });
      document.body.appendChild(clock.el);

      // using timestamp countdown
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

// Update values dynamically
hoursWheel.update(13);
minutesWheel.update(45);

// Clean up when done (includes timeout cleanup)
hoursWheel.destroy();
minutesWheel.destroy();
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
  countdown?: string | number;
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
  update(value: number): void; // Update wheel value with animation
  destroy(): void; // Clean up resources and animation timeouts
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

The library uses an enhanced data-attribute driven architecture with improved memory management and optimized CSS:

- **Options-Based Constructors**: Enhanced `CountdownTrackerOptions` interface for better TypeScript integration
- **Comprehensive Timeout Management**: Both `CountdownTracker` and `Clock` classes use Map<HTMLElement|string, number>` systems for precise timeout tracking
- **Instance Safety**: `isDestroyed` flags prevent operations on destroyed instances and ensure safe cleanup
- **Flexible Input Types**: Clock `countdown` parameter accepts both strings and numbers (timestamps) for maximum flexibility
- **Single Data Attribute**: Numbers are displayed using `content: attr(data-value)` in CSS
- **Object-Based Trackers**: Efficient `Record<string, CountdownTracker>` structure for performance
- **Countdown Animation Logic**: Proper backward animations for countdown scenarios with intelligent direction detection
- **Hardware Acceleration**: All animations use `translate3d()` transforms for optimal GPU acceleration
- **CSS Containment**: Strategic use of `contain: layout style paint` for isolated rendering
- **Theme-Aware Styling**: CSS custom properties enable automatic dark/light mode adaptation
- **Comprehensive Error Handling**: NaN safety with detailed validation and fallback mechanisms
- **Enhanced Memory Safety**: Managed timeouts with automatic cleanup prevent memory leaks in both animation and initialization phases
- **Type-Safe Exports**: Full TypeScript support with both value and type exports
- **Global Compatibility**: Automatic global registration for browser environments

## Styling & Customization

### CSS Custom Properties

The library uses modern CSS custom properties organized by category for easy theming:

```css
:root {
  /* Layout & Spacing */
  --wheel-height: 1.25em;
  --wheel-width: 0.75em;
  --wheel-gap: 1rem;
  --container-gap: 1rem;
  --clock-margin: 20px;
  --wheel-border-radius: 6px;
  --perspective: 400px;

  /* Typography */
  --wheel-font-size: 9vw;
  --slot-font-size: 2vw;
  --font-family: "Arial", sans-serif;
  --text-font-weight: 400;
  --wheel-font-weight: 400;
  --line-height-base: 1;
  --letter-spacing: -0.01em;

  /* Colors */
  --wheel-bg: #444;
  --wheel-text: #fff;
  --body-bg: #eee;
  --wheel-border: transparent;
  --gradient-highlight: rgba(255, 255, 255, 0.15);
  --gradient-shadow: rgba(0, 0, 0, 0.2);

  /* Effects & Shadows */
  --wheel-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  --wheel-shadow-inset: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  --transition-base: 0.2s ease-out;

  /* Animation */
  --animation-duration: 600ms;
  --animation-easing: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --animation-delay: 0ms;

  /* Responsiveness */
  --font-min: 40px;
  --font-max: 120px;
  --slot-font-min: 12px;
  --slot-font-max: 24px;
}
```

### Theme Customization

The library now supports easy theme switching with utility classes:

```html
<!-- Default theme -->
<div class="wheel-clock" id="clock1"></div>

<!-- Dark theme -->
<div class="wheel-clock wheel-clock--dark" id="clock2"></div>

<!-- Light theme -->
<div class="wheel-clock wheel-clock--light" id="clock3"></div>
```

You can also programmatically switch themes:

```javascript
const clock = document.querySelector(".wheel-clock");

// Switch to dark theme
clock.classList.add("wheel-clock--dark");

// Switch to light theme
clock.classList.remove("wheel-clock--dark");
clock.classList.add("wheel-clock--light");

// Reset to default theme
clock.classList.remove("wheel-clock--dark", "wheel-clock--light");
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

/* Theme utility classes */
.wheel-clock--dark; /* Dark theme variant */
.wheel-clock--light; /* Light theme variant */
```

### Visual Design Features

The library includes enhanced visual styling for realistic 3D wheel effects:

- **Multi-stop gradients**: Smooth 6-stop gradient using CSS custom properties for theme-aware styling
- **Enhanced shadows**: Carefully crafted top and bottom darkening for 3D appearance
- **Theme-aware colors**: Gradients that adapt to dark/light themes automatically
- **Performance optimized**: Using CSS variables for efficient gradient rendering
- **Positioning precision**: Strategic gradient stops at 6%, 49%, 51%, and 90% for optimal effect

```css
/* Enhanced wheel gradient with theme support */
.wheel-clock__wheel::before {
  background-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.09) 0%,
    var(--gradient-highlight) 6%,
    rgba(255, 255, 255, 0.09) 49%,
    rgba(0, 0, 0, 0.09) 51%,
    rgba(0, 0, 0, 0.15) 90%,
    var(--gradient-shadow) 100%
  );
}

/* Theme utility classes for easy customization */
.wheel-clock--dark {
  --wheel-bg: #222;
  --wheel-text: #fff;
  --gradient-highlight: rgba(255, 255, 255, 0.2);
  --gradient-shadow: rgba(0, 0, 0, 0.4);
}

.wheel-clock--light {
  --wheel-bg: #f5f5f5;
  --wheel-text: #333;
  --gradient-highlight: rgba(255, 255, 255, 0.8);
  --gradient-shadow: rgba(0, 0, 0, 0.1);
}
```

### Accessibility Features

The library includes comprehensive accessibility support with enhanced media queries:

```css
/* Comprehensive motion reduction support */
@media (prefers-reduced-motion: reduce) {
  :root {
    --animation-duration: 0.01ms;
    --transition-base: none;
  }

  .wheel-clock * {
    animation: none !important;
    transition: none !important;
  }
}

/* Enhanced contrast for better visibility */
@media (prefers-contrast: high) {
  :root {
    --wheel-bg: #000;
    --wheel-text: #fff;
    --wheel-border: #fff;
    --wheel-shadow: 0 4px 8px rgba(255, 255, 255, 0.3);
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  :root {
    --wheel-bg: #222;
    --wheel-text: #fff;
    --body-bg: #111;
    --gradient-highlight: rgba(255, 255, 255, 0.2);
  }
}

/* Windows High Contrast mode support */
@media (forced-colors: active) {
  :root {
    --wheel-bg: ButtonFace;
    --wheel-text: ButtonText;
    --body-bg: Canvas;
    --wheel-border: ButtonText;
  }

  .wheel-clock__wheel {
    forced-color-adjust: none;
    border: 2px solid ButtonText;
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

- **Organized CSS variables** grouped by category (Layout, Typography, Colors, Effects, Animation, Responsiveness)
- **Enhanced 3D gradient effects** with theme-aware CSS custom properties for automatic light/dark adaptation
- **CSS containment** for optimized rendering performance (`contain: layout style paint`)
- **Hardware acceleration** with `translate3d()` transforms and strategic `translateZ(0)`
- **Modern accessibility** including `prefers-color-scheme`, `forced-colors`, and comprehensive `prefers-reduced-motion`
- **Performance isolation** with `isolation: isolate` to prevent rendering issues
- **Responsive typography** using `clamp()` with dedicated min/max custom properties
- **Theme utility classes** (`.wheel-clock--dark`, `.wheel-clock--light`) for easy theme switching
- **Enhanced font optimization** with `font-feature-settings: "tnum"` for tabular numbers
- **Improved gradient system** using CSS variables for consistent theming across components

### JavaScript Optimizations

- **Comprehensive timeout management** with `Map<HTMLElement, number>` for precise timeout tracking across all components
- **Instance safety mechanisms**: with `isDestroyed` flags prevent operations on destroyed instances
- **Flexible input handling**: supporting both string and numeric countdown inputs (ISO strings and timestamps)
- **Comprehensive memory management** with automatic cleanup of all amangaed timeouts and animation frames
- **Options-based constructors** for better TypeScript integration and flexibility
- **Robust error handling** with comprehensive NaN safety checks and validation
- **Type-safe interfaces** with detailed JSDoc documentation for better developer experience
- **Global exports** for both ES modules and browser environments
- **Performance-optimized cleanup** methods that prevent memory leaks across animation and initialization phases
- **Managed initialization** system with safe timeout handling for initial delays

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

- Use TypeScript for all new JavaScript code with comprehensive JSDoc documentation
- Follow the options-based constructor pattern for enhanced type safety
- Follow the established CSS custom property naming convention
- Ensure accessibility features are maintained
- Add performance optimizations where possible
- Include proper cleanup methods for memory management with timeout tracking
- Use the enhanced `CountdownTrackerOptions` interface for new components
- Maintain compatibility with both ES modules and global browser usage

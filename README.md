# Wheel Clock

A high-performance, modern wheel-based clock and countdown timer library built with TypeScript. Features smooth rolling animations, comprehensive animation controls, CSS-free implementation with inline styling, and robust memory management.

## Features

- 🎨 **CSS-Free Implementation**: No external CSS dependencies - all styling handled via inline styles in TypeScript (A CSS file is provided for demo purposes)
- 🎯 **Smooth Rolling Animations**: Natural wheel transitions with configurable direction, duration, and easing
- 🔢 **Unlimited Numbers**: Handles any value from 0 to 9999 with proper digit separation and formatting
- 🎮 **Animation Control**: Configurable duration, easing functions, and direction (up/down/auto)
- 🏗️ **Modern Architecture**: RequestAnimationFrame-based animation management with proper cleanup
- 🚀 **Performance Optimized**: Hardware-accelerated animations with transform3d and efficient DOM updates
- ♿ **Accessibility Ready**: Screen reader support and motion-sensitive design patterns
- 📦 **TypeScript Native**: Full type definitions with comprehensive interfaces
- 🧹 **Memory Safe**: Automatic cleanup with proper resource management and animation cancellation
- 🌐 **Production Ready**: Robust error handling, input validation, and cross-browser compatibility
- 🔧 **Developer Experience**: Intuitive APIs, detailed documentation, and comprehensive debugging support
- ⏰ **Smart Completion**: Configurable early completion with threshold-based callbacks

## Installation

### Via NPM (Recommended)

```bash
npm install wheel-clock
```

### Direct Download

Clone or download the repository and include the built files:

- `dist/index.js` - Main library
- No CSS required - all styling is handled inline

## Quick Start

### ES Module (Modern)

```typescript
import { Clock } from "wheel-clock";

// Create a real-time clock
const clock = new Clock();
document.body.appendChild(clock.el);

// Create a countdown timer with custom animation
const countdown = new Clock({
  countdown: "2025-12-31T23:59:59Z",
  callback: () => console.log("Time's up!"),
  showSeconds: true,
  earlyCompletionMs: 58000, // Complete 58 seconds early for smooth "00:00:00" display
  animation: {
    duration: 800,
    easing: "ease-out",
    direction: "down",
  },
});
document.body.appendChild(countdown.el);

// Create a fast-updating clock
const fastClock = new Clock({
  animation: {
    duration: 200,
    easing: "linear",
  },
});
document.body.appendChild(fastClock.el);

// Instant updates (no animation)
const instantClock = new Clock({
  animation: { duration: 0 },
});
document.body.appendChild(instantClock.el);

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
  <body>
    <script src="dist/index.js"></script>
    <script>
      // Global Clock constructor is automatically available
      const clock = new Clock({
        countdown: "2025-12-31T23:59:59Z",
        twelveHour: true,
        showSeconds: true,
        animation: {
          duration: 600,
          direction: "auto",
        },
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

// Create individual time unit wheels with custom animations
const hoursWheel = new CountdownTracker({
  label: "Hours",
  value: 12,
  type: "clock",
  animation: {
    duration: 400,
    easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    direction: "up",
  },
});

const minutesWheel = new CountdownTracker({
  label: "Minutes",
  value: 30,
  type: "countdown",
  animation: {
    duration: 600,
    direction: "down",
  },
});

document.body.appendChild(hoursWheel.el);
document.body.appendChild(minutesWheel.el);

// Update values dynamically with smooth animations
hoursWheel.update(13);
minutesWheel.update(45);

// Clean up when done
hoursWheel.destroy();
minutesWheel.destroy();
```

### React Hook Integration

```typescript
import { useWheelClock } from "your-hooks";

const CountdownComponent = ({ endDate, callback }) => {
  const { containerRef, isReady, isTimeReached } = useWheelClock({
    countdown: endDate,
    callback,
    showSeconds: true,
    earlyCompletionMs: 58000,
    animation: {
      duration: 800,
      easing: "ease-in-out",
      direction: "down",
    },
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
      data-time-reached={isTimeReached}
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
  get isTimeReached(): boolean; // Whether countdown has reached completion threshold
  destroy(): void; // Clean up resources and animations
}
```

### Clock Options

```typescript
interface ClockOptions {
  callback?: () => void;
  countdown?: string | number; // ISO string or timestamp in milliseconds
  earlyCompletionMs?: number; // Complete early by this many milliseconds (default: varies by showSeconds)
  showSeconds?: boolean;
  slotLabels?: SlotLabels;
  twelveHour?: boolean;
  animation?: AnimationOptions;
}

interface AnimationOptions {
  duration?: number; // Animation duration in milliseconds (default: 600)
  easing?: string; // CSS easing function (default: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)')
  direction?: "up" | "down" | "auto"; // Animation direction (default: 'auto')
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
  destroy: () => void; // Clean up resources and animations
}

interface CountdownTrackerOptions {
  label: TimeUnit;
  value: string | number;
  slotLabels?: SlotLabels;
  type: "clock" | "countdown";
  animation?: AnimationOptions;
}

type TimeUnit = "Seconds" | "Minutes" | "Hours" | "Days";
```

### Early Completion Feature

The library includes intelligent early completion to provide smooth user experience:

```typescript
// Early completion automatically determined based on showSeconds
const countdown = new Clock({
  countdown: "2025-12-31T23:59:59Z",
  showSeconds: false, // Will complete ~58 seconds early to show "00:00:00"
  callback: () => console.log("Countdown complete!"), // Fires when threshold reached
});

// Custom early completion threshold
const customCountdown = new Clock({
  countdown: "2025-12-31T23:59:59Z",
  earlyCompletionMs: 30000, // Complete 30 seconds early
  callback: () => console.log("Almost there!"),
});

// Check completion state
console.log(countdown.isTimeReached); // true when threshold reached
```

### Animation Behavior

The library provides intelligent animation direction based on component type:

- **Clock Type**: Always animates "up" (digits roll upward) - representing forward time progression
- **Countdown Type**: Always animates "down" (digits roll downward) - representing time counting down
- **Auto Direction**: Automatically chooses direction based on component type
- **Manual Override**: Use `direction: 'up'` or `direction: 'down'` to force specific animation direction

```typescript
// Clock always rolls up (natural time progression)
const clock = new Clock({
  animation: { direction: "auto" }, // Will roll up
});

// Countdown always rolls down (counting down)
const countdown = new Clock({
  countdown: "2025-12-31T23:59:59Z",
  animation: { direction: "auto" }, // Will roll down
});

// Force specific direction
const customClock = new Clock({
  animation: { direction: "up" }, // Always rolls up regardless of type
});
```

## Input Format Support

### Countdown Input Types

```typescript
// Unix timestamp in milliseconds (JavaScript standard)
const timestampMs = new Date("2025-12-31T23:59:59Z").getTime();
new Clock({ countdown: timestampMs });

// ISO 8601 string formats
new Clock({ countdown: "2025-12-31T23:59:59Z" }); // UTC
new Clock({ countdown: "2025-12-31T15:59:59-08:00" }); // PST
new Clock({ countdown: "2025-12-31T18:59:59-05:00" }); // EST
```

## Styling & Customization

### Default Inline Styles

The library applies these default inline styles (all customizable):

```typescript
".wheel-clock__container": {
  contain: "layout style",
  display: "inline-block",
  textAlign: "center",
},
".wheel-clock": {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  contain: "layout style paint",
  isolation: "isolate",
  willChange: "transform",
},
".wheel-clock__pair": {
  contain: "layout",
  display: "flex",
},
".wheel-clock__wheel": {
  backfaceVisibility: "hidden",
  contain: "layout style paint",
  isolation: "isolate",
  display: "inline-block",
  overflow: "hidden",
  position: "relative",
},
".wheel-clock__number-wheel": {
  contain: "layout style paint",
  isolation: "isolate",
  position: "relative",
  textRendering: "optimizeSpeed",
  userSelect: "none",
  height: "100%",
  width: "100%",
  willChange: "transform",
},
".wheel-value wheel-value--current": {
  alignItems: "center",
  display: "flex",
  inset: 0,
  justifyContent: "center",
  lineHeight: 1,
  position: "absolute",
  userSelect: "none",
  zIndex: 1,
}
```

### Custom Styling

Since all styling is handled via inline styles, you can customize the appearance by modifying the source code, adding an external CSS file (like the sample included), or extending the classes:

```typescript
// Example: Custom styled wheel
class CustomCountdownTracker extends CountdownTracker {
  private createWheelContainer(
    type: WheelType,
    wheel: HTMLElement
  ): HTMLElement {
    const container = super.createWheelContainer(type, wheel);

    // Apply custom styles
    Object.assign(container.style, {
      backgroundColor: "#1a1a1a",
      border: "3px solid #333",
      borderRadius: "12px",
      boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
    });

    return container;
  }
}
```

## Performance Optimizations

### Animation Performance

- **RequestAnimationFrame**: Smooth 60fps animations with proper frame management
- **Hardware Acceleration**: All animations use `translate3d()` for GPU optimization
- **Smart Interruption**: New animations properly cancel previous ones using `cancelAnimationFrame`
- **Memory Management**: Automatic cleanup prevents memory leaks
- **Efficient Updates**: Only animates when values actually change
- **Throttled Updates**: Update loop throttling prevents excessive DOM manipulation

### Rendering Optimizations

- **Minimal DOM**: Creates only necessary elements during animations
- **Efficient Cleanup**: Removes temporary elements after animations complete
- **Transform-based**: Uses CSS transforms instead of position changes
- **Single Source of Truth**: Each wheel maintains one current value element
- **Optimized Update Loop**: Uses `UPDATE_THROTTLE` constant for performance tuning

## Browser Support

- **Chrome/Edge**: 60+ (full requestAnimationFrame support)
- **Firefox**: 55+ (full requestAnimationFrame support)
- **Safari**: 12+ (full requestAnimationFrame support)
- **Mobile**: All modern mobile browsers
- **Legacy**: Graceful degradation (animations may not work in very old browsers)

## Architecture Overview

### CSS-Free Design

The library eliminates CSS dependencies by:

- **Inline Styling**: All styles applied via `Object.assign(element.style, {...})`
- **Dynamic Elements**: Creates and removes DOM elements as needed for animations
- **No External CSS**: Zero external stylesheets required (A CSS file is provided for demo purposes)
- **Type-Safe Styling**: All style properties managed in TypeScript

### Animation System

- **RequestAnimationFrame**: Modern 60fps animation loop with proper cancellation
- **Frame-based**: Animation completion handled with frame counters and state management
- **Smooth Transitions**: Simultaneous in/out animations for natural rolling effect
- **Direction Logic**: Intelligent direction based on component type (clock vs countdown)
- **Throttled Updates**: Configurable update throttling for performance optimization

### Memory Management

- **Animation Cleanup**: RequestAnimationFrame IDs tracked and cancelled properly
- **Resource Tracking**: All animations and timeouts tracked and cleaned up on destroy
- **Element Lifecycle**: Dynamic creation and removal of animation elements
- **Timeout Management**: No timeout leaks with proper cleanup patterns using `Set<number>`

### State Management

- **Private Properties**: Internal state managed with private properties and public getters
- **Immutable Updates**: State changes handled through controlled update methods
- **Lifecycle Tracking**: `isDestroyed` flag prevents operations on destroyed instances
- **Threshold Logic**: Configurable completion thresholds with intelligent defaults

## Development

### Build System

```bash
# Build TypeScript to JavaScript
npm run build

# Development mode with file watching
npm run dev

# Start local development server
npm run serve
```

### Project Structure

```
wheel-clock/
├── index.html                # Demo page
├── package.json              # Package configuration
├── tsconfig.json             # TypeScript configuration
├── index.css                 # CSS for demo purposes
├── index.ts                  # Main TypeScript source (CSS-free)
└── dist/                     # Built files
    ├── index.d.ts            # TypeScript declarations
    ├── index.d.ts.map.       # Map for inspector
    ├── index.esm.js.         # Compiled Javascript ES Module
    ├── index.esm.min.js      # Compiled Minified Javascript ES Module
    ├── index.esm.min.js.map  # Map for inspector
    ├── index.js              # Compiled Common JavaScript
    ├── index.js.map          # Map for inspector
    ├── index.min.js          # Compiled Minified Common Javascript
    └── index.min.js.map      # Map for inspector
```

## Constants

The library uses performance-tuned constants:

```typescript
const CONSTANTS = {
  ANIMATION_DURATION: 600, // Default animation duration in ms
  UPDATE_THROTTLE: 10, // Update loop throttling factor
  INITIAL_DELAY: 500, // Initial delay before starting animations
} as const;
```

## License

ISC License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper TypeScript types
4. Ensure inline styling follows established patterns
5. Test animations across different browsers
6. Test animation cancellation and cleanup
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

### Development Guidelines

- **TypeScript First**: Use comprehensive TypeScript with JSDoc documentation
- **CSS-Free**: All styling must be handled via inline styles in TypeScript
- **Animation Safety**: Always use requestAnimationFrame with proper cancellation
- **Memory Safety**: Ensure proper cleanup in all destroy methods
- **Performance**: Use hardware-accelerated transforms for animations
- **Accessibility**: Maintain screen reader compatibility
- **Cross-browser**: Test across modern browsers for compatibility
- **Input Validation**: Validate all user inputs with proper error handling
- **State Management**: Use private properties with public getters for controlled access

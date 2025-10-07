// Constants for better maintainability and performance
const CONSTANTS = {
  ANIMATION_DURATION: 600, // ms
  UPDATE_THROTTLE: 10, // frames
  INITIAL_DELAY: 500, // ms
} as const;

// Improved type definitions
type TimeUnit = "Seconds" | "Minutes" | "Hours" | "Days";
type WheelType = "tens" | "ones";

interface TimeObject {
  Total: Date | number;
  Days?: number;
  Hours: number;
  Minutes: number;
  Seconds?: number;
}

interface AnimationOptions {
  easing?: string;
  direction?: "up" | "down" | "auto";
  duration?: number;
}

interface ClockOptions {
  animation?: AnimationOptions;
  callback?: () => void;
  countdown?: string | number;
  earlyCompletionMs?: number;
  showSeconds?: boolean;
  slotLabels?: SlotLabels;
  twelveHour?: boolean;
}

interface CountdownTrackerOptions {
  animation?: AnimationOptions;
  label: TimeUnit;
  slotLabels?: SlotLabels;
  type: "clock" | "countdown";
  value: string | number;
}

interface SlotLabels {
  Days?: string;
  Hours?: string;
  Minutes?: string;
  Seconds?: string;
}

/**
 * Manages the display and animation of a two-digit countdown wheel clock.
 *
 * The `CountdownTracker` class creates a DOM structure representing a time unit (e.g., seconds, minutes)
 * with animated wheels for tens and ones digits. It supports smooth transitions between values,
 * customizable animation options, and proper resource cleanup.
 *
 * @remarks
 * - Designed for use in a wheel clock UI component.
 * - Handles both countdown and count-up modes.
 * - Uses `AbortController` for robust animation cancellation.
 *
 * @example
 * ```typescript
 * const tracker = new CountdownTracker({
 *   label: "seconds",
 *   value: 59,
 *   slotLabels: { seconds: "Sec" },
 *   type: "countdown",
 *   animation: { duration: 300 }
 * });
 * document.body.appendChild(tracker.el);
 * tracker.update(58); // Animates wheels to new value
 * tracker.destroy();  // Cleans up DOM and animations
 * ```
 *
 * @public
 */
class CountdownTracker {
  readonly el: HTMLElement;
  private currentValue: number;
  private readonly tensWheel: HTMLElement;
  private readonly onesWheel: HTMLElement;
  private readonly type: CountdownTrackerOptions["type"];
  private readonly animationControllers: Map<HTMLElement, AbortController> =
    new Map();
  private readonly animationOptions: Required<AnimationOptions>;

  constructor(options: CountdownTrackerOptions) {
    const { label, value, slotLabels, type, animation = {} } = options;
    const numValue = Number(value);
    this.currentValue = isNaN(numValue) ? 0 : numValue;
    this.type = type;

    // Set default animation options
    this.animationOptions = {
      duration: animation.duration ?? CONSTANTS.ANIMATION_DURATION,
      easing: animation.easing ?? "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      direction: animation.direction ?? "auto",
    };

    // Create DOM structure
    const { el, tensWheel, onesWheel } = this.createDOMStructure(
      label,
      slotLabels
    );
    this.el = el;
    this.tensWheel = tensWheel;
    this.onesWheel = onesWheel;

    // Initialize positions
    this.initializeWheelPositions(this.currentValue);
  }

  /**
   * Creates the DOM structure for a wheel clock component, including number wheels and a slot label.
   *
   * @param label - The time unit label to display (e.g., "hours", "minutes").
   * @param slotLabels - Optional mapping of time unit labels to display strings.
   * @returns An object containing the root element (`el`), and references to the tens and ones wheels (`tensWheel`, `onesWheel`).
   */
  private createDOMStructure(label: TimeUnit, slotLabels?: SlotLabels) {
    const fragment = document.createDocumentFragment();
    const el = document.createElement("div");
    el.className = "wheel-clock__container";

    // Apply container styles
    Object.assign(el.style, {
      display: "inline-block",
      contain: "layout style",
      textAlign: "center",
    });

    // Create wheels
    const tensWheel = this.createNumberWheel("tens");
    const onesWheel = this.createNumberWheel("ones");

    // Create containers
    const wheelsPair = document.createElement("div");
    wheelsPair.className = "wheel-clock__pair";

    // Style the pair container
    Object.assign(wheelsPair.style, {
      contain: "layout",
      display: "flex",
    });

    const tensContainer = this.createWheelContainer("tens", tensWheel);
    const onesContainer = this.createWheelContainer("ones", onesWheel);

    wheelsPair.append(tensContainer, onesContainer);

    const slot = document.createElement("div");
    slot.className = "wheel-clock__slot";
    slot.textContent = slotLabels?.[label] ?? label;

    fragment.append(wheelsPair, slot);
    el.appendChild(fragment);

    return { el, tensWheel, onesWheel };
  }

  /**
   * Creates a container element for a wheel, applying specific classes and inline styles,
   * and appends the provided wheel element to it.
   *
   * @param type - The type of wheel, used to set a modifier class on the container.
   * @param wheel - The wheel HTMLElement to be wrapped inside the container.
   * @returns The container HTMLElement with the wheel appended.
   */
  private createWheelContainer(
    type: WheelType,
    wheel: HTMLElement
  ): HTMLElement {
    const container = document.createElement("div");
    container.className = `wheel-clock__wheel wheel wheel--${type}`;

    // Apply inline styles for container with explicit dimensions
    Object.assign(container.style, {
      backfaceVisibility: "hidden",
      contain: "layout style paint",
      isolation: "isolate",
      display: "inline-block",
      overflow: "hidden",
      position: "relative",
    });

    container.appendChild(wheel);
    return container;
  }

  /**
   * Creates a number wheel element for the wheel clock component.
   *
   * This method generates a `div` element with the class `wheel-clock__number-wheel`,
   * applies inline styles to set its position and size, and appends an initial value
   * div as its child. The type of wheel to create is specified by the `type` parameter.
   *
   * @param type - The type of wheel to create, specified by the `WheelType` enum.
   * @returns The created number wheel as an `HTMLElement`.
   */
  private createNumberWheel(type: WheelType): HTMLElement {
    const wheel = document.createElement("div");
    wheel.className = "wheel-clock__number-wheel";

    // Apply inline styles for wheel container
    Object.assign(wheel.style, {
      position: "relative",
      width: "100%",
      height: "100%",
      contain: "layout style paint",
      isolation: "isolate",
      willChange: "transform",
      userSelect: "none",
      textRendering: "optimizeSpeed",
    });

    // Create and add initial current div
    const currentDiv = this.createValueDiv();
    wheel.appendChild(currentDiv);

    return wheel;
  }

  /**
   * Creates and returns a styled `div` element representing the current value in the wheel clock.
   *
   * The returned `div` has the following properties:
   * - CSS classes: `wheel-value wheel-value--current`
   * - Inline styles: positioned absolutely, fills its container, centers its content,
   *   disables text selection, sets line height to 1, and sets z-index to 1.
   *
   * @returns {HTMLElement} The styled `div` element for displaying the current wheel value.
   */
  private createValueDiv(): HTMLElement {
    const div = document.createElement("div");
    div.className = "wheel-value wheel-value--current";

    // Base styles for all value divs
    Object.assign(div.style, {
      alignItems: "center",
      display: "flex",
      inset: 0,
      justifyContent: "center",
      lineHeight: 1,
      position: "absolute",
      userSelect: "none",
      zIndex: 1,
    });

    return div;
  }

  /**
   * Sets the displayed value of a wheel element based on the specified type and target value.
   *
   * This method formats the target value, extracts its digits, and updates the wheel's
   * current value display (either tens or ones) accordingly.
   *
   * @param wheel - The HTML element representing the wheel whose value will be updated.
   * @param type - The type of digit to update ("tens" or "ones").
   * @param targetValue - The numeric value to set on the wheel.
   */
  private setWheelValue(
    wheel: HTMLElement,
    type: WheelType,
    targetValue: number
  ): void {
    const formattedValue = this.formatValue(targetValue);
    const [tens, ones] = this.parseDigits(formattedValue);

    const targetDigit = type === "tens" ? tens : ones;
    const currentDiv = wheel.querySelector(
      ".wheel-value--current"
    ) as HTMLElement;

    if (currentDiv) {
      currentDiv.textContent = targetDigit.toString();
    }
  }

  /**
   * Initializes the positions of the tens and ones wheels based on the provided value.
   *
   * @param value - The numeric value used to set the positions of the tens and ones wheels.
   */
  private initializeWheelPositions(value: number): void {
    this.setWheelValue(this.tensWheel, "tens", value);
    this.setWheelValue(this.onesWheel, "ones", value);
  }

  /**
   * Formats a numeric or string value as a two-digit string, padding with a leading zero if necessary.
   *
   * - If the input is not a valid number, returns "00".
   * - If the number is less than 10, pads with a leading zero (e.g., 5 → "05").
   * - If the number is between 10 and 99, returns the number as a string.
   * - For numbers 100 or greater, returns the number as a string.
   *
   * @param value - The value to format, either a string or number.
   * @returns The formatted two-digit string representation of the value.
   */
  private formatValue(value: string | number): string {
    const num = Number(value);
    if (isNaN(num)) return "00";

    // Use more efficient padding for common cases
    if (num < 10) return `0${num}`;
    if (num < 100) return String(num);
    return String(num);
  }

  /**
   * Parses the last two digits of a string representation of a number.
   *
   * If the input string has two or more characters, returns an array containing the numeric values
   * of the last two characters. If the string has fewer than two characters, returns an array where
   * the first element is 0 and the second element is the numeric value of the first character (or 0 if empty).
   *
   * @param value - The string to parse digits from.
   * @returns A tuple containing two numbers extracted from the input string.
   */
  private parseDigits(value: string): [number, number] {
    const str = String(value);
    const len = str.length;

    if (len >= 2) {
      const lastTwo = str.slice(-2);
      return [parseInt(lastTwo[0], 10), parseInt(lastTwo[1], 10)];
    }

    return [0, parseInt(str[0] || "0", 10)];
  }

  /**
   * Updates the specified wheel (tens or ones) to reflect a digit change, optionally animating the transition.
   *
   * If the old digit and new digit are the same, no update occurs. Any ongoing animation for the wheel is cancelled
   * before starting a new one. The animation direction is determined internally. If the animation duration is greater
   * than zero, the wheel transition is animated; otherwise, the wheel value is updated instantly.
   *
   * @param wheelType - The type of wheel to update ("tens" or "ones").
   * @param oldDigit - The previous digit value displayed on the wheel.
   * @param newDigit - The new digit value to display on the wheel.
   */
  private updateWheel(
    wheelType: WheelType,
    oldDigit: number,
    newDigit: number
  ): void {
    if (oldDigit === newDigit) return;

    const wheel = wheelType === "tens" ? this.tensWheel : this.onesWheel;

    // Cancel any existing animation
    this.cancelWheelAnimation(wheel);

    // Determine animation direction
    const direction = this.getAnimationDirection();

    // Apply animation if duration > 0
    if (this.animationOptions.duration > 0) {
      this.animateWheelTransition(wheel, newDigit, direction);
    } else {
      // Instant update
      this.setWheelValue(wheel, wheelType, this.currentValue);
    }
  }

  /**
   * Determines the animation direction for the wheel clock.
   *
   * If the `animationOptions.direction` property is not set to `"auto"`,
   * returns its value. Otherwise, returns `"down"` if the clock type is
   * `"countdown"`, or `"up"` for other types.
   *
   * @returns {"up" | "down"} The direction of the animation.
   */
  private getAnimationDirection(): "up" | "down" {
    if (this.animationOptions.direction !== "auto") {
      return this.animationOptions.direction;
    }
    return this.type === "countdown" ? "down" : "up";
  }

  /**
   * Animates the transition of a wheel digit by sliding the current value out and the new value in.
   *
   * This method creates a new digit element, positions it off-screen based on the direction,
   * and animates both the outgoing and incoming digit elements using the Web Animations API.
   * It also handles aborting the animation via an AbortController and cleans up elements on completion or cancellation.
   *
   * @param wheel - The HTMLElement representing the wheel whose digit is being animated.
   * @param newDigit - The new digit value to display.
   * @param direction - The direction of the animation, either "up" (digit increases) or "down" (digit decreases).
   */
  private animateWheelTransition(
    wheel: HTMLElement,
    newDigit: number,
    direction: "up" | "down"
  ): void {
    const { duration, easing } = this.animationOptions;

    const currentDiv = wheel.querySelector(
      ".wheel-value--current"
    ) as HTMLElement;

    if (!currentDiv) return;

    // Create new div for incoming value
    const newDiv = this.createValueDiv();
    newDiv.textContent = newDigit.toString();

    // Position new div off-screen based on direction
    const startTransform =
      direction === "up"
        ? "translate3d(0, 100%, 0)"
        : "translate3d(0, -100%, 0)";
    newDiv.style.transform = startTransform;

    wheel.appendChild(newDiv);

    // Create abort controller for this animation
    const controller = new AbortController();
    this.animationControllers.set(wheel, controller);

    // Define keyframes for better performance
    const outKeyframes =
      direction === "up"
        ? [
            { transform: "translate3d(0, 0, 0)" },
            { transform: "translate3d(0, -100%, 0)" },
          ]
        : [
            { transform: "translate3d(0, 0, 0)" },
            { transform: "translate3d(0, 100%, 0)" },
          ];

    const inKeyframes =
      direction === "up"
        ? [
            { transform: "translate3d(0, 100%, 0)" },
            { transform: "translate3d(0, 0, 0)" },
          ]
        : [
            { transform: "translate3d(0, -100%, 0)" },
            { transform: "translate3d(0, 0, 0)" },
          ];

    // Start animations
    const outAnimation = currentDiv.animate(outKeyframes, {
      duration,
      easing,
      fill: "forwards",
    });

    const inAnimation = newDiv.animate(inKeyframes, {
      duration,
      easing,
      fill: "forwards",
    });

    // Handle animation completion
    Promise.all([outAnimation.finished, inAnimation.finished])
      .then(() => {
        if (!controller.signal.aborted) {
          this.completeWheelTransition(wheel, currentDiv, newDiv);
        }
      })
      .catch(() => {
        // Animation was cancelled or failed - clean up
        if (newDiv.parentNode) {
          newDiv.parentNode.removeChild(newDiv);
        }
      });

    // Handle abort signal
    controller.signal.addEventListener("abort", () => {
      outAnimation.cancel();
      inAnimation.cancel();
    });
  }

  /**
   * Completes the wheel transition by removing the old value element,
   * resetting the styles and class of the new value element, and cleaning up
   * the animation controller associated with the wheel.
   *
   * @param wheel - The wheel element whose transition is being completed.
   * @param oldDiv - The old value element to be removed from the DOM.
   * @param newDiv - The new value element to be reset and displayed as current.
   */
  private completeWheelTransition(
    wheel: HTMLElement,
    oldDiv: HTMLElement,
    newDiv: HTMLElement
  ): void {
    // Remove old div
    if (oldDiv.parentNode) {
      oldDiv.parentNode.removeChild(oldDiv);
    }

    // Reset new div styles
    newDiv.style.transform = "";
    newDiv.className = "wheel-value wheel-value--current";

    // Clean up controller
    this.animationControllers.delete(wheel);
  }

  /**
   * Cancels the wheel animation for the specified wheel element.
   *
   * This method aborts any ongoing animation associated with the wheel,
   * removes the animation controller, and cleans up any extra value divs.
   * If multiple `.wheel-value` divs are present, it removes all of them and
   * creates a fresh `.wheel-value` div with the current value.
   *
   * @param wheel - The wheel HTMLElement whose animation should be cancelled and cleaned up.
   */
  private cancelWheelAnimation(wheel: HTMLElement): void {
    const controller = this.animationControllers.get(wheel);
    if (controller) {
      controller.abort();
      this.animationControllers.delete(wheel);
    }

    // Clean up any extra divs
    const valueDivs = wheel.querySelectorAll(".wheel-value");
    if (valueDivs.length > 1) {
      const currentValue =
        wheel.querySelector(".wheel-value--current")?.textContent || "0";

      // Remove all divs
      valueDivs.forEach((div) => {
        if (div.parentNode) {
          div.parentNode.removeChild(div);
        }
      });

      // Create fresh current div
      const newCurrentDiv = this.createValueDiv();
      newCurrentDiv.textContent = currentValue;
      wheel.appendChild(newCurrentDiv);
    }
  }

  /**
   * Updates the wheel clock value with the provided input.
   *
   * Converts the input to a number and validates that it is within the allowed range (0 to 9999).
   * If the value is invalid or unchanged, the method returns early.
   * Otherwise, it parses the old and new digits, updates the current value,
   * and triggers the wheel update for both tens and ones places.
   *
   * @param val - The new value to set, as a string or number.
   */
  update(val: string | number): void {
    const newValue = Number(val);

    if (isNaN(newValue) || newValue < 0 || newValue > 9999) {
      console.warn(`Invalid value ${newValue} for wheel clock`);
      return;
    }

    if (newValue === this.currentValue) return;

    // Get old and new digits
    const [oldTens, oldOnes] = this.parseDigits(
      this.formatValue(this.currentValue)
    );
    this.currentValue = newValue;
    const [newTens, newOnes] = this.parseDigits(
      this.formatValue(this.currentValue)
    );

    // Update wheels
    this.updateWheel("tens", oldTens, newTens);
    this.updateWheel("ones", oldOnes, newOnes);
  }

  /**
   * Cleans up resources used by the wheel clock instance.
   * Cancels all ongoing animations and removes the element from the DOM.
   */
  destroy(): void {
    // Cancel all animations
    this.animationControllers.forEach((controller) => controller.abort());
    this.animationControllers.clear();

    // Remove from DOM
    this.el.remove();
  }
}

/**
 * Calculates the remaining time until a specified end time.
 *
 * @param endtime - The target end time as an ISO string.
 * @param showSeconds - Optional flag to include seconds in the result.
 * @returns An object containing the total milliseconds remaining and the breakdown into days, hours, minutes, and optionally seconds.
 */
function getTimeRemaining(endtime: string, showSeconds?: boolean): TimeObject {
  const t = Date.parse(endtime) - Date.now();
  const clampedT = Math.max(t, 0);

  const seconds = Math.floor(clampedT / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const result: TimeObject = {
    Total: t,
    Days: days,
    Hours: hours % 24,
    Minutes: minutes % 60,
  };

  if (showSeconds) {
    result.Seconds = clampedT === 0 ? 0 : seconds % 60;
  }

  return result;
}

/**
 * Returns the current time as a `TimeObject`, optionally formatted in 12-hour mode and including seconds.
 *
 * @param twelveHour - If `true`, returns the hour in 12-hour format; otherwise, uses 24-hour format.
 * @param showSeconds - If `true`, includes the seconds in the returned object.
 * @returns A `TimeObject` containing the current time components.
 */
function getTime(twelveHour?: boolean, showSeconds?: boolean): TimeObject {
  const now = new Date();
  let hours = now.getHours();

  if (twelveHour) {
    hours = hours % 12 || 12;
  }

  const result: TimeObject = {
    Total: now,
    Hours: hours,
    Minutes: now.getMinutes(),
  };

  if (showSeconds) {
    result.Seconds = now.getSeconds();
  }

  return result;
}

/**
 * Represents a visual clock or countdown timer component.
 *
 * The `Clock` class creates a DOM element displaying either the current time or a countdown to a specified end time.
 * It supports customization options such as 12-hour/24-hour format, showing seconds, slot labels, and animation settings.
 *
 * @remarks
 * - The clock can be initialized as a regular clock or as a countdown timer.
 * - Trackers for each time unit (hours, minutes, seconds, etc.) are created and updated automatically.
 * - Provides a callback when the countdown completes.
 * - Handles animation frame and timeout management for smooth updates.
 * - Call `destroy()` to clean up resources and remove the clock from the DOM.
 *
 * @example
 * ```typescript
 * const clock = new Clock({
 *   countdown: "2024-07-01T12:00:00Z",
 *   showSeconds: true,
 *   twelveHour: false,
 *   callback: () => alert("Countdown finished!"),
 *   slotLabels: { hours: "H", minutes: "M", seconds: "S" },
 *   animation: { duration: 300 }
 * });
 * document.body.appendChild(clock.el);
 * ```
 *
 * @see CountdownTracker
 * @see getTimeRemaining
 * @see getTime
 */
class Clock {
  readonly el: HTMLElement;
  private readonly trackers: Partial<Record<TimeUnit, CountdownTracker>> = {};
  private readonly animationTimeouts: Set<number> = new Set();
  private readonly animationOptions: AnimationOptions;
  private readonly earlyCompletionMs: number | undefined;
  private readonly showSeconds: boolean;
  private animationFrameId: number | null = null;
  private isDestroyed = false;
  private frameCounter = 0;
  private _isTimeReached = false; // Use private property

  // Add getter for public access
  get isTimeReached(): boolean {
    return this._isTimeReached;
  }

  constructor(options: ClockOptions = {}) {
    const {
      animation = {},
      callback,
      countdown: countdownInput,
      earlyCompletionMs,
      showSeconds,
      slotLabels,
      twelveHour,
    } = options;

    this.earlyCompletionMs = earlyCompletionMs;
    this.showSeconds = showSeconds ?? false;
    this.animationOptions = animation;

    let countdown = "";
    if (typeof countdownInput === "number") {
      countdown = new Date(countdownInput).toISOString();
    } else if (typeof countdownInput === "string") {
      countdown = new Date(Date.parse(countdownInput)).toISOString();
    }

    const updateFn = this.createUpdateFunction(
      countdown,
      twelveHour,
      showSeconds
    );

    this.el = document.createElement("div");
    this.el.className = "wheel-clock";

    // Apply container styles
    Object.assign(this.el.style, {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      contain: "layout style paint",
      isolation: "isolate",
      willChange: "transform",
    });

    // Initialize trackers
    const initialTime = updateFn(countdown);
    this.createTrackers(initialTime, slotLabels, countdown);

    // Start update loop
    this.startUpdateLoop(updateFn, countdown, callback);
  }

  /**
   * Creates a function to update and retrieve time information based on the provided parameters.
   *
   * If a `countdown` string is provided, the returned function calculates the remaining time
   * until the specified end time using `getTimeRemaining`. Otherwise, it returns the current time
   * using `getTime`.
   *
   * @param countdown - The countdown end time as a string. If provided, the returned function will calculate time remaining.
   * @param twelveHour - Optional. If true, formats the time in 12-hour format; otherwise, uses 24-hour format.
   * @param showSeconds - Optional. If true, includes seconds in the time output.
   * @returns A function that, when called, returns a `TimeObject` representing either the remaining time or the current time.
   */
  private createUpdateFunction(
    countdown: string,
    twelveHour?: boolean,
    showSeconds?: boolean
  ): (countdown?: string) => TimeObject {
    if (countdown) {
      return (endtime?: string) =>
        getTimeRemaining(endtime || countdown, showSeconds);
    }
    return () => getTime(twelveHour, showSeconds);
  }

  /**
   * Creates and initializes countdown or clock trackers for each time unit in the provided `timeObject`,
   * excluding the "Total" key. Each tracker is configured with its label, value, optional slot labels,
   * and type (countdown or clock), and is appended to the component's DOM element.
   *
   * @param timeObject - An object containing time units and their corresponding values.
   * @param slotLabels - Optional labels for each slot/unit.
   * @param countdown - Optional string indicating countdown mode; if provided, trackers are created as countdowns.
   */
  private createTrackers(
    timeObject: TimeObject,
    slotLabels?: SlotLabels,
    countdown?: string
  ): void {
    const fragment = document.createDocumentFragment();

    for (const [key, value] of Object.entries(timeObject)) {
      if (key === "Total") continue;

      const tracker = new CountdownTracker({
        label: key as TimeUnit,
        value: value as number,
        slotLabels,
        type: countdown ? "countdown" : "clock",
        animation: this.animationOptions,
      });
      this.trackers[key as TimeUnit] = tracker;
      fragment.appendChild(tracker.el);
    }

    this.el.appendChild(fragment);
  }

  /**
   * Starts the update loop for the wheel clock animation.
   *
   * This method schedules an initial delay before beginning the animation loop,
   * which repeatedly calls the provided `updateFn` to update the clock state.
   * The loop uses `requestAnimationFrame` for smooth updates and throttles updates
   * based on the `CONSTANTS.UPDATE_THROTTLE` value. If a countdown is provided and
   * completes, the `callback` is invoked and the loop is stopped.
   *
   * @param updateFn - A function that receives an optional countdown string and returns a `TimeObject` representing the current clock state.
   * @param countdown - An optional countdown string to track the countdown progress.
   * @param callback - An optional callback function to be called when the countdown completes.
   */
  private startUpdateLoop(
    updateFn: (countdown?: string) => TimeObject,
    countdown: string,
    callback?: () => void
  ): void {
    const update = () => {
      if (this.isDestroyed) return;

      this.animationFrameId = requestAnimationFrame(update);

      if (++this.frameCounter % CONSTANTS.UPDATE_THROTTLE !== 0) return;

      const timeObject = updateFn(countdown);

      if (countdown && this.shouldCompleteCountdown(timeObject)) {
        // Only trigger completion if _isTimeReached wasn't already true
        if (!this._isTimeReached) {
          this._isTimeReached = true;
          this.handleCountdownComplete(callback);
        }
        return;
      }

      this.updateTrackers(timeObject);
    };

    const timeoutId = window.setTimeout(() => {
      if (!this.isDestroyed) {
        this.animationTimeouts.delete(timeoutId);
        update();
      }
    }, CONSTANTS.INITIAL_DELAY);

    this.animationTimeouts.add(timeoutId);
  }

  /**
   * Determines whether the countdown should be completed based on the provided time object.
   *
   * - If `showSeconds` is true, the countdown completes when the total milliseconds are less than zero.
   * - If `earlyCompletionMs` is defined and `showSeconds` is false, the countdown completes when the total milliseconds are less than `earlyCompletionMs`.
   * - Otherwise, the countdown completes when the total milliseconds are less than zero.
   *
   * @param timeObject - An object containing the total time in milliseconds.
   * @returns `true` if the countdown should complete, otherwise `false`.
   */
  private shouldCompleteCountdown(timeObject: TimeObject): boolean {
    const totalMs = timeObject.Total as number;
    const threshold =
      !this.showSeconds && this.earlyCompletionMs !== undefined
        ? this.earlyCompletionMs
        : 0;
    return totalMs < threshold;
  }

  /**
   * Handles the completion of the countdown by performing cleanup operations.
   * Cancels any ongoing animation frame, resets all trackers to zero, and invokes an optional callback.
   *
   * @param callback - An optional function to be called after the countdown is complete.
   */
  private handleCountdownComplete(callback?: () => void): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    Object.values(this.trackers).forEach((tracker) => tracker?.update(0));
    callback?.();
  }

  /**
   * Updates the values of the trackers based on the provided {@link TimeObject}.
   * Iterates through each entry in the time object, skipping the "Total" key,
   * and updates the corresponding tracker if it exists and the value is a number.
   *
   * @param timeObject - An object containing time units as keys and their numeric values.
   */
  private updateTrackers(timeObject: TimeObject): void {
    for (const [key, value] of Object.entries(timeObject)) {
      if (key === "Total") continue;

      const tracker = this.trackers[key as TimeUnit];
      if (tracker && typeof value === "number") {
        tracker.update(value);
      }
    }
  }

  /**
   * Cleans up resources used by the wheel clock instance.
   * Cancels any ongoing animation frames and timeouts, destroys all trackers,
   * and removes the associated DOM element.
   * After calling this method, the instance should not be used.
   */
  destroy(): void {
    this.isDestroyed = true;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.animationTimeouts.forEach((id) => clearTimeout(id));
    this.animationTimeouts.clear();

    Object.values(this.trackers).forEach((tracker) => tracker?.destroy());
    this.el.remove();
  }
}

export { Clock, CountdownTracker };
export type { ClockOptions, TimeObject, AnimationOptions };

// Make classes globally available for browser use
if (typeof globalThis !== "undefined") {
  (globalThis as any).Clock = Clock;
  (globalThis as any).CountdownTracker = CountdownTracker;
}

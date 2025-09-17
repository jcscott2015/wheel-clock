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

interface ClockOptions {
  callback?: () => void;
  countdown?: string | number;
  showSeconds?: boolean;
  slotLabels?: SlotLabels;
  twelveHour?: boolean;
}

interface CountdownTrackerOptions {
  label: TimeUnit;
  value: string | number;
  slotLabels?: SlotLabels;
  type: "clock" | "countdown";
}

interface SlotLabels {
  Days?: string;
  Hours?: string;
  Minutes?: string;
  Seconds?: string;
}

/**
 * Represents a visual countdown tracker for a wheel clock UI, managing the display and animation
 * of tens and ones digit wheels for a specific time unit (e.g., hours, minutes, seconds).
 *
 * The `CountdownTracker` class is responsible for:
 * - Creating and managing the DOM structure for a time unit's wheels and label.
 * - Initializing and updating the visual state of the wheels based on value changes.
 * - Handling digit transitions with appropriate animations.
 * - Cleaning up resources and DOM elements when destroyed.
 *
 * Usage:
 * - Instantiate with options specifying the time unit, initial value, slot labels, and tracker type.
 * - Call `update()` to change the displayed value and trigger wheel animations.
 * - Call `destroy()` to remove the tracker and release resources.
 *
 * @remarks
 * This class is designed for use in a wheel clock countdown component, supporting efficient DOM updates
 * and smooth digit animations. It is not intended for direct manipulation of time logic, but rather for
 * visual representation and transitions.
 *
 * @example
 * ```typescript
 * const tracker = new CountdownTracker({
 *   label: "seconds",
 *   value: 59,
 *   slotLabels: { seconds: "Sec" },
 *   type: "countdown"
 * });
 * document.body.appendChild(tracker.el);
 * tracker.update(58); // Animates wheels to new value
 * tracker.destroy();  // Cleans up DOM and timeouts
 */
class CountdownTracker {
  readonly el: HTMLElement;
  private currentValue: number;
  private readonly tensWheel: HTMLElement;
  private readonly onesWheel: HTMLElement;
  private readonly type: CountdownTrackerOptions["type"];
  private readonly animationTimeouts: Map<HTMLElement, number> = new Map();

  constructor(options: CountdownTrackerOptions) {
    const { label, value, slotLabels, type } = options;
    const numValue = Number(value);
    this.currentValue = isNaN(numValue) ? 0 : numValue;

    // Create DOM structure efficiently
    const { el, tensWheel, onesWheel } = this.createDOMStructure(
      label,
      slotLabels
    );
    this.type = type;
    this.el = el;
    this.tensWheel = tensWheel;
    this.onesWheel = onesWheel;

    // Initialize positions
    this.initializeWheelPositions(this.currentValue);
  }

  /**
   * Creates the DOM structure for a wheel clock time unit, including the tens and ones wheels,
   * their containers, and a slot label. Uses a document fragment for performance.
   *
   * @param label - The time unit label (e.g., "hours", "minutes", "seconds") to display in the slot.
   * @returns An object containing:
   *   - `el`: The root container element for this time unit's wheels and label.
   *   - `tensWheel`: The DOM element representing the tens wheel.
   *   - `onesWheel`: The DOM element representing the ones wheel.
   */
  private createDOMStructure(label: TimeUnit, slotLabels?: SlotLabels) {
    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();
    const el = document.createElement("div");
    el.className = "wheel-clock__container";

    // Create wheels
    const tensWheel = this.createNumberWheel("tens");
    const onesWheel = this.createNumberWheel("ones");

    // Create containers
    const wheelsPair = document.createElement("div");
    wheelsPair.className = "wheel-clock__pair";

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
   * Creates a container element for a wheel of the specified type and appends the given wheel element to it.
   *
   * @param type - The type of the wheel, used to determine the container's CSS class.
   * @param wheel - The wheel HTMLElement to be wrapped inside the container.
   * @returns The container HTMLElement with the wheel appended as its child.
   */
  private createWheelContainer(
    type: WheelType,
    wheel: HTMLElement
  ): HTMLElement {
    const container = document.createElement("div");
    container.className = `wheel-clock__wheel wheel wheel--${type}`;
    container.appendChild(wheel);
    return container;
  }

  /**
   * Creates a number wheel element for the clock UI.
   *
   * @param type - The type of wheel to create (e.g., hours, minutes).
   * @returns The HTMLElement representing the number wheel.
   */
  private createNumberWheel(type: WheelType): HTMLElement {
    const wheel = document.createElement("div");
    wheel.className = "wheel-clock__number-wheel";

    // Set initial data attributes for current, previous, and next values
    this.setWheelDataValue(wheel, type, this.currentValue);

    return wheel;
  }

  /**
   * Sets the `data-value` attribute of a wheel element based on the specified digit type and target value.
   *
   * @param wheel - The HTML element representing the wheel whose value should be updated.
   * @param type - The type of digit to update ("tens" or "ones").
   * @param targetValue - The numeric value to be formatted and parsed for updating the wheel.
   */
  private setWheelDataValue(
    wheel: HTMLElement,
    type: WheelType,
    targetValue: number
  ): void {
    const formattedValue = this.formatValue(targetValue);
    const [tens, ones] = this.parseDigits(formattedValue);

    const targetDigit = type === "tens" ? tens : ones;
    wheel.setAttribute("data-value", targetDigit.toString());
  }

  /**
   * Initializes the data values for both the tens and ones wheels based on the provided value.
   *
   * @param value - The numeric value used to set the data for the tens and ones wheels.
   */
  private initializeWheelPositions(value: number): void {
    this.setWheelDataValue(this.tensWheel, "tens", value);
    this.setWheelDataValue(this.onesWheel, "ones", value);
  }

  /**
   * Formats a numeric or string value as a string with specific padding rules.
   *
   * - For values greater than or equal to 100, returns the full number as a string.
   * - For values less than 100, pads the number to at least two digits with leading zeros.
   * - For invalid or non-numeric values, returns "00".
   *
   * @param value - The value to format, as a string or number.
   * @returns The formatted string representation of the value.
   */
  private formatValue(value: string | number): string {
    const num = Number(value);
    if (isNaN(num)) {
      return "00"; // Default to "00" for invalid values
    }
    return num >= 100 ? String(num) : String(num).padStart(2, "0");
  }

  /**
   * Parses a string value and returns a tuple containing the tens and ones digits as numbers.
   *
   * Always considers the rightmost two characters of the input string. If the string has fewer than two characters,
   * it is left-padded with a "0". Non-numeric characters are treated as zero.
   *
   * @param value - The string to parse for digit extraction.
   * @returns A tuple where the first element is the tens digit and the second is the ones digit.
   */
  private parseDigits(value: string): [number, number] {
    const str = String(value);
    const paddedStr = str.length >= 2 ? str : str.padStart(2, "0");
    const lastTwo = paddedStr.slice(-2);
    const tens = parseInt(lastTwo[0], 10);
    const ones = parseInt(lastTwo[1], 10);

    // Safety check for NaN values
    return [isNaN(tens) ? 0 : tens, isNaN(ones) ? 0 : ones];
  }

  /**
   * Updates the visual state of a wheel element to reflect a digit change,
   * triggering an animation for the transition.
   *
   * @param wheelType - Specifies which wheel to update ("tens" or "ones").
   * @param oldDigit - The previous digit value displayed on the wheel.
   * @param newDigit - The new digit value to display on the wheel.
   *
   * If the digit has not changed, the function returns early.
   * Sets appropriate data attributes for animation, applies the correct animation class
   * based on the tracker type ("countdown" or otherwise), and removes the animation class
   * after the animation duration.
   */
  private updateWheel(
    wheelType: WheelType,
    oldDigit: number,
    newDigit: number
  ): void {
    if (oldDigit === newDigit) return;

    const wheel = wheelType === "tens" ? this.tensWheel : this.onesWheel;

    // Clear existing timeout for this wheel
    this.clearAnimationTimeout(wheel);

    // Set previous value for animation
    wheel.setAttribute("data-next-previous", oldDigit.toString());
    wheel.setAttribute("data-value", newDigit.toString());

    const animationClass = this.applyAnimationClass(
      wheel,
      this.type === "countdown"
    );

    // Use managed timeout
    const timeoutId = window.setTimeout(() => {
      wheel.classList.remove(animationClass);
      this.animationTimeouts.delete(wheel);
    }, CONSTANTS.ANIMATION_DURATION);

    this.animationTimeouts.set(wheel, timeoutId);
  }

  /**
   * Applies an animation class to the given wheel element based on the countdown state.
   *
   * @param wheel - The HTML element representing the wheel to which the animation class will be added.
   * @param isCountdown - If `true`, applies the "wheel-decreasing" class; otherwise, applies the "wheel-increasing" class.
   * @returns The name of the animation class that was added to the wheel element.
   */
  private applyAnimationClass(
    wheel: HTMLElement,
    isCountdown: boolean
  ): string {
    const className = isCountdown ? "wheel-decreasing" : "wheel-increasing";
    wheel.classList.add(className);
    return className;
  }

  /**
   * Updates the current value and triggers wheel updates if the value has changed.
   *
   * If the new value is different from the current value and the current value is non-negative,
   * this method parses the tens and ones digits of both the old and new values, and updates
   * the corresponding wheels only if their values have changed.
   *
   * @param val - The new value to set, as a string or number.
   */
  update(val: string | number): void {
    const newValue = Number(val);
    if (newValue < 0 || newValue > 9999) {
      console.warn(`Value ${newValue} may be outside expected range.`);
    }
    if (val !== this.currentValue && this.currentValue >= 0) {
      // Get old tens and ones
      const [oldTens, oldOnes] = this.parseDigits(
        this.formatValue(this.currentValue)
      );

      // Set current value to new value
      this.currentValue = Number(val);

      // Get current tens and ones
      const [tens, ones] = this.parseDigits(
        this.formatValue(this.currentValue)
      );

      // Update wheels only if their values have changed
      this.updateWheel("tens", oldTens, tens);
      this.updateWheel("ones", oldOnes, ones);
    }
  }

  /**
   * Clears any existing animation timeout associated with the given wheel element.
   *
   * If a timeout exists for the provided wheel, this method cancels the timeout
   * and removes its reference from the `animationTimeouts` map to prevent memory leaks.
   *
   * @param wheel - The HTML element representing the wheel whose animation timeout should be cleared.
   */
  private clearAnimationTimeout(wheel: HTMLElement): void {
    const existingTimeout = this.animationTimeouts.get(wheel);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.animationTimeouts.delete(wheel);
    }
  }

  /**
   * Clears all active animation timeouts by iterating through the stored timeout IDs,
   * calling `clearTimeout` on each, and then emptying the `animationTimeouts` set.
   * This ensures that any pending animation callbacks are cancelled and resources are released.
   */
  private clearAnimationTimeouts(): void {
    this.animationTimeouts.forEach((id) => clearTimeout(id));
    this.animationTimeouts.clear();
  }

  /**
   * Cleans up resources used by the clock instance.
   *
   * This method clears any active animation timeouts and removes the associated
   * DOM element from the document. After calling this method, the instance should
   * not be used further.
   */
  destroy(): void {
    this.clearAnimationTimeouts();
    this.el.remove();
  }
}

/**
 * Calculates the remaining time until a specified end time.
 *
 * @param endtime - The target end time as an ISO 8601 string or any valid date string.
 * @param showSeconds - Optional. Whether to include the seconds in the result. Defaults to `false`.
 * @returns An object containing the total milliseconds remaining (can be negative if the end time is in the past) and the breakdown into days, hours, minutes, and optionally seconds.
 *
 * @remarks
 * The `Total` property in the returned object may be negative if the specified end time is in the past.
 */
function getTimeRemaining(endtime: string, showSeconds?: boolean): TimeObject {
  const t = Date.parse(endtime) - Date.now();
  const clampedT = Math.max(t, 0); // Clamp to zero for display, but keep original for completion check

  const totalHours = Math.floor(clampedT / (1000 * 60 * 60));
  const result: TimeObject = {
    Total: t, // Keep original value (can be negative) for completion detection
    Days: Math.floor(clampedT / (1000 * 60 * 60 * 24)),
    Hours: ((totalHours % 24) + 24) % 24, // Always in 0-23 range
    Minutes: Math.floor((clampedT / 1000 / 60) % 60),
  };

  if (showSeconds) {
    // Clamp seconds to 0 if clampedT is 0 to avoid negative values
    result.Seconds = clampedT === 0 ? 0 : Math.floor((clampedT / 1000) % 60);
  }

  return result;
}

/**
 * Returns the current time as a `TimeObject`, with options for 12-hour format and including seconds.
 *
 * @param twelveHour - If `true`, returns the hour in 12-hour format (1-12). Defaults to `false` (24-hour format).
 * @param showSeconds - If `true`, includes the `Seconds` property in the result. Defaults to `false`.
 * @returns An object containing the current time, with properties for the total `Date`, `Hours`, `Minutes`, and optionally `Seconds`.
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
 * The `Clock` class creates a DOM element displaying time units (hours, minutes, seconds, etc.)
 * and updates them in real-time using `requestAnimationFrame`. It supports both regular clocks
 * and countdown timers, with customizable labels and optional completion callbacks.
 *
 * @remarks
 * - Uses `CountdownTracker` instances to render and update each time unit.
 * - Supports throttled updates for performance.
 * - Handles countdown completion and resource cleanup.
 *
 * @example
 * ```typescript
 * const clock = new Clock({
 *   countdown: "2024-12-31T23:59:59",
 *   callback: () => alert("Countdown finished!"),
 *   twelveHour: true,
 *   showSeconds: true,
 *   slotLabels: { Hours: "H", Minutes: "M", Seconds: "S" }
 * });
 * document.body.appendChild(clock.el);
 * ```
 *
 * @public
 */
class Clock {
  readonly el: HTMLElement;
  private readonly trackers: Partial<Record<TimeUnit, CountdownTracker>> = {};
  private readonly animationTimeouts: Map<string, number> = new Map();
  private readonly showSeconds: boolean;
  private animationFrameId: number | null = null;
  private isDestroyed = false;
  private frameCounter = 0;

  constructor(options: ClockOptions = {}) {
    const {
      countdown: countdownInput,
      callback,
      twelveHour,
      showSeconds,
      slotLabels,
    } = options;

    this.showSeconds = showSeconds ?? false;

    let countdown = "";
    if (typeof countdownInput === "number") {
      countdown = new Date(countdownInput).toISOString();
    } else if (typeof countdownInput === "string") {
      countdown = new Date(Date.parse(countdownInput)).toISOString();
    }

    // Extract update function logic for better readability
    function createUpdateFn(
      countdown: string,
      twelveHour?: boolean,
      showSeconds?: boolean
    ): (countdown?: string) => TimeObject {
      if (countdown) {
        return (endtime?: string) =>
          getTimeRemaining(endtime || countdown, showSeconds);
      } else {
        return () => getTime(twelveHour, showSeconds);
      }
    }

    const updateFn: (countdown?: string) => TimeObject = createUpdateFn(
      countdown,
      twelveHour,
      showSeconds
    );

    this.el = document.createElement("div");
    this.el.className = "wheel-clock";

    // Initialize trackers
    const initialTime = updateFn(countdown);
    this.createTrackers(initialTime, slotLabels, countdown);

    // Start update loop with better performance
    this.startUpdateLoop(updateFn, countdown, callback);
  }

  /**
   * Creates and appends countdown tracker elements for each time unit in the provided `timeObject`.
   *
   * Iterates over the entries of `timeObject`, skipping the "Total" key, and for each remaining key-value pair:
   * - Instantiates a `CountdownTracker` for the time unit.
   * - Stores the tracker in the `this.trackers` map.
   * - Appends the tracker's element to a document fragment.
   *
   * Finally, appends the fragment containing all tracker elements to the main element (`this.el`).
   *
   * @param timeObject - An object containing time units as keys and their corresponding numeric values.
   * @param slotLabels - An optional object containing custom labels for each time unit.
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
      });
      this.trackers[key as TimeUnit] = tracker;
      fragment.appendChild(tracker.el);
    }

    this.el.appendChild(fragment);
  }

  /**
   * Starts the update loop for the clock, using requestAnimationFrame for smooth updates.
   * The loop throttles updates for performance and checks for countdown completion.
   *
   * @param updateFn - A function that returns a `TimeObject` representing the current time state.
   *                   Optionally accepts a countdown string.
   * @param countdown - A string representing the countdown target or value.
   * @param callback - An optional callback function to be invoked when the countdown completes.
   */
  private startUpdateLoop(
    updateFn: (countdown?: string) => TimeObject,
    countdown: string,
    callback?: () => void
  ): void {
    const update = () => {
      // Safety check for destroyed instance
      if (this.isDestroyed) return;

      this.animationFrameId = requestAnimationFrame(update);

      // Throttle updates for better performance
      if (++this.frameCounter % CONSTANTS.UPDATE_THROTTLE !== 0) return;

      const timeObject = updateFn(countdown);

      // Check for countdown completion
      if (countdown && this.shouldCompleteCountdown(timeObject)) {
        this.handleCountdownComplete(callback);
        return;
      }

      // Update all trackers
      this.updateTrackers(timeObject);
    };

    // Use managed timeout for initial delay
    const initialTimeoutId = window.setTimeout(() => {
      if (!this.isDestroyed) {
        this.animationTimeouts.delete("initial");
        update();
      }
    }, CONSTANTS.INITIAL_DELAY);

    this.animationTimeouts.set("initial", initialTimeoutId);
  }

  /**
   * Determines whether the countdown should be considered complete based on the provided time object.
   *
   * - If `showSeconds` is enabled, the countdown completes when the total time is less than 0 milliseconds.
   * - If `showSeconds` is disabled, the countdown completes 1 minute early (when the total time is less than 60,000 milliseconds).
   *
   * @param timeObject - An object containing the total remaining time in milliseconds.
   * @returns `true` if the countdown should be completed, otherwise `false`.
   */
  private shouldCompleteCountdown(timeObject: TimeObject): boolean {
    const totalMs = timeObject.Total as number;

    // If showSeconds is enabled, complete when Total < 0 (normal behavior)
    if (this.showSeconds) {
      return totalMs < 0;
    }

    // If showSeconds is false, complete 1 minute early (when Total < 60000ms)
    return totalMs < 60000; // 60 seconds * 1000ms = 60000ms
  }

  /**
   * Handles the completion of the countdown by performing cleanup actions.
   *
   * This method cancels any ongoing animation frame, resets all trackers to zero,
   * and optionally executes a provided callback function.
   *
   * @param callback - An optional function to be executed after the countdown is complete and cleanup is done.
   */
  private handleCountdownComplete(callback?: () => void): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Reset all trackers to zero
    Object.values(this.trackers).forEach((tracker) => tracker.update(0));

    // Execute callback if provided
    callback?.();
  }

  /**
   * Updates the values of the trackers based on the provided time object.
   *
   * Iterates over each property in the `timeObject`, skipping the "Total" key.
   * For each key, if a corresponding tracker exists and the value is a number,
   * the tracker's `update` method is called with the value.
   *
   * @param timeObject - An object containing time-related properties and their numeric values.
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
   * Cleans up resources used by the instance.
   * Cancels any ongoing animation frame, destroys all trackers,
   * clears the trackers object, and removes the associated DOM element.
   */
  destroy(): void {
    this.isDestroyed = true;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Clear all managed timeouts
    this.animationTimeouts.forEach((id) => clearTimeout(id));
    this.animationTimeouts.clear();

    Object.values(this.trackers).forEach((tracker) => tracker.destroy());
    // Clear the trackers object
    Object.keys(this.trackers).forEach(
      (key) => delete this.trackers[key as TimeUnit]
    );
    this.el.remove();
  }
}

/**
 * Exports the `Clock` and `CountdownTracker` classes or objects for external usage.
 *
 * @module
 * @exports Clock
 * @exports CountdownTracker
 */
export { Clock, CountdownTracker };

/**
 * Exports the types `ClockOptions` and `TimeObject` for use in other modules.
 *
 * @remarks
 * These types are likely used to configure and represent time-related data within the clock module.
 *
 * @see ClockOptions
 * @see TimeObject
 */
export type { ClockOptions, TimeObject };

// Make classes globally available for browser use (when not using modules)
if (typeof globalThis !== "undefined") {
  (globalThis as any).Clock = Clock;
  (globalThis as any).CountdownTracker = CountdownTracker;
}

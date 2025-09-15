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

/**
 * Represents a visual countdown tracker for a specific time unit (e.g., hours, minutes, seconds)
 * using animated number wheels. Handles DOM creation, digit parsing, animation direction, and
 * efficient updates for smooth transitions between values.
 *
 * @remarks
 * - Designed for use in a wheel-style clock/countdown UI.
 * - Handles both increasing and decreasing transitions, including rollovers (e.g., 59 → 00).
 * - Manages animation classes and timeouts for each wheel to ensure proper cleanup and memory management.
 *
 * @example
 * ```typescript
 * const tracker = new CountdownTracker("Seconds", 59);
 * document.body.appendChild(tracker.el);
 * tracker.update(0); // Animates from 59 to 00
 * ```
 *
 * @public
 */
class CountdownTracker {
  readonly el: HTMLElement;
  private currentValue: number;
  private readonly tensWheel: HTMLElement;
  private readonly onesWheel: HTMLElement;
  private readonly label: TimeUnit;
  private readonly animationTimeouts: Map<HTMLElement, number> = new Map();

  constructor(
    label: TimeUnit,
    value: string | number,
    slotLabels?: SlotLabels
  ) {
    this.label = label;
    const numValue = Number(value);
    this.currentValue = isNaN(numValue) ? 0 : numValue;

    // Create DOM structure efficiently
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
    const tensWheel = this.createNumberWheel("tens", label);
    const onesWheel = this.createNumberWheel("ones", label);

    // Create containers
    const wheelsPair = document.createElement("div");
    wheelsPair.className = "wheel-clock__pair";

    const tensContainer = this.createWheelContainer("tens", tensWheel);
    const onesContainer = this.createWheelContainer("ones", onesWheel);

    wheelsPair.append(tensContainer, onesContainer);

    const slot = document.createElement("div");
    slot.className = "wheel-clock__slot";
    slot.textContent = slotLabels?.[label] || label;

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
   * @param label - The label representing the time unit for this wheel.
   * @returns The HTMLElement representing the number wheel.
   */
  private createNumberWheel(type: WheelType, label: TimeUnit): HTMLElement {
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
   * Determines whether a time unit (seconds, minutes, or hours) has cycled from its maximum value back to zero,
   * or from zero to its maximum value during countdown.
   *
   * For "Seconds" and "Minutes", this checks transitions between 59 and 0.
   * For "Hours", this checks transitions between 23 and 0.
   *
   * @param oldValue - The previous value of the time unit.
   * @param newValue - The new value of the time unit.
   * @returns An object with `isCycle: boolean` and `isForward: boolean`, or null if no cycle detected.
   */
  private getTimeUnitCycleInfo(
    oldValue: number,
    newValue: number
  ): { isCycle: boolean; isForward: boolean } | null {
    // Check if this is a time unit cycling scenario
    if (this.label === "Seconds" || this.label === "Minutes") {
      // Forward cycle: 59->0 (normal time progression)
      if (oldValue === 59 && newValue === 0) {
        return { isCycle: true, isForward: true };
      }
      // Backward cycle: 0->59 (countdown scenario)
      if (oldValue === 0 && newValue === 59) {
        return { isCycle: true, isForward: false };
      }
    }
    if (this.label === "Hours") {
      // Forward cycle: 23->0 (normal time progression)
      if (oldValue === 23 && newValue === 0) {
        return { isCycle: true, isForward: true };
      }
      // Backward cycle: 0->23 (countdown scenario)
      if (oldValue === 0 && newValue === 23) {
        return { isCycle: true, isForward: false };
      }
    }
    return null;
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
   * Updates the visual state and animation of a wheel element to reflect a value change.
   *
   * This method determines the direction of the value change (increasing or decreasing),
   * updates the wheel's data attributes, manages animation classes, and ensures that
   * any previous animation timeouts are cleared before starting a new animation.
   * After the animation duration, it cleans up the animation classes.
   *
   * @param wheel - The HTMLElement representing the wheel to update.
   * @param type - The type of digit to update ("tens" or "ones").
   * @param oldValue - The previous value displayed by the wheel.
   * @param newValue - The new value to display on the wheel.
   */
  private updateWheel(
    wheel: HTMLElement,
    type: WheelType,
    oldValue: number,
    newValue: number
  ): void {
    const formattedOld = this.formatValue(oldValue);
    const formattedNew = this.formatValue(newValue);
    const [oldTens, oldOnes] = this.parseDigits(formattedOld);
    const [newTens, newOnes] = this.parseDigits(formattedNew);

    const oldDigit = type === "tens" ? oldTens : oldOnes;
    const newDigit = type === "tens" ? newTens : newOnes;

    if (oldDigit === newDigit) return;

    const isIncreasing = this.getWheelDirection(
      oldDigit,
      newDigit,
      oldValue,
      newValue
    );

    // Update data attribute with new target value
    this.setWheelDataValue(wheel, type, newValue);

    // Clear any existing timeouts for this specific wheel
    this.clearAnimationTimeout(wheel);

    // Add animation class based on direction
    wheel.classList.remove("wheel-increasing", "wheel-decreasing");
    wheel.classList.add(isIncreasing ? "wheel-increasing" : "wheel-decreasing");

    // Clean up animation classes after animation completes
    const timeoutId = window.setTimeout(() => {
      wheel.classList.remove("wheel-increasing", "wheel-decreasing");
      this.animationTimeouts.delete(wheel);
    }, CONSTANTS.ANIMATION_DURATION);

    this.animationTimeouts.set(wheel, timeoutId);
  }

  /**
   * Determines the direction of a wheel animation based on digit and value changes.
   *
   * Returns `true` if the wheel should move forward (increasing), or `false` if it should move backward (decreasing).
   * Handles special cases for time unit cycling (e.g., 59 → 00), standard digit rollovers (e.g., 9 → 0 or 0 → 9),
   * and general digit changes.
   *
   * @param oldDigit - The previous digit value (0-9) being displayed.
   * @param newDigit - The new digit value (0-9) to be displayed.
   * @param oldValue - The previous overall value (e.g., hour, minute, or second).
   * @param newValue - The new overall value after the change.
   * @returns `true` if the wheel direction is forward (increasing), `false` if backward (decreasing).
   */
  private getWheelDirection(
    oldDigit: number,
    newDigit: number,
    oldValue: number,
    newValue: number
  ): boolean {
    // Check for time unit cycling first (this takes precedence)
    const cycleInfo = this.getTimeUnitCycleInfo(oldValue, newValue);
    if (cycleInfo?.isCycle) {
      return cycleInfo.isForward;
    }

    // Handle rollover cases
    const rolloverResult = this.handleRolloverCases(
      oldDigit,
      newDigit,
      oldValue,
      newValue
    );
    if (rolloverResult !== null) {
      return rolloverResult;
    }

    // For countdown scenarios, prioritize overall value direction
    return this.getDirectionBasedOnValue(
      newValue,
      oldValue,
      newDigit,
      oldDigit
    );
  }

  /**
   * Handles rollover cases for wheel direction determination.
   * Returns true for forward rollover, false for backward rollover, or null if no rollover detected.
   */
  private handleRolloverCases(
    oldDigit: number,
    newDigit: number,
    oldValue: number,
    newValue: number
  ): boolean | null {
    // Standard rollover detection for non-time-unit cases
    let isForwardRollover =
      oldDigit === 9 && newDigit === 0 && newValue > oldValue;
    let isBackwardRollover =
      oldDigit === 0 && newDigit === 9 && newValue < oldValue;

    // General digit rollovers based on overall value direction
    if (!isForwardRollover && !isBackwardRollover) {
      if (oldDigit === 9 && newDigit === 0) {
        // 9->0 rollover: check if overall value is increasing
        isForwardRollover = newValue >= oldValue;
      } else if (oldDigit === 0 && newDigit === 9) {
        // 0->9 rollover: check if overall value is decreasing
        isBackwardRollover = newValue <= oldValue;
      }
    }

    if (isForwardRollover) {
      return true;
    }
    if (isBackwardRollover) {
      return false;
    }
    return null; // No rollover detected
  }

  /**
   * Determines direction based on overall value change, falling back to digit comparison.
   */
  private getDirectionBasedOnValue(
    newValue: number,
    oldValue: number,
    newDigit: number,
    oldDigit: number
  ): boolean {
    // This handles cases like going to "00" during countdown
    if (newValue < oldValue) {
      return false; // Animate backward when overall value is decreasing (countdown)
    }
    if (newValue > oldValue) {
      return true; // Animate forward when overall value is increasing
    }
    // If overall values are equal, fall back to digit comparison
    return newDigit > oldDigit;
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

  // Public update method
  /**
   * Updates the current value of the clock and triggers the wheel animations if the value has changed.
   *
   * Converts the input value to a number and compares it with the current value.
   * If the value has changed, it stores the previous value in data attributes for animation purposes,
   * updates the current value, and calls `updateWheel` for both the tens and ones wheels.
   *
   * @param val - The new value to update the clock with. Can be a string or number.
   */
  update = (val: string | number): void => {
    const newValue = Number(val);

    if (newValue !== this.currentValue) {
      const oldValue = this.currentValue;

      // Store old value in data attributes for animation
      if (oldValue >= 0) {
        const formattedOld = this.formatValue(oldValue);
        const [oldTens, oldOnes] = this.parseDigits(formattedOld);

        // Set previous values for roll animation
        this.tensWheel.setAttribute("data-previous", oldTens.toString());
        this.onesWheel.setAttribute("data-previous", oldOnes.toString());
      }

      this.currentValue = newValue;

      // Update both wheels
      this.updateWheel(this.tensWheel, "tens", oldValue, newValue);
      this.updateWheel(this.onesWheel, "ones", oldValue, newValue);
    }
  };

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
 * Represents a wheel-style clock or countdown timer component.
 *
 * The `Clock` class creates a visual clock or countdown timer using DOM elements,
 * updating its display with animation frames for smooth performance. It supports
 * both standard clocks and countdowns to a specific date/time, with customizable
 * options for 12-hour/24-hour format and whether to show seconds.
 *
 * @example
 * // Create a standard clock
 * const clock = new Clock({ twelveHour: true, showSeconds: false });
 * document.body.appendChild(clock.el);
 *
 * @example
 * // Create a countdown timer
 * const countdown = new Clock({
 *   countdown: "2024-12-31T23:59:59Z",
 *   callback: () => alert("Countdown finished!"),
 * });
 * document.body.appendChild(countdown.el);
 *
 * @remarks
 * - Call {@link destroy} to clean up resources and remove the clock from the DOM.
 * - The clock uses requestAnimationFrame for efficient updates and throttles updates for performance.
 *
 * @param options - Configuration options for the clock or countdown.
 * @see {@link destroy} for cleanup.
 */
class Clock {
  readonly el: HTMLElement;
  private readonly trackers: Partial<Record<TimeUnit, CountdownTracker>> = {};
  private animationFrameId: number | null = null;
  private frameCounter = 0;

  constructor(options: ClockOptions = {}) {
    const {
      countdown: countdownInput,
      callback,
      twelveHour,
      showSeconds,
      slotLabels,
    } = options;

    const countdown = countdownInput
      ? new Date(Date.parse(countdownInput)).toString()
      : "";

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
    this.createTrackers(initialTime, slotLabels);

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
    slotLabels?: SlotLabels
  ): void {
    const fragment = document.createDocumentFragment();

    for (const [key, value] of Object.entries(timeObject)) {
      if (key === "Total") continue;

      const tracker = new CountdownTracker(
        key as TimeUnit,
        value as number,
        slotLabels
      );
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
      this.animationFrameId = requestAnimationFrame(update);

      // Throttle updates for better performance
      if (++this.frameCounter % CONSTANTS.UPDATE_THROTTLE !== 0) return;

      const timeObject = updateFn(countdown);

      // Check for countdown completion
      if (countdown && (timeObject.Total as number) < 0) {
        this.handleCountdownComplete(callback);
        return;
      }

      // Update all trackers
      this.updateTrackers(timeObject);
    };

    // Start with initial delay
    setTimeout(update, CONSTANTS.INITIAL_DELAY);
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
   * Cleans up resources used by the clock instance.
   *
    Object.values(this.trackers).forEach((tracker) => tracker.destroy());
    // Clear the trackers object
    (this.trackers as Record<string, CountdownTracker>) = {};
    this.el.remove();
   * This method clears any active animation timeouts and removes the associated
   * DOM element from the document. After calling this method, the instance should
   * not be used further.
   */
  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

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

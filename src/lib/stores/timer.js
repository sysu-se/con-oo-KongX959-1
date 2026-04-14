/**
 * Timer Store - 游戏计时
 */

import { writable } from 'svelte/store';

export const timer = writable({
    seconds: 0,
    paused: false,
    started: false,
});

/**
 * Start timer
 */
export function startTimer() {
    timer.update(t => ({ ...t, started: true, paused: false }));
}

/**
 * Pause timer
 */
export function pauseTimer() {
    timer.update(t => ({ ...t, paused: true }));
}

/**
 * Resume timer
 */
export function resumeTimer() {
    timer.update(t => ({ ...t, paused: false }));
}

/**
 * Set elapsed seconds
 */
export function setSeconds(seconds) {
    timer.update(t => ({ ...t, seconds }));
}

/**
 * Reset timer
 */
export function resetTimer() {
    timer.set({
        seconds: 0,
        paused: false,
        started: false,
    });
}

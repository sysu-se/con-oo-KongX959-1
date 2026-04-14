/**
 * Keyboard Store - 键盘事件状态
 */
import { writable } from 'svelte/store';

export const keyboardDisabled = writable(false);

/**
 * Disable keyboard
 */
export function disable() {
    keyboardDisabled.set(true);
}

/**
 * Enable keyboard
 */
export function enable() {
    keyboardDisabled.set(false);
}

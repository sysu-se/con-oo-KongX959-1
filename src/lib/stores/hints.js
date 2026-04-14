/**
 * Hints Store - 可用提示数量
 */
import { writable } from 'svelte/store';

export const hints = writable(3);

/**
 * Decrement hints
 */
export function useHint() {
    hints.update((h) => Math.max(0, h - 1));
}

/**
 * Reset hints
 */
export function resetHints() {
    hints.set(3);
}

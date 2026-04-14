/**
 * Notes Store - 是否启用笔记模式
 */
import { writable } from 'svelte/store';

export const notes = writable(false);

/**
 * Toggle notes mode
 */
export function toggle() {
    notes.update((n) => !n);
}

/**
 * Set notes mode
 */
export function set(value) {
    notes.set(value);
}

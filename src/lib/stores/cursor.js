/**
 * Cursor Store - 当前选中的单元格位置
 */

import { writable } from 'svelte/store';

export const cursor = writable({
    row: 0,
    col: 0,
});

/**
 * Set cursor position
 */
export function setCursor(row, col) {
    cursor.set({ row, col });
}

/**
 * Grid Store - 用户编辑的网格状态
 */
import { writable } from 'svelte/store';

const initialGrid = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => 0)
);

export const userGrid = writable(initialGrid);

// 无效单元格（产生冲突的）
export const invalidCells = writable([]);

/**
 * Apply hint to a cell
 */
export function applyHint(cursor) {
    userGrid.update((grid) => {
        const newGrid = grid.map((row) => [...row]);
        // Hint logic would go here
        return newGrid;
    });
}

/**
 * Set invalid cells
 */
export function setInvalidCells(cells) {
    invalidCells.set(cells);
}

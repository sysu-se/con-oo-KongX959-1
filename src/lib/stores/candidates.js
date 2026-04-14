/**
 * Candidates Store - 候选数字（可能的数字）
 */

import { writable } from 'svelte/store';

export const candidates = writable(
    Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []))
);

/**
 * Update candidates for a cell
 */
export function setCellCandidates(row, col, nums) {
    candidates.update(cands => {
        const newCands = cands.map(r => [...r]);
        newCands[row][col] = [...nums];
        return newCands;
    });
}

/**
 * Reset all candidates
 */
export function resetCandidates() {
    candidates.set(
        Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []))
    );
}

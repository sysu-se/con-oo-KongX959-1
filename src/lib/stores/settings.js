/**
 * Settings Store - 游戏设置
 */
import { writable } from 'svelte/store';

export const settings = writable({
    hintsLimited: true,
    notesEnabled: true,
    darkMode: false,
});

/**
 * Update a setting
 */
export function updateSetting(key, value) {
    settings.update((s) => ({ ...s, [key]: value }));
}

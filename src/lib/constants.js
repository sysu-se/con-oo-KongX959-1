/**
 * 应用常量
 */

// 数独网格大小
export const SUDOKU_SIZE = 9;
export const BOX_SIZE = 3;

// 模态常量
export const MODAL_NONE = null;
export const MODAL_DURATION = 300;
export const DROPDOWN_DURATION = 200;

// 难度级别
export const DIFFICULTIES = {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    insane: 'Insane',
};

export const DIFFICULTY_CUSTOM = 'custom';

// 提示相关
export const MAX_HINTS = 3;

// 游戏结束
export const GAME_OVER_CELEBRATIONS = [
    '🎉',
    '🎊',
    '✨',
    '🌟',
    '👏',
    '🏆',
];

// 候选数字坐标（用于候选数字网格渲染）
export const CANDIDATE_COORDS = {};
for (let i = 1; i <= 9; i++) {
    const row = Math.floor((i - 1) / 3);
    const col = (i - 1) % 3;
    CANDIDATE_COORDS[i] = { row, col };
}

// 基础 URL（用于分享）
export const BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

// 数独的初始化网格（用作示例）
export const INITIAL_GRID = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => 0)
);

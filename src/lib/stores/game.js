/**
 * gameStore 适配层 - 桥接 Game 对象和 Svelte 响应式
 * 
 * 职责：
 * 1. 内部持有 Game 实例
 * 2. 对外暴露可被 Svelte 消费的响应式状态（writable store）
 * 3. 对外暴露 UI 可调用的方法
 * 4. 确保每次 Game 变化后同步到响应式 store
 * 
 * 关键原理：
 * - Svelte 的 $ 自动订阅 store，但前提是 store 值真正改变（引用变化）
 * - 直接改 grid[0][0] 不会触发更新，因为数组引用未变
 * - 必须调用 store.set(newGrid) 替换整个引用，Svelte 才能检测到
 * - updateStores() 方法确保每次 Game 操作都同步到 store
 */

import { writable, derived } from 'svelte/store';
import { createGame, createSudoku } from '../../domain/index.js';

// ============================================================================
// 响应式状态（Store）
// ============================================================================

// 当前网格 - 由 gameStore 操作后更新
export const grid = writable([]);

// 游戏是否胜利
export const gameWon = writable(false);

// 撤销/重做可用状态
export const canUndo = writable(false);
export const canRedo = writable(false);

// 页面输入的网格（UI 编辑状态）- 保持不变
export const userGrid = writable(
    Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0))
);

// ============================================================================
// 内部状态
// ============================================================================

let gameInstance = null;
let paused = false;

// ============================================================================
// 初始化函数
// ============================================================================

/**
 * 初始化游戏
 * @param {Sudoku} sudoku - Sudoku 实例
 * @param {number[][]} userInitialGrid - 用户编辑的初始网格（可选）
 */
export function initGame(sudoku, userInitialGrid = null) {
    gameInstance = createGame({ sudoku });

    // 初始化 userGrid
    if (userInitialGrid) {
        userGrid.set(userInitialGrid.map(row => [...row]));
    } else {
        userGrid.set(sudoku.getGrid());
    }

    // 同步状态到 store
    updateStores();
}

// ============================================================================
// 操作方法（UI 调用这些方法）
// ============================================================================

/**
 * 进行一次猜测
 * 这是 UI 调用的主要方法
 * @param {Object} move - {row, col, value}
 */
export function guess(move) {
    if (!gameInstance) {
        console.warn('Game not initialized');
        return;
    }

    // 从 userGrid 同步当前值到 Game
    const currentUserGrid = get_userGrid();
    currentUserGrid[move.row][move.col] = move.value;
    userGrid.set(currentUserGrid.map(row => [...row])); // 触发 userGrid 更新

    // 在 Game 中执行操作
    gameInstance.guess(move);

    // 同步状态到所有响应式 store
    updateStores();
}

/**
 * 撤销
 */
export function undo() {
    if (!gameInstance || !gameInstance.canUndo()) {
        return;
    }

    gameInstance.undo();
    updateStores();
}

/**
 * 重做
 */
export function redo() {
    if (!gameInstance || !gameInstance.canRedo()) {
        return;
    }

    gameInstance.redo();
    updateStores();
}

/**
 * 获取当前 Game 实例（仅限内部使用）
 */
export function getGameInstance() {
    return gameInstance;
}

// ============================================================================
// 内部同步函数
// ============================================================================

/**
 * 核心同步函数：从 Game 同步状态到所有响应式 store
 * 
 * 这是关键！每次 Game 变化后都要调用这个函数，
 * 通过 store.set() 替换引用，让 Svelte 检测到变化
 * 
 * @private
 */
function updateStores() {
    if (!gameInstance) return;

    const sudoku = gameInstance.getSudoku();
    const currentGrid = sudoku.getGrid();

    // 同步当前 grid
    grid.set(currentGrid);

    // 同步 undo/redo 状态
    canUndo.set(gameInstance.canUndo());
    canRedo.set(gameInstance.canRedo());

    // 检查胜利：所有单元格都非零
    const isWon = currentGrid.every(row => row.every(cell => cell !== 0));
    gameWon.set(isWon);
}

/**
 * 获取当前 userGrid 的值
 * 用于读取 store 的当前值（subscribe 回调中获得）
 * @private
 */
function get_userGrid() {
    let value = [];
    userGrid.subscribe(v => { value = v; })();
    return value;
}

/**
 * 获取当前 grid 的值
 * @private
 */
function get_grid() {
    let value = [];
    grid.subscribe(v => { value = v; })();
    return value;
}

// ============================================================================
// 游戏状态查询
// ============================================================================

/**
 * 获取当前网格数据
 * @returns {number[][]}
 */
export function getCurrentGrid() {
    return get_grid();
}

/**
 * 获取当前游戏的 JSON 序列化
 * @returns {Object}
 */
export function getGameJSON() {
    if (!gameInstance) return null;
    return gameInstance.toJSON();
}

/**
 * 从 JSON 恢复游戏状态
 * @param {Object} json
 */
export function restoreFromJSON(json) {
    if (json && json.sudoku) {
        const sudoku = createSudoku(json.sudoku.grid);
        initGame(sudoku, json.sudoku.grid);
    }
}

/**
 * 暂停游戏
 */
export function pause() {
    paused = true;
}

/**
 * 恢复游戏
 */
export function resume() {
    paused = false;
}

/**
 * 获取暂停状态
 */
export function isPaused() {
    return paused;
}

/**
 * Domain API 导出
 * 必须导出的 4 个 factory 函数（按测试合约）
 */

export { Sudoku } from './Sudoku.js';
export { Game } from './Game.js';

import { Sudoku } from './Sudoku.js';
import { Game } from './Game.js';

/**
 * 工厂函数 1: 创建 Sudoku
 * @param {number[][]} grid - 9×9 网格
 * @returns {Sudoku}
 */
export function createSudoku(grid) {
    return new Sudoku(grid);
}

/**
 * 工厂函数 2: 从 JSON 创建 Sudoku
 * @param {Object} json - {grid: number[][]}
 * @returns {Sudoku}
 */
export function createSudokuFromJSON(json) {
    return new Sudoku(json.grid);
}

/**
 * 工厂函数 3: 创建 Game
 * @param {Object} options - {sudoku}
 * @returns {Game}
 */
export function createGame({ sudoku }) {
    return new Game({ sudoku });
}

/**
 * 工厂函数 4: 从 JSON 创建 Game（恢复历史）
 * @param {Object} json - {sudoku, undoStack, redoStack}
 * @returns {Game}
 */
export function createGameFromJSON(json) {
    const sudoku = new Sudoku(json.sudoku.grid);
    const game = new Game({ sudoku });

    // 恢复历史栈
    if (json.undoStack) {
        game.undoStack = json.undoStack;
    }
    if (json.redoStack) {
        game.redoStack = json.redoStack;
    }

    return game;
}

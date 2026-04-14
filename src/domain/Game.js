import { Sudoku } from './Sudoku.js';

/**
 * Game 类 - 管理 Sudoku + 历史记录，支持 undo/redo
 * 核心职责：
 * - 持有当前 Sudoku 实例
 * - 维护两个快照栈：undo 和 redo
 * - 提供 guess/undo/redo 接口
 * 
 * 快照方案：每次 guess 前保存当前状态快照到 undo 栈，
 * 然后执行操作。Undo 时从栈恢复快照。
 */

export class Game {
    /**
     * @param {Object} options
     * @param {Sudoku} options.sudoku - 初始 Sudoku 实例
     */
    constructor({ sudoku }) {
        if (!sudoku) {
            throw new Error('Game requires a sudoku instance');
        }
        this.sudoku = sudoku;

        // 快照栈：每个元素是 JSON 格式的 Sudoku 状态
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * 获取当前 Sudoku 实例
     * @returns {Sudoku}
     */
    getSudoku() {
        return this.sudoku;
    }

    /**
     * 执行一次猜测
     * 流程：
     * 1. 如果 redo 栈非空，清空它（新操作后 redo 历史失效）
     * 2. 保存当前状态快照到 undo 栈
     * 3. 在当前 Sudoku 上执行 guess
     * 
     * @param {Object} move - {row, col, value}
     */
    guess(move) {
        // 新操作后清除 redo 历史
        if (this.redoStack.length > 0) {
            this.redoStack = [];
        }

        // 保存当前快照到 undo 栈
        this.undoStack.push(this.sudoku.toJSON());

        // 执行操作
        this.sudoku.guess(move);
    }

    /**
     * 撤销上一步操作
     * 流程：
     * 1. 从 undo 栈弹出快照
     * 2. 当前状态推入 redo 栈
     * 3. 从快照恢复状态
     */
    undo() {
        if (!this.canUndo()) {
            throw new Error('Cannot undo: undo stack is empty');
        }

        // 当前状态保存到 redo 栈
        this.redoStack.push(this.sudoku.toJSON());

        // 从 undo 栈恢复
        const snapshot = this.undoStack.pop();
        this.sudoku = new Sudoku(snapshot.grid);
    }

    /**
     * 重做上一步撤销的操作
     * 流程：
     * 1. 从 redo 栈弹出快照
     * 2. 当前状态推入 undo 栈
     * 3. 从快照恢复状态
     */
    redo() {
        if (!this.canRedo()) {
            throw new Error('Cannot redo: redo stack is empty');
        }

        // 当前状态保存到 undo 栈
        this.undoStack.push(this.sudoku.toJSON());

        // 从 redo 栈恢复
        const snapshot = this.redoStack.pop();
        this.sudoku = new Sudoku(snapshot.grid);
    }

    /**
     * 检查是否可执行 undo
     * @returns {boolean}
     */
    canUndo() {
        return this.undoStack.length > 0;
    }

    /**
     * 检查是否可执行 redo
     * @returns {boolean}
     */
    canRedo() {
        return this.redoStack.length > 0;
    }

    /**
     * 序列化当前游戏状态（包括历史）
     * @returns {Object}
     */
    toJSON() {
        return {
            sudoku: this.sudoku.toJSON(),
            undoStack: this.undoStack,
            redoStack: this.redoStack,
        };
    }
}

/**
 * Sudoku 类 - 持有当前 grid 数据，提供 guess/clone/toJSON 接口
 * 核心职责：
 * - 维护 9×9 数字网格（0表示空）
 * - 提供防御性拷贝确保内部数据安全
 * - 支持操作（guess）和序列化（toJSON）
 */

export class Sudoku {
    /**
     * @param {number[][]} grid - 9×9 二维数组，0表示空单元格
     */
    constructor(grid) {
        // 防御性拷贝输入 grid，确保内部不受外界修改影响
        this.grid = this._deepCloneGrid(grid);
    }

    /**
     * 获取当前网格的拷贝（防御性拷贝）
     * @returns {number[][]} 9×9 二维数组
     */
    getGrid() {
        return this._deepCloneGrid(this.grid);
    }

    /**
     * 进行一次猜测操作：在指定单元格输入数字
     * @param {Object} move - {row, col, value}
     * @param {number} move.row - 行索引 (0-8)
     * @param {number} move.col - 列索引 (0-8)
     * @param {number} move.value - 输入值 (0-9, 0表示清空)
     */
    guess({ row, col, value }) {
        if (row < 0 || row > 8 || col < 0 || col > 8) {
            throw new Error(`Invalid row/col: ${row}, ${col}`);
        }
        if (value < 0 || value > 9) {
            throw new Error(`Invalid value: ${value}`);
        }
        this.grid[row][col] = value;
    }

    /**
     * 深拷贝当前 Sudoku 实例
     * 关键：嵌套数组也必须深拷贝，不能共享引用
     * @returns {Sudoku} 新的独立 Sudoku 实例
     */
    clone() {
        const clonedGrid = this._deepCloneGrid(this.grid);
        return new Sudoku(clonedGrid);
    }

    /**
     * 序列化为 JSON 对象
     * @returns {Object} {grid: number[][]}
     */
    toJSON() {
        return {
            grid: this._deepCloneGrid(this.grid),
        };
    }

    /**
     * 字符串表示
     * @returns {string}
     */
    toString() {
        return this.grid
            .map(row => row.map(cell => cell === 0 ? '.' : cell).join(' '))
            .join('\n');
    }

    /**
     * 内部方法：深拷贝二维数组
     * 必须拷贝嵌套数组，不能只拷贝外层数组
     * @private
     * @param {number[][]} grid
     * @returns {number[][]}
     */
    _deepCloneGrid(grid) {
        return grid.map(row => [...row]);
    }
}

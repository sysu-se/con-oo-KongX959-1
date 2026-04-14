/**
 * Game initialization utilities
 * 这些函数在 Welcome modal 中调用以启动新游戏
 */

import * as gameStore from './game.js';
import { createSudoku } from '../domain/index.js';
import { difficulty } from './difficulty.js';

// 导入谜题生成器
import { generateDifficulty } from 'fake-sudoku-puzzle-generator';

/**
 * 开始新游戏 - 根据难度生成新谜题
 * @param {string} diff - 难度级别 ('easy', 'medium', 'hard')
 */
export function startNew(diff = 'hard') {
    // 生成一个新的谜题网格
    const puzzleArray = generateDifficulty(diff);

    // 转换为 Sudoku 对象
    const sudoku = createSudoku(puzzleArray);

    // 初始化游戏
    gameStore.initGame(sudoku, puzzleArray);

    // 保存难度选择
    difficulty.set(diff);
}

/**
 * 开始自定义游戏 - 从 sencode 加载
 * @param {string} sencode - 谜题代码
 */
export function startCustom(sencode) {
    // TODO: 从 sencode 解码得到网格
    // 暂时使用一个占位符实现
    const puzzleArray = Array(9)
        .fill()
        .map(() => Array(9).fill(0));

    const sudoku = createSudoku(puzzleArray);
    gameStore.initGame(sudoku, puzzleArray);
}

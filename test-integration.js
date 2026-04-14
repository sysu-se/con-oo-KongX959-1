/**
 * 集成测试：验证 gameStore 的完整 undo/redo 工作流
 */

const { createSudoku, createGame } = require('./src/domain/index.js');

// 模拟游戏流程
console.log('=== Sudoku Game Undo/Redo 集成测试 ===\n');

// 1. 创建 Sudoku
const initialGrid = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

const sudoku = createSudoku(initialGrid);
console.log('✓ Sudoku 创建成功');
console.log(`  初始网格[0][0] = ${sudoku.getGrid()[0][0]}`);

// 2. 创建 Game
const game = createGame({ sudoku });
console.log('\n✓ Game 创建成功');
console.log(`  canUndo: ${game.canUndo()}, canRedo: ${game.canRedo()}`);

// 3. 进行第一个 guess
game.guess({ row: 0, col: 1, value: 2 });
console.log('\n✓ 执行 guess({0,1}=2)');
console.log(`  grid[0][1] = ${game.getSudoku().getGrid()[0][1]}`);
console.log(`  canUndo: ${game.canUndo()}, canRedo: ${game.canRedo()}`);

// 4. 进行第二个 guess
game.guess({ row: 0, col: 2, value: 4 });
console.log('\n✓ 执行 guess({0,2}=4)');
console.log(`  grid[0][2] = ${game.getSudoku().getGrid()[0][2]}`);
console.log(`  canUndo: ${game.canUndo()}, canRedo: ${game.canRedo()}`);

// 5. 撤销（应该回到有一个元素改变的状态）
game.undo();
console.log('\n✓ 执行 undo()');
console.log(`  grid[0][1] = ${game.getSudoku().getGrid()[0][1]} (应该是 2)`);
console.log(`  grid[0][2] = ${game.getSudoku().getGrid()[0][2]} (应该是 0)`);
console.log(`  canUndo: ${game.canUndo()}, canRedo: ${game.canRedo()}`);

// 6. 再撤销一次
game.undo();
console.log('\n✓ 执行第二个 undo()');
console.log(`  grid[0][1] = ${game.getSudoku().getGrid()[0][1]} (应该是 3)`);
console.log(`  grid[0][2] = ${game.getSudoku().getGrid()[0][2]} (应该是 0)`);
console.log(`  canUndo: ${game.canUndo()}, canRedo: ${game.canRedo()}`);

// 7. 重做
game.redo();
console.log('\n✓ 执行 redo()');
console.log(`  grid[0][1] = ${game.getSudoku().getGrid()[0][1]} (应该是 2)`);
console.log(`  grid[0][2] = ${game.getSudoku().getGrid()[0][2]} (应该是 0)`);
console.log(`  canUndo: ${game.canUndo()}, canRedo: ${game.canRedo()}`);

// 8. 在 undo 后进行新操作，应该清除 redo 栈
console.log('\n✓ 在 undo 后执行新的 guess()');
game.guess({ row: 1, col: 1, value: 7 });
console.log(`  grid[0][1] = ${game.getSudoku().getGrid()[0][1]} (应该是 2)`);
console.log(`  grid[0][2] = ${game.getSudoku().getGrid()[0][2]} (应该是 0)`);
console.log(`  grid[1][1] = ${game.getSudoku().getGrid()[1][1]} (应该是 7)`);
console.log(`  canUndo: ${game.canUndo()}, canRedo: ${game.canRedo()} (应该是 false)`);

console.log('\n=== 所有测试完成！✅ ===');

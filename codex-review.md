# con-oo-KongX959-1 - Review

## Review 结论

领域层已经有 `Sudoku` / `Game` 的基础雏形，但当前提交没有把它稳定地接入到真实的 Svelte 游戏主流程里。按当前 Rollup alias 配置静态阅读，界面仍然依赖旧 store 契约，渲染、输入、撤销/重做、胜负判定之间没有形成以领域对象为核心的单一真相源，因此这次接入在设计质量和可运行性上都存在明显缺口。

## 总体评价

| 维度 | 评价 |
| --- | --- |
| OOP | fair |
| JS Convention | poor |
| Sudoku Business | poor |
| OOD | poor |

## 缺点

### 1. 棋盘渲染没有真正消费领域对象导出的状态

- 严重程度：core
- 位置：src/components/Board/index.svelte:3-5,40-51; src/lib/stores/game.js:25-32,139-155; src/lib/stores/grid.js:10-13
- 原因：`gameStore` 已经维护了基于 `Game` 的 `grid/userGrid/canUndo/canRedo/gameWon`，但棋盘组件仍从 `@sudoku/stores/grid` 取状态，而不是从 `@sudoku/stores/game` 取由领域对象同步出来的视图状态。更严重的是 `src/lib/stores/grid.js` 并没有导出 `grid`，说明 UI 仍绑定旧接口，领域对象没有成为页面渲染的唯一数据源，这直接违背了作业要求里“界面渲染当前局面必须来自领域对象”的核心目标。

### 2. 用户输入流程没有统一走 `Game` / `Sudoku`，且组件依赖的 store API 与实现不一致

- 严重程度：core
- 位置：src/components/Controls/Keyboard.svelte:10-25,29-73; src/components/Board/Cell.svelte:24-25; src/components/Controls/ActionBar/Actions.svelte:15-30,109-112; src/lib/stores/grid.js:10-24; src/lib/stores/cursor.js:7-16; src/lib/stores/notes.js:6-19; src/lib/stores/game.js:78-118
- 原因：键盘输入仍直接调用 `userGrid.set(...)`，提示仍调用 `userGrid.applyHint(...)`，光标和 notes 也按“带方法的自定义 store”来用；但当前 `src/lib/stores/grid.js`、`cursor.js`、`notes.js` 实际导出的只是普通 writable 或独立函数。也就是说，组件层既没有稳定地调用 `gameStore.guess()`，也没有和实际 store API 对齐。结果不是简单的风格问题，而是输入、提示、选择单元格这些关键流程无法可靠闭环到领域对象上。

### 3. 数独业务规则没有进入领域模型，胜利判定错误

- 严重程度：core
- 位置：src/domain/Sudoku.js:33-40; src/lib/stores/game.js:152-154
- 原因：`Sudoku.guess()` 只校验坐标和值范围，不校验行/列/宫冲突，也没有区分“题目给定数字”和“用户可编辑数字”。与此同时，`gameWon` 只要发现所有格子都非 0 就判定胜利，完全不看是否合法。这样一个填满但冲突很多的棋盘，也会被视为通关，和数独业务语义明显不符。

### 4. `Game` 暴露并持有可变的 `Sudoku` 实例，封装边界过弱

- 严重程度：major
- 位置：src/domain/Game.js:19-24,34-58
- 原因：`Game` 构造时直接保存外部传入的 `Sudoku` 实例，`getSudoku()` 又把内部对象原样暴露出去。任何外部代码只要拿到这个实例，就可以直接调用 `sudoku.guess(...)` 绕过 `Game.guess()`，从而跳过 undo/redo 历史维护。对于需要维护操作历史和不变量的聚合根，这种可变对象泄漏会明显削弱 OOP/OOD 设计。

### 5. 序列化/恢复设计没有真正保持游戏历史，且暴露内部引用

- 严重程度：major
- 位置：src/domain/Game.js:120-124; src/domain/index.js:44-54; src/lib/stores/game.js:194-207
- 原因：`Game.toJSON()` 直接把 `undoStack` / `redoStack` 原样暴露出去，没有做防御性拷贝；`createGameFromJSON()` 也是直接把外部数组赋回实例。更关键的是，Svelte 接入层自己的 `restoreFromJSON()` 并没有使用 `createGameFromJSON()`，只恢复了当前 `sudoku`，历史记录会丢失。这样既破坏封装，也让“可恢复的游戏状态”在 UI 接入层失真。

### 6. 开始新游戏的流程没有完整重置相关 UI 状态

- 严重程度：major
- 位置：src/lib/game.js:17-29,35-43
- 原因：`startNew()` / `startCustom()` 只创建 `Sudoku` 并调用 `initGame()`，再设置难度；但与游戏流程强相关的 `cursor`、`timer`、`hints`、`notes`、`candidates` 等状态都没有被同步重置。即使先不考虑其它接线问题，这个流程本身也容易把上一局的 UI 状态带到下一局，说明 Svelte 层的用例编排还不完整。

### 7. 读取 store 当前值的写法不符合 Svelte 常见惯例

- 严重程度：minor
- 位置：src/lib/stores/game.js:162-175
- 原因：这里通过“立即订阅再立刻取消订阅”的方式读取 `userGrid` / `grid` 当前值，而不是使用 `svelte/store` 的 `get(...)` 辅助函数。功能上未必马上出错，但可读性和惯例性都较差，也让 store 适配层显得比必要更绕。

## 优点

### 1. `Sudoku` 在快照和外表化边界上有基本自觉

- 位置：src/domain/Sudoku.js:13-24,48-60,67-71
- 原因：构造函数、`getGrid()`、`clone()`、`toJSON()` 都做了二维数组的防御性拷贝，`toString()` 也提供了较直接的外表化能力。这至少避免了最常见的“外部直接改内部 grid 引用”的问题。

### 2. Undo/Redo 的快照式实现清晰直接

- 位置：src/domain/Game.js:47-98
- 原因：`guess()` 前入 undo 栈、新操作清空 redo、`undo()` / `redo()` 通过快照恢复，这套流程简单易懂，行为模型也符合大多数用户对撤销/重做的预期。

### 3. 接入层有明确的 adapter 思路

- 位置：src/lib/stores/game.js:131-155
- 原因：`updateStores()` 试图把 `Game` 的变化统一同步到可订阅的 Svelte store，这个方向本身是对的，也比把业务逻辑散落在各个 `.svelte` 组件里更接近本次作业推荐的 Store Adapter 方案。

## 补充说明

- 本次结论完全基于静态阅读，没有运行测试，也没有实际启动 Svelte 页面验证交互。
- Svelte 接入部分是按 `rollup.config.js:71-90` 的 alias 配置静态推断的，因此我将 `src/lib/game.js`、`src/lib/stores/*` 和相关 `.svelte` 组件视为“关联的 Svelte 接入”进行审查。
- 仓库中同时存在 `src/lib/*` 与 `src/node_modules/@sudoku/*` 两套近似实现；如果人为绕过 alias 去使用后者，部分集成结论会变化，但按当前工程配置，真实构建目标应当是 `src/lib/*`。
- 关于“胜利判定错误”“输入没有走领域对象”“恢复历史会丢失”等判断，都是基于源码控制流和导入关系的静态推断，不是基于实际运行结果。

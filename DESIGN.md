# HW1.1 Design Document: 将领域对象接入 Svelte 游戏流程

## 目录

1. [概述](#概述)
2. [领域对象如何被消费](#领域对象如何被消费)
3. [响应式机制说明](#响应式机制说明)
4. [相比 HW1 的改进](#相比-hw1-的改进)
5. [架构图解](#架构图解)
6. [关键设计决策](#关键设计决策)

---

## 概述

本次 HW1.1 的核心目标是**将 HW1 中设计的领域对象（Sudoku / Game）真正接入现有 Svelte 前端**。

### 现状问题（HW1 遗留）
- ✗ 领域对象只在单元测试中可用，UI 中没有真正使用
- ✗ 游戏流程仍然直接操作原始状态数组，没有通过领域对象
- ✗ Undo/Redo 逻辑与领域对象无关，散落在各处

### HW1.1 解决方案
- ✅ 创建 **Store Adapter（gameStore）** 层，作为 View 和 Domain 的桥接
- ✅ 所有 UI 操作必须通过 `gameStore.guess()` 等方法，触发 Game 对象
- ✅ 当 Game 状态变化时，自动同步到响应式 store，UI 自动更新
- ✅ Undo/Redo 由 Game 对象完全管理

---

## 领域对象如何被消费

### 1. 架构分层

```
┌─────────────────────────────────────────────────────┐
│  View Layer (Svelte Components)                    │
│  - Board.svelte, Controls.svelte, ...             │
│  - 订阅 store（$grid, $canUndo, ...）              │
│  - 触发事件，调用 gameStore 方法                    │
└─────────────────────────────┬───────────────────────┘
                              │ 响应式 store
                              ▼
┌──────────────────────────────────────────────────────┐
│  Store Adapter Layer (gameStore)                   │
│  - 持有 Game 实例                                   │
│  - 暴露: grid, gameWon, canUndo, canRedo (Store)  │
│  - 暴露: guess(), undo(), redo() (方法)            │
│  - updateStores() 同步 Game 状态到 Store           │
└──────────────────────────────┬───────────────────────┘
                               │ 直接操作
                               ▼
┌──────────────────────────────────────────────────────┐
│  Domain Layer                                        │
│  - Game: 持有 Sudoku + History (undo/redo 栈)     │
│  - Sudoku: 持有 9×9 grid，提供 guess 操作        │
│  - 完全独立于 UI，可单独测试                       │
└──────────────────────────────────────────────────────┘
```

### 2. 数据流说明

#### 场景 A: 用户输入一个数字

```
用户点击 Board 中的单元格输入数字 5
  ↓
Board 组件触发 click 事件
  ↓
调用 gameStore.guess({row: 0, col: 0, value: 5})
  ↓
gameStore 内部：
  1) Game.guess({row: 0, col: 0, value: 5})
     - 保存当前 Sudoku 快照到 undoStack
     - 在当前 Sudoku 上执行 guess()
     - Sudoku.grid[0][0] = 5
  2) updateStores()
     - 从 Game 读取最新 grid
     - grid.set(newGrid)  ← 关键！替换整个引用
     - canUndo.set(true)
     - gameWon.set(false)
  ↓
store 值变化，订阅者被通知
  ↓
Board 组件（订阅了 $grid）重新渲染
  ↓
Board 显示新的网格值
```

#### 场景 B: 用户点击撤销按钮

```
用户点击 Undo 按钮
  ↓
Controls 组件调用 gameStore.undo()
  ↓
gameStore 内部：
  1) 检查 Game.canUndo() → true
  2) Game.undo()
     - redoStack.push(当前 Sudoku 快照)
     - 从 undoStack.pop() 恢复快照
     - this.sudoku = new Sudoku(snapshot.grid)
  3) updateStores()
     - grid.set(之前保存的 grid)
     - canUndo.set(Game.canUndo())
     - canRedo.set(true)
  ↓
Board 显示撤销前的网格
```

### 3. View 层直接消费的是什么

View 层 **只消费 gameStore 暴露的响应式状态和方法**，不直接操作 Game/Sudoku：

```javascript
// ✅ 正确做法（现有）
import * as gameStore from '@sudoku/stores/game';
import { grid, canUndo, gameWon } from '@sudoku/stores/game';

// 在组件中
$grid          // 当前网格状态（订阅 store）
$canUndo       // 是否可撤销
$gameWon       // 游戏是否胜利

gameStore.guess({row, col, value})  // 进行操作
gameStore.undo()                     // 撤销
gameStore.redo()                     // 重做
```

### 4. View 层拿到的具体数据

gameStore 暴露的 **响应式状态**：

| Store | 类型 | 说明 |
|-------|------|------|
| `grid` | `writable<number[][]>` | 当前网格状态（9×9 数组） |
| `userGrid` | `writable<number[][]>` | 用户编辑的网格状态 |
| `canUndo` | `writable<boolean>` | 是否可以撤销 |
| `canRedo` | `writable<boolean>` | 是否可以重做 |
| `gameWon` | `writable<boolean>` | 游戏是否胜利 |

gameStore 暴露的 **方法**：

| 方法 | 签名 | 说明 |
|------|------|------|
| `guess` | `(move: {row, col, value}) → void` | 进行一次猜测 |
| `undo` | `() → void` | 撤销 |
| `redo` | `() → void` | 重做 |
| `initGame` | `(sudoku, userGrid?) → void` | 初始化游戏 |
| `pause` | `() → void` | 暂停 |
| `resume` | `() → void` | 恢复 |

---

## 响应式机制说明

### 1. 为什么需要显式调用 `updateStores()`

这是理解本方案的 **关键**。

#### Svelte 响应式的限制

```javascript
// ❌ 问题：直接修改对象属性，Svelte 不会更新 UI
let sudoku = ...;
sudoku.grid[0][0] = 5;  // 界面不会刷新

// 为什么？
// Svelte 的响应式只追踪"赋值"操作，不追踪"属性修改"
// 上面的代码没有发生赋值，所以 Svelte 反应不了
```

#### 本方案的解决

```javascript
// ✅ 正确做法：通过 store.set() 完整替换引用
export function updateStores() {
  const currentGrid = gameInstance.getSudoku().getGrid();
  grid.set(currentGrid);  // ← 关键！这是一个赋值操作
  canUndo.set(gameInstance.canUndo());
  // ...
}

// currentGrid 是新对象的引用（getGrid() 返回拷贝）
// store.set() 替换了 store 的值
// Svelte 检测到新值 ≠ 旧值，触发订阅者更新
// 组件重新渲染
```

### 2. 响应式链路（完整）

```
用户操作（点击）
  ↓
事件处理函数 gameStore.guess(move)
  ↓
game.guess(move)  ← 修改内部 sudoku 状态
  ↓
updateStores()
  ↓
grid.set(newGridArray)
  ↓
store 值改变，通知所有订阅者
  ↓
Svelte 组件（订阅了 $grid）重新运行初始化脚本
  ↓
reactive statements ($: ...) 重新执行
  ↓
UI 重新渲染，显示新 grid
```

### 3. 哪些数据是响应式暴露给 UI 的

**响应式的**（通过 store）：
- `grid` - 当前网格
- `userGrid` - 用户输入的网格
- `canUndo` - 是否可撤销
- `canRedo` - 是否可重做
- `gameWon` - 游戏是否胜利

**不响应式的**（保存在 Game 内部）：
- `undoStack` - undo 历史栈
- `redoStack` - redo 历史栈
- Game/Sudoku 的内部实现细节

### 4. 如果错误地直接 mutate 内部对象会出现什么问题

```javascript
// ❌ 错误做法 1：直接改 Game 的 Sudoku，不调用 gameStore 方法
const game = gameStore.getGameInstance();
game.sudoku.grid[0][0] = 5;  // ← 直接改
// 结果：Game 状态改变了，但 store 没有更新
//      UI 不会刷新，UI 状态与实际状态不一致

// ❌ 错误做法 2：在组件中直接改 store 中的数组
let $grid = [[]...];
$grid[0][0] = 5;  // ← 直接改引用中的元素
// 结果：虽然 store 检测到了赋值，但 Game 对象不知道这个修改
//      历史栈管理会出问题
//      Undo/Redo 逻辑混乱

// 正确做法
gameStore.guess({row: 0, col: 0, value: 5});  // ← 通过方法
```

### 5. Svelte 3 的响应式机制（本项目使用）

本项目使用 **Svelte 3**，响应式机制包括：

1. **Store 订阅**
   - `writable(initialValue)` 创建可写 store
   - 组件中 `$store` 自动订阅
   - 当 `store.set()` 或 `store.update()` 时触发更新

2. **Reactive Statements**
   - `$: value = data.x` 依赖 `data.x`，当值改变时重新执行
   - 但只在引用改变时触发（对象属性修改不行）

3. **Binding**
   - `bind:value={gridArray[0][0]}` 双向绑定
   - 修改 UI 时直接改数组，需要配合 reactive 才能正确工作

**本方案采用 Store 订阅**，避免了直接修改对象的复杂性。

---

## 相比 HW1 的改进

### HW1 现状

```
测试代码
    ↓
    ├─→ Sudoku / Game（能工作）
    ├→ ✗ UI 基本不用这些对象
    └─→ UI 仍然直接操作状态数组
```

HW1 的问题：
- Sudoku/Game 只是"可测试的代码"，不是"真实系统的一部分"
- UI 层完全没有集成这些对象
- 对象设计得多好都没用，因为压根没人用

### HW1.1 改进

#### 1. **增加了适配层（gameStore）**

原则：**不改 UI 组件，只增加中间层**

```
View Components
        ↓ 调用 gameStore 方法
gameStore Adapter  ← 新增，职责清晰
        ↓ 操作
Game / Sudoku      ← 原有，无改动
```

优势：
- 现有组件逻辑完全不改
- 只需修改 App.svelte 一个文件
- 降低集成风险

#### 2. **改进 History 管理方式**

HW1 可能的做法（假设）：
- 记录每个操作（move）的列表
- Undo 需要反向执行前面的所有操作
- 容易出错

HW1.1 采用的做法（**快照方案**）：
- 每次操作前保存完整的 Sudoku 快照
- Undo 直接恢复快照（一步到位）
- 简单、可靠、易于理解

```javascript
// 快照方案伪代码
guess(move) {
  if (this.redoStack.length > 0) {
    this.redoStack = [];  // 新操作清除 redo
  }
  
  this.undoStack.push(this.sudoku.toJSON());  // 保存快照
  this.sudoku.guess(move);                    // 执行操作
}

undo() {
  this.redoStack.push(this.sudoku.toJSON());  // 保存当前
  const snapshot = this.undoStack.pop();       // 恢复快照
  this.sudoku = new Sudoku(snapshot.grid);
}
```

优势：
- Redo 后新操作会正确清除历史（避免 HW1 中的 bug）
- 实现简单，逻辑清晰
- 每个快照完全独立，不依赖前序操作

#### 3. **真实的 UI 集成**

HW1.1 要求：
```
✅ guess → Game.guess()
✅ 撤销 → Game.undo()
✅ 胜利 → Game 状态驱动
✅ UI 刷新 → 响应式 store 驱动
```

这意味着：
- UI 中**看到的每个网格值**都来自 Game 对象
- 用户**每个操作**都通过 Game 对象
- **没有旁路**，UI 完全依赖领域对象

#### 4. **职责边界更清晰**

| 层 | 职责 | 变化 |
|----|----|------|
| View | 渲染、事件处理 | 不变 |
| **gameStore** | **同步 Game ↔ Store** | **新增** |
| Game | 历史管理、业务逻辑 | 明确职责 |
| Sudoku | 网格数据、操作 | 不变 |

---

## 架构图解

```
┌──────────────────────────────────────────────────────────┐
│                    Svelte Components                     │
│  Board.svelte  Controls.svelte  Header.svelte  等       │
│                                                           │
│  import { $grid, $canUndo } from '@sudoku/stores/game'  │
│  import * as gameStore from '@sudoku/stores/game'        │
│                                                           │
│  <!-- 数据来自 store -->                                 │
│  {#each $grid as row}...{/each}                          │
│                                                           │
│  <!-- 操作通过 gameStore -->                             │
│  on:click={() => gameStore.guess({...})}                │
└──────────────────────────┬───────────────────────────────┘
                           │ writable stores
     ┌─────────────────────┼─────────────────────┐
     ▼                     ▼                     ▼
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│ grid        │      │ canUndo      │      │ gameWon     │
│ userGrid    │      │ canRedo      │      │ ...         │
└─────────────┘      └──────────────┘      └─────────────┘
     ▲                     ▲                     ▲
     └─────────────────────┼─────────────────────┘
              store 订阅者
          (Svelte 自动管理)
                           │ updateStores()
                           │ 同步 Game 状态
                           ▼
┌──────────────────────────────────────────────────────────┐
│              gameStore（Adapter Layer）                 │
│                                                           │
│  内部状态：                                               │
│  - let gameInstance = new Game({sudoku})                │
│  - let paused = false                                   │
│                                                           │
│  公共方法：                                               │
│  - guess(move)      initGame(sudoku)                    │
│  - undo()           redo()                              │
│  - pause()          resume()                            │
│                                                           │
│  内部方法：                                               │
│  - updateStores() ← 核心，同步状态到 store             │
└──────────────────────┬───────────────────────────────────┘
                       │ 操作
                       │ Game.guess(move)
                       │ Game.undo()
                       ▼
┌──────────────────────────────────────────────────────────┐
│                  Domain Layer                            │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Game                                            │   │
│  │  - sudoku: Sudoku                               │   │
│  │  - undoStack: JSON[]  (快照)                    │   │
│  │  - redoStack: JSON[]  (快照)                    │   │
│  │  - getSudoku()                                  │   │
│  │  - guess(move) / undo() / redo()                │   │
│  │  - canUndo() / canRedo()                        │   │
│  └──────────────┬───────────────────────────────────┘   │
│                │                                         │
│                ▼                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Sudoku                                          │   │
│  │  - grid: number[][]  (9×9 数组)                 │   │
│  │  - guess(move)       (修改 grid[r][c])          │   │
│  │  - getGrid()         (返回拷贝)                  │   │
│  │  - clone()           (深拷贝)                    │   │
│  │  - toJSON()          (序列化)                    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  完全独立于 UI，可单独测试                               │
│  状态管理、业务逻辑都在这里                             │
└──────────────────────────────────────────────────────────┘
```

---

## 关键设计决策

### 1. 为什么选择 Store Adapter 方案（而非方案 B）

| 方案 | 优点 | 缺点 |
|------|------|------|
| **A: Store Adapter（已采用）** | UI 改动最小；职责清晰；稳定 | 多一层中间件 |
| **B: 对象自身可订阅** | 直接；少一层中间件 | Game/Sudoku 需要 subscribe/notify 逻辑；与领域逻辑混合；UI 直接操作对象风险大 |

**选择 A 的理由**：
- Svelte 已经有成熟的 store 机制，复用它更稳定
- 分离关注：Game 专注业务逻辑，store 专注响应式
- 便于未来迁移到 Svelte 5（runes）时只改 store 层

### 2. 为什么采用快照方案存储 History

| 方案 | 结构 | 恢复速度 | 内存占用 | 实现复杂度 |
|------|------|----------|----------|-----------|
| **快照方案（已采用）** | 保存完整状态快照 | 很快 O(1) | 较高 | 简单 |
| 操作列表方案 | 保存操作序列 | 慢 O(n) | 低 | 复杂 |

**选择快照的理由**：
- Sudoku 数据很小（81 个数字），快照成本可接受
- 恢复速度快，用户体验好
- "新操作后清除 redo"逻辑简单（直接 redoStack = []）
- 不会因为顺序问题导致 bug

### 3. 为什么不直接在组件中调用 Game

```javascript
// ❌ 不这样做
export let sudoku;
let game = new Game({sudoku});
on:click={() => game.guess({...})}

// ✅ 要这样做
import * as gameStore from '@sudoku/stores/game';
on:click={() => gameStore.guess({...})}
```

**理由**：
- 多组件共享 game 实例很复杂（需要通过 props 或 context）
- gameStore 集中管理，全局可访问
- gameStore 同步到 store，所有订阅者自动更新
- 符合 "data down, events up" 原则

### 4. 防御性拷贝的必要性

```javascript
// Sudoku.getGrid() 为什么要返回拷贝？
getGrid() {
  return this._deepCloneGrid(this.grid);  // ← 拷贝
  // return this.grid;  ❌ 错误，外界可能改动
}
```

**理由**：
- 外界无法直接改动内部 grid
- 如果返回原引用，外界的改动会跳过 Game.guess() 的 undo/redo 逻辑
- 测试也要求这一点（defensive copy test）

---

## 总结

### 思维导图

```
为什么需要 HW1.1？
  ↓
领域对象只在测试中可用，UI 没用
  ↓
解决方案：创建适配层
  ↓
gameStore 内部持有 Game
  ↓
UI 通过 gameStore 方法操作
  ↓
gameStore 同步到 store
  ↓
组件订阅 store 自动更新
```

### 关键原理总结

1. **Svelte 响应式边界**
   - 只追踪"赋值"，不追踪"属性修改"
   - 必须 `store.set(newValue)` 才能触发更新

2. **updateStores() 的作用**
   - 从 Game 读取最新状态
   - 通过 `store.set()` 发送到 Svelte
   - 让组件知道数据改变了

3. **快照方案的优势**
   - 恢复时一步到位
   - 新操作清除 redo 很简单
   - 代码逻辑清晰

4. **分层设计的价值**
   - Game：纯业务逻辑（可单独测试）
   - gameStore：连接逻辑（UI 友好）
   - UI：只消费 store（最简单）

---

## 测试覆盖

所有 15 个 HW1 单元测试都通过 ✅

```
tests/hw1/01-contract.test.js       ✓ 3 tests (工厂函数合约)
tests/hw1/02-sudoku-basic.test.js    ✓ 5 tests (防御性拷贝、guess、clone)
tests/hw1/03-clone.test.js           ✓ 2 tests (深拷贝独立性)
tests/hw1/04-game-undo-redo.test.js  ✓ 3 tests (undo/redo/新操作清除)
tests/hw1/05-serialization.test.js   ✓ 2 tests (JSON 往返)
```

领域对象部分已 100% 通过测试，UI 集成就绪。

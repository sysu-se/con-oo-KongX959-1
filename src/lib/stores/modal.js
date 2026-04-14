/**
 * Modal Store - 控制模态对话框的显示/隐藏
 */

import { writable, derived } from 'svelte/store';
import { MODAL_NONE } from '../constants.js';

const initialState = {
    type: MODAL_NONE,     // 模态类型：'welcome', 'gameover', 'settings' 等，null 表示隐藏
    visible: false,
    data: {},             // 传给模态的额外数据
};

const internalStore = writable(initialState);

// 导出可直接订阅的 store（用 $modal 在模板中）
export const modalType = derived(internalStore, $state => $state.type);

// 导出 modalData store
export const modalData = derived(internalStore, $state => $state.data);

// 导出控制对象（用于 App.svelte 的 modal.show() 等）
export const modal = {
    /**
     * 显示模态
     * @param {string} type - 模态类型
     * @param {Object} data - 传入的数据（如 onHide 回调、sencode 等）
     */
    show: (type, data = {}) => {
        internalStore.set({
            type,
            visible: true,
            data,
        });
    },

    /**
     * 隐藏模态
     */
    hide: () => {
        internalStore.set({
            type: MODAL_NONE,
            visible: false,
            data: {},
        });
    },

    /**
     * 重置
     */
    reset: () => internalStore.set(initialState),

    /**
     * 订阅支持
     */
    subscribe: modalType.subscribe,
};

export class RecorderStore {
  constructor() {
    this.state = {
      isRecording: true,

      // 錄製結果
      actions: [],
      currentActionIndex: 0,

      // 已初始化的 listener
      activeListenerContextIds: new Set(),

      // context 註冊資訊（先簡單存，之後可交給 ContextRegistry）
      contexts: new Map(),

      // 當前動作相關
      currentAction: null,
      lastAction: null,

      // input / click / dblclick / debounce 暫存
      pendingActionTimers: new Map(),

      // drag session
      dragSession: {
        isDragging: false,
        sourceContextId: null,
        sourceElementInfo: null,
        targetContextId: null,
        targetElementInfo: null
      },

      // popup 狀態
      pendingPopup: null,

      // 通知訂閱者用
      subscribers: new Set()
    };
  }

  // ===== 基本讀取 =====
  getState() {
    return this.state;
  }

  getActions() {
    return this.state.actions;
  }

  getCurrentAction() {
    return this.state.currentAction;
  }

  getLastAction() {
    return this.state.lastAction;
  }

  isRecording() {
    return this.state.isRecording;
  }

  // ===== 訂閱 / 通知 =====
  subscribe(callback) {
    if (typeof callback !== 'function') return () => {};
    this.state.subscribers.add(callback);

    return () => {
      this.state.subscribers.delete(callback);
    };
  }

  notify() {
    this.state.subscribers.forEach((callback) => {
      try {
        callback(this.state);
      } catch (error) {
        console.error('RecorderStore subscriber error:', error);
      }
    });
  }

  // ===== 錄製開關 =====
  setRecording(value) {
    this.state.isRecording = !!value;
    this.notify();
  }

  // ===== Action 管理 =====
  addAction(action) {
    if (!action || typeof action !== 'object') return null;

    const normalizedAction = {
      id: `action_${this.state.currentActionIndex}`,
      index: this.state.currentActionIndex,
      timestamp: Date.now(),
      ...action
    };

    this.state.actions.push(normalizedAction);
    this.state.lastAction = normalizedAction;
    this.state.currentAction = normalizedAction;
    this.state.currentActionIndex += 1;

    this.notify();
    return normalizedAction;
  }

  removeLastAction() {
    const removedAction = this.state.actions.pop() || null;
    this.state.lastAction = this.state.actions[this.state.actions.length - 1] || null;
    this.state.currentAction = this.state.lastAction;
    this.notify();
    return removedAction;
  }

  updateCurrentAction(patch) {
    if (!this.state.currentAction || !patch || typeof patch !== 'object') return;

    Object.assign(this.state.currentAction, patch);
    this.state.lastAction = this.state.currentAction;

    this.notify();
  }

  setCurrentAction(action) {
    this.state.currentAction = action || null;
    if (action) {
      this.state.lastAction = action;
    }
    this.notify();
  }

  clearCurrentAction() {
    this.state.currentAction = null;
    this.notify();
  }

  clearActions() {
    this.state.actions = [];
    this.state.currentActionIndex = 0;
    this.state.currentAction = null;
    this.state.lastAction = null;
    this.notify();
  }

  // ===== Listener 管理 =====
  hasListener(contextId) {
    if (!contextId) return false;
    return this.state.activeListenerContextIds.has(contextId);
  }

  registerListener(contextId) {
    if (!contextId) return;
    this.state.activeListenerContextIds.add(contextId);
    this.notify();
  }

  unregisterListener(contextId) {
    if (!contextId) return;
    this.state.activeListenerContextIds.delete(contextId);
    this.notify();
  }

  clearListeners() {
    this.state.activeListenerContextIds.clear();
    this.notify();
  }

  // ===== Context 管理 =====
  registerContext(context) {
    if (!context?.contextId) return;
    this.state.contexts.set(context.contextId, context);
    this.notify();
  }

  registerContexts(contexts = []) {
    contexts.forEach((context) => this.registerContext(context));
  }

  getContext(contextId) {
    if (!contextId) return null;
    return this.state.contexts.get(contextId) || null;
  }

  getAllContexts() {
    return Array.from(this.state.contexts.values());
  }

  removeContext(contextId) {
    if (!contextId) return;
    this.state.contexts.delete(contextId);
    this.state.activeListenerContextIds.delete(contextId);
    this.notify();
  }

  clearContexts() {
    this.state.contexts.clear();
    this.state.activeListenerContextIds.clear();
    this.notify();
  }

  // ===== Timer / debounce 管理 =====
  setPendingTimer(key, timerId) {
    if (!key) return;
    this.clearPendingTimer(key);
    this.state.pendingActionTimers.set(key, timerId);
  }

  getPendingTimer(key) {
    if (!key) return null;
    return this.state.pendingActionTimers.get(key) || null;
  }

  clearPendingTimer(key) {
    if (!key) return;
    const timerId = this.state.pendingActionTimers.get(key);
    if (timerId) {
      clearTimeout(timerId);
    }
    this.state.pendingActionTimers.delete(key);
  }

  clearAllPendingTimers() {
    this.state.pendingActionTimers.forEach((timerId) => {
      clearTimeout(timerId);
    });
    this.state.pendingActionTimers.clear();
  }

  // ===== Drag session =====
  // 修改 RecorderStore.js
startDragSession({ sourceContextId = null, sourceElementInfo = null, sourcePath = null } = {}) {
  this.state.dragSession = {
    isDragging: true,
    sourceContextId,
    sourceElementInfo,
    sourcePath, // <=== 必須新增這一行，把解析好的路徑存起來！
    targetContextId: null,
    targetElementInfo: null
  };
  this.notify();
}

  updateDragTarget({ targetContextId = null, targetElementInfo = null } = {}) {
    if (!this.state.dragSession.isDragging) return;

    this.state.dragSession.targetContextId = targetContextId;
    this.state.dragSession.targetElementInfo = targetElementInfo;
    this.notify();
  }

  getDragSession() {
    return this.state.dragSession;
  }

  endDragSession() {
    const finishedSession = { ...this.state.dragSession };

    this.state.dragSession = {
      isDragging: false,
      sourceContextId: null,
      sourceElementInfo: null,
      targetContextId: null,
      targetElementInfo: null
    };

    this.notify();
    return finishedSession;
  }

  // ===== Popup 狀態 =====
  setPendingPopup(popupInfo) {
    this.state.pendingPopup = popupInfo || null;
    this.notify();
  }

  getPendingPopup() {
    return this.state.pendingPopup;
  }

  clearPendingPopup() {
    this.state.pendingPopup = null;
    this.notify();
  }

  // ===== reset =====
  reset() {
    this.clearAllPendingTimers();

    this.state.isRecording = true;
    this.state.actions = [];
    this.state.currentActionIndex = 0;
    this.state.activeListenerContextIds.clear();
    this.state.contexts.clear();
    this.state.currentAction = null;
    this.state.lastAction = null;
    this.state.dragSession = {
      isDragging: false,
      sourceContextId: null,
      sourceElementInfo: null,
      targetContextId: null,
      targetElementInfo: null
    };
    this.state.pendingPopup = null;

    this.notify();
  }
}

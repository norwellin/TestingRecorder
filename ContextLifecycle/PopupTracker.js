export class PopupTracker {
  constructor({
    onPopupDetected = null,
    onPopupClosed = null,
    pollInterval = 300,
    popupLoadTimeout = 10000
  } = {}) {
    this.onPopupDetected = onPopupDetected;
    this.onPopupClosed = onPopupClosed;
    this.pollInterval = pollInterval;
    this.popupLoadTimeout = popupLoadTimeout;

    this.originalWindowOpen = null;
    this.activePopupMonitors = new Map();
    this.isStarted = false;
  }

  start() {
    if (this.isStarted) {
      console.log('[PopupTracker] already started');
      return;
    }

    this.originalWindowOpen = window.open;
    this.overrideWindowOpen();
    this.isStarted = true;

    console.log('[PopupTracker] started');
  }

  stop() {
    if (!this.isStarted) {
      console.log('[PopupTracker] not started');
      return;
    }

    this.restoreWindowOpen();
    this.clearAllPopupMonitors();
    this.isStarted = false;

    console.log('[PopupTracker] stopped');
  }

  // 在 PopupTracker.js 裡面，把這個函式變空：
  overrideWindowOpen() {
    // 捨棄不穩定的 DOM 注入與覆寫，改由 Background 的 chrome.tabs 原生 API 負責攔截
    console.log('[PopupTracker] 已將 Popup 攔截任務交接給 Background 上帝視角。');
  }

  restoreWindowOpen() {
    if (this.originalWindowOpen) {
      window.open = this.originalWindowOpen;
      this.originalWindowOpen = null;
    }
  }

  trackPopupWindow(popupWindow, openArgs = []) {
    const popupId = this.createPopupId();
    const openedAt = Date.now();

    const popupInfo = {
      popupId,
      popupWindow,
      openArgs,
      openedAt,
      isDetected: false,
      isClosed: false
    };

    const intervalId = setInterval(() => {
      this.checkPopupStatus(popupInfo);
    }, this.pollInterval);

    const timeoutId = setTimeout(() => {
      console.warn(`[PopupTracker] popup load timeout: ${popupId}`);
      this.cleanupPopupMonitor(popupId);
    }, this.popupLoadTimeout);

    this.activePopupMonitors.set(popupId, {
      popupInfo,
      intervalId,
      timeoutId
    });

    console.log(`[PopupTracker] tracking popup: ${popupId}`);
  }

  checkPopupStatus(popupInfo) {
    const { popupId, popupWindow } = popupInfo;

    if (!popupWindow) {
      this.cleanupPopupMonitor(popupId);
      return;
    }

    if (this.isPopupClosed(popupWindow)) {
      popupInfo.isClosed = true;
      if (typeof this.onPopupClosed === 'function') {
        try { this.onPopupClosed({ popupId, popupWindow, popupInfo }); } catch (e) {}
      }
      this.cleanupPopupMonitor(popupId);
      return;
    }

    if (popupInfo.isDetected) return;

    let isCors = false;
    let readyState = '';
    let popupUrl = '';

    try {
      readyState = popupWindow.document.readyState;
      popupUrl = popupWindow.location.href;
    } catch (error) {
      isCors = true;
    }

    if (isCors) {
      popupInfo.isDetected = true;
      if (typeof this.onPopupDetected === 'function') {
        this.onPopupDetected({
          popupId, popupWindow, popupDocument: null, popupUrl: 'cross-origin', popupInfo
        });
      }
      return;
    }

    // 🌟 關鍵修復：破解 about:blank 幽靈陷阱
    const expectedUrl = popupInfo.openArgs[0];
    // 如果現在網址還是 about:blank，而且我們原本呼叫 open 時有傳入真實網址，就繼續等！
    if (popupUrl === 'about:blank' && expectedUrl && expectedUrl !== 'about:blank') {
      return; // 假裝沒看到，讓他繼續輪詢
    }

    // 等到真實網址出現，且狀態為 interactive 或 complete 才算真正載入完成
    const popupDocument = popupWindow.document;
    if (readyState === 'interactive' || readyState === 'complete') {
      popupInfo.isDetected = true;
      console.log(`[PopupTracker] 同網域 popup 偵測成功: ${popupId}`, popupUrl);
      if (typeof this.onPopupDetected === 'function') {
        this.onPopupDetected({ popupId, popupWindow, popupDocument, popupUrl, popupInfo });
      }
    }
  }

  isPopupClosed(popupWindow) {
    try {
      return !popupWindow || popupWindow.closed;
    } catch (error) {
      return true;
    }
  }

  safeGetPopupDocument(popupWindow) {
    try {
      return popupWindow?.document || null;
    } catch (error) {
      return null;
    }
  }

  safeGetPopupUrl(popupWindow) {
    try {
      return popupWindow?.location?.href || null;
    } catch (error) {
      return null;
    }
  }

  cleanupPopupMonitor(popupId) {
    const monitor = this.activePopupMonitors.get(popupId);
    if (!monitor) return;

    clearInterval(monitor.intervalId);
    clearTimeout(monitor.timeoutId);

    this.activePopupMonitors.delete(popupId);
  }

  clearAllPopupMonitors() {
    this.activePopupMonitors.forEach((monitor, popupId) => {
      clearInterval(monitor.intervalId);
      clearTimeout(monitor.timeoutId);
    });

    this.activePopupMonitors.clear();
  }

  createPopupId() {
    return `popup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  getActivePopupCount() {
    return this.activePopupMonitors.size;
  }

  getActivePopupIds() {
    return Array.from(this.activePopupMonitors.keys());
  }
}
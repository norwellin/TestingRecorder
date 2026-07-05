// 匯入各個獨立功能的模組 (依賴注入的來源)
import { ContextScanner } from "./ContextLifecycle/ContextScanner.js"; // 負責掃描網頁中的執行環境 (如 iframe, popup)
import { ContextRegistry } from "./ContextLifecycle/ContextRegistry.js"; // 負責註冊與管理掃描到的執行環境
import { RecorderStore } from "./RecorderStore.js"; // 狀態管理中心 (儲存動作紀錄、錄製狀態)
//import { PopupTracker } from "./ContextLifecycle/PopupTracker.js"; // 追蹤彈出新視窗的行為
import { NavigationTracker } from "./ContextLifecycle/NavigationTracker.js"; // 追蹤網址跳轉/導航行為
//import { ClickToPageTracker } from "./ContextLifecycle/ClickToPageTracker.js"; // 追蹤點擊導致換頁的行為
import { DOMParserService } from "./usecases/DOMParserService.js"; // 解析 DOM 元素 (例如取得元素的 selector)
import { PlaywrightCodeGenerator } from "./usecases/PlaywrightCodeGenerator.js"; // 將動作轉化為 Playwright 語法
import { PlaywrightCommand } from "./entities/PlaywrightCommand.js"; // 儲存與管理生成的 Playwright 程式碼字串
// 請確保檔案頂端有這兩行
import { OuterEventListener } from "./interfaces/OuterEventListener.js";
import { IframeEventListener } from "./interfaces/IframeEventListener.js";
import customRules from './custom-rules.json';

// 加在檔案最頂端，脫離所有邏輯限制
console.log("🚀 [System] bundle.js 已經成功被 Chrome 注入到這個網頁！", window.location.href);
export class MainApp {
  // 建構子：初始化所有子系統。允許傳入自訂的 document 與 window，預設為當前網頁的
  constructor(rootDoc = document, rootWin = window) {
    console.log("🏗️ [MainApp] 進入 constructor！");
    this.rootDoc = rootDoc;
    this.rootWin = rootWin;

    this.isStarted = false;
    this.scanResult = null;
    this.activeListeners = [];
    this.hoverPreviewSessionEnabled = false;
    this.dynamicFrameObserver = null;
    this.dynamicFrameScanTimer = null;
    this.pendingGrapesDrops = [];
    this.hasInitializedRecordingSession = false;

    this.setupBackgroundMessageListener();
    this.setupNativeDialogListener();
    this.setupGrapesDropListener();


    
    this.registry = new ContextRegistry();
    this.store = new RecorderStore();

    this.domParserService = new DOMParserService({
      mainWindow: rootWin
    });

    // 🌟 2. 針對你的 JSON 格式，加入這段轉換邏輯
    if (customRules && Array.isArray(customRules.dynamicIdRules)) {
      // 這裡的 .map 會走訪陣列中的每一個物件，並只把 "pattern" 的值抽出來
      // 結果會變成: ["^form-input-\\d+$", "^member_[A-Z0-9]{6}$", "^el-table_\\d+_column_\\d+$", "^\\d+$"]
      const ruleStrings = customRules.dynamicIdRules.map(rule => rule.pattern);

      // 將純字串陣列傳給 DOMParserService
      this.domParserService.setCustomDynamicIdRules(ruleStrings);

      console.log("✅ [MainApp] 已成功載入自定義動態 ID 規則數量：", ruleStrings.length);
    }
    this.command = new PlaywrightCommand();

    this.pageAlias = 'page';
    this.codeGenerator = new PlaywrightCodeGenerator(this.domParserService, this.command, this.pageAlias);

    this.navigationTracker = new NavigationTracker({
      rootWindow: this.rootWin,
      onNavigationDetected: (navInfo) => {
        const action = {
          type: "navigate",
          ...navInfo,
          url: navInfo.currentUrl || navInfo.url || window.location.href,
          viewport: this.getRecordingViewport(),
          ts: Date.now()
        };
        const newLine = this.appendGeneratedCode(action);
        this.attachGeneratedCodeToAction(action, newLine);
        const savedAction = this.addGeneratedAction(action, newLine);
        this.syncToGlobalStorage(newLine, savedAction);
      },
    });

    // 🌟 關鍵修復：統一處理身分認領與自動喚醒機制
    this.safeChromeStorageGet(['latestPopupAlias', 'recorderStatus'], (result) => {

        // 1. 如果是新視窗，認領自己的專屬變數名稱 (例如 popup_123456)
        if (window.opener && result.latestPopupAlias) {
          this.pageAlias = result.latestPopupAlias;
          this.codeGenerator.pageAlias = this.pageAlias;
          console.log(`🆔 [MainApp] 認領身分成功！我的 Playwright 變數名稱是: ${this.pageAlias}`);

          // 認領完畢後，把小本本擦掉，以免其他新視窗誤認
          this.safeChromeStorageRemove('latestPopupAlias');
        }

        // 2. 如果整個系統正在錄製中，這個新視窗必須「自動開工」！
        if (result.recorderStatus === 'recording') {
          this.autoStart();
        }
      });
  }
  // 🌟 貼上這個新方法：專門處理 Background 傳來的跨世界/原生 Popup 事件
  // ==================== myrecorderRestructure/MainApp1.js ====================
  // 將這段函式加在 MainApp1 類別裡面

  // 接收 Background 傳來的原生 Popup 通知
  setupBackgroundMessageListener() {
    if (!this.isExtensionContextAvailable() || !chrome.runtime?.onMessage) return;

    try {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // 確認系統正在錄製中，且收到的是 Popup 通知
      if (this.isStarted && message.type === "NATIVE_POPUP_DETECTED") {
        console.log("🌍 [MainApp] 接收到 Background 傳來的新視窗情報：", message.url);

        // 1. 建立標準動作實體
        const action = {
          type: "popup",
          popupId: message.popupId,
          url: message.url,
          ts: Date.now(),
        };

        // ===== 修改後 =====
        const newLine = this.appendGeneratedCode(action);
        this.attachGeneratedCodeToAction(action, newLine);
        const savedAction = this.addGeneratedAction(action, newLine);
        this.syncToGlobalStorage(newLine, savedAction);
      }
      return false; // 非同步安全機制
      });
    } catch (error) {
      this.handleExtensionContextError(error, "setup background message listener");
    }
  }

  setupNativeDialogListener() {
    this.rootWin.addEventListener("message", (event) => {
      const msg = event.data;
      if (msg?.source !== "RECORDER_PAGE_HOOK") return;
      if (msg.type !== "RECORDER_NATIVE_DIALOG") return;
      if (!this.isStarted) return;
      if (event.source !== this.rootWin && !this.isKnownFrameSource(event.source)) return;

      this.handleUserAction({
        type: "dialog",
        dialogType: msg.dialogType,
        message: msg.message,
        result: msg.result,
        defaultValue: msg.defaultValue,
        frameUrl: msg.frameUrl,
        fromIframe: msg.fromIframe === true,
        sourceWindow: "ctx_page_0",
        ts: Date.now()
      });
    });
  }

  setupGrapesDropListener() {
    this.rootWin.addEventListener("message", (event) => {
      const msg = event.data;
      if (msg?.source !== "RECORDER_PAGE_HOOK") return;
      if (msg.type !== "RECORDER_GRAPES_DROP" && msg.type !== "RECORDER_GRAPES_READY") return;
      if (event.source !== this.rootWin && !this.isKnownFrameSource(event.source)) return;

      if (msg.type === "RECORDER_GRAPES_READY") {
        console.info("[Recorder][GrapesJS] editor detected", {
          frameUrl: msg.frameUrl,
          fromIframe: msg.fromIframe === true
        });
        return;
      }

      if (!this.isStarted || !msg.grapesDrop) return;
      this.handleGrapesDropMetadata({
        ...msg.grapesDrop,
        frameUrl: msg.frameUrl || "",
        fromIframe: msg.fromIframe === true
      });
    });
  }

  handleGrapesDropMetadata(grapesDrop) {
    const now = Date.now();
    this.pendingGrapesDrops = this.pendingGrapesDrops
      .filter((item) => now - Number(item?.capturedAt || now) <= 4000);

    const actions = this.store?.getActions?.() || [];
    const recentDragAction = [...actions].reverse().find((action) => {
      if (action?.type !== "dragANDdrop") return false;
      const actionTime = Number(action.timestamp || action.ts || 0);
      return actionTime > 0 && Math.abs(now - actionTime) <= 4000;
    });

    if (!recentDragAction) {
      this.pendingGrapesDrops.push(grapesDrop);
      console.debug("[Recorder][GrapesJS] drop metadata queued", grapesDrop);
      return;
    }

    this.attachGrapesDropToAction(recentDragAction, grapesDrop);
    this.safeChromeSendMessage({
      type: "RECORDER_ACTIONS_UPDATE",
      action: this.getActions()
    });
  }

  attachPendingGrapesDrop(action) {
    const now = Date.now();
    this.pendingGrapesDrops = this.pendingGrapesDrops
      .filter((item) => now - Number(item?.capturedAt || now) <= 4000);
    const grapesDrop = this.pendingGrapesDrops.pop();
    if (grapesDrop) this.attachGrapesDropToAction(action, grapesDrop);
  }

  attachGrapesDropToAction(action, grapesDrop) {
    if (!action || !grapesDrop) return;

    const current = action.grapesDrop;
    if (current?.kind === "block-add" && grapesDrop.kind !== "block-add") return;

    action.grapesDrop = grapesDrop;
    action.grapesDropDetected = true;
    console.info("[Recorder][GrapesJS] semantic drop attached", {
      actionId: action.id || null,
      kind: grapesDrop.kind,
      parent: grapesDrop.parent,
      index: grapesDrop.index,
      previousSibling: grapesDrop.previousSibling,
      nextSibling: grapesDrop.nextSibling
    });
  }

  isExtensionContextAvailable() {
    try {
      return typeof chrome !== "undefined" && !!chrome.runtime?.id;
    } catch (error) {
      return false;
    }
  }

  handleExtensionContextError(error, operation) {
    const message = error?.message || String(error);
    if (message.includes("Extension context invalidated")) {
      console.warn(`[MainApp] Extension context invalidated while trying to ${operation}. Please reload the page after reloading the extension.`);
      return true;
    }

    console.warn(`[MainApp] Chrome extension API failed while trying to ${operation}`, error);
    return false;
  }

  safeChromeStorageGet(keys, callback) {
    if (!this.isExtensionContextAvailable() || !chrome.storage?.local) return;

    try {
      chrome.storage.local.get(keys, (result) => {
        const runtimeError = chrome.runtime?.lastError;
        if (runtimeError) {
          this.handleExtensionContextError(runtimeError, "read chrome storage");
          return;
        }
        callback(result || {});
      });
    } catch (error) {
      this.handleExtensionContextError(error, "read chrome storage");
    }
  }

  safeChromeStorageSet(value) {
    if (!this.isExtensionContextAvailable() || !chrome.storage?.local) return;

    try {
      chrome.storage.local.set(value, () => {
        const runtimeError = chrome.runtime?.lastError;
        if (runtimeError) this.handleExtensionContextError(runtimeError, "write chrome storage");
      });
    } catch (error) {
      this.handleExtensionContextError(error, "write chrome storage");
    }
  }

  safeChromeStorageRemove(keys) {
    if (!this.isExtensionContextAvailable() || !chrome.storage?.local) return;

    try {
      chrome.storage.local.remove(keys, () => {
        const runtimeError = chrome.runtime?.lastError;
        if (runtimeError) this.handleExtensionContextError(runtimeError, "remove chrome storage");
      });
    } catch (error) {
      this.handleExtensionContextError(error, "remove chrome storage");
    }
  }

  safeChromeSendMessage(message) {
    if (!this.isExtensionContextAvailable() || !chrome.runtime?.sendMessage) return null;

    try {
      const result = chrome.runtime.sendMessage(message);
      if (result?.catch) {
        result.catch((error) => this.handleExtensionContextError(error, "send chrome runtime message"));
      }
      return result;
    } catch (error) {
      this.handleExtensionContextError(error, "send chrome runtime message");
      return null;
    }
  }

  isKnownFrameSource(sourceWindow) {
    if (!sourceWindow || !this.registry || typeof this.registry.getContextsByType !== "function") return false;
    return this.registry
      .getContextsByType("iframe")
      .some((ctx) => ctx.windowRef === sourceWindow);
  }

  createContextSnapshot(ctx) {
    if (!ctx) return null;
    return {
      contextId: ctx.contextId || null,
      type: ctx.type || null,
      parentContextId: ctx.parentContextId || null,
      openerContextId: ctx.openerContextId || null,
      frameSelector: ctx.frameSelector || null,
      url: ctx.url || null,
      frameId: ctx.frameElement?.id || null,
      frameName: ctx.frameElement?.name || null,
      frameTitle: ctx.frameElement?.getAttribute?.("title") || null,
      frameSrc: ctx.frameElement?.getAttribute?.("src") || null,
      resolvedFrameSrc: ctx.frameElement?.src || null
    };
  }

  // 統一處理來自各個 Listener (Page/Iframe/Popup) 的互動動作
  handleUserAction(action) {
    if (!this.isStarted) return;
    console.log("[Debug MainApp] 接收到 Action:", action.type, action);
    console.log("[RecorderDebug][MainApp handleUserAction] received", {
      actionType: action.type,
      sourceWindow: action.sourceWindow,
      targetWindow: action.targetWindow,
      sourceElement: this.describeDebugElement(
        typeof action.getSourceElement === "function" ? action.getSourceElement() : null
      ),
      hasPreParsedSourcePath: !!action.preParsedSourcePath,
      preParsedSummary: this.summarizeDebugSourcePath(action.preParsedSourcePath)
    });
    // ===== 拖放事件 (Drag & Drop) 狀態組裝邏輯 =====
    if (action.type === "dragANDdrop") {
      if (action.isDragStart) {
        // 【修改點】在 DragStart 階段就先解析路徑
        const sourcePath = this.domParserService.getOpenSourcePath(
          action.getSourceElement(),
          action.sourceWindow
        );
        console.log("[Debug MainApp] 預解析完成的路徑:", sourcePath); // 檢查點 1
        this.store.startDragSession({
          sourceContextId: action.sourceWindow,
          sourceContext: action.sourceContext || null,
          sourceElementInfo: action.getSourceElement(),
          sourcePath: sourcePath // 預先存好解析結果
        });
        return;
      }

      if (action.isDrop) {
        const session = this.store.getDragSession();
        if (!session.isDragging) return;

        action.setSourceWindow(session.sourceContextId);
        if (session.sourceContext) {
          if (typeof action.setSourceContext === "function") {
            action.setSourceContext(session.sourceContext);
          } else {
            action.sourceContext = session.sourceContext;
          }
        }
        action.setSourceElement(session.sourceElementInfo);
        // 將預先解析好的路徑塞入 action，避免後續重複解析失敗
        action.preParsedSourcePath = session.sourcePath;
        this.attachPendingGrapesDrop(action);

        this.store.endDragSession();
      }
    }
    // ==========================================

    // ===== 修改後 =====
    const newLine = this.appendGeneratedCode(action);
    this.attachGeneratedCodeToAction(action, newLine);
    const savedAction = this.addGeneratedAction(action, newLine);
    console.log("[RecorderDebug][MainApp handleUserAction] saved action", {
      actionType: savedAction?.type,
      sourceMethod: savedAction?.sourceMethod,
      sourceData: savedAction?.sourceData,
      sourceDomPathChain: savedAction?.sourceDomPathChain || [],
      sourceDomPathOptions: savedAction?.sourceDomPathOptions || [],
      generatedCodeLines: savedAction?.generatedCodeLines || []
    });
    this.syncToGlobalStorage(newLine, savedAction);

  }
  // 啟動錄製器
  // 檔案：myrecorderRestructure/MainApp.js

  start() {
    if (this.isStarted) return this.getState();
    if (this.hasInitializedRecordingSession) return this.resumeRecording();
    this.hoverPreviewSessionEnabled = true;

    // 1. 掃描環境並註冊
    const scanner = new ContextScanner(this.rootDoc, this.rootWin);
    this.scanResult = scanner.scanAllContexts();
    this.registry.registerMany(this.scanResult.contexts);
    this.syncRegistryToStore();

    const allContexts = this.registry.getAllContexts();
    this.codeGenerator.setContexts(allContexts, this.pageAlias);

    // 3. 準備初始導航動作 (page.goto)
    const gotoAction = {
      type: "navigate",
      url: window.location.href,
      viewport: this.getRecordingViewport(),
      ts: Date.now()
    };

    // 🌟 關鍵修正：建立一個初始化批次陣列
    const initialBatchCode = [];

    // 加入 goto (透過 generator 確保格式正確)
    const gotoResult = this.codeGenerator.generate(gotoAction);
    if (gotoResult) {
      const gotoLines = Array.isArray(gotoResult) ? gotoResult : [gotoResult];
      initialBatchCode.push(...gotoLines);
      gotoLines.forEach(line => this.command.appendCode(line));
      this.attachGeneratedCodeToAction(gotoAction, {
        code: gotoLines,
        isReplace: false
      });
      this.store.addAction(gotoAction);
    }

    // 4. 🌟 一次性同步所有初始化代碼，防止多次發送導致的覆蓋問題
    if (initialBatchCode.length > 0) {
      this.safeChromeSendMessage({
          type: "APPEND_RECORD_DATA",
          newCode: initialBatchCode, // 傳送陣列
          isReplace: false,
          newAction: gotoAction // 關聯最後一個動作
        });
    }

    this.hasInitializedRecordingSession = true;
    this.isStarted = true;
    this.store.setRecording(true);
    this.bindListenersToContexts(allContexts);
    this.navigationTracker.start();
    this.startDynamicFrameWatcher();

    return this.getState();
  }

  resumeRecording() {
    if (this.isStarted) return this.getState();

    this.isStarted = true;
    this.hoverPreviewSessionEnabled = true;
    this.store.setRecording(true);

    this.activeListeners.forEach(listener => {
      if (typeof listener.setRecordingState === "function") {
        listener.setRecordingState(true, { allowHoverPreview: true });
      } else {
        listener.isRecording = true;
      }
    });

    this.navigationTracker.start();
    this.startDynamicFrameWatcher();
    return this.getState();
  }

  // 🌟 關鍵新增：專門給新分頁(Popup)或重新整理後的頁面「自動接續錄製」使用
  autoStart() {
    if (this.isStarted) return;
    this.hoverPreviewSessionEnabled = false;

    console.log(`🚀 [MainApp] 偵測到系統正在錄製中，自動啟動監聽器！(身分: ${this.pageAlias})`);

    // 1. 掃描新視窗裡面的環境並註冊
    const scanner = new ContextScanner(this.rootDoc, this.rootWin);
    this.scanResult = scanner.scanAllContexts();
    this.registry.registerMany(this.scanResult.contexts);
    this.syncRegistryToStore();

    const allContexts = this.registry.getAllContexts();
    this.codeGenerator.setContexts(allContexts, this.pageAlias);

    // 2. 正式啟動監聽器與狀態
    this.hasInitializedRecordingSession = true;
    this.isStarted = true;
    this.store.setRecording(true);
    this.bindListenersToContexts(allContexts);
    this.navigationTracker.start();
    this.startDynamicFrameWatcher();
  }

  // 停止錄製器
  stop() {
    // 🌟 新增：錄製結束，清空全域狀態
    this.safeChromeStorageSet({ isRecordingSessionActive: false });
    if (!this.isStarted) return this.getState();


    //this.popupTracker.stop();
    this.stopDynamicFrameWatcher();
    this.navigationTracker.stop();
    //this.clickToPageTracker.stop();

    // [修改] 關閉所有事件監聽器的錄製開關
    this.activeListeners.forEach(l => {
      if (typeof l.setRecordingState === "function") {
        l.setRecordingState(false, { allowHoverPreview: false });
      } else {
        l.isRecording = false;
        l.hoverInspector?.hide?.();
        l.lastPreviewTarget = null;
      }
    });

    this.store.setRecording(false);
    this.isStarted = false;
    this.hoverPreviewSessionEnabled = false;

    return this.getState();
  }

  startDynamicFrameWatcher() {
    if (this.dynamicFrameObserver || !this.rootDoc?.documentElement) return;
    if (typeof MutationObserver === "undefined") return;

    const hasFrameNode = (node) => {
      if (!node) return false;
      if (node.nodeType === 1 && node.matches?.("iframe, frame")) return true;
      return !!node.querySelector?.("iframe, frame");
    };

    this.dynamicFrameObserver = new MutationObserver((mutations) => {
      const shouldRescan = mutations.some((mutation) => {
        if (mutation.type === "childList") {
          return Array.from(mutation.addedNodes || []).some(hasFrameNode);
        }

        if (mutation.type === "attributes") {
          return mutation.target?.matches?.("iframe, frame");
        }

        return false;
      });

      if (shouldRescan) {
        this.scheduleDynamicFrameRescan("iframe mutation");
      }
    });

    this.dynamicFrameObserver.observe(this.rootDoc.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src"]
    });
  }

  stopDynamicFrameWatcher() {
    if (this.dynamicFrameObserver) {
      this.dynamicFrameObserver.disconnect();
      this.dynamicFrameObserver = null;
    }

    if (this.dynamicFrameScanTimer) {
      clearTimeout(this.dynamicFrameScanTimer);
      this.dynamicFrameScanTimer = null;
    }
  }

  scheduleDynamicFrameRescan(reason = "dynamic iframe") {
    if (!this.isStarted) return;

    clearTimeout(this.dynamicFrameScanTimer);
    this.dynamicFrameScanTimer = setTimeout(() => {
      this.dynamicFrameScanTimer = null;
      this.rescanAndBindDynamicFrames(reason);
    }, 800);
  }

  rescanAndBindDynamicFrames(reason = "dynamic iframe") {
    if (!this.isStarted) return;

    console.log("[Debug MainApp] rescan contexts for dynamic iframe", { reason });
    const scanner = new ContextScanner(this.rootDoc, this.rootWin);
    this.scanResult = scanner.scanAllContexts();
    this.registry.registerMany(this.scanResult.contexts);
    this.syncRegistryToStore();
    this.refreshGeneratorContexts();
    this.bindListenersToContexts(this.registry.getAllContexts());
  }

  // 完全重置錄製器 (清除所有資料)
  reset() {
    this.stop();
    this.registry.clear();
    this.store.reset();

    // 【重要修復】如果沒有 clearCode 方法，就重新 new 一個乾淨的實體
    if (typeof this.command.clearCode === 'function') {
      this.command.clearCode();
    } else {
      this.command = new PlaywrightCommand();
      this.codeGenerator.command = this.command;
    }

    this.scanResult = null;
    this.activeListeners = [];
    this.pendingGrapesDrops = [];
    this.hasInitializedRecordingSession = false;
    this.isStarted = false;
    return this.getState();
  }

  // 處理新彈出的視窗 (Popup)
  // 處理新彈出的視窗 (Popup)
  // 處理新彈出的視窗 (Popup)
  handleNewPopup(popupData) {
    console.log("[pop up detected]");
    // 🌟 關鍵修復：無論是不是跨網域，都「必須」把開啟 Popup 的動作記錄下來產出程式碼！
    const action = {
      type: "popup",
      popupId: popupData.popupId,
      url: popupData.popupUrl || "",
      ts: Date.now(),
    };

    this.store.setPendingPopup(popupData);

    // ===== 修改後 =====
    const newLine = this.appendGeneratedCode(action);
    this.attachGeneratedCodeToAction(action, newLine);
    const savedAction = this.addGeneratedAction(action, newLine);
    this.syncToGlobalStorage(newLine, savedAction);

    // popup 內部由新視窗自己的 MainApp.autoStart() 註冊，避免父視窗重複綁定並產生 contextId 撞名。

  }

  // 將 Registry 裡的環境資料同步到 Store 中集中管理
  syncRegistryToStore() {
    this.store.registerContexts(this.registry.getAllContexts());
  }

  // 核心邏輯：將「動作資料」轉譯為「程式碼字串」並存起來


  // 以下為各種 Getter 方法，用於提供對外取得內部狀態的介面

  // 取得錄製到的所有動作列表
  // 取得錄製到的所有動作列表 (安全過濾版)
  getActions() {
    // 避免 chrome.runtime.sendMessage 發生 DataCloneError，必須拔除真實 DOM 節點
    return this.store.getActions().map(act => {
      return this.decorateActionForDisplay(act);
    });
  }

  decorateActionForDisplay(action) {
    const safeAct = { ...action };
    delete safeAct.source;  // 移除無法序列化的真實 DOM 節點
    delete safeAct.target;  // 移除無法序列化的真實 DOM 節點

    safeAct.displaySourceWindow = this.getDisplayContextName(safeAct.sourceWindow);
    safeAct.displayTargetWindow = this.getDisplayContextName(safeAct.targetWindow);

    return safeAct;
  }

  getRecordingViewport() {
    const width = Math.floor(Number(this.rootWin?.innerWidth));
    const height = Math.floor(Number(this.rootWin?.innerHeight));
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      return null;
    }
    return { width, height };
  }

  getDisplayContextName(contextId) {
    if (!contextId) return "";

    if (this.codeGenerator && typeof this.codeGenerator._getContextPrefix === "function") {
      return this.codeGenerator._getContextPrefix(contextId);
    }

    return contextId;
  }

  summarizeDebugSourcePath(sourcePath) {
    if (!sourcePath) return null;

    const summary = {};
    Object.keys(sourcePath).forEach((key) => {
      const item = sourcePath[key];
      if (!item) return;
      summary[key] = {
        funName: item.funName,
        csspath: item.obj?.csspath || null,
        shadowChain: item.obj?.shadowChain || [],
        options: Array.isArray(item.obj?.options)
          ? item.obj.options.map(option => ({
              path: option.path,
              shadowChain: option.shadowChain || [],
              score: option.score,
              U: option.U
            }))
          : []
      };
    });
    return summary;
  }

  describeDebugElement(element) {
    if (!element || element.nodeType !== 1) return String(element);

    const attrs = {};
    ["id", "class", "type", "part", "tab", "value", "data-gjs-type", "role", "aria-label"].forEach((name) => {
      const value = element.getAttribute?.(name);
      if (value !== null && value !== undefined && value !== "") attrs[name] = value;
    });

    return {
      tagName: element.tagName,
      attrs,
      text: (element.innerText || element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80)
    };
  }

  // 取得產生的完整 Playwright 程式碼字串
  getGeneratedCode() {
    return this.command.getCode();
  }

  // 取得整個 App 的綜合狀態 (通常打包傳給 Popup 介面渲染使用)
  getState() {
    return {
      isStarted: this.isStarted,
      isRecording: this.store.isRecording(),
      actions: this.store.getActions(),
      currentAction: this.store.getCurrentAction(),
      contexts: this.store.getAllContexts(),
      generatedCode: this.command.getCode(),
    };
  }

  // 取得供開發者除錯用的詳細狀態
  debugState() {
    return {
      scanResult: this.scanResult,
      registry: this.registry.getAllContexts(),
      store: this.store.getState(),
      code: this.command.getCode(),
      isStarted: this.isStarted,
    };
  }
  // [新增] 動態為掃描到的每一個 Context 掛載對應的事件監聽器
  // 動態為掃描到的每一個 Context 掛載對應的事件監聽器
  bindListenersToContexts(contexts) {
    contexts.forEach(ctx => {
      // 🚨 修正 1：使用 ctx.contextId 而不是 ctx.id
      if (this.store.hasListener(ctx.contextId)) return;

      if (ctx.type === "iframe" && !ctx.documentRef) {
        const frameId = ctx.frameElement?.id || "(no id)";
        const frameName = ctx.frameElement?.name || "(no name)";
        const frameSrc = ctx.frameElement?.getAttribute?.("src") || "(no src)";
        const resolvedSrc = ctx.frameElement?.src || "(no resolved src)";
        console.warn(
          `[Debug MainApp] unable to bind iframe listener: contextId=${ctx.contextId}, id=${frameId}, name=${frameName}, selector=${ctx.frameSelector || "(no selector)"}, src=${frameSrc}, resolvedSrc=${resolvedSrc}`
        );
        console.warn("[Debug MainApp] skip iframe listener because documentRef is null", {
          contextId: ctx.contextId,
          locator: ctx.frameSelector,
          url: ctx.url,
          frameId,
          frameName,
          frameSrc: ctx.frameElement?.getAttribute?.("src") || null,
          resolvedSrc: ctx.frameElement?.src || null
        });
        return;
      }

      let listener = null;

      // 🚨 修正 2：使用 ctx.windowRef 而不是 ctx.window
      const listenerContexts = {
        contextId: ctx.contextId,
        contextSnapshot: this.createContextSnapshot(ctx),
        // 如果是主頁或彈出視窗，就把它的 windowRef 當作 mainWindow
        mainWindow: (ctx.type === 'page' || ctx.type === 'popup') ? ctx.windowRef : this.rootWin,
        // 如果是 iframe，就把它的 windowRef 給 iframeWindow
        iframeWindow: ctx.type === 'iframe' ? ctx.windowRef : null
      };

      // 根據環境類型實例化對應的 Listener
      if (ctx.type === 'page' || ctx.type === 'popup') {
        listener = new OuterEventListener(
          listenerContexts,
          this.domParserService,
          (action) => this.handleUserAction(action)
        );
      } else if (ctx.type === 'iframe') {
        listener = new IframeEventListener(
          listenerContexts,
          this.domParserService,
          (action) => this.handleUserAction(action)
        );
      }

      // 如果成功建立，則初始化並記錄起來
      if (listener) {
        listener.init();
        if (typeof listener.setRecordingState === "function") {
          listener.setRecordingState(this.isStarted, {
            allowHoverPreview: this.hoverPreviewSessionEnabled === true
          });
        } else {
          listener.isRecording = this.isStarted;
        }
        this.activeListeners.push(listener);
        this.store.registerListener(ctx.contextId);
      }
    });

    // Debug: 顯示目前已掛上監聽器的所有 iframe contextId / locator
    const activeIframes = this.registry
      .getContextsByType("iframe")
      .filter((iframeCtx) => this.store.hasListener(iframeCtx.contextId))
      .map((iframeCtx) => ({
        contextId: iframeCtx.contextId,
        locator: iframeCtx.frameSelector,
        url: iframeCtx.url,
        hasDocument: !!iframeCtx.documentRef
      }));

    console.table(activeIframes);
  }

  appendGeneratedCode(action) {
    this.refreshGeneratorContexts();
    const result = this.codeGenerator.generate(action);
    console.log("[Debug MainApp] appendGeneratedCode result", {
      actionType: action?.type || null,
      sourceWindow: action?.sourceWindow || null,
      result
    });
    if (!result) return null;

    let codeToReturn = result;
    let isReplace = false;

    // 處理 Generator 要求覆寫上一行的情況
    if (typeof result === 'object' && result.isReplace) {
      codeToReturn = result.code;
      isReplace = true;
      // 替換本地 Command 的最後一行
      this.command.code.pop();
      if (Array.isArray(codeToReturn)) {
        codeToReturn.forEach(l => this.command.codeSetter(l));
      }
    } else {
      if (typeof this.command.codeSetter === 'function') {
        if (Array.isArray(codeToReturn)) {
          codeToReturn.forEach(line => this.command.codeSetter(line));
        } else {
          this.command.codeSetter(codeToReturn);
        }
      } else {
        if (Array.isArray(codeToReturn)) {
          codeToReturn.forEach(line => this.command.appendCode(line));
        } else {
          this.command.appendCode(codeToReturn);
        }
      }
    }
    console.log("[Debug MainApp] appendGeneratedCode stored", {
      codeToReturn,
      isReplace,
      commandCode: this.command.code
    });
    return { code: codeToReturn, isReplace };
  }

  attachGeneratedCodeToAction(action, codeResult) {
    if (!action || !codeResult || !codeResult.code) return;

    const lines = Array.isArray(codeResult.code) ? codeResult.code : [codeResult.code];
    action.generatedCodeLines = lines;
    action.generatedCodeLine = lines[lines.length - 1] || "";
    action.generatedCodeReplacesPrevious = codeResult.isReplace === true;
  }

  addGeneratedAction(action, codeResult) {
    let replacedAction = null;
    if (codeResult?.isReplace && typeof this.store.removeLastAction === "function") {
      replacedAction = this.store.removeLastAction();
    }

    if (replacedAction) {
      action.triggerAction = this.decorateActionForDisplay(replacedAction);
    }

    return this.store.addAction(action);
  }

  updateRecordedAction(actionId, actionIndex, patch) {
    return this.store.updateAction(actionId, actionIndex, patch);
  }

  setHoverPreviewSessionEnabled(enabled) {
    this.hoverPreviewSessionEnabled = enabled === true;
    try {
      this.safeChromeStorageSet({ hoverPreviewSessionEnabled: this.hoverPreviewSessionEnabled });
    } catch (error) {
      console.warn("[MainApp] Unable to persist hover preview session state", error);
    }
    this.activeListeners.forEach(listener => {
      if (typeof listener.setHoverPreviewSessionEnabled === "function") {
        listener.setHoverPreviewSessionEnabled(this.hoverPreviewSessionEnabled);
      }
    });
  }

  refreshGeneratorContexts() {
    const allContexts = this.registry.getAllContexts();
    this.codeGenerator.setContexts(allContexts, this.pageAlias);
  }
  // 🌟 關鍵新增：統一處理增量同步到 Background 的機制
  syncToGlobalStorage(codeResult, action) {
    const safeAct = this.decorateActionForDisplay(action);

    this.safeChromeSendMessage({
      type: "APPEND_RECORD_DATA",
      newCode: codeResult ? codeResult.code : null,
      isReplace: codeResult ? codeResult.isReplace : false, // 傳遞覆寫訊號
      newAction: safeAct
    });
    console.log("[Debug MainApp] syncToGlobalStorage sent", {
      newCode: codeResult ? codeResult.code : null,
      isReplace: codeResult ? codeResult.isReplace : false,
      actionType: safeAct?.type || null,
      sourceWindow: safeAct?.sourceWindow || null
    });
  }

}

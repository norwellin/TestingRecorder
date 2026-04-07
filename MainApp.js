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

    this.setupBackgroundMessageListener();

    this.registry = new ContextRegistry();
    this.store = new RecorderStore();

    this.domParserService = new DOMParserService({
      mainWindow: rootWin
    });

    this.command = new PlaywrightCommand();

    this.pageAlias = 'page'; 
    this.codeGenerator = new PlaywrightCodeGenerator(this.domParserService, this.command, this.pageAlias);

    this.navigationTracker = new NavigationTracker({
      rootWindow: this.rootWin,
      onNavigate: (navInfo) => {
        const action = { type: "navigate", ...navInfo, ts: Date.now() };
        const newLine = this.appendGeneratedCode(action);
        const savedAction = this.store.addAction(action);
        this.syncToGlobalStorage(newLine, savedAction);
      },
    });

    // 🌟 關鍵修復：統一處理身分認領與自動喚醒機制
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(['latestPopupAlias', 'recorderStatus'], (result) => {
        
        // 1. 如果是新視窗，認領自己的專屬變數名稱 (例如 popup_123456)
        if (window.opener && result.latestPopupAlias) {
          this.pageAlias = result.latestPopupAlias;
          this.codeGenerator.pageAlias = this.pageAlias;
          console.log(`🆔 [MainApp] 認領身分成功！我的 Playwright 變數名稱是: ${this.pageAlias}`);
          
          // 認領完畢後，把小本本擦掉，以免其他新視窗誤認
          chrome.storage.local.remove('latestPopupAlias');
        }

        // 2. 如果整個系統正在錄製中，這個新視窗必須「自動開工」！
        if (result.recorderStatus === 'recording') {
          this.autoStart();
        }
      });
    }
  }
  // 🌟 貼上這個新方法：專門處理 Background 傳來的跨世界/原生 Popup 事件
  // ==================== myrecorderRestructure/MainApp1.js ====================
// 將這段函式加在 MainApp1 類別裡面

  // 接收 Background 傳來的原生 Popup 通知
  setupBackgroundMessageListener() {
    if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.onMessage) return;

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
        const savedAction = this.store.addAction(action);
        this.syncToGlobalStorage(newLine, savedAction);

        // 4. 即時更新畫面 UI
        try {
          chrome.runtime.sendMessage({
            type: "display_code",
            code: this.command.codeGetter ? this.command.codeGetter() : this.getGeneratedCode()
          }).catch(() => {});
          
          chrome.runtime.sendMessage({
            type: "display_useraction",
            action: this.getActions()
          }).catch(() => {});
        } catch (e) {
          console.warn("[MainApp] UI 同步失敗:", e);
        }
      }
      return false; // 非同步安全機制
    });
  }
  // 統一處理來自各個 Listener (Page/Iframe/Popup) 的互動動作
  handleUserAction(action) {
    if (!this.isStarted) return;
    console.log("[Debug MainApp] 接收到 Action:", action.type, action);
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
        sourceElementInfo: action.getSourceElement(),
        sourcePath: sourcePath // 預先存好解析結果
      });
      return;
    }
    
    if (action.isDrop) {
      const session = this.store.getDragSession();
      if (!session.isDragging) return;

      action.setSourceWindow(session.sourceContextId);
      action.setSourceElement(session.sourceElementInfo);
      // 將預先解析好的路徑塞入 action，避免後續重複解析失敗
      action.preParsedSourcePath = session.sourcePath; 
      
      this.store.endDragSession();
    }
  }
    // ==========================================
    
    // ===== 修改後 =====
    const newLine = this.appendGeneratedCode(action);
    const savedAction = this.store.addAction(action);
    this.syncToGlobalStorage(newLine, savedAction);
    

    // 把最新的狀態發送給擴充功能 UI
    if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: "display_code",
        code: this.command.codeGetter ? this.command.codeGetter() : this.getGeneratedCode()
      }).catch(() => {});
      
      chrome.runtime.sendMessage({
        type: "display_useraction",
        action: this.getActions()
      }).catch(() => {});
    }
  }
  // 啟動錄製器
  // 檔案：myrecorderRestructure/MainApp.js

start() {
    if (this.isStarted) return this.getState();

    // 1. 掃描環境並註冊
    const scanner = new ContextScanner(this.rootDoc, this.rootWin);
    this.scanResult = scanner.scanAllContexts();
    this.registry.registerMany(this.scanResult.contexts);
    this.syncRegistryToStore();

    // 2. 產生所有環境宣告 (iframe_1, iframe_2...)
    const allContexts = this.registry.getAllContexts();
    const declarations = this.codeGenerator.declareContexts(allContexts, this.pageAlias);

    // 3. 準備初始導航動作 (page.goto)
    const gotoAction = { 
        type: "navigate", 
        url: window.location.href, 
        ts: Date.now() 
    };

    // 🌟 關鍵修正：建立一個初始化批次陣列
    const initialBatchCode = [];
    
    // 先加入宣告
    if (declarations && declarations.length > 0) {
        declarations.forEach(line => initialBatchCode.push(line));
    }

    // 再加入 goto (透過 generator 確保格式正確)
    const gotoResult = this.codeGenerator.generate(gotoAction);
    if (gotoResult) {
        initialBatchCode.push(gotoResult);
        this.command.appendCode(gotoResult);
    }

    // 4. 🌟 一次性同步所有初始化代碼，防止多次發送導致的覆蓋問題
    if (initialBatchCode.length > 0) {
        if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({
                type: "APPEND_RECORD_DATA",
                newCode: initialBatchCode, // 傳送陣列
                isReplace: false,
                newAction: gotoAction // 關聯最後一個動作
            }).catch(() => {});
        }
    }

    this.isStarted = true;
    this.store.setRecording(true);
    this.bindListenersToContexts(allContexts);
    
    return this.getState();
}
// 🌟 關鍵新增：專門給新分頁(Popup)或重新整理後的頁面「自動接續錄製」使用
  autoStart() {
    if (this.isStarted) return;
    
    console.log(`🚀 [MainApp] 偵測到系統正在錄製中，自動啟動監聽器！(身分: ${this.pageAlias})`);

    // 1. 掃描新視窗裡面的環境並註冊
    const scanner = new ContextScanner(this.rootDoc, this.rootWin);
    this.scanResult = scanner.scanAllContexts();
    this.registry.registerMany(this.scanResult.contexts);
    this.syncRegistryToStore();

    // 2. 如果新視窗裡面也有 iframe，產生 iframe 宣告 
    const allContexts = this.registry.getAllContexts();
    const declarations = this.codeGenerator.declareContexts(allContexts, this.pageAlias);

    // 3. 把宣告同步回 Background (不需要 goto)
    if (declarations && declarations.length > 0) {
      if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          type: "APPEND_RECORD_DATA",
          newCode: declarations, 
          isReplace: false,
          newAction: null
        }).catch(() => {});
      }
    }

    // 4. 正式啟動監聽器與狀態
    this.isStarted = true;
    this.store.setRecording(true);
    this.bindListenersToContexts(allContexts);
  }

  // 停止錄製器
  stop() {
    // 🌟 新增：錄製結束，清空全域狀態
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ isRecordingSessionActive: false });
    }
    if (!this.isStarted) return this.getState();


    //this.popupTracker.stop();
    this.navigationTracker.stop();
    //this.clickToPageTracker.stop();

    // [修改] 關閉所有事件監聽器的錄製開關
    this.activeListeners.forEach(l => l.isRecording = false);

    this.store.setRecording(false);
    this.isStarted = false;

    return this.getState();
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
    this.isStarted = false;
    return this.getState();
  }

  // 處理新彈出的視窗 (Popup)
  // 處理新彈出的視窗 (Popup)
  // 處理新彈出的視窗 (Popup)
  handleNewPopup(popupData) {
    console.log("[pop up detected]");
    // 🚨 修正屬性名稱：Tracker 傳來的是 popupDocument 與 popupWindow
    const popupDoc = popupData?.popupDocument;
    const popupWin = popupData?.popupWindow;
    
    // 至少要有 window 物件才算有效的彈出視窗
    //if (!popupWin) return;

    // 🌟 關鍵修復：只有在「同網域」且拿得到 document 的情況下，才去掃描裡面的 iframe
    if (popupDoc) {
      const scanner = new ContextScanner(popupDoc, popupWin, { rootType: "popup" });
      const result = scanner.scanAllContexts(); 
      this.registry.registerMany(result.contexts);
      this.syncRegistryToStore();
      this.bindListenersToContexts(result.contexts);
    }

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
    const savedAction = this.store.addAction(action);
    this.syncToGlobalStorage(newLine, savedAction);

    // 同步更新 UI
    if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: "display_code",
        code: this.command.codeGetter ? this.command.codeGetter() : this.getGeneratedCode()
      }).catch(() => {});
      
      chrome.runtime.sendMessage({
        type: "display_useraction",
        action: this.getActions()
      }).catch(() => {});
    }
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
      const safeAct = { ...act };
      delete safeAct.source;  // 移除無法序列化的真實 DOM 節點
      delete safeAct.target;  // 移除無法序列化的真實 DOM 節點
      return safeAct;
    });
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

      let listener = null;
      
      // 🚨 修正 2：使用 ctx.windowRef 而不是 ctx.window
      const listenerContexts = {
        contextId: ctx.contextId,
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
        listener.isRecording = this.isStarted; 
        this.activeListeners.push(listener);
        this.store.registerListener(ctx.contextId);
      }
    });
  }

  appendGeneratedCode(action) {
    const result = this.codeGenerator.generate(action);
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
            this.command.codeSetter(codeToReturn);
        } else {
            this.command.appendCode(codeToReturn);
        }
    }
    return { code: codeToReturn, isReplace };
  }
  // 🌟 關鍵新增：統一處理增量同步到 Background 的機制
  syncToGlobalStorage(codeResult, action) {
    if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) return;

    const safeAct = { ...action };
    delete safeAct.source;
    delete safeAct.target;

    chrome.runtime.sendMessage({
      type: "APPEND_RECORD_DATA",
      newCode: codeResult ? codeResult.code : null,
      isReplace: codeResult ? codeResult.isReplace : false, // 傳遞覆寫訊號
      newAction: safeAct
    }).catch(() => {});
  }
  
}
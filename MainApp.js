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

    this.isStarted = false; // 標記整體 App 是否已經啟動
    this.scanResult = null; // 儲存初始化時掃描網頁 (ContextScanner) 的結果

    // [新增] 存放所有實例化的 Listeners，以便後續啟停控制
    this.activeListeners = [];

    // 🌟 貼上這段：接收來自 Background 的「上帝視角」原生 Popup 通知
    this.setupBackgroundMessageListener();

    // 初始化狀態儲存與環境註冊表
    this.registry = new ContextRegistry();
    this.store = new RecorderStore();

    // 初始化 DOM 解析服務，傳入主視窗物件
    this.domParserService = new DOMParserService({
      mainWindow: rootWin
    });


    // 初始化程式碼生成器與指令儲存庫
    this.command = new PlaywrightCommand();

    this.pageAlias = 'page'; // 預設

    // 因為去 storage 取資料是非同步的，我們先用預設值實例化 Generator
    // 記得把 this.pageAlias 當作第三個參數傳進去！
    this.codeGenerator = new PlaywrightCodeGenerator(this.domParserService, this.command, this.pageAlias);

    if (window.opener && typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(['latestPopupAlias'], (result) => {
        if (result.latestPopupAlias) {
          this.pageAlias = result.latestPopupAlias;
          // 🌟 認領身分成功後，務必也要更新 Generator 裡面的變數！
          this.codeGenerator.pageAlias = this.pageAlias;
          console.log(`🆔 [MainApp] 認領身分成功！更新 Generator 變數為: ${this.pageAlias}`);
        }
      });
    }
    
    // 2. 導航 (網址跳轉) 追蹤器
    this.navigationTracker = new NavigationTracker({
      rootWindow: this.rootWin,
      onNavigate: (navInfo) => {
        const action = { type: "navigate", ...navInfo, ts: Date.now() };
        // ===== 修改後 =====
        const newLine = this.appendGeneratedCode(action);
        const savedAction = this.store.addAction(action);
        this.syncToGlobalStorage(newLine, savedAction);
      },
    });
    // 預設變數名稱為 'page' (主視窗)
    this.pageAlias = 'page'; 
    
    // 🌟 關鍵修復 2：如果是新視窗，去 storage 認領自己的專屬變數名稱
    if (window.opener && typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(['latestPopupAlias'], (result) => {
        if (result.latestPopupAlias) {
          this.pageAlias = result.latestPopupAlias;
          console.log(`🆔 [MainApp] 認領身分成功！我的 Playwright 變數名稱是: ${this.pageAlias}`);
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
    
    // ===== 拖放事件 (Drag & Drop) 狀態組裝邏輯 =====
    if (action.type === "dragANDdrop") {
      // 1. 如果是拖曳起點
      if (action.isDragStart) {
        this.store.startDragSession({ 
          sourceContextId: action.sourceWindow,
          sourceElementInfo: action.getSourceElement()
        });
        return; // 起點不急著產 code，先存起來等終點
      }
      
      // 2. 如果是拖曳終點 (Drop)
      if (action.isDrop) {
        const session = this.store.getDragSession();
        // 如果之前沒有紀錄到起點，這可能只是個無效的 drop，直接忽略
        if (!session.isDragging) return;
        
        // 將起點與終點的資料合併到同一個 action 中
        action.setSourceWindow(session.sourceContextId);
        action.setSourceElement(session.sourceElementInfo);
        //action.setTargetWindow(action.sourceWindow); // 這裡的 sourceWindow 實際上是 drop 時當下的 window
        // target element 已在 Listener 階段綁定
        
        this.store.endDragSession(); // 清除拖拉狀態
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
  start() {
    if (this.isStarted) return this.getState();

    // 🌟 關鍵修復：確保寫入全域狀態，並印出確認訊息
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ isRecordingSessionActive: true }, () => {
        if (chrome.runtime.lastError) {
          console.error("❌ [MainApp] 寫入全域錄製狀態失敗:", chrome.runtime.lastError);
        } else {
          console.log("💾 [MainApp] 已成功將「錄製中」狀態寫入全域資料庫！(isRecordingSessionActive: true)");
        }
      });
    } else {
       console.warn("⚠️ [MainApp] 找不到 chrome.storage API，無法同步跨視窗狀態！請檢查 manifest.json 是否有 storage 權限。");
    }

    // 1. 掃描環境
    const scanner = new ContextScanner(this.rootDoc, this.rootWin);
    this.scanResult = scanner.scanAllContexts();
    // 🔍 加入這行：確認掃描到的原始資料
    console.log("🔍 [Debug] Scanner 掃描到的所有 Contexts:", this.scanResult.contexts);
    // 2. 註冊環境並同步到 Store
    this.registry.clear();
    this.registry.registerMany(this.scanResult.contexts);
    this.syncRegistryToStore();
     // 🌟 [新增] 將掃描到的環境交給 Generator 建立 iframe 變數
    //this.codeGenerator.declareContexts(this.scanResult.contexts, this.pageAlias);
    
    // 🌟【關鍵修改】：在此處呼叫 declareContexts
  // 這會確保在任何 click 發生前，iframe 的宣告 (const iframe_1 = ...) 已經進入 command 陣列
  // 🌟 修正：獲取所有 contexts 並執行宣告
  const allContexts = this.registry.getAllContexts(); 
  // 🔍 加入這行：確認 Registry 整理後的資料
    console.log("🔍 [Debug] Registry 中的 Contexts (準備傳給 Generator):", allContexts);
  const declarations = this.codeGenerator.declareContexts(allContexts, this.pageAlias);
  // 🔍 加入這行：確認產生器回傳了哪些宣告字串
    console.log("🔍 [Debug] Generator 產出的宣告內容:", declarations);
  // 🌟【關鍵修改】：將生成的宣告同步到全域儲存空間 (Background)，否則其他視窗看不到這些宣告
  // 🌟 修正點：將所有宣告合併後一次同步
    // 3. 【修正點】逐行同步宣告，不要合併，但確保順序
    if (declarations && declarations.length > 0) {
        declarations.forEach(line => {
            // 直接推送到 Command 與 GlobalStorage，不要觸發 isReplace
            this.syncToGlobalStorage({ code: line, isReplace: false }, null);
        });
    }
    
    // 🌟 新增：載入頁面並掃描完畢後，立刻印出樹狀結構供除錯
    console.log("🌍 [MainApp] 頁面掃描完成！當前的 Context 樹狀結構：");
    this.registry.printTree();
    
    // 3. 啟動 Trackers
    //this.popupTracker.start();
    this.navigationTracker.start();
    //this.clickToPageTracker.start();

    // 4. [修改] 為剛掃描到的所有環境綁定事件監聽器
    this.bindListenersToContexts(this.registry.getAllContexts());

    // 5. [修改] 啟動所有一般事件監聽器的 isRecording 開關
    this.activeListeners.forEach(l => l.isRecording = true);

    // 6. 更新狀態
    this.store.setRecording(true);
    this.isStarted = true;
    // 🌟 新增：錄製啟動時，確認是否為全新錄製，若是則自動補上當前頁面的 goto 指令
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['generatedCode'], (result) => {
        // 如果 global 的程式碼為空，代表是第一步
        if (!result.generatedCode || result.generatedCode.length === 0) {
          const gotoAction = { 
            type: "navigate", 
            url: window.location.href, 
            ts: Date.now() 
          };
          const newLine = this.appendGeneratedCode(gotoAction);
          const savedAction = this.store.addAction(gotoAction);
          this.syncToGlobalStorage(newLine, savedAction);
        }
      });
    }
    // 在 start() 函式的最後面 (return this.getState(); 之前) 加上：
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      // 這裡改讀取純淨的 Body 陣列
      chrome.storage.local.get(['generatedCodeBody'], (result) => {
        if (!result.generatedCodeBody || result.generatedCodeBody.length === 0) {
          const gotoAction = { type: "navigate", url: window.location.href, ts: Date.now() };
          const codeResult = this.appendGeneratedCode(gotoAction);
          const savedAction = this.store.addAction(gotoAction);
          this.syncToGlobalStorage(codeResult, savedAction);
        }
      });
    }
    return this.getState();
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
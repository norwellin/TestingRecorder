export function setupRecorderBridge({ MainApp }) {
  let app = null;
  let isRecording = false;

  function isExtensionContextAvailable() {
    try {
      return typeof chrome !== "undefined" && !!chrome.runtime?.id;
    } catch (error) {
      return false;
    }
  }

  function handleExtensionContextError(error, operation) {
    const message = error?.message || String(error);
    if (message.includes("Extension context invalidated")) {
      console.warn(`[Bridge] Extension context invalidated while trying to ${operation}. Please reload the page after reloading the extension.`);
      return true;
    }

    console.warn(`[Bridge] Chrome extension API failed while trying to ${operation}`, error);
    return false;
  }

  function safeSendMessage(message) {
    if (!isExtensionContextAvailable() || !chrome.runtime?.sendMessage) return null;

    try {
      const result = chrome.runtime.sendMessage(message);
      if (result?.catch) {
        result.catch((error) => handleExtensionContextError(error, "send runtime message"));
      }
      return result;
    } catch (error) {
      handleExtensionContextError(error, "send runtime message");
      return null;
    }
  }

  function safeStorageGet(keys, callback) {
    if (!isExtensionContextAvailable() || !chrome.storage?.local) return;

    try {
      chrome.storage.local.get(keys, (result) => {
        const runtimeError = chrome.runtime?.lastError;
        if (runtimeError) {
          handleExtensionContextError(runtimeError, "read storage");
          return;
        }
        callback(result || {});
      });
    } catch (error) {
      handleExtensionContextError(error, "read storage");
    }
  }

  function safeStorageSet(value) {
    if (!isExtensionContextAvailable() || !chrome.storage?.local) return;

    try {
      chrome.storage.local.set(value, () => {
        const runtimeError = chrome.runtime?.lastError;
        if (runtimeError) handleExtensionContextError(runtimeError, "write storage");
      });
    } catch (error) {
      handleExtensionContextError(error, "write storage");
    }
  }

  function ensureApp() {
    if (!isExtensionContextAvailable()) return null;
    if (!app) {
      try {
        app = new MainApp(document, window);
      } catch (error) {
        handleExtensionContextError(error, "create MainApp");
        return null;
      }
    }
    return app;
  }

  // 修正 1：移除無效的 window.playwrightCommand，改用正規的 app.getGeneratedCode()
  function getGeneratedCodeLines() {
    if (!app) return [];
    
    // 從核心取得生成的程式碼 (現在是取得 Array)
    const code = app.getGeneratedCode();
    
    // 如果已經是陣列就直接回傳，如果是字串才做切割，否則給空陣列
    if (Array.isArray(code)) {
      return code;
    }
    return typeof code === "string" ? code.split("\n") : [];
  }

  // 修正 2：不越權讀取 app.store，直接呼叫 app.getActions()
  // 🌟 關鍵修復 3：改寫 pushActionsAndCode，導入全域狀態同步機制
  function pushActionsAndCode() {
    if (!app) return;

    // 取得當前視窗「新產生」的動作
    const localActions = typeof app.getActions === "function" ? app.getActions() : [];
    const localCode = getGeneratedCodeLines();

    if (isExtensionContextAvailable() && chrome.storage?.local) {
      // 1. 先去下載全域的歷史紀錄
      safeStorageGet(['globalActions', 'globalCode'], (result) => {
        const historyActions = result.globalActions || [];
        const historyCode = result.globalCode || [];

        // 2. 判斷是否需要合併 (如果 localActions 只有一兩步，代表它是新視窗，必須接在 history 後面)
        // 為了簡單起見，我們讓每次 action 發生時，都直接更新 Storage 裡的總表。
        // *這裡提供一個簡易的覆蓋/合併邏輯：*
        
        let mergedActions = localActions;
        let mergedCode = localCode;

        // 如果這是一個新視窗 (它的動作數量比歷史紀錄還少)，代表它發生了「失憶蓋台」
        if (localActions.length < historyActions.length && isRecording) {
            // 把本地的新動作，接在歷史紀錄的後面！
            mergedActions = [...historyActions, ...localActions.slice(-1)]; 
            // 程式碼也接在後面
            mergedCode = [...historyCode, ...localCode.slice(-1)];
            
            // 把合併後的結果塞回給當前的 app (治好它的失憶症)
            if (typeof app.setActions === "function") app.setActions(mergedActions);
            // 注意：你可能需要給 app 寫一個 setCode 或 initCode 的方法
        }

        // 3. 把最新的總表存回 Storage，供下一個視窗使用
        safeStorageSet({ 
            globalActions: mergedActions,
            globalCode: mergedCode
        });

        // 4. 發送給 UI 顯示
        safeSendMessage({
          type: "RECORDER_ACTIONS_UPDATE",
          action: mergedActions
        });

        safeSendMessage({
          type: "RECORDER_CODE_UPDATE",
          code: mergedCode
        });
      });
    }
  }

  function startRecording() {
    const instance = ensureApp();
    if (!instance) return;
    if (typeof instance.setHoverPreviewSessionEnabled === "function") {
      instance.setHoverPreviewSessionEnabled(true);
    }
    if (!isRecording) {
      instance.start();
      isRecording = true;

      safeSendMessage({
        type: "RECORDER_STATUS_UPDATE",
        status: "recording"
      });
    }
  }

  function stopRecording() {
    if (!app) return;

    // 前一次抓出的 Bug：必須確實呼叫核心的 stop！
    if (typeof app.stop === "function") {
      app.stop();
    }

    isRecording = false;
    safeStorageSet({ hoverPreviewSessionEnabled: false });
    //pushActionsAndCode(); // 停止時把最後一次的狀態推播給背景

    safeSendMessage({
      type: "RECORDER_STATUS_UPDATE",
      status: "idle"
    });
  }

  // 修正 3：必須呼叫 app.reset() 讓核心重置所有子系統，而非只呼叫 app.store.reset()
  function clearRecording() {
    if (app && typeof app.reset === "function") {
      app.reset();
    }

    // 發送空資料給背景，同步清除 Storage 狀態
    safeSendMessage({ type: "RECORDER_ACTIONS_UPDATE", action: [] });
    safeSendMessage({ type: "RECORDER_CODE_UPDATE", code: [] });
    safeSendMessage({ type: "RECORDER_STATUS_UPDATE", status: "idle" });

    isRecording = false;
    safeStorageSet({ hoverPreviewSessionEnabled: false });
  }

  // ==========================================
  // 監聽器設定 (Listeners)
  // ==========================================

  if (isExtensionContextAvailable() && chrome.runtime?.onMessage) {
    try {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message?.type) return;
    // 🚨 關鍵修復 1：防止 iframe 接收背景指令並重複啟動
    if (window !== window.top) return;
    if (message.type === "START_RECORDING") {
      startRecording();
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "STOP_RECORDING") {
      stopRecording();
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "CLEAR_RECORDING") {
      clearRecording();
      sendResponse({ ok: true });
      return;
    }
      });
    } catch (error) {
      handleExtensionContextError(error, "register runtime message listener");
    }
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data || event.data.source !== "RECORDER_EXTENSION") return;
    // 🚨 防止 iframe 執行
    if (window !== window.top) return;
    if (event.data.type === "START_RECORDING") startRecording();
    if (event.data.type === "STOP_RECORDING") stopRecording();
    if (event.data.type === "CLEAR_RECORDING") clearRecording();
  
  
    
  });

  // ==========================================
  // 🌟 關鍵修復：新視窗載入時，自動檢查全域錄製狀態
  // ==========================================
  // ==========================================
  // 🌟 關鍵修復：新視窗載入時，自動檢查全域錄製狀態
  // ==========================================
// ==========================================
  // 🌟 關鍵修復：新視窗載入時，自動檢查全域錄製狀態
  // ==========================================
  if (isExtensionContextAvailable() && chrome.storage?.local) {
    // 🚨 確保只有最頂層的視窗才允許自動喚醒錄製器（防止 iframe 群魔亂舞）
    if (window === window.top) {
      safeStorageGet(['recorderStatus'], (result) => {
        console.log(`🌉 [Bridge] 頂層視窗啟動，檢查全域狀態:`, result);
        
        if (result && result.recorderStatus === "recording") {
          console.log('🌍 [Bridge] 偵測到全域錄製狀態為 ON，準備自動喚醒！');
          
          const autoStart = () => {
            console.log('⏳ [Bridge] DOM 準備完畢，建立 MainApp 讓它接管自動啟動！');
            
            // 🚨 關鍵修改 1：這裡「絕對不要」呼叫 startRecording()
            // 我們只呼叫 ensureApp() 確保 MainApp 被建立出來。
            // 接著 MainApp 的 constructor 就會自己去認領 popup_xxx 的名字，
            // 並自動呼叫它內部的「無 goto 版」 autoStart() 函式。
            ensureApp(); 
            
            // 🚨 關鍵修改 2：手動把 Bridge 層級的錄製開關打開，確保能監聽到點擊動作
            isRecording = true; 
          };

          if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(autoStart, 1000); 
          } else {
            window.addEventListener('load', () => setTimeout(autoStart, 1000));
          }
        } else {
          console.log('💤 [Bridge] 未偵測到錄製狀態，等待手動啟動。');
        }
      });
    }
  }
} // 結束 setupRecorderBridge 函式

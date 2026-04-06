chrome.action.onClicked.addListener(() => {
  chrome.windows.create({
    url: chrome.runtime.getURL("popup.html"),
    type: "popup",
    width: 1200,
    height: 700,
    focused: true
  });
});

async function getTargetTab() {
  // 將 lastFocusedWindow 替換為 windowType: "normal"
  const tabs = await chrome.tabs.query({
    active: true,
    windowType: "normal" // 🚨 關鍵修改：只找一般的瀏覽器視窗，忽略 popup 視窗
  });

  // 找出該視窗中，不是擴充功能、不是 chrome 內建頁面的合法分頁
  const targetTab = tabs.find(
    (tab) =>
      tab.id &&
      tab.url &&
      !tab.url.startsWith("chrome-extension://") &&
      !tab.url.startsWith("chrome://")
  );

  return targetTab || null;
}

async function sendCommandToRecorder(commandType) {
  const targetTab = await getTargetTab();

  if (!targetTab) {
    console.error("No valid web page found to record.");
    chrome.runtime.sendMessage({
      type: "RECORDER_ERROR",
      error: "No valid active tab found."
    });
    return;
  }

  try {
    await chrome.tabs.sendMessage(targetTab.id, { type: commandType });
  } catch (err) {
    console.warn("tabs.sendMessage failed, trying executeScript fallback:", err);

    await chrome.scripting.executeScript({
      target: { tabId: targetTab.id, allFrames: true },
      func: (msg) => {
        window.postMessage({ source: "RECORDER_EXTENSION", ...msg }, "*");
      },
      args: [{ type: commandType }]
    });
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("background received:", message);

  (async () => {
    if (message.type === "START_RECORDING") {
      await chrome.storage.local.set({ recorderStatus: "recording" });
      await sendCommandToRecorder("START_RECORDING");
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "STOP_RECORDING") {
      await chrome.storage.local.set({ recorderStatus: "idle" });
      await sendCommandToRecorder("STOP_RECORDING");
      sendResponse({ ok: true });
      return;
    }

    // 🌟 新增這個區塊：負責處理「增量附加」動作與程式碼
    if (message.type === "APPEND_RECORD_DATA") {
      // 分離儲存：generatedCodeBody 存純動作，generatedCode 存含外框的完整字串
      const data = await chrome.storage.local.get(["generatedCodeBody", "generatedAction"]);
      
      let codeBody = Array.isArray(data.generatedCodeBody) ? data.generatedCodeBody : [];
      const currentAction = Array.isArray(data.generatedAction) ? data.generatedAction : [];
      
      // 接收到 MainApp 傳來的覆寫訊號，剔除上一行 click
      if (message.isReplace && codeBody.length > 0) {
          codeBody.pop(); 
      }
      
      if (message.newCode) {
          const newLines = Array.isArray(message.newCode) ? message.newCode : [message.newCode];
          codeBody.push(...newLines);
      }
      
      if (message.newAction) {
          currentAction.push(message.newAction);
      }
      
      // 🌟 在這裡單純地套上靜態外框
      const fullCode = [
          "import { test, expect } from '@playwright/test';",
          "",
          "test('test', async ({ page }) => {",
          ...codeBody.map(line => "  " + line),
          "});"
      ];
      
      await chrome.storage.local.set({
          generatedCodeBody: codeBody,
          generatedCode: fullCode, // 讓 UI 直接拿這包顯示
          generatedAction: currentAction
      });
      
      sendResponse({ ok: true });
      return;
    }
    
    // ⚠️ 記得在 CLEAR_RECORDING 時，也把 generatedCodeBody 清空：
    if (message.type === "CLEAR_RECORDING") {
      await chrome.storage.local.set({
        generatedCode: [],
        generatedCodeBody: [], // 新增這行
        generatedAction: [],
        recorderStatus: "idle"
      });
      await sendCommandToRecorder("CLEAR_RECORDING");
      sendResponse({ ok: true });
      return;
    }
    if (message.type === "RECORDER_CODE_UPDATE" || message.type === "display_code") {
      await chrome.storage.local.set({
        generatedCode: Array.isArray(message.code) ? message.code : [String(message.code ?? "")]
      });
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "RECORDER_ACTIONS_UPDATE" || message.type === "display_useraction") {
      await chrome.storage.local.set({
        generatedAction: Array.isArray(message.action) ? message.action : []
      });
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "RECORDER_STATUS_UPDATE") {
      await chrome.storage.local.set({
        recorderStatus: message.status || "idle"
      });
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "GET_RECORDER_STATE") {
      const data = await chrome.storage.local.get([
        "generatedCode",
        "generatedAction",
        "recorderStatus"
      ]);
      sendResponse({
        ok: true,
        state: {
          generatedCode: data.generatedCode || [],
          generatedAction: data.generatedAction || [],
          recorderStatus: data.recorderStatus || "idle"
        }
      });
      return;
    }

    sendResponse({ ok: false, error: "Unknown message type" });
  })();

  return true;
});

// ==================== myrecorderRestructure/background.js ====================

// 用來暫存剛建立、但還沒拿到真實網址的新分頁 (Key: tabId, Value: openerTabId)
const pendingPopups = new Map();

// 1. 捕捉新分頁誕生的瞬間
chrome.tabs.onCreated.addListener(async (tab) => {
  try {
    // 找出是誰開啟了這個新分頁
    let openerId = tab.openerTabId;
    if (!openerId) {
      // 如果 Chrome 沒給，就抓當前一般視窗的活躍分頁當作「母分頁」
      const activeTabs = await chrome.tabs.query({ active: true, windowType: "normal" });
      if (activeTabs.length > 0) openerId = activeTabs[0].id;
    }

    if (openerId) {
      const url = tab.pendingUrl || tab.url;
      // 如果一誕生就有真實網址，直接發送通知
      if (url && url !== "about:blank" && !url.startsWith('chrome://')) {
        sendPopupToContentScript(openerId, tab.id, url);
      } else {
        // 如果網址還沒準備好 (about:blank)，先把它記在小本本裡，等 onUpdated
        pendingPopups.set(tab.id, openerId);
      }
    }
  } catch (error) {
    console.error("[Background] 捕捉 Popup 錯誤:", error);
  }
});

// 2. 捕捉分頁網址更新的瞬間
// 2. 捕捉分頁網址更新的瞬間
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 如果這個分頁在我們的小本本裡，而且有網址更新的情報
  if (pendingPopups.has(tabId) && changeInfo.url) {
    const url = changeInfo.url;
    
    // 🚨 關鍵修復：嚴格把關！
    // 必須不是 chrome 內部頁面，且「絕對不能是 about:blank 或空字串」
    if (!url.startsWith('chrome://') && url !== 'about:blank' && url.trim() !== '') {
      const openerId = pendingPopups.get(tabId);
      pendingPopups.delete(tabId); // 拿到真實網址了，從本本劃掉
      sendPopupToContentScript(openerId, tabId, url);
    }
  }
});

// 3. 專門負責發送情報給 MainApp1 的通訊員
// 在 background.js 裡面

function sendPopupToContentScript(openerTabId, newTabId, url) {
  console.log(`[Background] 完美捕捉新視窗！URL: ${url}`);
  
  // 建立一個專屬的變數名稱，例如 popup_17749323
  const uniquePopupId = `popup_${Date.now().toString().slice(-6)}`;

  // 🌟 關鍵修復 1：把這個變數名稱存入全域，讓即將甦醒的新視窗可以去認領！
  chrome.storage.local.set({ latestPopupAlias: uniquePopupId });

  chrome.tabs.sendMessage(openerTabId, {
    type: "NATIVE_POPUP_DETECTED",
    url: url,
    popupId: uniquePopupId // 主視窗會用這個 ID 產出 const popup_123 = await ...
  }).catch(() => {});
}

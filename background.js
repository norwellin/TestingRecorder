chrome.action.onClicked.addListener(() => {
  chrome.windows.create({
    url: chrome.runtime.getURL("popup.html"),
    type: "popup",
    width: 1200,
    height: 700,
    focused: true
  });
});

//取得目前的主網頁
async function getTargetTab() {
  // 將 lastFocusedWindow 替換為 windowType: "normal"
  const tabs = await chrome.tabs.query({
    active: true,
    windowType: "normal" 
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

async function sendCommandToRecorder(command) {
  const message = typeof command === "string" ? { type: command } : command;
  if (!message?.type) return false;

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
    const response = await chrome.tabs.sendMessage(targetTab.id, message);
    return response?.ok !== false;
  } catch (err) {
    console.warn("tabs.sendMessage failed, trying executeScript fallback:", err);

    await chrome.scripting.executeScript({
      target: { tabId: targetTab.id, allFrames: true },
      func: (msg) => {
          window.postMessage({ source: "RECORDER_EXTENSION", ...msg }, "*");
        },
      args: [message]
    });
    return true;
  }
}

function preserveSelectorOverrides(nextAction, storedAction) {
  if (!nextAction || !storedAction) return nextAction;

  const mergedAction = { ...nextAction };
  let hasOverride = false;

  if (
    storedAction.type === "popup" &&
    storedAction.viewport &&
    !nextAction.viewport
  ) {
    mergedAction.viewport = storedAction.viewport;
    mergedAction.generatedCodeLines = storedAction.generatedCodeLines || [];
    mergedAction.generatedCodeLine = storedAction.generatedCodeLine || "";
  }

  if (storedAction.codeNote !== undefined) {
    mergedAction.codeNote = storedAction.codeNote;
  }

  ["source", "target"].forEach((field) => {
    const locatorOverrideKey = `${field}LocatorSelectionOverridden`;
    const domPathOverrideKey = `${field}DomPathSelectionOverridden`;
    if (storedAction[locatorOverrideKey] !== true && storedAction[domPathOverrideKey] !== true) return;

    mergedAction[`${field}Method`] = storedAction[`${field}Method`];
    mergedAction[`${field}Data`] = storedAction[`${field}Data`];
    mergedAction[`${field}DomPathChain`] = storedAction[`${field}DomPathChain`] || [];
    mergedAction[`${field}LocatorOptions`] = storedAction[`${field}LocatorOptions`] || [];
    mergedAction[locatorOverrideKey] = storedAction[locatorOverrideKey] === true;
    mergedAction[domPathOverrideKey] = storedAction[domPathOverrideKey] === true;
    hasOverride = true;
  });

  if (hasOverride) {
    mergedAction.generatedCodeLines = storedAction.generatedCodeLines || [];
    mergedAction.generatedCodeLine = storedAction.generatedCodeLine || "";
    mergedAction.generatedCodeReplacesPrevious = storedAction.generatedCodeReplacesPrevious === true;
  }

  return mergedAction;
}

function noteToCommentLines(note) {
  const normalized = String(note || "").replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [];
  return normalized.split("\n").map(line => line ? `// ${line}` : "//");
}

function formatDomPathCandidate(path, chain = []) {
  const hostSelectors = Array.isArray(chain)
    ? chain.map(step => step?.hostSelector).filter(Boolean)
    : [];
  return [...hostSelectors, path].filter(Boolean).join(" >> ");
}

function formatLocatorOptionForComment(option) {
  const method = option?.method;
  const data = option?.data || {};

  if (method === "ByPlaywright") return data.locator || data.selector || "";
  if (method === "ByDomPath") {
    return formatDomPathCandidate(data.csspath || data.path, data.shadowChain || []);
  }
  if (method === "ByRole") {
    const name = data.name ? `, { name: ${JSON.stringify(String(data.name))} }` : "";
    const index = data.index !== null && data.index !== undefined ? `.nth(${data.index})` : "";
    return `getByRole(${JSON.stringify(String(data.role || ""))}${name})${index}`;
  }
  if (method === "ByTitle") return `getByTitle(${JSON.stringify(String(data.title || ""))})`;
  if (method === "ByText") return `getByText(${JSON.stringify(String(data.text || ""))})`;
  return data.locator || data.value || "";
}

function isBlockedSelectorCandidate(selector) {
  return /\.gjs-selected-parent(?![a-zA-Z0-9_-])/.test(
    String(selector || "")
  );
}

function getAllSelectablePaths(action, field = "source") {
  const values = [];
  const add = value => {
    if (
      value &&
      !isBlockedSelectorCandidate(value) &&
      !values.includes(value)
    ) values.push(value);
  };

  const locatorOptions = action?.[`${field}LocatorOptions`];
  if (Array.isArray(locatorOptions)) {
    locatorOptions.forEach(option => add(formatLocatorOptionForComment(option)));
  }

  const domPathOptions = action?.[`${field}DomPathOptions`];
  if (Array.isArray(domPathOptions)) {
    domPathOptions.forEach(option => {
      if (typeof option === "string") add(option);
      else add(formatDomPathCandidate(option?.path, option?.shadowChain || []));
    });
  }

  const selectedMethod = action?.[`${field}Method`];
  const selectedData = action?.[`${field}Data`];
  if (!values.length && selectedData) {
    add(selectedMethod === "ByDomPath"
      ? formatDomPathCandidate(selectedData, action?.[`${field}DomPathChain`] || [])
      : selectedData);
  }
  return values;
}

function getAutomaticActionComment(action, actionIndex) {
  const sourcePaths = getAllSelectablePaths(action, "source");
  const targetPaths = getAllSelectablePaths(action, "target");
  const pathParts = [];

  if (action?.type === "dragANDdrop") {
    if (sourcePaths.length) pathParts.push(`source: ${sourcePaths.join(" ; ")}`);
    if (targetPaths.length) pathParts.push(`target: ${targetPaths.join(" ; ")}`);
  } else if (sourcePaths.length) {
    pathParts.push(...sourcePaths);
  } else if (targetPaths.length) {
    pathParts.push(...targetPaths);
  }

  return `// Recorded Action #${actionIndex + 1} [${pathParts.join(" | ")}]`;
}

function annotateCodeBodyWithNotes(codeBody, actions) {
  const lines = Array.isArray(codeBody) ? codeBody : [];
  const notesByCodeIndex = new Map();
  const claimedCodeIndexes = new Set();
  let searchFrom = 0;

  for (const [actionIndex, action] of (actions || []).entries()) {
    const actionLines = Array.isArray(action?.generatedCodeLines) && action.generatedCodeLines.length
      ? action.generatedCodeLines.filter(Boolean)
      : (action?.generatedCodeLine ? [action.generatedCodeLine] : []);
    if (!actionLines.length) continue;

    const findBlock = (startIndex) => {
      const lastStartIndex = lines.length - actionLines.length;
      for (let index = startIndex; index <= lastStartIndex; index++) {
        const isExactUnclaimedBlock = actionLines.every((actionLine, offset) => {
          const codeIndex = index + offset;
          return !claimedCodeIndexes.has(codeIndex) && lines[codeIndex] === actionLine;
        });
        if (isExactUnclaimedBlock) {
          return {
            start: index,
            end: index + actionLines.length - 1
          };
        }
      }
      return null;
    };

    let block = findBlock(searchFrom);
    if (!block) block = findBlock(0);
    if (!block) continue;

    for (let codeIndex = block.start; codeIndex <= block.end; codeIndex++) {
      claimedCodeIndexes.add(codeIndex);
    }
    searchFrom = block.end + 1;
    notesByCodeIndex.set(block.start, [
      getAutomaticActionComment(action, actionIndex),
      ...noteToCommentLines(action.codeNote)
    ]);
  }

  return lines.flatMap((line, index) => [
    ...(notesByCodeIndex.get(index) || []),
    line
  ]);
}

function normalizeViewport(viewport) {
  const width = Math.floor(Number(viewport?.width));
  const height = Math.floor(Number(viewport?.height));
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }
  return { width, height };
}

function getPopupViewportCodeLine(popupId, viewport) {
  const normalizedViewport = normalizeViewport(viewport);
  if (!popupId || !normalizedViewport) return "";
  return `await ${popupId}.setViewportSize({ width: ${normalizedViewport.width}, height: ${normalizedViewport.height} });`;
}

function attachPopupViewportToCodeLines(lines, popupId, viewport) {
  const viewportLine = getPopupViewportCodeLine(popupId, viewport);
  const normalizedLines = Array.isArray(lines) ? lines.filter(Boolean) : [];
  if (!viewportLine) return normalizedLines;

  const viewportPrefix = `await ${popupId}.setViewportSize(`;
  const withoutPreviousViewport = normalizedLines.filter(line =>
    !String(line).trim().startsWith(viewportPrefix)
  );
  return [...withoutPreviousViewport, viewportLine];
}

function replaceActionCodeBlock(codeBody, oldLines, newLines) {
  const lines = Array.isArray(codeBody) ? [...codeBody] : [];
  const previousLines = Array.isArray(oldLines) ? oldLines.filter(Boolean) : [];
  if (!previousLines.length) return lines;

  const lastStartIndex = lines.length - previousLines.length;
  for (let index = 0; index <= lastStartIndex; index++) {
    if (previousLines.every((line, offset) => lines[index + offset] === line)) {
      lines.splice(index, previousLines.length, ...newLines);
      return lines;
    }
  }
  return lines;
}

function findActionCodeBlock(codeBody, actions, targetActionIndex) {
  const lines = Array.isArray(codeBody) ? codeBody : [];
  const claimedCodeIndexes = new Set();
  let searchFrom = 0;

  for (let actionIndex = 0; actionIndex <= targetActionIndex; actionIndex++) {
    const action = actions?.[actionIndex];
    const actionLines = Array.isArray(action?.generatedCodeLines) && action.generatedCodeLines.length
      ? action.generatedCodeLines.filter(Boolean)
      : (action?.generatedCodeLine ? [action.generatedCodeLine] : []);
    if (!actionLines.length) {
      if (actionIndex === targetActionIndex) return null;
      continue;
    }

    const findBlock = startIndex => {
      const lastStartIndex = lines.length - actionLines.length;
      for (let index = startIndex; index <= lastStartIndex; index++) {
        if (actionLines.every((line, offset) =>
          !claimedCodeIndexes.has(index + offset) && lines[index + offset] === line
        )) {
          return { start: index, length: actionLines.length };
        }
      }
      return null;
    };

    const block = findBlock(searchFrom) || findBlock(0);
    if (!block) {
      if (actionIndex === targetActionIndex) return null;
      continue;
    }

    for (let index = block.start; index < block.start + block.length; index++) {
      claimedCodeIndexes.add(index);
    }
    searchFrom = block.start + block.length;
    if (actionIndex === targetActionIndex) return block;
  }

  return null;
}

function buildFullCode(codeBody, actions) {
  const annotatedCodeBody = annotateCodeBodyWithNotes(codeBody, actions);
  return [
    "import { test, expect } from '@playwright/test';",
    "",
    "test('test', async ({ page }) => {",
    ...annotatedCodeBody.map(line => "  " + line),
    "});"
  ];
}

const pendingPopupViewports = new Map();

function mergeSelectorOverrides(nextActions, storedActions) {
  return nextActions.map((nextAction, index) => {
    const indexedAction = storedActions[index];
    const storedAction =
      nextAction?.id != null && indexedAction?.id === nextAction.id
        ? indexedAction
        : nextAction?.id != null
          ? storedActions.find(action => action?.id === nextAction.id) || indexedAction
          : indexedAction;
    return preserveSelectorOverrides(nextAction, storedAction);
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("background received:", message);

  (async () => {
    if (message.type === "START_RECORDING") {
      const dropPositionMode = ["ratio", "absolute", "center"].includes(message.dropPositionMode)
        ? message.dropPositionMode
        : "ratio";
      await chrome.storage.local.set({
        recorderStatus: "recording",
        dropPositionMode
      });
      await sendCommandToRecorder({
        type: "START_RECORDING",
        dropPositionMode
      });
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "SET_DROP_POSITION_MODE") {
      const dropPositionMode = ["ratio", "absolute", "center"].includes(message.dropPositionMode)
        ? message.dropPositionMode
        : "ratio";
      await chrome.storage.local.set({ dropPositionMode });
      const updated = await sendCommandToRecorder({
        type: "SET_DROP_POSITION_MODE",
        dropPositionMode
      });
      sendResponse({ ok: updated });
      return;
    }

    if (message.type === "POPUP_VIEWPORT_DETECTED") {
      const popupId = String(message.popupId || "");
      const viewport = normalizeViewport(message.viewport);
      if (!popupId || !viewport) {
        sendResponse({ ok: false, error: "Invalid popup viewport" });
        return;
      }

      const data = await chrome.storage.local.get([
        "generatedCodeBody",
        "generatedAction"
      ]);
      const currentActions = Array.isArray(data.generatedAction) ? data.generatedAction : [];
      const actionIndex = currentActions.findIndex(action =>
        action?.type === "popup" && action?.popupId === popupId
      );

      if (actionIndex < 0) {
        pendingPopupViewports.set(popupId, viewport);
        sendResponse({ ok: true, pending: true });
        return;
      }

      const action = currentActions[actionIndex];
      const oldLines = Array.isArray(action.generatedCodeLines)
        ? action.generatedCodeLines.filter(Boolean)
        : (action.generatedCodeLine ? [action.generatedCodeLine] : []);
      const newLines = attachPopupViewportToCodeLines(oldLines, popupId, viewport);
      let codeBody = replaceActionCodeBlock(data.generatedCodeBody, oldLines, newLines);

      action.viewport = viewport;
      action.generatedCodeLines = newLines;
      action.generatedCodeLine = newLines[newLines.length - 1] || "";
      currentActions[actionIndex] = action;
      pendingPopupViewports.delete(popupId);

      const fullCode = buildFullCode(codeBody, currentActions);
      await chrome.storage.local.set({
        generatedCodeBody: codeBody,
        generatedCode: fullCode,
        generatedAction: currentActions
      });
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "STOP_RECORDING") {
      await chrome.storage.local.set({ recorderStatus: "idle" });
      await sendCommandToRecorder("STOP_RECORDING");
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "UPDATE_RECORDED_ACTION") {
      const updated = await sendCommandToRecorder({
        type: "UPDATE_RECORDED_ACTION",
        actionId: message.actionId,
        actionIndex: message.actionIndex,
        patch: message.patch
      });
      sendResponse({ ok: updated });
      return;
    }

    if (message.type === "DELETE_RECORDED_ACTION") {
      const data = await chrome.storage.local.get([
        "generatedCodeBody",
        "generatedAction"
      ]);
      const currentActions = Array.isArray(data.generatedAction)
        ? [...data.generatedAction]
        : [];
      const actionIndex = message.actionId != null
        ? currentActions.findIndex(action => action?.id === message.actionId)
        : (Number.isInteger(message.actionIndex) ? message.actionIndex : -1);

      if (actionIndex < 0 || actionIndex >= currentActions.length) {
        sendResponse({ ok: false, error: "Recorded action not found" });
        return;
      }

      const action = currentActions[actionIndex];
      const actionLines = Array.isArray(action?.generatedCodeLines)
        ? action.generatedCodeLines.filter(Boolean)
        : (action?.generatedCodeLine ? [action.generatedCodeLine] : []);
      const codeBody = Array.isArray(data.generatedCodeBody)
        ? [...data.generatedCodeBody]
        : [];
      const codeBlock = findActionCodeBlock(codeBody, currentActions, actionIndex);

      if (actionLines.length && !codeBlock) {
        sendResponse({ ok: false, error: "Generated code block not found" });
        return;
      }

      const recorderUpdated = await sendCommandToRecorder({
        type: "DELETE_RECORDED_ACTION",
        actionId: action.id,
        actionIndex
      });
      if (!recorderUpdated) {
        sendResponse({ ok: false, error: "Recorder could not delete the action" });
        return;
      }

      if (codeBlock) codeBody.splice(codeBlock.start, codeBlock.length);
      currentActions.splice(actionIndex, 1);
      const fullCode = buildFullCode(codeBody, currentActions);

      await chrome.storage.local.set({
        generatedCodeBody: codeBody,
        generatedCode: fullCode,
        generatedAction: currentActions
      });

      chrome.runtime.sendMessage({
        type: "RECORDER_ACTIONS_UPDATE",
        action: currentActions
      }).catch(() => {});
      chrome.runtime.sendMessage({
        type: "RECORDER_CODE_UPDATE",
        code: fullCode
      }).catch(() => {});

      sendResponse({
        ok: true,
        state: {
          generatedAction: currentActions,
          generatedCode: fullCode
        }
      });
      return;
    }

    // 🌟 新增這個區塊：負責處理「增量附加」動作與程式碼
    if (message.type === "APPEND_RECORD_DATA") {
      console.log("[Debug background] APPEND_RECORD_DATA received:", {
        newCode: message.newCode,
        isReplace: message.isReplace,
        newActionType: message.newAction?.type,
        newActionSourceWindow: message.newAction?.sourceWindow
      });
      // 分離儲存：generatedCodeBody 存純動作，generatedCode 存含外框的完整字串
      const data = await chrome.storage.local.get(["generatedCodeBody", "generatedAction"]);
      
      let codeBody = Array.isArray(data.generatedCodeBody) ? data.generatedCodeBody : [];
      const currentAction = Array.isArray(data.generatedAction) ? data.generatedAction : [];
      
      // 接收到 MainApp 傳來的覆寫訊號，剔除上一行 click/action
      if (message.isReplace && codeBody.length > 0) {
          codeBody.pop(); 
      }
      
      if (message.newCode) {
          const newLines = Array.isArray(message.newCode) ? message.newCode : [message.newCode];
          codeBody.push(...newLines);
      }
      
      let replacedAction = null;
      if (message.isReplace && currentAction.length > 0) {
          replacedAction = currentAction.pop();
      }

      if (message.newAction) {
          const popupViewport = message.newAction.type === "popup"
              ? pendingPopupViewports.get(message.newAction.popupId)
              : null;
          if (popupViewport) {
              const originalNewLines = message.newCode
                  ? (Array.isArray(message.newCode) ? message.newCode : [message.newCode])
                  : [];
              message.newAction.viewport = popupViewport;
              message.newCode = attachPopupViewportToCodeLines(
                  originalNewLines,
                  message.newAction.popupId,
                  popupViewport
              );
              pendingPopupViewports.delete(message.newAction.popupId);
              codeBody.splice(
                  Math.max(0, codeBody.length - originalNewLines.length),
                  originalNewLines.length,
                  ...message.newCode
              );
          }
          const newLines = message.newCode
              ? (Array.isArray(message.newCode) ? message.newCode : [message.newCode])
              : [];
          if (newLines.length) {
              message.newAction.generatedCodeLines = newLines;
              message.newAction.generatedCodeLine = newLines[newLines.length - 1] || "";
              message.newAction.generatedCodeReplacesPrevious = message.isReplace === true;
          }
          currentAction.push(preserveSelectorOverrides(message.newAction, replacedAction));
      }
      
      // 🌟 在這裡單純地套上靜態外框
      const fullCode = buildFullCode(codeBody, currentAction);
      
      await chrome.storage.local.set({
          generatedCodeBody: codeBody,
          generatedCode: fullCode, // 讓 UI 直接拿這包顯示
          generatedAction: currentAction
      });
      console.log("[Debug background] APPEND_RECORD_DATA stored:", {
        codeBody,
        fullCode
      });
      // 🚨 【必須新增這段】在這裡統一廣播最新的「完整總表」給 UI 面板顯示
      chrome.runtime.sendMessage({
        type: "RECORDER_ACTIONS_UPDATE",
        action: currentAction
      }).catch(() => {});

      chrome.runtime.sendMessage({
        type: "RECORDER_CODE_UPDATE",
        code: fullCode
      }).catch(() => {});
      sendResponse({ ok: true });
      return;
    }
    
    // ⚠️ 記得在 CLEAR_RECORDING 時，也把 generatedCodeBody 清空：
    if (message.type === "CLEAR_RECORDING") {
      pendingPopupViewports.clear();
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
      console.log("[Debug background] code overwrite received:", {
        type: message.type,
        code: message.code
      });
      await chrome.storage.local.set({
        generatedCode: Array.isArray(message.code) ? message.code : [String(message.code ?? "")]
      });
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "RECORDER_ACTIONS_UPDATE" || message.type === "display_useraction") {
      const data = await chrome.storage.local.get(["generatedAction"]);
      const storedActions = Array.isArray(data.generatedAction) ? data.generatedAction : [];
      const nextActions = Array.isArray(message.action) ? message.action : [];
      await chrome.storage.local.set({
        generatedAction: mergeSelectorOverrides(nextActions, storedActions)
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
      // 如果 Chrome 沒給，就抓當前一般視窗的活躍分頁當作母分頁
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
//用來取得在onCreate沒有取到網址的網頁
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 如果這個分頁在我們的小本本裡，而且有網址更新的情報
  if (pendingPopups.has(tabId) && changeInfo.url) { //url變動才觸發
    const url = changeInfo.url;
    
    // 必須不是 chrome 內部頁面，且絕對不能是 about:blank 或空字串
    if (!url.startsWith('chrome://') && url !== 'about:blank' && url.trim() !== '') {
      const openerId = pendingPopups.get(tabId);
      pendingPopups.delete(tabId); // 拿到真實網址了，從本本劃掉
      sendPopupToContentScript(openerId, tabId, url);
    }
  }
});

// 3. 專門負責發送情報給 MainApp 的通訊員

function sendPopupToContentScript(openerTabId, newTabId, url) {
  console.log(`[Background] 完美捕捉新視窗！URL: ${url}`);
  
  // 建立一個專屬的變數名稱，例如 popup_17749323
  const uniquePopupId = `popup_${Date.now().toString().slice(-6)}`;

  // 把這個變數名稱存入全域，讓即將甦醒的新視窗可以去認領！
  chrome.storage.local.set({ latestPopupAlias: uniquePopupId });

  chrome.tabs.sendMessage(openerTabId, {
    type: "NATIVE_POPUP_DETECTED",
    url: url,
    popupId: uniquePopupId // 主視窗會用這個 ID 產出 const popup_123 = await ...
  }).catch(() => {});
}

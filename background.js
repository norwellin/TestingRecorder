chrome.action.onClicked.addListener(() => {
  chrome.windows.create({
    url: chrome.runtime.getURL("popup.html"),
    type: "popup",
    width: 1200,
    height: 500,
    focused: true
  });
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("message: ",message);
  // background.js 修改版
if (message.type === 'START_RECORDING' || message.type == "STOP_RECORDING") {
    // 這裡我們改用更精確的查詢，排除掉 extension 自己的窗口
    chrome.tabs.query({ active: true }, (tabs) => {
        // 找到第一個 URL 不是以 chrome-extension 開頭的標籤
        const targetTab = tabs.find(tab => !tab.url.startsWith('chrome-extension://'));

        if (!targetTab) {
            console.error("No valid web page found to record.");
            return;
        }

        chrome.scripting.executeScript({
            target: { tabId: targetTab.id, allFrames: true },
            func: (msg) => {
                window.postMessage({ type: msg.type }, '*');
            },
            args: [message]
        });
    });
}

  else if (message.type == "display_code") {
    chrome.storage.local.set({ generatedCode: message.code });
    console.log("已更新程式碼:", message.code);
  }
  else if (message.type == "display_useraction"){
    chrome.storage.local.set({ generatedAction: message.action });
    console.log("已更新user action:", message.action);
  }
});

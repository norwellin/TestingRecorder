let viewerTabId = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "show_code") {
    chrome.windows.create(
      {
        url: chrome.runtime.getURL("viewer.html"),
        type: "popup",
        width: 600,
        height: 400
      },
      (newWindow) => {
        // 等視窗建立後傳送訊息（小延遲保險）
        setTimeout(() => {
          chrome.runtime.sendMessage({
            type: "display_code",
            code: message.code
          });
        }, 500);
      }
    );
  }
});

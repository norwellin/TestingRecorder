chrome.action.onClicked.addListener(() => {
  chrome.windows.create({
    url: chrome.runtime.getURL("viewer.html"),
    type: "popup",
    width: 500,
    height: 400,
    focused: true
  });
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type == "display_code") {
    chrome.storage.local.set({ generatedCode: message.code });
    console.log("已更新程式碼:", message.code);
  }
});

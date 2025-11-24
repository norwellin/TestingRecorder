chrome.action.onClicked.addListener(() => {
  chrome.windows.create({
    url: chrome.runtime.getURL("viewer.html"),
    type: "popup",
    width: 1200,
    height: 500,
    focused: true
  });
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("message: ",message);
  if (message.type == "display_code") {
    chrome.storage.local.set({ generatedCode: message.code });
    console.log("已更新程式碼:", message.code);
  }
  else if (message.type == "display_useraction"){
    chrome.storage.local.set({ generatedAction: message.action });
    console.log("已更新user action:", message.action);
  }
});

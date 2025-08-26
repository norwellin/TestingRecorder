chrome.action.onClicked.addListener(() => {
  chrome.windows.create({
    url: chrome.runtime.getURL("viewer.html"),
    type: "popup",
    width: 500,
    height: 400
  });
});

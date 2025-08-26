const logArea = document.getElementById("log");
const startBtn = document.getElementById("startBtn");

startBtn.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: () => {
      window.addEventListener("dragstart", (e) => {
        if (e.target.tagName === "IFRAME") {
          console.log("Iframe dragged:", e.target.src || "iframe");
        }
      });
    }
  });
  logArea.value += "Started listening...\n";
});

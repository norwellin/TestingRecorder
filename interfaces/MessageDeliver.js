//負責轉送來自popup.js的訊息
export class MessageDeliver {
    constructor() {

    }
    init() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log("try to deliver msg");
            switch (message.type) {
                case "START_RECORDING":
                    window.postMessage({ type: "START_RECORDING" }, "*");
                    break;
                case "STOP_RECORDING":
                    window.postMessage({ type: "STOP_RECORDING" }, "*");
                    break;
            }
        });
    }

}

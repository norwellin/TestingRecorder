// 確保整個 HTML 文件的 DOM 元素都載入完成後，才開始執行內部的 JavaScript
document.addEventListener("DOMContentLoaded", async function () {
    // 1. 取得畫面上各種控制元件的 DOM 節點
    const startButton = document.getElementById("start-recording"); // 開始錄製按鈕
    const stopButton = document.getElementById("stop-recording");   // 停止錄製按鈕
    const clearButton = document.getElementById("clear-recording"); // 清除紀錄按鈕
    const exportButton = document.getElementById("export-script");  // 匯出腳本按鈕
    const statusDiv = document.getElementById("status");            // 狀態文字顯示區塊
    const recordingIndicator = document.getElementById("recording-indicator"); // 錄製中的紅點指示燈
    const actionsDiv = document.getElementById("recorded-actions"); // 顯示使用者動作紀錄的清單區塊
    const codeView = document.getElementById("code-view");          // 顯示生成的程式碼區塊
    const actionsCountSpan = document.getElementById("actions-count"); // 顯示動作總數的標籤

    let actions = []; // 儲存在記憶體中的動作陣列

    // 2. 輔助函式：將不同格式的程式碼資料正規化為單一字串
    function normalizeCode(value) {
        if (Array.isArray(value)) return value.join("\n"); // 如果是陣列，用換行符號組合起來
        if (value && typeof value === "object") return Object.values(value).join("\n"); // 如果是物件，取其值組合
        if (typeof value === "string") return value; // 如果已經是字串，直接回傳
        return "// No code has been generated yet"; // 預設的空狀態文字
    }

    // 3. 輔助函式：更新畫面上的程式碼顯示區塊，並套用語法高亮 (Highlight.js)
    function setCodeView(code) {
        codeView.textContent = code || "// No code has been generated yet";
        delete codeView.dataset.highlighted; // 清除舊的高亮標記，強制重新渲染
        hljs.highlightElement(codeView); // 呼叫 Highlight.js 進行程式碼上色
    }

    // 4. UI 狀態更新函式：根據「是否正在錄製」，切換按鈕的可用狀態與視覺指示
    function updateUI(isRecording) {
        startButton.disabled = isRecording; // 錄製中不可按開始
        stopButton.disabled = !isRecording; // 非錄製中不可按停止
        statusDiv.textContent = isRecording ? "Recording..." : "Not recording";

        // 切換錄製紅點指示燈的 CSS 類別
        if (isRecording) {
            recordingIndicator.classList.add("active");
        } else {
            recordingIndicator.classList.remove("active");
        }
    }

    // 5. 畫面渲染函式：將動作紀錄陣列轉化為畫面上的 HTML 列表
    function updateActionsList(actions) {
        actionsDiv.innerHTML = ""; // 先清空目前的列表
        actionsCountSpan.textContent = `${actions.length} ${actions.length === 1 ? "action" : "actions"}`; // 更新總數文字

        // 如果沒有任何動作，顯示空狀態提示
        if (!actions.length) {
            const emptyMessage = document.createElement("div");
            emptyMessage.className = "empty-message";
            emptyMessage.textContent = "No actions recorded yet.";
            actionsDiv.appendChild(emptyMessage);
            clearButton.disabled = true;  // 沒資料時禁用清除按鈕
            exportButton.disabled = false; // 但仍允許匯出（匯出空腳本）
            return;
        }

        clearButton.disabled = false;
        exportButton.disabled = false;

        // 走訪每一個動作紀錄，建立對應的 DOM 元素
        actions.forEach((action, index) => {
            const actionElement = document.createElement("div");
            actionElement.className = "action-item";

            // 建立序號
            const numberSpan = document.createElement("span");
            numberSpan.className = "action-number";
            numberSpan.textContent = index + 1;

            // 建立目標視窗標籤 (例如：發生在哪個頁面)
            const windowSpan = document.createElement("span");
            windowSpan.className = "action-window";
            windowSpan.style.color = "#888";
            windowSpan.style.marginRight = "10px";

            // 針對拖放動作特殊處理，顯示來源到目標的視窗；否則顯示單一視窗
            if (action.type === "dragANDdrop") {
                windowSpan.textContent = `[${action.sourceWindow || "unknown"} to ${action.targetWindow || "unknown"}]`;
            } else {
                windowSpan.textContent = `[${action.targetWindow || action.sourceWindow || "unknown"}]`;
            }

            // 建立詳細資訊區塊，依據不同的動作類型 (navigate, input, change, dragANDdrop) 給予不同的文字排版
            const detailsSpan = document.createElement("span");
            detailsSpan.className = "action-details";

            if (action.type === "navigate") {
                // 網址跳轉紀錄
                detailsSpan.textContent = `Maps: ${action.url || action.value || ""}`;
            }else if (action.type === "popup") {
                // 🌟 新增：讓 UI 顯示 Popup 動作
                detailsSpan.textContent = `Popup: ${action.url || ""}`;
                detailsSpan.style.color = "#d97706"; // 給它一個特別的顏色 (橘黃色)
            } 
            else if (action.type === "input") {
                // 文字輸入紀錄
                detailsSpan.textContent = `INPUT: ${action.sourceMethod || ""}`;
                if (action.sourceData) {
                    const valueSpan = document.createElement("span");
                    valueSpan.className = "action-value";
                    valueSpan.textContent = ` "${action.sourceData}"`;
                    detailsSpan.appendChild(valueSpan);

                    detailsSpan.appendChild(document.createElement("br"));

                    const inputSpan = document.createElement("span");
                    inputSpan.textContent = ` input: ${action.inputText || ""}`;
                    detailsSpan.appendChild(inputSpan);
                }
            } else if (action.type === "change") {
                // 下拉選單或選項變更紀錄
                detailsSpan.textContent = `SELECT: ${action.sourceMethod || ""}`;
                if (action.sourceData) {
                    const valueSpan = document.createElement("span");
                    valueSpan.className = "action-value";
                    valueSpan.textContent = ` "${action.sourceData}"`;
                    detailsSpan.appendChild(valueSpan);

                    detailsSpan.appendChild(document.createElement("br"));

                    const inputSpan = document.createElement("span");
                    inputSpan.textContent = ` selected element: ${action.selectedText || ""}`;
                    detailsSpan.appendChild(inputSpan);
                }
            } else if (action.type === "dragANDdrop") {
                // 拖曳與放置紀錄
                detailsSpan.textContent = `DRAG&DROP: ${action.sourceMethod || ""}`;
                if (action.sourceData) {
                    const valueSpan = document.createElement("span");
                    valueSpan.className = "action-value";
                    valueSpan.textContent = ` source - "${action.sourceData}"`;
                    detailsSpan.appendChild(valueSpan);

                    detailsSpan.appendChild(document.createElement("br"));

                    const inputSpan = document.createElement("span");
                    inputSpan.className = "action-value";
                    inputSpan.textContent = `${action.targetMethod || ""} target - ${action.targetData || ""}`;
                    detailsSpan.appendChild(inputSpan);
                }
            } else {
                // 其他未定義或泛用的點擊動作
                detailsSpan.textContent = `${(action.type || "unknown").toUpperCase()}: ${action.sourceMethod || ""}`;
                if (action.sourceData) {
                    const valueSpan = document.createElement("span");
                    valueSpan.className = "action-value";
                    valueSpan.textContent = ` "${action.sourceData}"`;
                    detailsSpan.appendChild(valueSpan);
                }
            }

            // 將所有資訊組裝進該動作的容器中
            actionElement.appendChild(numberSpan);
            actionElement.appendChild(windowSpan);
            actionElement.appendChild(detailsSpan);

            actionsDiv.appendChild(actionElement);
        });

        // 讓清單自動捲動到最底部（最新的一筆）
        actionsDiv.scrollTop = actionsDiv.scrollHeight;
    }

    // 6. 從 Storage 中取得最新的程式碼
    function getJSCode() {
        return new Promise((resolve) => {
            chrome.storage.local.get(["generatedCode"], (result) => {
                resolve(normalizeCode(result.generatedCode));
            });
        });
    }

    // 7. 初始化狀態：當介面剛開啟時，向背景腳本索取目前的狀態並更新畫面
    async function loadInitialState() {
        const response = await chrome.runtime.sendMessage({ type: "GET_RECORDER_STATE" });

        // 如果背景腳本沒回應，進入錯誤狀態
        if (!response?.ok) {
            setCodeView("// Failed to load recorder state");
            updateActionsList([]);
            updateUI(false);
            return;
        }

        const { generatedCode, generatedAction, recorderStatus } = response.state;
        actions = generatedAction || [];
        setCodeView(normalizeCode(generatedCode)); // 顯示程式碼
        updateActionsList(actions); // 顯示動作列表
        updateUI(recorderStatus === "recording"); // 切換按鈕狀態
    }

    // 8. 即時響應：監聽 Storage 的變化。如果背景腳本有寫入新資料，介面會即時自動更新，這就是為什麼錄製時畫面會同步跳動的原因
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.generatedCode) {
            setCodeView(normalizeCode(changes.generatedCode.newValue));
        }

        if (changes.generatedAction) {
            actions = changes.generatedAction.newValue || [];
            updateActionsList(actions);
        }

        if (changes.recorderStatus) {
            updateUI(changes.recorderStatus.newValue === "recording");
        }
    });

    // 9. 按鈕事件綁定：發送指令給背景腳本處理 (Background Script)
    
    // 點擊「開始錄製」
    startButton.addEventListener("click", async () => {
        const response = await chrome.runtime.sendMessage({ type: "START_RECORDING" });
        if (!response?.ok) {
            alert(response?.error || "Failed to start recording");
            return;
        }
        updateUI(true);
    });

    // 點擊「停止錄製」
    stopButton.addEventListener("click", async () => {
        const response = await chrome.runtime.sendMessage({ type: "STOP_RECORDING" });
        if (!response?.ok) {
            alert(response?.error || "Failed to stop recording");
            return;
        }
        updateUI(false);
    });

    // 點擊「清除紀錄」
    clearButton.addEventListener("click", async () => {
        if (!confirm("Are you sure you want to clear all recorded actions?")) return; // 防呆確認

        const response = await chrome.runtime.sendMessage({ type: "CLEAR_RECORDING" });
        if (!response?.ok) {
            alert(response?.error || "Failed to clear recording");
            return;
        }

        // 成功後重置本地變數與畫面
        actions = [];
        updateActionsList(actions);
        setCodeView("// No code has been generated yet");
        updateUI(false);
    });

    // 點擊「匯出腳本」：將生成的程式碼下載成實體檔案
    exportButton.addEventListener("click", async () => {
        const filenameInput = document.getElementById("filename-input");
        let customFilename = filenameInput ? filenameInput.value.trim() : "playwright-test";
        if (!customFilename) customFilename = "playwright-test";

        // 確保副檔名為 .spec.js (標準的 Playwright 測試檔格式)
        const finalFilename = customFilename.replace(/\.\w+$/, "") + ".spec.js";
        const scriptContent = await getJSCode();

        // 利用 Blob 將字串轉換成可下載的二進位檔案物件
        const blob = new Blob([scriptContent], { type: "text/javascript" });
        const url = URL.createObjectURL(blob);

        // 呼叫 Chrome 內建的下載 API
        chrome.downloads.download({
            url,
            filename: finalFilename,
            saveAs: true // 詢問使用者要存到哪裡
        });
    });

    // 10. 執行初始化：腳本載入完畢後立刻向 Background 拿資料
    await loadInitialState();
});
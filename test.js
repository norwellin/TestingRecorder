



document.addEventListener('DOMContentLoaded', function () {
    //美化CODE VIEW

    // --- 1. 元素宣告 ---
    const startButton = document.getElementById('start-recording');
    const stopButton = document.getElementById('stop-recording');
    const clearButton = document.getElementById('clear-recording');
    const exportButton = document.getElementById('export-script');
    const statusDiv = document.getElementById('status');
    const recordingIndicator = document.getElementById('recording-indicator');
    const actionsDiv = document.getElementById('recorded-actions');
    const codeView = document.getElementById("code-view");
    const actionsCountSpan = document.getElementById('actions-count');
    let actions = [];

    // 2. 初始化抓取儲存的程式碼
    chrome.storage.local.get(["generatedCode"], (result) => {
        let code = "";

        if (result.generatedCode) {
            // 將 Array 透過換行符號 \n 結合成字串
            code = result.generatedCode.join("\n");
        } else {
            code = "// No code has been generated yet";
        }

        // 將文字寫入 code-view
        codeView.textContent = code;
        delete codeView.dataset.highlighted;
        hljs.highlightElement(codeView);
    });
    // 監聽儲存內容變化
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (changes.generatedCode) {
            let code = "";
            const newValue = changes.generatedCode.newValue;

            if (Array.isArray(newValue)) {
                code = newValue.join("\n");
            } else if (newValue && typeof newValue === "object") {
                code = Object.values(newValue).join("\n");
            } else if (typeof newValue === "string") {
                code = newValue;
            } else {
                code = "// No code has been generated yet";
            }

            codeView.textContent = code;
            delete codeView.dataset.highlighted;
            hljs.highlightElement(codeView);
        }
        else if (changes.generatedAction) {
            console.log("action change detected");
            // 1. 取得更新後的動作陣列
            const newActions = changes.generatedAction.newValue;

            if (newActions) {
                // 2. 更新本地變數 actions，確保與儲存空間同步
                actions = newActions;

                // 3. 執行您要求的渲染邏輯：建立一列 > 序號 > 來源視窗 > 詳情 > 放入容器
                updateActionsList(actions);

                // 4. 當有新動作時，確保清除與匯出按鈕是可點擊的
                if (actions.length > 0) {
                    clearButton.disabled = false;
                    exportButton.disabled = false;
                }
            }
        }
    });
    // --- 2. 核心輔助函式 (處理 Array 轉字串) ---
    /**
     * 取得儲存的代碼並轉為字串
     * 因為您確認傳入的是 Array，所以這裡使用 .join("\n")
     */
    function updateActionsList(actions) {
        // 1. 先清空現有的列表內容
        actionsDiv.innerHTML = '';
        actionsCountSpan.textContent = actions.length + (actions.length === 1 ? ' action' : ' actions');

        if (actions.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = 'No actions recorded yet.';
            actionsDiv.appendChild(emptyMessage);
            return;
        }

        // 針對每個動作物件進行處理
        actions.forEach(function (action, index) {
            // --- 建立一列 (Row) ---
            const actionElement = document.createElement('div');
            actionElement.className = 'action-item';

            // --- 建立序號 (Number) ---
            const numberSpan = document.createElement('span');
            numberSpan.className = 'action-number';
            numberSpan.textContent = index + 1;

            // --- 填入來源視窗 (Source Window) ---
            const windowSpan = document.createElement('span');
            windowSpan.className = 'action-window';
            windowSpan.style.color = '#888';
            windowSpan.style.marginRight = '10px';
            if (action.type === 'dragANDdrop') {
                windowSpan.textContent = `[${action.sourceWindow} to ${action.targetWindow}]`;
            }
            else {
                windowSpan.textContent = `[${action.targetWindow || action.sourceWindow}]`;
            }
            // --- 填入動作詳情 (Details) ---
            const detailsSpan = document.createElement('span');
            detailsSpan.className = 'action-details';

            if (action.type === 'navigate') {
                detailsSpan.textContent = `Maps to ${action.value}`;
            }
            else if (action.type === "input") {
                detailsSpan.textContent = `${action.type.toUpperCase()}: ${action.sourceMethod}`;
                if (action.sourceData) {
                    const valueSpan = document.createElement('span');
                    valueSpan.className = 'action-value';
                    valueSpan.textContent = ` "${action.sourceData}"`;
                    detailsSpan.appendChild(valueSpan);

                    // 建立換行元素
                    const br = document.createElement('br');
                    detailsSpan.appendChild(br);

                    // 下一行文字
                    const inputSpan = document.createElement('span');
                    inputSpan.textContent = ` input: ${action.inputText}`;
                    detailsSpan.appendChild(inputSpan);
                }
            }
            else if (action.type === "change") {
                detailsSpan.textContent = `SELECT: ${action.sourceMethod}`;
                if (action.sourceData) {
                    const valueSpan = document.createElement('span');
                    valueSpan.className = 'action-value';
                    valueSpan.textContent = ` "${action.sourceData}"`;
                    detailsSpan.appendChild(valueSpan);

                    // 建立換行元素
                    const br = document.createElement('br');
                    detailsSpan.appendChild(br);

                    // 下一行文字
                    const inputSpan = document.createElement('span');
                    inputSpan.textContent = ` selected element: ${action.selectedText}`;
                    detailsSpan.appendChild(inputSpan);
                }
            }
            else if (action.type === "dragANDdrop") {
                detailsSpan.textContent = `${action.type.toUpperCase()}: ${action.sourceMethod}`;
                if (action.sourceData) {
                    const valueSpan = document.createElement('span');
                    valueSpan.className = 'action-value';
                    valueSpan.textContent = ` source - "${action.sourceData}"`;
                    detailsSpan.appendChild(valueSpan);

                    // 建立換行元素
                    const br = document.createElement('br');
                    detailsSpan.appendChild(br);

                    // 下一行文字
                    const inputSpan = document.createElement('span');
                    inputSpan.className = 'action-value';
                    inputSpan.textContent = `${action.targetMethod} target - ${action.targetData}`;
                    detailsSpan.appendChild(inputSpan);
                }
            }
            else {
                // 顯示選擇器與動作值
                detailsSpan.textContent = `${action.type.toUpperCase()}: ${action.sourceMethod}`;
                if (action.sourceData) {
                    const valueSpan = document.createElement('span');
                    valueSpan.className = 'action-value';
                    valueSpan.textContent = ` "${action.sourceData}"`;
                    detailsSpan.appendChild(valueSpan);
                }
            }

            // --- 依序放入列表容器 (Container) ---
            actionElement.appendChild(numberSpan);
            actionElement.appendChild(windowSpan);
            actionElement.appendChild(detailsSpan);

            actionsDiv.appendChild(actionElement);
        });

        // 自動捲動到最新動作
        actionsDiv.scrollTop = actionsDiv.scrollHeight;
    }
    function getJSCode() {
        return new Promise((resolve) => {
            chrome.storage.local.get(["generatedCode"], (result) => {
                if (result.generatedCode && Array.isArray(result.generatedCode) && result.generatedCode.length > 0) {
                    // 將陣列中的每一行合併成一個字串
                    resolve(result.generatedCode.join("\n"));
                } else {
                    resolve("// No code has been generated yet");
                }
            });
        });
    }

    // --- 3. UI 狀態切換 ---
    function updateUI(isRecording) {
        startButton.disabled = isRecording;
        stopButton.disabled = !isRecording;
        statusDiv.textContent = isRecording ? 'Recording...' : 'Not recording';
        if (isRecording) {
            recordingIndicator.classList.add('active');
        } else {
            recordingIndicator.classList.remove('active');
        }
    }

    // --- 4. 按鈕事件監聽 ---

    // [Start] 開始錄製
    startButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'START_RECORDING' }); //
        updateUI(true);
    });

    // [Stop] 停止錄製
    stopButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'STOP_RECORDING' }); //
        updateUI(false);
    });

    // [Clear] 清除所有資料
    clearButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all recorded actions?')) {
            chrome.storage.local.set({ actions: [], generatedCode: [] }, () => {
                actions = []; // 清空本地變數
                actionsDiv.innerHTML = ''; // 清空 UI
                actionsCountSpan.textContent = '0 actions';
                if (codeView) codeView.textContent = "// No code has been generated yet";
                delete codeView.dataset.highlighted;
                hljs.highlightElement(codeView);
                clearButton.disabled = true;
                console.log('Storage cleared.');
            });
        }
    });

    // [Export] 匯出腳本檔案
    exportButton.addEventListener('click', async () => {
        console.log('Exporting script...');

        // 取得檔案名稱 (從您的 filename-input 取得)
        const filenameInput = document.getElementById('filename-input');
        let customFilename = filenameInput ? filenameInput.value.trim() : 'playwright-test';
        if (!customFilename) customFilename = 'playwright-test';

        // 確保副檔名正確
        const finalFilename = customFilename.replace(/\.\w+$/, '') + '.spec.js';

        // 取得合併後的代碼字串
        const scriptContent = await getJSCode();

        // 建立下載
        const blob = new Blob([scriptContent], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);

        chrome.downloads.download({
            url: url,
            filename: finalFilename,
            saveAs: true
        });
    });
});


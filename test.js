// 蝣箔??游?HTML ?辣??DOM ???質??亙???嚗????瑁??折??JavaScript
document.addEventListener("DOMContentLoaded", async function () {
    // 1. ???恍銝?蝔格?嗅?隞嗥? DOM 蝭暺?
    const startButton = document.getElementById("start-recording"); // ???ˊ??
    const stopButton = document.getElementById("stop-recording");   // ?迫?ˊ??
    const clearButton = document.getElementById("clear-recording"); // 皜蝝????
    const exportButton = document.getElementById("export-script");  // ?臬?單??
    const statusDiv = document.getElementById("status");            // ???摮＊蝷箏?憛?
    const recordingIndicator = document.getElementById("recording-indicator"); // ?ˊ銝剔?蝝??內??
    const actionsDiv = document.getElementById("recorded-actions"); // 憿舐內雿輻??雿???皜?憛?
    const codeView = document.getElementById("code-view");          // 憿舐內????撘Ⅳ?憛?
    const actionsCountSpan = document.getElementById("actions-count"); // 憿舐內??蝮賣??蝐?

    let actions = []; // ?脣??刻??園?銝剔??????

    // 2. 頛?賢?嚗?銝??澆???撘Ⅳ鞈?甇????桐?摮葡
    function normalizeCode(value) { 
        if (Array.isArray(value)) return value.join("\n"); // 憒??舫???冽?銵泵???絲靘?
        if (value && typeof value === "object") return Object.values(value).join("\n"); // 憒??舐隞塚???潛???
        if (typeof value === "string") return value; // 憒?撌脩??臬?銝莎??湔?
        return "// No code has been generated yet"; // ?身?征???摮?
    }

    // 3. 頛?賢?嚗?啁?Ｖ???撘Ⅳ憿舐內?憛?銝血??刻?瘜?鈭?(Highlight.js)
    function setCodeView(code) {
        codeView.textContent = code || "// No code has been generated yet";
        delete codeView.dataset.highlighted; // 皜??擃漁璅?嚗撥?園??唳葡??
        hljs.highlightElement(codeView); // ?澆 Highlight.js ?脰?蝔?蝣潔???
    }

    // 4. UI ???啣撘??寞???行迤?券?鋆賬???????函???閬死?內
    function updateUI(isRecording) {
        startButton.disabled = isRecording; // ?ˊ銝凋??舀???
        stopButton.disabled = !isRecording; // ??鋆賭葉銝??甇?
        statusDiv.textContent = isRecording ? "Recording..." : "Not recording";

        // ???ˊ蝝??內?? CSS 憿
        if (isRecording) {
            recordingIndicator.classList.add("active");
        } else {
            recordingIndicator.classList.remove("active");
        }
    }

    // 5. ?恍皜脫??賢?嚗???蝝?????恍銝? HTML ?”
    function updateActionsList(actions) {
        actionsDiv.innerHTML = ""; // ??蝛箇???”
        actionsCountSpan.textContent = `${actions.length} ${actions.length === 1 ? "action" : "actions"}`; // ?湔蝮賣??

        // 憒?瘝?隞颱???嚗＊蝷箇征???蝷?
        if (!actions.length) {
            const emptyMessage = document.createElement("div");
            emptyMessage.className = "empty-message";
            emptyMessage.textContent = "No actions recorded yet.";
            actionsDiv.appendChild(emptyMessage);
            clearButton.disabled = true;  // 瘝???蝳皜??
            exportButton.disabled = false; // 雿??迂?臬嚗?箇征?單嚗?
            return;
        }

        clearButton.disabled = false;
        exportButton.disabled = false;

        // 韏啗赤瘥???雿???撱箇?撠???DOM ??
        actions.forEach((action, index) => {
            const actionElement = document.createElement("div");
            actionElement.className = "action-item";

            actionElement.appendChild(createCell(index + 1, "action-index"));
            actionElement.appendChild(createCell(getActionSource(action)));
            actionElement.appendChild(createCell(getActionTarget(action)));
            actionElement.appendChild(createCell(getActionBehavior(action), "action-behavior"));
            actionElement.appendChild(createMethodCell(action));
            actionElement.appendChild(createElementCell(action, index));

            actionsDiv.appendChild(actionElement);
        });

        // 霈??株???摨嚗??啁?銝蝑?
        actionsDiv.scrollTop = actionsDiv.scrollHeight;
    }
    function createCell(text, className = "") {
        const div = document.createElement("div");
        div.className = `action-cell ${className}`;
        div.textContent = text ?? "";
        return div;
    }

    function getActionSource(action) {
        if (action.type === "navigate") return action.displaySourceWindow || action.sourceWindow || "page";
        if (action.type === "popup") return action.displaySourceWindow || action.sourceWindow || action.popupId || "";
        return action.displaySourceWindow || action.sourceWindow || "";
    }

    function getActionTarget(action) {
        if (action.type === "dragANDdrop") return action.displayTargetWindow || action.targetWindow || "";
        return action.displayTargetWindow || action.targetWindow || "";
    }

    function getActionBehavior(action) {
        return action.type || "unknown";
    }

    function getActionValue(action) {
        if (action.type === "navigate" || action.type === "popup") return action.url || "";
        if (action.type === "input") return action.inputText || action.sourceData || "";
        if (action.type === "change") return action.selectedText || action.selectedValue || action.sourceData || "";
        if (action.type === "keyboard") return action.keyboard || "";
        return action.sourceData || "";
    }

    function formatActionMethod(action) {
        if (action.type === "dragANDdrop") {
            return `來源: ${action.sourceMethod || ""}\n目標: ${action.targetMethod || ""}`;
        }
        return action.sourceMethod || "";
    }

    function createMethodCell(action) {
        return createCell(formatActionMethod(action), "action-method");
    }

    function createElementCell(action, index) {
        const cell = createCell("", "action-element");

        if (action.type === "dragANDdrop") {
            appendLabeledElement(cell, "來源", action.sourceData, action.sourceMethod, action.sourceDomPathOptions, index, "source");
            appendLabeledElement(cell, "目標", action.targetData, action.targetMethod, action.targetDomPathOptions, index, "target");
            return cell;
        }

        if (action.type === "navigate" || action.type === "popup") {
            cell.textContent = action.url || "";
            return cell;
        }

        appendDomPathOrText(cell, action.sourceData || getActionValue(action), action.sourceMethod, action.sourceDomPathOptions, index, "source");
        return cell;
    }

    function appendLabeledElement(parent, label, value, method, options, actionIndex, field) {
        const wrapper = document.createElement("div");
        const prefix = document.createElement("span");
        prefix.textContent = `${label}: `;
        wrapper.appendChild(prefix);
        appendDomPathOrText(wrapper, value, method, options, actionIndex, field);
        parent.appendChild(wrapper);
    }

    function appendDomPathOrText(parent, value, method, options, actionIndex, field) {
        if (method === "ByDomPath" && Array.isArray(options) && options.length) {
            const select = document.createElement("select");
            select.className = "dompath-select";
            options.forEach((option, optionIndex) => {
                const path = typeof option === "string" ? option : option.path;
                if (!path) return;

                const item = document.createElement("option");
                item.value = path;
                item.textContent = `${optionIndex + 1}. ${path}`;
                item.selected = path === value;
                select.appendChild(item);
            });

            select.addEventListener("change", async () => {
                const key = field === "target" ? "targetData" : "sourceData";
                const oldValue = actions[actionIndex][key];
                actions[actionIndex][key] = select.value;
                await updateDomPathSelection(actionIndex, field, oldValue, select.value);
            });

            parent.appendChild(select);
            return;
        }

        const span = document.createElement("span");
        span.textContent = value || "";
        parent.appendChild(span);
    }

    function wrapPlaywrightCode(codeBody) {
        const orderedBody = orderPlaywrightCodeBody(codeBody);
        return [
            "import { test, expect } from '@playwright/test';",
            "",
            "test('test', async ({ page }) => {",
            ...orderedBody.map(line => "  " + line),
            "});"
        ];
    }

    function parseFrameDeclaration(line) {
        const match = String(line || "").match(/^const\s+([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*)\.frameLocator\(/);
        if (!match) return null;
        return { line, alias: match[1], parentAlias: match[2] };
    }

    function containsAlias(line, alias) {
        return new RegExp(`\\b${alias}\\b`).test(String(line || ""));
    }

    function collectUsedFrameDeclarations(declarations, executableLines) {
        const byAlias = new Map(declarations.map(declaration => [declaration.alias, declaration]));
        const usedAliases = new Set();

        for (const line of executableLines) {
            for (const declaration of declarations) {
                if (containsAlias(line, declaration.alias)) usedAliases.add(declaration.alias);
            }
        }

        let changed = true;
        while (changed) {
            changed = false;
            for (const alias of [...usedAliases]) {
                const declaration = byAlias.get(alias);
                if (!declaration) continue;
                if (byAlias.has(declaration.parentAlias) && !usedAliases.has(declaration.parentAlias)) {
                    usedAliases.add(declaration.parentAlias);
                    changed = true;
                }
            }
        }

        return declarations.filter(declaration => usedAliases.has(declaration.alias));
    }

    function appendDeclarationsForParent(parentAlias, declarationsByParent, insertedParents, output) {
        if (insertedParents.has(parentAlias)) return;
        insertedParents.add(parentAlias);

        for (const declaration of declarationsByParent.get(parentAlias) || []) {
            output.push(declaration.line);
            appendDeclarationsForParent(declaration.alias, declarationsByParent, insertedParents, output);
        }
    }

    function orderPlaywrightCodeBody(codeBody) {
        const lines = Array.isArray(codeBody) ? codeBody.filter(Boolean) : [];
        const declarations = [];
        const executableLines = [];

        for (const line of lines) {
            const declaration = parseFrameDeclaration(line);
            if (declaration) declarations.push(declaration);
            else executableLines.push(line);
        }

        const usedDeclarations = collectUsedFrameDeclarations(declarations, executableLines);
        const declarationsByParent = new Map();
        for (const declaration of usedDeclarations) {
            const siblings = declarationsByParent.get(declaration.parentAlias) || [];
            siblings.push(declaration);
            declarationsByParent.set(declaration.parentAlias, siblings);
        }

        const output = [];
        const insertedParents = new Set();
        const firstGotoIndex = executableLines.findIndex(line => /\.goto\(/.test(String(line)));

        if (firstGotoIndex >= 0) {
            output.push(executableLines[firstGotoIndex]);
            appendDeclarationsForParent("page", declarationsByParent, insertedParents, output);
        }

        executableLines.forEach((line, index) => {
            if (index === firstGotoIndex) return;
            output.push(line);

            const popupMatch = String(line).match(/const\s+\[([A-Za-z_$][\w$]*)\]\s*=\s*await\s+Promise\.all/);
            if (popupMatch) appendDeclarationsForParent(popupMatch[1], declarationsByParent, insertedParents, output);
        });

        if (firstGotoIndex < 0) appendDeclarationsForParent("page", declarationsByParent, insertedParents, output);
        return output;
    }

    function escapePathForCode(cssPath) {
        return String(cssPath || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    }

    function matchesActionCodeLine(action, line) {
        const text = String(line || "");
        if (!action) return false;
        if (action.type === "navigate") return text.includes(".goto(");
        if (action.type === "dragANDdrop") return text.includes(".dragTo(");
        if (action.type === "input") return text.includes(".fill(");
        if (action.type === "change") return text.includes(".selectOption(");
        if (action.type === "dbclick") return text.includes(".dblclick(");
        if (action.type === "popup") return text.includes("waitForEvent('popup')");
        if (action.type === "click" || action.type === "checkBox") return text.includes(".click(");
        return text.trim().startsWith("await ");
    }

    function findCodeBodyIndexForAction(codeBody, actionIndex) {
        let matchedActionIndex = 0;

        for (let codeIndex = 0; codeIndex < codeBody.length; codeIndex++) {
            const action = actions[matchedActionIndex];
            if (!action) break;

            if (!matchesActionCodeLine(action, codeBody[codeIndex])) continue;

            if (matchedActionIndex === actionIndex) return codeIndex;
            matchedActionIndex++;
        }

        return -1;
    }

    function replaceDomPathInCodeLine(line, field, oldPath, newPath) {
        const escapedOldPath = escapePathForCode(oldPath);
        const escapedNewPath = escapePathForCode(newPath);

        if (escapedOldPath && line.includes(escapedOldPath)) {
            return line.replace(escapedOldPath, escapedNewPath);
        }

        if (field === "target" && line.includes(".dragTo(")) {
            return line.replace(/(\.dragTo\([\s\S]*?locator\(")([^"]*)("\))/, `$1${escapedNewPath}$3`);
        }

        if (field === "source" && line.includes(".dragTo(")) {
            return line.replace(/^(.*?locator\(")([^"]*)("\)[\s\S]*?\.dragTo\([\s\S]*)$/, `$1${escapedNewPath}$3`);
        }

        return line.replace(/(locator|click|dblclick)\("([^"]*)"\)/, `$1("${escapedNewPath}")`);
    }

    async function updateDomPathSelection(actionIndex, field, oldPath, newPath) {
        const storage = await chrome.storage.local.get(["generatedCodeBody", "generatedCode"]);
        const codeBody = Array.isArray(storage.generatedCodeBody) ? [...storage.generatedCodeBody] : [];
        const codeIndex = findCodeBodyIndexForAction(codeBody, actionIndex);

        if (codeIndex >= 0) {
            codeBody[codeIndex] = replaceDomPathInCodeLine(codeBody[codeIndex], field, oldPath, newPath);
        }

        const generatedCode = wrapPlaywrightCode(codeBody);
        await chrome.storage.local.set({
            generatedAction: actions,
            generatedCodeBody: codeBody,
            generatedCode
        });
        setCodeView(normalizeCode(generatedCode));
    }

    async function syncGeneratedCodeWithActions() {
        const storage = await chrome.storage.local.get(["generatedCodeBody"]);
        const codeBody = Array.isArray(storage.generatedCodeBody) ? [...storage.generatedCodeBody] : [];
        let changed = false;

        actions.forEach((action, actionIndex) => {
            const codeIndex = findCodeBodyIndexForAction(codeBody, actionIndex);
            if (codeIndex < 0) return;

            let nextLine = codeBody[codeIndex];
            if (action.sourceMethod === "ByDomPath" && action.sourceData) {
                nextLine = replaceDomPathInCodeLine(nextLine, "source", null, action.sourceData);
            }
            if (action.targetMethod === "ByDomPath" && action.targetData) {
                nextLine = replaceDomPathInCodeLine(nextLine, "target", null, action.targetData);
            }

            if (nextLine !== codeBody[codeIndex]) {
                codeBody[codeIndex] = nextLine;
                changed = true;
            }
        });

        if (!changed) return;

        const generatedCode = wrapPlaywrightCode(codeBody);
        await chrome.storage.local.set({
            generatedCodeBody: codeBody,
            generatedCode
        });
        setCodeView(normalizeCode(generatedCode));
    }
    // 6. 敺?Storage 銝剖?敺??啁?蝔?蝣?
    function getJSCode() {
        return new Promise((resolve) => {
            chrome.storage.local.get(["generatedCode"], (result) => {
                resolve(normalizeCode(result.generatedCode));
            });
        });
    }

    // 7. ???????嗡??Ｗ????????航?祉揣?????蒂?湔?恍
    async function loadInitialState() {
        const response = await chrome.runtime.sendMessage({ type: "GET_RECORDER_STATE" });

        // 憒???單瘝????脣?航炊???
        if (!response?.ok) {
            setCodeView("// Failed to load recorder state");
            updateActionsList([]);
            updateUI(false);
            return;
        }

        const { generatedCode, generatedAction, recorderStatus } = response.state;
        actions = generatedAction || [];
        setCodeView(normalizeCode(generatedCode)); // 憿舐內蝔?蝣?
        updateActionsList(actions); // 憿舐內???”
        updateUI(recorderStatus === "recording"); // ???????
        await syncGeneratedCodeWithActions();
    }

    // 8. ?單??踵?嚗??Storage ???????航?祆?撖怠?啗???隞????堆??停?舐隞暻潮?鋆賣??恍??甇亥歲????
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.generatedCode) {
            setCodeView(normalizeCode(changes.generatedCode.newValue));
        }

        if (changes.generatedAction) {
            actions = changes.generatedAction.newValue || [];
            updateActionsList(actions);
            syncGeneratedCodeWithActions();
        }

        if (changes.recorderStatus) {
            updateUI(changes.recorderStatus.newValue === "recording");
        }
    });

    // 9. ??鈭辣蝬?嚗??隞斤策??單?? (Background Script)
    
    // 暺???憪?鋆賬?
    startButton.addEventListener("click", async () => {
        const response = await chrome.runtime.sendMessage({ type: "START_RECORDING" });
        if (!response?.ok) {
            alert(response?.error || "Failed to start recording");
            return;
        }
        updateUI(true);
    });

    // 暺???甇ａ?鋆賬?
    stopButton.addEventListener("click", async () => {
        const response = await chrome.runtime.sendMessage({ type: "STOP_RECORDING" });
        if (!response?.ok) {
            alert(response?.error || "Failed to stop recording");
            return;
        }
        updateUI(false);
    });

    // 暺????斤???
    clearButton.addEventListener("click", async () => {
        if (!confirm("Are you sure you want to clear all recorded actions?")) return; // ?脣?蝣箄?

        const response = await chrome.runtime.sendMessage({ type: "CLEAR_RECORDING" });
        if (!response?.ok) {
            alert(response?.error || "Failed to clear recording");
            return;
        }

        // ??敺?蝵格?啗??貉??恍
        actions = [];
        updateActionsList(actions);
        setCodeView("// No code has been generated yet");
        updateUI(false);
    });

    // 暺???箄?研?撠???蝔?蝣潔?頛?撖阡?瑼?
    exportButton.addEventListener("click", async () => {
        const filenameInput = document.getElementById("filename-input");
        let customFilename = filenameInput ? filenameInput.value.trim() : "playwright-test";
        if (!customFilename) customFilename = "playwright-test";

        // 蝣箔??舀?? .spec.js (璅???Playwright 皜祈岫瑼撘?
        const finalFilename = customFilename.replace(/\.\w+$/, "") + ".spec.js";
        const scriptContent = await getJSCode();

        // ?拍 Blob 撠?銝脰????臭?頛?鈭脖?瑼??拐辣
        const blob = new Blob([scriptContent], { type: "text/javascript" });
        const url = URL.createObjectURL(blob);

        // ?澆 Chrome ?批遣??頛?API
        chrome.downloads.download({
            url,
            filename: finalFilename,
            saveAs: true // 閰Ｗ?雿輻??摮?芾ㄐ
        });
    });

    // 10. ?瑁??????單頛摰敺??餃? Background ?輯???
    await loadInitialState();
});

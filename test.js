// 蝣箔??游?HTML ?辣??DOM ???質??亙???嚗????瑁??折??JavaScript
document.addEventListener("DOMContentLoaded", async function () {
    // 1. ???恍銝?蝔格?嗅?隞嗥? DOM 蝭暺?
    const startButton = document.getElementById("start-recording"); // ???ˊ??
    const stopButton = document.getElementById("stop-recording");   // ?迫?ˊ??
    const clearButton = document.getElementById("clear-recording"); // 皜蝝????
    const exportButton = document.getElementById("export-script");  // ?臬?單??
    const hoverHighlightButton = document.getElementById("toggle-hover-highlight");
    const statusDiv = document.getElementById("status");            // ???摮＊蝷箏?憛?
    const recordingIndicator = document.getElementById("recording-indicator"); // ?ˊ銝剔?蝝??內??
    const actionsDiv = document.getElementById("recorded-actions"); // 憿舐內雿輻??雿???皜?憛?
    const codeView = document.getElementById("code-view");          // 憿舐內????撘Ⅳ?憛?
    const actionsCountSpan = document.getElementById("actions-count"); // 憿舐內??蝮賣??蝐?

    let actions = []; // ?脣??刻??園?銝剔??????
    let hoverHighlightEnabled = true;

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

    function updateHoverHighlightButton(enabled) {
        hoverHighlightEnabled = enabled !== false;
        if (!hoverHighlightButton) return;

        hoverHighlightButton.textContent = hoverHighlightEnabled ? "Highlight On" : "Highlight Off";
        hoverHighlightButton.classList.toggle("disabled", !hoverHighlightEnabled);
        hoverHighlightButton.title = hoverHighlightEnabled
            ? "Click to turn off hovered element highlight"
            : "Click to turn on hovered element highlight";
    }

    function getActionTarget(action) {
        if (action.type === "dragANDdrop") return action.displayTargetWindow || action.targetWindow || "";
        return action.displayTargetWindow || action.targetWindow || "";
    }

    function getActionBehavior(action) {
        if (action.type === "dialog" && action.triggerAction?.type) {
            return `dialog\ntrigger: ${action.triggerAction.type}`;
        }
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
        if (action.type === "dialog" && action.triggerAction) {
            return `dialog\ntrigger: ${action.triggerAction.sourceMethod || ""}`;
        }
        return action.sourceMethod || "";
    }

    function createMethodCell(action) {
        return createCell(formatActionMethod(action), "action-method");
    }

    function createElementCell(action, index) {
        const cell = createCell("", "action-element");

        if (action.type === "dragANDdrop") {
            appendLabeledElement(cell, "來源", action.sourceData, action.sourceMethod, action.sourceDomPathOptions, action.sourceDomPathChain, index, "source");
            appendLabeledElement(cell, "目標", action.targetData, action.targetMethod, action.targetDomPathOptions, action.targetDomPathChain, index, "target");
            return cell;
        }

        if (action.type === "navigate" || action.type === "popup") {
            cell.textContent = action.url || "";
            return cell;
        }

        if (action.type === "dialog" && action.triggerAction) {
            const dialogText = action.dialogType || action.message || "dialog";
            appendLabeledElement(cell, "Dialog", dialogText, null, null, index, "source");
            appendLabeledElement(
                cell,
                "Trigger",
                action.triggerAction.sourceData || getActionValue(action.triggerAction),
                action.triggerAction.sourceMethod,
                null,
                null,
                index,
                "source"
            );
            return cell;
        }

        appendDomPathOrText(cell, action.sourceData || getActionValue(action), action.sourceMethod, action.sourceDomPathOptions, action.sourceDomPathChain, index, "source");
        return cell;
    }

    function appendLabeledElement(parent, label, value, method, options, chain, actionIndex, field) {
        const wrapper = document.createElement("div");
        const prefix = document.createElement("span");
        prefix.textContent = `${label}: `;
        wrapper.appendChild(prefix);
        appendDomPathOrText(wrapper, value, method, options, chain, actionIndex, field);
        parent.appendChild(wrapper);
    }

    function formatDomPathParts(path, chain = []) {
        const hostChain = Array.isArray(chain)
            ? chain.map(step => step?.hostSelector).filter(Boolean)
            : [];

        return [...hostChain, path].filter(Boolean).join(" >> ");
    }

    function formatDomPathOption(option, fallbackChain = []) {
        if (typeof option === "string") return formatDomPathParts(option, fallbackChain);

        const chain = Array.isArray(option?.shadowChain)
            ? option.shadowChain.map(step => step?.hostSelector).filter(Boolean)
            : [];

        return [...chain, option?.path].filter(Boolean).join(" >> ");
    }

    function sameDomPathChain(left = [], right = []) {
        const leftSelectors = Array.isArray(left) ? left.map(step => step?.hostSelector).filter(Boolean) : [];
        const rightSelectors = Array.isArray(right) ? right.map(step => step?.hostSelector).filter(Boolean) : [];
        return leftSelectors.join("\n") === rightSelectors.join("\n");
    }

    function appendDomPathOrText(parent, value, method, options, chain, actionIndex, field) {
        if (method === "ByDomPath" && Array.isArray(options) && options.length) {
            const select = document.createElement("select");
            select.className = "dompath-select";
            options.forEach((option, optionIndex) => {
                const path = typeof option === "string" ? option : option.path;
                const optionChain = typeof option === "string" ? [] : option?.shadowChain || [];
                if (!path) return;

                const item = document.createElement("option");
                item.value = String(optionIndex);
                item.textContent = `${optionIndex + 1}. ${formatDomPathOption(option, chain)}`;
                item.selected = path === value && sameDomPathChain(optionChain, chain);
                select.appendChild(item);
            });

            select.addEventListener("change", async () => {
                const selectedOption = options[Number(select.value)];
                const nextPath = typeof selectedOption === "string" ? selectedOption : selectedOption?.path;
                const nextChain = typeof selectedOption === "string" ? [] : selectedOption?.shadowChain || [];
                if (!nextPath) return;

                const key = field === "target" ? "targetData" : "sourceData";
                const chainKey = field === "target" ? "targetDomPathChain" : "sourceDomPathChain";
                const oldValue = actions[actionIndex][key];
                actions[actionIndex][key] = nextPath;
                actions[actionIndex][chainKey] = nextChain;
                await updateDomPathSelection(actionIndex, field, oldValue, nextPath, nextChain);
            });

            parent.appendChild(select);
            return;
        }

        const span = document.createElement("span");
        span.textContent = method === "ByDomPath" ? formatDomPathParts(value, chain) : value || "";
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

    function getActionGeneratedLines(action) {
        if (Array.isArray(action?.generatedCodeLines)) return action.generatedCodeLines.filter(Boolean);
        if (action?.generatedCodeLine) return [action.generatedCodeLine];
        return [];
    }

    function setActionGeneratedLines(action, lines) {
        const normalizedLines = Array.isArray(lines) ? lines.filter(Boolean) : [];
        action.generatedCodeLines = normalizedLines;
        action.generatedCodeLine = normalizedLines[normalizedLines.length - 1] || "";
    }

    function buildCodeBodyFromActions(fallbackCodeBody = []) {
        const codeBody = [];
        let hasMissingActionCode = false;

        actions.forEach(action => {
            const lines = getActionGeneratedLines(action);
            if (lines.length) {
                codeBody.push(...lines);
            } else if (action.type !== "navigate" || action.url) {
                hasMissingActionCode = true;
            }
        });

        return codeBody.length && !hasMissingActionCode
            ? codeBody
            : (Array.isArray(fallbackCodeBody) ? fallbackCodeBody.filter(Boolean) : []);
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

    function buildDomPathLocatorChain(newPath, shadowChain = []) {
        const selectors = [
            ...(Array.isArray(shadowChain) ? shadowChain.map(step => step?.hostSelector).filter(Boolean) : []),
            newPath
        ].filter(Boolean);

        return selectors.map(selector => `.locator("${escapePathForCode(selector)}")`).join("");
    }

    function replaceLastLocatorChain(line, locatorChain) {
        const locatorChainPattern = /(?:\.locator\("((?:\\.|[^"\\])*)"\))+/g;
        let match = null;
        let lastMatch = null;

        while ((match = locatorChainPattern.exec(line)) !== null) {
            lastMatch = {
                start: match.index,
                end: locatorChainPattern.lastIndex
            };
        }

        if (!lastMatch) return line;

        return [
            line.slice(0, lastMatch.start),
            locatorChain,
            line.slice(lastMatch.end)
        ].join("");
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

    function replaceDomPathInCodeLine(line, field, oldPath, newPath, newChain = []) {
        const escapedOldPath = escapePathForCode(oldPath);
        const escapedNewPath = escapePathForCode(newPath);
        const hasShadowChain = Array.isArray(newChain) && newChain.length > 0;
        const dragIndex = line.includes(".dragTo(") ? line.indexOf(".dragTo(") : -1;

        if (hasShadowChain) {
            const locatorChain = buildDomPathLocatorChain(newPath, newChain);

            if (dragIndex >= 0) {
                if (field === "source") {
                    return replaceLastLocatorChain(line.slice(0, dragIndex), locatorChain) + line.slice(dragIndex);
                }
                return line.slice(0, dragIndex) + replaceLastLocatorChain(line.slice(dragIndex), locatorChain);
            }

            return replaceLastLocatorChain(line, locatorChain);
        }

        if (dragIndex >= 0) {
            const locatorChain = `.locator("${escapedNewPath}")`;
            if (field === "source") {
                return replaceLastLocatorChain(line.slice(0, dragIndex), locatorChain) + line.slice(dragIndex);
            }
            return line.slice(0, dragIndex) + replaceLastLocatorChain(line.slice(dragIndex), locatorChain);
        }

        if (escapedOldPath && line.includes(escapedOldPath)) {
            return line.replace(escapedOldPath, escapedNewPath);
        }

        return replaceLastLocatorPath(line, escapedNewPath);
    }

    function replaceLastLocatorPath(line, escapedNewPath) {
        const locatorPattern = /\.locator\("((?:\\.|[^"\\])*)"\)/g;
        let match = null;
        let lastMatch = null;

        while ((match = locatorPattern.exec(line)) !== null) {
            lastMatch = {
                start: match.index,
                end: locatorPattern.lastIndex
            };
        }

        if (!lastMatch) return line;

        return [
            line.slice(0, lastMatch.start),
            `.locator("${escapedNewPath}")`,
            line.slice(lastMatch.end)
        ].join("");
    }

    async function updateDomPathSelection(actionIndex, field, oldPath, newPath, newChain = []) {
        const storage = await chrome.storage.local.get(["generatedCodeBody", "generatedCode"]);
        const codeBody = Array.isArray(storage.generatedCodeBody) ? [...storage.generatedCodeBody] : [];
        const action = actions[actionIndex];
        const actionLines = getActionGeneratedLines(action);

        if (action && actionLines.length) {
            const nextLines = actionLines.map(line => replaceDomPathInCodeLine(line, field, oldPath, newPath, newChain));
            setActionGeneratedLines(action, nextLines);
        } else {
            const codeIndex = findCodeBodyIndexForAction(codeBody, actionIndex);
            if (codeIndex >= 0) {
                codeBody[codeIndex] = replaceDomPathInCodeLine(codeBody[codeIndex], field, oldPath, newPath, newChain);
            }
        }

        const nextCodeBody = buildCodeBodyFromActions(codeBody);
        const generatedCode = wrapPlaywrightCode(nextCodeBody);
        await chrome.storage.local.set({
            generatedAction: actions,
            generatedCodeBody: nextCodeBody,
            generatedCode
        });
        setCodeView(normalizeCode(generatedCode));
    }

    async function syncGeneratedCodeWithActions() {
        const storage = await chrome.storage.local.get(["generatedCodeBody"]);
        const codeBody = Array.isArray(storage.generatedCodeBody) ? [...storage.generatedCodeBody] : [];
        let changed = false;

        actions.forEach((action, actionIndex) => {
            const actionLines = getActionGeneratedLines(action);
            if (actionLines.length) {
                let nextLines = actionLines;
                if (action.sourceMethod === "ByDomPath" && action.sourceData) {
                    nextLines = nextLines.map(line => replaceDomPathInCodeLine(line, "source", null, action.sourceData, action.sourceDomPathChain || []));
                }
                if (action.targetMethod === "ByDomPath" && action.targetData) {
                    nextLines = nextLines.map(line => replaceDomPathInCodeLine(line, "target", null, action.targetData, action.targetDomPathChain || []));
                }
                if (nextLines.join("\n") !== actionLines.join("\n")) {
                    setActionGeneratedLines(action, nextLines);
                    changed = true;
                }
                return;
            }

            const codeIndex = findCodeBodyIndexForAction(codeBody, actionIndex);
            if (codeIndex < 0) return;

            let nextLine = codeBody[codeIndex];
            if (action.sourceMethod === "ByDomPath" && action.sourceData) {
                nextLine = replaceDomPathInCodeLine(nextLine, "source", null, action.sourceData, action.sourceDomPathChain || []);
            }
            if (action.targetMethod === "ByDomPath" && action.targetData) {
                nextLine = replaceDomPathInCodeLine(nextLine, "target", null, action.targetData, action.targetDomPathChain || []);
            }

            if (nextLine !== codeBody[codeIndex]) {
                codeBody[codeIndex] = nextLine;
                changed = true;
            }
        });

        const nextCodeBody = buildCodeBodyFromActions(codeBody);
        if (!changed && nextCodeBody.join("\n") === codeBody.filter(Boolean).join("\n")) return;

        const generatedCode = wrapPlaywrightCode(nextCodeBody);
        await chrome.storage.local.set({
            generatedAction: actions,
            generatedCodeBody: nextCodeBody,
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

        if (changes.hoverHighlightEnabled) {
            updateHoverHighlightButton(changes.hoverHighlightEnabled.newValue !== false);
        }
    });

    // 9. ??鈭辣蝬?嚗??隞斤策??單?? (Background Script)
    
    // 暺???憪?鋆賬?
    startButton.addEventListener("click", async () => {
        await chrome.storage.local.set({ hoverPreviewSessionEnabled: true });
        const response = await chrome.runtime.sendMessage({ type: "START_RECORDING" });
        if (!response?.ok) {
            await chrome.storage.local.set({ hoverPreviewSessionEnabled: false });
            alert(response?.error || "Failed to start recording");
            return;
        }
        updateUI(true);
    });

    // 暺???甇ａ?鋆賬?
    stopButton.addEventListener("click", async () => {
        await chrome.storage.local.set({ hoverPreviewSessionEnabled: false });
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
        await chrome.storage.local.set({ hoverPreviewSessionEnabled: false });
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

    hoverHighlightButton?.addEventListener("click", async () => {
        const nextEnabled = !hoverHighlightEnabled;
        await chrome.storage.local.set({ hoverHighlightEnabled: nextEnabled });
        updateHoverHighlightButton(nextEnabled);
    });

    // 10. ?瑁??????單頛摰敺??餃? Background ?輯???
    const hoverStorage = await chrome.storage.local.get(["hoverHighlightEnabled"]);
    updateHoverHighlightButton(hoverStorage.hoverHighlightEnabled !== false);
    await loadInitialState();
});

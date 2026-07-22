// 蝣箔??游?HTML ?辣??DOM ???質??亙???嚗????瑁??折??JavaScript
document.addEventListener("DOMContentLoaded", async function () {
    // 1. ???恍銝?蝔格?嗅?隞嗥? DOM 蝭暺?
    const startButton = document.getElementById("start-recording"); // ???ˊ??
    const stopButton = document.getElementById("stop-recording");   // ?迫?ˊ??
    const clearButton = document.getElementById("clear-recording"); // 皜蝝????
    const exportButton = document.getElementById("export-script");  // ?臬?單??
    const hoverHighlightButton = document.getElementById("toggle-hover-highlight");
    const dropPositionModeSelect = document.getElementById("drop-position-mode");
    const loginEnabledInput = document.getElementById("login-enabled");
    const usernameLocatorInput = document.getElementById("username-locator");
    const passwordLocatorInput = document.getElementById("password-locator");
    const loginButtonLocatorInput = document.getElementById("login-button-locator");
    const credentialSourceSelect = document.getElementById("credential-source");
    const loginUsernameInput = document.getElementById("login-username");
    const loginPasswordInput = document.getElementById("login-password");
    const loginSettingsNote = document.getElementById("login-settings-note");
    const statusDiv = document.getElementById("status");            // ???摮＊蝷箏?憛?
    const recordingIndicator = document.getElementById("recording-indicator"); // ?ˊ銝剔?蝝??內??
    const actionsDiv = document.getElementById("recorded-actions"); // 憿舐內雿輻??雿???皜?憛?
    const codeView = document.getElementById("code-view");          // 憿舐內????撘Ⅳ?憛?
    const actionsCountSpan = document.getElementById("actions-count"); // 憿舐內??蝮賣??蝐?

    let actions = []; // ?脣??刻??園?銝剔??????
    let hoverHighlightEnabled = true;
    let dropPositionMode = "ratio";
    let pendingActionsRefresh = null;
    let pendingCodeViewRefresh = null;
    let locatorSelectInteractionActive = false;
    const noteSaveTimers = new Map();

    function getLoginSettings() {
        return {
            enabled: loginEnabledInput?.checked === true,
            usernameLocator: usernameLocatorInput?.value.trim() || "",
            passwordLocator: passwordLocatorInput?.value.trim() || "",
            loginButtonLocator: loginButtonLocatorInput?.value.trim() || "",
            credentialSource: credentialSourceSelect?.value === "environment"
                ? "environment"
                : "direct",
            username: loginUsernameInput?.value || "",
            password: loginPasswordInput?.value || ""
        };
    }

    function validateLoginSettings(settings) {
        if (!settings.enabled) return "";

        const requiredFields = [
            ["Username locator", settings.usernameLocator],
            ["Password locator", settings.passwordLocator],
            ["Login button locator", settings.loginButtonLocator]
        ];
        if (settings.credentialSource === "direct") {
            requiredFields.push(
                ["Username", settings.username],
                ["Password", settings.password]
            );
        }
        const missingField = requiredFields.find(([, value]) => !value);
        if (missingField) return `${missingField[0]} is required`;

        return "";
    }

    function updateCredentialSourceUI() {
        const isDirect = credentialSourceSelect?.value !== "environment";
        document.querySelectorAll(".login-direct-field").forEach(element => {
            element.hidden = !isDirect;
        });
        if (loginSettingsNote) {
            loginSettingsNote.textContent = isDirect
                ? "Direct mode writes the username and password into the generated and exported test file as plain text."
                : "Generated tests read TEST_USERNAME and TEST_PASSWORD from environment variables; credentials are not embedded in the test file.";
        }
    }

    function findMatchingActionIndex(actionList, action, preferredIndex) {
        const list = Array.isArray(actionList) ? actionList : [];
        const indexedAction = list[preferredIndex];
        if (indexedAction && (action?.id == null || indexedAction.id === action.id)) {
            return preferredIndex;
        }
        if (action?.id != null) {
            return list.findIndex(item => item?.id === action.id);
        }
        return Number.isInteger(preferredIndex) && preferredIndex >= 0 && preferredIndex < list.length
            ? preferredIndex
            : -1;
    }

    function isLocatorSelectActive() {
        const activeElement = document.activeElement;
        const hasFocusedDropdown = !!activeElement
            && !!activeElement.closest?.(".locator-dropdown")
            && actionsDiv.contains(activeElement);
        const hasOpenDropdown = !!actionsDiv.querySelector(".locator-dropdown[open]");
        return locatorSelectInteractionActive || hasFocusedDropdown || hasOpenDropdown;
    }

    function applyGeneratedActions(nextActions, previousActions = actions) {
        const normalizedActions = Array.isArray(nextActions) ? nextActions : [];
        const previousLength = Array.isArray(previousActions) ? previousActions.length : 0;
        actions = normalizedActions;
        updateActionsList(actions, {
            scrollToBottom: actions.length > previousLength
        });
    }

    function haveSameActionRows(currentActions, nextActions) {
        if (!Array.isArray(currentActions) || !Array.isArray(nextActions)) return false;
        if (currentActions.length !== nextActions.length) return false;

        return currentActions.every((currentAction, index) => {
            const nextAction = nextActions[index];
            if (!currentAction || !nextAction) return currentAction === nextAction;

            if (currentAction.id != null || nextAction.id != null) {
                return currentAction.id === nextAction.id;
            }

            return currentAction.index === nextAction.index
                && currentAction.type === nextAction.type
                && currentAction.timestamp === nextAction.timestamp;
        });
    }

    function preserveLocalLocatorOverrides(nextActions, currentActions = actions) {
        if (!Array.isArray(nextActions)) return [];
        const existingActions = Array.isArray(currentActions) ? currentActions : [];

        return nextActions.map((nextAction, index) => {
            if (!nextAction) return nextAction;
            const currentIndex = findMatchingActionIndex(existingActions, nextAction, index);
            const currentAction = currentIndex >= 0 ? existingActions[currentIndex] : null;
            if (!currentAction) return nextAction;

            const mergedAction = { ...nextAction };
            if (currentAction.codeNote !== undefined) {
                mergedAction.codeNote = currentAction.codeNote;
            }
            let hasOverride = false;

            ["source", "target"].forEach(field => {
                const locatorOverrideKey = `${field}LocatorSelectionOverridden`;
                const domPathOverrideKey = `${field}DomPathSelectionOverridden`;
                if (
                    currentAction[locatorOverrideKey] !== true
                    && currentAction[domPathOverrideKey] !== true
                ) {
                    return;
                }

                mergedAction[`${field}Method`] = currentAction[`${field}Method`];
                mergedAction[`${field}Data`] = currentAction[`${field}Data`];
                mergedAction[`${field}DomPathChain`] =
                    currentAction[`${field}DomPathChain`] || [];
                mergedAction[`${field}LocatorOptions`] =
                    currentAction[`${field}LocatorOptions`] || [];
                mergedAction[locatorOverrideKey] =
                    currentAction[locatorOverrideKey] === true;
                mergedAction[domPathOverrideKey] =
                    currentAction[domPathOverrideKey] === true;
                hasOverride = true;
            });

            if (hasOverride) {
                mergedAction.generatedCodeLines = currentAction.generatedCodeLines || [];
                mergedAction.generatedCodeLine = currentAction.generatedCodeLine || "";
                mergedAction.generatedCodeReplacesPrevious =
                    currentAction.generatedCodeReplacesPrevious === true;
            }

            return mergedAction;
        });
    }

    function flushPendingActionsRefresh({ force = false } = {}) {
        if (!pendingActionsRefresh || (!force && isLocatorSelectActive())) return;
        const pending = pendingActionsRefresh;
        pendingActionsRefresh = null;
        applyGeneratedActions(pending.nextActions, pending.previousActions);
    }

    function flushPendingCodeViewRefresh({ force = false } = {}) {
        if (pendingCodeViewRefresh === null || (!force && isLocatorSelectActive())) return;
        const pendingCode = pendingCodeViewRefresh;
        pendingCodeViewRefresh = null;
        setCodeView(pendingCode);
    }

    function updateCodeViewWithoutInterruptingSelect(code) {
        if (isLocatorSelectActive()) {
            pendingCodeViewRefresh = code;
            return;
        }
        setCodeView(code);
    }

    function endLocatorSelectInteraction() {
        locatorSelectInteractionActive = false;
        setTimeout(() => {
            flushPendingActionsRefresh({ force: true });
            flushPendingCodeViewRefresh({ force: true });
        }, 0);
    }

    document.addEventListener("pointerdown", (event) => {
        if (event.target?.closest?.(".locator-dropdown")) return;
        actionsDiv.querySelectorAll(".locator-dropdown[open]").forEach(dropdown => {
            dropdown.removeAttribute("open");
        });
        endLocatorSelectInteraction();
    }, true);

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
    function updateActionsList(actions, { scrollToBottom = false } = {}) {
        const previousScrollTop = actionsDiv.scrollTop;
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
            actionElement.appendChild(createElementCell(action, index));
            actionElement.appendChild(createNoteCell(action, index));
            actionElement.appendChild(createDeleteCell(action, index));

            actionsDiv.appendChild(actionElement);
        });

        if (scrollToBottom) {
            actionsDiv.scrollTop = actionsDiv.scrollHeight;
        } else {
            actionsDiv.scrollTop = previousScrollTop;
        }
    }
    function createCell(text, className = "") {
        const div = document.createElement("div");
        div.className = `action-cell ${className}`;
        div.textContent = text ?? "";
        return div;
    }

    function createNoteCell(action, actionIndex) {
        const cell = createCell("", "action-note");
        const input = document.createElement("textarea");
        input.className = "action-note-input";
        input.rows = 2;
        input.placeholder = "輸入這條程式碼的備註";
        input.value = action?.codeNote || "";
        input.setAttribute("aria-label", `Action ${actionIndex + 1} note`);

        input.addEventListener("input", () => {
            action.codeNote = input.value;
            clearTimeout(noteSaveTimers.get(actionIndex));
            noteSaveTimers.set(actionIndex, setTimeout(() => {
                noteSaveTimers.delete(actionIndex);
                saveActionNote(actionIndex, input.value);
            }, 300));
        });
        input.addEventListener("blur", () => {
            clearTimeout(noteSaveTimers.get(actionIndex));
            noteSaveTimers.delete(actionIndex);
            saveActionNote(actionIndex, input.value);
        });

        cell.appendChild(input);
        return cell;
    }

    function createDeleteCell(action, actionIndex) {
        const cell = createCell("", "action-delete");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "action-delete-button";
        button.textContent = "刪除";
        button.title = `Delete Action ${actionIndex + 1}`;
        button.setAttribute("aria-label", `Delete Action ${actionIndex + 1}`);
        button.addEventListener("click", async () => {
            if (!window.confirm(`確定要刪除 Action ${actionIndex + 1}？`)) return;
            button.disabled = true;
            try {
                await deleteRecordedAction(actionIndex);
            } catch (error) {
                console.warn("[Recorded Actions] Unable to delete action.", error);
                window.alert(`刪除失敗：${error?.message || "Unable to delete action"}`);
            } finally {
                if (button.isConnected) button.disabled = false;
            }
        });
        cell.appendChild(button);
        return cell;
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
        if (action.type === "dragANDdrop") {
            return `dragANDdrop\nposition: ${action.dropPositionMode || "ratio"}`;
        }
        if (action.type === "ionSelect") {
            return `ionSelect\nselected: ${action.selectedText || action.selectedValue || ""}`;
        }
        return action.type || "unknown";
    }

    function getActionValue(action) {
        if (action.type === "navigate" || action.type === "popup") return action.url || "";
        if (action.type === "input") return action.inputText || action.sourceData || "";
        if (action.type === "change" || action.type === "ionSelect") {
            return action.selectedText || action.selectedValue || action.sourceData || "";
        }
        if (action.type === "keyboard") return action.keyboard || "";
        return action.sourceData || "";
    }

    function createElementCell(action, index) {
        const cell = createCell("", "action-element");

        if (action.type === "dragANDdrop") {
            appendLabeledElement(cell, "來源", action.sourceData, action.sourceMethod, action.sourceDomPathOptions, action.sourceDomPathChain, index, "source");
            appendLabeledElement(cell, "目標", action.targetData, action.targetMethod, action.targetDomPathOptions, action.targetDomPathChain, index, "target");
            return cell;
        }

        if (action.type === "navigate" || action.type === "popup") {
            const viewportText = action.type === "popup" && action.viewport
                ? `\nviewport: ${action.viewport.width} × ${action.viewport.height}`
                : "";
            cell.textContent = `${action.url || ""}${viewportText}`;
            return cell;
        }

        if (action.type === "ionSelect") {
            appendLabeledElement(
                cell,
                "元件",
                action.sourceData,
                action.sourceMethod,
                action.sourceDomPathOptions,
                action.sourceDomPathChain,
                index,
                "source"
            );
            const selectedValue = Array.isArray(action.selectedValue)
                ? action.selectedValue.join(", ")
                : String(action.selectedValue ?? "");
            const selectedText = action.selectedText || selectedValue;
            const optionDisplay = selectedValue && selectedValue !== selectedText
                ? `${selectedText} (${selectedValue})`
                : selectedText;
            appendReadOnlyLabeledValue(
                cell,
                "選項",
                optionDisplay
            );
            return cell;
        }

        if (action.type === "dialog" && action.triggerAction) {
            const dialogText = action.dialogType || action.message || "dialog";
            appendReadOnlyLabeledValue(cell, "Dialog", dialogText);
            appendLabeledElement(
                cell,
                "Trigger",
                action.triggerAction.sourceData || getActionValue(action.triggerAction),
                action.triggerAction.sourceMethod,
                action.triggerAction.sourceDomPathOptions,
                action.triggerAction.sourceDomPathChain,
                index,
                "trigger"
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

    function appendReadOnlyLabeledValue(parent, label, value) {
        const wrapper = document.createElement("div");
        wrapper.className = "action-readonly-row";

        const prefix = document.createElement("span");
        prefix.textContent = `${label}: `;
        wrapper.appendChild(prefix);

        const text = document.createElement("span");
        text.className = "action-readonly-value";
        text.textContent = value ?? "";
        wrapper.appendChild(text);

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

    function getLocatorOptionValue(method, data = {}) {
        if (method === "ByPlaywright") return data.locator || data.selector || data.value || "";
        if (method === "ByGjsToolbarItem") {
            const toolbar = data.toolbarSelector || ".gjs-toolbar";
            const item = data.itemSelector || ".gjs-toolbar-item";
            const index = Number.isInteger(Number(data.index)) ? Number(data.index) : 0;
            return `${toolbar} ${item} nth=${index}`;
        }
        if (method === "ByRole") {
            const parts = [`role: ${data.role || ""}`];
            if (data.name !== null && data.name !== undefined && data.name !== "") {
                parts.push(`name: "${data.name}"`);
            }
            if (data.index !== null && data.index !== undefined) {
                parts.push(`index: ${data.index}`);
            }
            return parts.join(" ");
        }
        if (method === "ByTitle") return data.title || "";
        if (method === "ByText") return data.text || "";
        if (method === "ByDomPath") return data.csspath || data.path || "";
        return data.value || "";
    }

    function isBlockedSelectorCandidate(selector) {
        return /\.gjs-selected-parent(?![a-zA-Z0-9_-])/.test(
            String(selector || "")
        );
    }

    function isBlockedLocatorOption(candidate) {
        const data = candidate?.data || {};
        return isBlockedSelectorCandidate(
            data.selector ||
            data.locator ||
            data.csspath ||
            data.path ||
            candidate?.currentValue
        );
    }

    function getLocatorOptions(action, field, value, method, domOptions, chain) {
        const optionOwner = field === "trigger" && action?.triggerAction
            ? action.triggerAction
            : action;
        const optionsKey = field === "target" ? "targetLocatorOptions" : "sourceLocatorOptions";
        const storedOptions = Array.isArray(optionOwner?.[optionsKey]) ? optionOwner[optionsKey] : [];
        const filteredStoredOptions = storedOptions.filter(option => !isBlockedLocatorOption(option));
        if (filteredStoredOptions.length) return filteredStoredOptions;

        const fallback = [];
        if (method && !isBlockedSelectorCandidate(value)) {
            fallback.push({
                id: `${method}-current`,
                method,
                data: method === "ByDomPath"
                    ? { csspath: value, shadowChain: chain || [] }
                    : method === "ByPlaywright"
                        ? { locator: value, shadowChain: chain || [] }
                    : { value },
                currentValue: value,
                recommended: true
            });
        }

        if (Array.isArray(domOptions)) {
            domOptions.forEach((option, index) => {
                const path = typeof option === "string" ? option : option?.path;
                if (
                    !path ||
                    isBlockedSelectorCandidate(path) ||
                    (method === "ByDomPath" && path === value)
                ) return;
                fallback.push({
                    id: `ByDomPath-${index}`,
                    method: "ByDomPath",
                    data: {
                        csspath: path,
                        shadowChain: typeof option === "string" ? [] : option?.shadowChain || chain || []
                    }
                });
            });
        }
        return fallback;
    }

    function getLocatorRiskLabelPrefix(candidate) {
        const data = candidate?.data || {};
        const labels = [];
        if (data.possibleDynamicId === true) labels.push("【可能為動態 ID】");
        if (data.possibleDynamicClass === true) labels.push("【可能為動態 Class】");
        return labels.length ? `${labels.join("")} ` : "";
    }

    function formatLocatorOptionLabel(candidate, domIndex = 0) {
        const data = candidate?.data || {};
        const recommended = candidate?.recommended ? "（推薦）" : "";
        const riskPrefix = getLocatorRiskLabelPrefix(candidate);

        if (candidate.method === "ByPlaywright") {
            const hostPrefix = formatDomPathParts("", data.shadowChain || []).replace(/\s*>>\s*$/, "");
            const selector = data.locator || data.selector || candidate.currentValue || "";
            return `${riskPrefix}Playwright${recommended} — ${[hostPrefix, selector].filter(Boolean).join(" >> ")}`;
        }
        if (candidate.method === "ByGjsToolbarItem") {
            const toolbar = data.toolbarSelector || ".gjs-toolbar";
            const item = data.itemSelector || ".gjs-toolbar-item";
            const index = Number.isInteger(Number(data.index)) ? Number(data.index) : 0;
            return `GJS Toolbar${recommended} — ${toolbar} > ${item}.nth(${index})`;
        }
        if (candidate.method === "ByRole") {
            const name = data.name ? ` "${data.name}"` : "";
            const index = data.index !== null && data.index !== undefined ? ` [${data.index}]` : "";
            return `ByRole${recommended} — ${data.role || "element"}${name}${index}`;
        }
        if (candidate.method === "ByText") {
            return `ByText${recommended} — "${data.text || candidate.currentValue || ""}"`;
        }
        if (candidate.method === "ByTitle") {
            return `ByTitle${recommended} — "${data.title || candidate.currentValue || ""}"`;
        }

        const path = data.csspath || data.path || "";
        return `DOM Path ${domIndex}${recommended} — ${path}`;
    }

    function isSelectedLocatorOption(candidate, method, value, chain) {
        if (candidate.method !== method) return false;
        if (method === "ByPlaywright") {
            return (
                getLocatorOptionValue(method, candidate.data) === value ||
                candidate.currentValue === value
            ) && sameDomPathChain(candidate.data?.shadowChain || [], chain);
        }
        if (method !== "ByDomPath") {
            return getLocatorOptionValue(method, candidate.data) === value
                || candidate.currentValue === value;
        }

        const path = candidate.data?.csspath || candidate.data?.path || "";
        return path === value && sameDomPathChain(candidate.data?.shadowChain || [], chain);
    }

    function appendDomPathOrText(parent, value, method, options, chain, actionIndex, field) {
        const action = actions[actionIndex];
        const locatorOptions = getLocatorOptions(action, field, value, method, options, chain);

        if (locatorOptions.length > 1) {
            const dropdown = document.createElement("details");
            dropdown.className = "locator-dropdown";
            const summary = document.createElement("summary");
            summary.className = "locator-dropdown-summary";
            const menu = document.createElement("div");
            menu.className = "locator-dropdown-menu";
            let domIndex = 0;
            let selectedLabel = "";
            let currentGroup = "";

            locatorOptions.forEach((candidate, optionIndex) => {
                if (candidate.method === "ByDomPath") domIndex++;
                const group = candidate.method === "ByDomPath" ? "DOM Path" : "語意定位";
                if (group !== currentGroup) {
                    const groupLabel = document.createElement("div");
                    groupLabel.className = "locator-dropdown-group";
                    groupLabel.textContent = group;
                    menu.appendChild(groupLabel);
                    currentGroup = group;
                }

                const label = formatLocatorOptionLabel(candidate, domIndex);
                const item = document.createElement("button");
                item.type = "button";
                item.className = "locator-dropdown-option";
                item.dataset.optionIndex = String(optionIndex);
                item.textContent = label;

                if (isSelectedLocatorOption(candidate, method, value, chain)) {
                    selectedLabel = label;
                    item.classList.add("selected");
                    item.setAttribute("aria-current", "true");
                }

                item.addEventListener("click", async () => {
                    dropdown.removeAttribute("open");
                    menu.querySelectorAll(".locator-dropdown-option").forEach(option => {
                        option.classList.remove("selected");
                        option.removeAttribute("aria-current");
                    });
                    item.classList.add("selected");
                    item.setAttribute("aria-current", "true");
                    summary.textContent = label;

                    try {
                        await updateLocatorSelection(actionIndex, field, candidate);
                    } finally {
                        endLocatorSelectInteraction();
                    }
                });
                menu.appendChild(item);
            });

            summary.textContent = selectedLabel || formatLocatorOptionLabel(locatorOptions[0], 0);

            const beginDropdownInteraction = () => {
                actionsDiv.querySelectorAll(".locator-dropdown[open]").forEach(otherDropdown => {
                    if (otherDropdown !== dropdown) otherDropdown.removeAttribute("open");
                });
                locatorSelectInteractionActive = true;
            };
            summary.addEventListener("pointerdown", beginDropdownInteraction, true);
            summary.addEventListener("click", () => {
                if (dropdown.open) {
                    setTimeout(endLocatorSelectInteraction, 0);
                } else {
                    beginDropdownInteraction();
                }
            });
            dropdown.addEventListener("keydown", (event) => {
                if (event.key === "Escape") {
                    event.preventDefault();
                    dropdown.removeAttribute("open");
                    summary.focus();
                    endLocatorSelectInteraction();
                }
            });
            dropdown.addEventListener("focusout", () => {
                setTimeout(() => {
                    if (!dropdown.contains(document.activeElement)) {
                        dropdown.removeAttribute("open");
                        endLocatorSelectInteraction();
                    }
                }, 0);
            });

            dropdown.appendChild(summary);
            dropdown.appendChild(menu);
            parent.appendChild(dropdown);
            return;
        }

        const span = document.createElement("span");
        const selectedOption = locatorOptions.find(candidate =>
            isSelectedLocatorOption(candidate, method, value, chain)
        ) || locatorOptions[0];
        const displayedValue = method === "ByDomPath" ? formatDomPathParts(value, chain) : value || "";
        span.textContent = `${getLocatorRiskLabelPrefix(selectedOption)}${displayedValue}`;
        parent.appendChild(span);
    }

    function wrapPlaywrightCode(codeBody) {
        const orderedBody = orderPlaywrightCodeBody(codeBody);
        const annotatedBody = annotateCodeBodyWithNotes(orderedBody);
        return [
            "import { test, expect } from '@playwright/test';",
            "",
            "async function safeScrollIntoViewIfNeeded(locator, timeout = 1000) {",
            "  try {",
            "    await locator.scrollIntoViewIfNeeded({ timeout });",
            "  } catch (error) {",
            "    console.warn(`scrollIntoViewIfNeeded skipped: ${error.message}`);",
            "  }",
            "}",
            "",
            "test('test', async ({ page }) => {",
            ...annotatedBody.map(line => "  " + line),
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

    function noteToCommentLines(note) {
        const normalized = String(note || "").replace(/\r\n?/g, "\n").trim();
        if (!normalized) return [];
        return normalized.split("\n").map(line => line ? `// ${line}` : "//");
    }

    function formatDomPathCandidate(path, chain = []) {
        const hostSelectors = Array.isArray(chain)
            ? chain.map(step => step?.hostSelector).filter(Boolean)
            : [];
        return [...hostSelectors, path].filter(Boolean).join(" >> ");
    }

    function formatLocatorOptionForComment(option) {
        const method = option?.method;
        const data = option?.data || {};

        if (method === "ByPlaywright") return data.locator || data.selector || "";
        if (method === "ByGjsToolbarItem") {
            const toolbar = data.toolbarSelector || ".gjs-toolbar";
            const item = data.itemSelector || ".gjs-toolbar-item";
            const index = Math.max(0, Math.floor(Number(data.index) || 0));
            return `locator(${JSON.stringify(toolbar)}).locator(${JSON.stringify(item)}).nth(${index})`;
        }
        if (method === "ByDomPath") {
            return formatDomPathCandidate(data.csspath || data.path, data.shadowChain || []);
        }
        if (method === "ByRole") {
            const name = data.name ? `, { name: ${JSON.stringify(String(data.name))} }` : "";
            const index = data.index !== null && data.index !== undefined ? `.nth(${data.index})` : "";
            return `getByRole(${JSON.stringify(String(data.role || ""))}${name})${index}`;
        }
        if (method === "ByTitle") return `getByTitle(${JSON.stringify(String(data.title || ""))})`;
        if (method === "ByText") return `getByText(${JSON.stringify(String(data.text || ""))})`;
        return data.locator || data.value || "";
    }

    function getAllSelectablePaths(action, field = "source") {
        const values = [];
        const add = value => {
            if (
                value &&
                !isBlockedSelectorCandidate(value) &&
                !values.includes(value)
            ) values.push(value);
        };

        const locatorOptions = action?.[`${field}LocatorOptions`];
        if (Array.isArray(locatorOptions)) {
            locatorOptions.forEach(option => add(formatLocatorOptionForComment(option)));
        }

        const domPathOptions = action?.[`${field}DomPathOptions`];
        if (Array.isArray(domPathOptions)) {
            domPathOptions.forEach(option => {
                if (typeof option === "string") add(option);
                else add(formatDomPathCandidate(option?.path, option?.shadowChain || []));
            });
        }

        const selectedMethod = action?.[`${field}Method`];
        const selectedData = action?.[`${field}Data`];
        if (!values.length && selectedData) {
            add(selectedMethod === "ByDomPath"
                ? formatDomPathCandidate(selectedData, action?.[`${field}DomPathChain`] || [])
                : selectedData);
        }
        return values;
    }

    function getAutomaticActionComment(action, actionIndex) {
        const sourcePaths = getAllSelectablePaths(action, "source");
        const targetPaths = getAllSelectablePaths(action, "target");
        const pathParts = [];

        if (action?.type === "dragANDdrop") {
            if (sourcePaths.length) pathParts.push(`source: ${sourcePaths.join(" ; ")}`);
            if (targetPaths.length) pathParts.push(`target: ${targetPaths.join(" ; ")}`);
        } else if (sourcePaths.length) {
            pathParts.push(...sourcePaths);
        } else if (targetPaths.length) {
            pathParts.push(...targetPaths);
        }

        return `// Recorded Action #${actionIndex + 1} [${pathParts.join(" | ")}]`;
    }

    function annotateCodeBodyWithNotes(codeBody) {
        const lines = Array.isArray(codeBody) ? codeBody : [];
        const notesByCodeIndex = new Map();
        const claimedCodeIndexes = new Set();
        let searchFrom = 0;

        actions.forEach((action, actionIndex) => {
            const actionLines = getActionGeneratedLines(action);
            if (!actionLines.length) return;

            const findBlock = (startIndex) => {
                const lastStartIndex = lines.length - actionLines.length;
                for (let index = startIndex; index <= lastStartIndex; index++) {
                    const isExactUnclaimedBlock = actionLines.every((actionLine, offset) => {
                        const codeIndex = index + offset;
                        return !claimedCodeIndexes.has(codeIndex) && lines[codeIndex] === actionLine;
                    });
                    if (isExactUnclaimedBlock) {
                        return {
                            start: index,
                            end: index + actionLines.length - 1
                        };
                    }
                }
                return null;
            };

            let block = findBlock(searchFrom);
            if (!block) block = findBlock(0);
            if (!block) return;

            for (let codeIndex = block.start; codeIndex <= block.end; codeIndex++) {
                claimedCodeIndexes.add(codeIndex);
            }
            searchFrom = block.end + 1;
            notesByCodeIndex.set(block.start, [
                getAutomaticActionComment(action, actionIndex),
                ...noteToCommentLines(action.codeNote)
            ]);
        });

        return lines.flatMap((line, index) => [
            ...(notesByCodeIndex.get(index) || []),
            line
        ]);
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

        const fallbackLines = Array.isArray(fallbackCodeBody)
            ? fallbackCodeBody.filter(Boolean)
            : [];
        if (!codeBody.length || hasMissingActionCode) return fallbackLines;

        const markerIndex = fallbackLines.findIndex(line =>
            String(line).trim() === "// Recorder login setup"
        );
        const legacyUsernameLineIndex = fallbackLines.findIndex(line =>
            String(line).includes(".fill(process.env.TEST_USERNAME)")
        );
        const loginSetupLines = markerIndex >= 0
            ? fallbackLines.slice(markerIndex, markerIndex + 4)
            : (legacyUsernameLineIndex >= 0
                ? fallbackLines.slice(legacyUsernameLineIndex, legacyUsernameLineIndex + 4)
                : []);
        const pauseLines = fallbackLines.filter(line =>
            String(line).trim() === "await page.pause();"
        );

        const nextCodeBody = [...codeBody];
        const navigationIndex = nextCodeBody.findIndex(line => /\.goto\(/.test(String(line)));
        if (loginSetupLines.length && navigationIndex >= 0) {
            nextCodeBody.splice(navigationIndex + 1, 0, ...loginSetupLines);
        }

        return [...nextCodeBody, ...pauseLines];
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
        const preGotoSetupIndexes = new Set();

        if (firstGotoIndex >= 0) {
            executableLines.forEach((line, index) => {
                if (index < firstGotoIndex && /\.setViewportSize\(/.test(String(line))) {
                    output.push(line);
                    preGotoSetupIndexes.add(index);
                }
            });
            output.push(executableLines[firstGotoIndex]);
            appendDeclarationsForParent("page", declarationsByParent, insertedParents, output);
        }

        executableLines.forEach((line, index) => {
            if (index === firstGotoIndex || preGotoSetupIndexes.has(index)) return;
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
        if (action.type === "dragANDdrop") {
            return text.includes(".dragTo(")
                || /^\s*const\s+(?:dragSource|dropTarget)\s*=/.test(text)
                || text.includes(".mouse.down(")
                || text.includes(".mouse.up(");
        }
        if (action.type === "input") return text.includes(".fill(");
        if (action.type === "monacoSetValue") return text.includes("editorRoot.evaluate(") || text.includes("editor.setValue(") || text.includes("model.setValue(");
        if (action.type === "canvasInput") return text.includes(".keyboard.type(");
        if (action.type === "canvasWheel") return text.includes(".mouse.wheel(");
        if (action.type === "change") return text.includes(".selectOption(");
        if (action.type === "ionSelect") {
            return text.includes(".click(")
                && !/\.locator\(["']ion-(?:popover|alert|action-sheet|modal)["']\)/.test(text);
        }
        if (action.type === "dbclick") return text.includes(".dblclick(");
        if (action.type === "keyboard") return text.includes(".press(") || text.includes(".keyboard.press(");
        if (action.type === "popup") return text.includes("waitForEvent('popup')");
        if (action.type === "click" || action.type === "rightClick" || action.type === "checkBox") return text.includes(".click(");
        return text.trim().startsWith("await ");
    }

    function getActionMethod(action, field = "source") {
        return field === "target" ? action?.targetMethod : action?.sourceMethod;
    }

    function matchesActionLocatorMethod(action, line, field = "source") {
        const text = String(line || "");
        const method = getActionMethod(action, field);

        if (method === "ByPlaywright") {
            const dataKey = field === "target" ? "targetData" : "sourceData";
            const locator = action?.[dataKey];
            return locator
                ? text.includes(`.${locator}`)
                : /\.(?:getBy[A-Z]\w*|locator)\(/.test(text);
        }
        if (method === "ByRole") return text.includes(".getByRole(");
        if (method === "ByTitle") return text.includes(".getByTitle(");
        if (method === "ByText") return text.includes(".getByText(");
        if (method === "ByPlaceholder") return text.includes(".getByPlaceholder(");
        if (method === "ByAltText") return text.includes(".getByAltText(");
        if (method === "ByLabel") return text.includes(".getByLabel(");
        if (method === "ByGjsToolbarItem") {
            return text.includes(".locator(\".gjs-toolbar\")")
                || text.includes(".locator('.gjs-toolbar')");
        }
        if (method === "ByDomPath") {
            return text.includes(".locator(")
                && !/\.getBy(?:Role|Title|Text|Placeholder|AltText|Label)\(/.test(text);
        }
        return true;
    }

    function actionContainsDomPath(action, field, path) {
        if (!path) return true;

        const dataKey = field === "target" ? "targetData" : "sourceData";
        const optionsKey = field === "target" ? "targetDomPathOptions" : "sourceDomPathOptions";
        if (action?.[dataKey] === path) return true;

        return (action?.[optionsKey] || []).some(option => {
            const optionPath = typeof option === "string" ? option : option?.path;
            return optionPath === path;
        });
    }

    function findCodeBodyIndexForAction(codeBody, actionIndex, path = null, field = "source") {
        const action = actions[actionIndex];
        if (!action) return -1;

        for (const line of getActionGeneratedLines(action)) {
            const occurrence = actions.slice(0, actionIndex).filter(previousAction => {
                return getActionGeneratedLines(previousAction).includes(line);
            }).length;
            let codeIndex = -1;
            let searchFrom = 0;
            for (let index = 0; index <= occurrence; index++) {
                codeIndex = codeBody.indexOf(line, searchFrom);
                if (codeIndex < 0) break;
                searchFrom = codeIndex + 1;
            }
            if (codeIndex >= 0 && matchesActionCodeLine(action, codeBody[codeIndex])) {
                return codeIndex;
            }
        }

        const escapedPath = escapePathForCode(path);
        const candidates = [];
        codeBody.forEach((line, codeIndex) => {
            if (!matchesActionCodeLine(action, line)) return;
            if (!matchesActionLocatorMethod(action, line, field)) return;
            if (escapedPath && !String(line).includes(escapedPath)) return;
            candidates.push(codeIndex);
        });
        if (!candidates.length) return -1;

        const ordinal = actions.slice(0, actionIndex).filter(previousAction => {
            return previousAction?.type === action.type
                && getActionMethod(previousAction, field) === getActionMethod(action, field)
                && actionContainsDomPath(previousAction, field, path);
        }).length;

        return candidates[Math.min(ordinal, candidates.length - 1)];
    }

    function findCodeBodyIndexForDialogTrigger(codeBody, dialogAction, triggerAction, path = null) {
        if (!dialogAction || !triggerAction) return -1;

        const dialogLines = getActionGeneratedLines(dialogAction);
        for (const line of dialogLines) {
            if (!matchesActionCodeLine(triggerAction, line)) continue;
            const codeIndex = codeBody.indexOf(line);
            if (codeIndex >= 0) return codeIndex;
        }

        const escapedPath = escapePathForCode(path);
        return codeBody.findIndex(line => {
            if (!matchesActionCodeLine(triggerAction, line)) return false;
            if (!matchesActionLocatorMethod(triggerAction, line, "source")) return false;
            return !escapedPath || String(line).includes(escapedPath);
        });
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

    function buildLocatorSuffix(candidate) {
        const data = candidate?.data || {};
        if (candidate?.method === "ByPlaywright") {
            const locator = data.locator || "";
            const hostLocators = (data.shadowChain || [])
                .map(step => step?.hostSelector)
                .filter(Boolean)
                .map(selector => `.locator(${JSON.stringify(String(selector))})`)
                .join("");
            return locator ? `${hostLocators}.${locator.replace(/^\./, "")}` : hostLocators;
        }
        if (candidate?.method === "ByGjsToolbarItem") {
            const toolbar = data.toolbarSelector || ".gjs-toolbar";
            const item = data.itemSelector || ".gjs-toolbar-item";
            const index = Math.max(0, Math.floor(Number(data.index) || 0));
            return `.locator(${JSON.stringify(toolbar)}).locator(${JSON.stringify(item)}).nth(${index})`;
        }
        if (candidate?.method === "ByRole") {
            const hasName = data.name !== null && data.name !== undefined && data.name !== "";
            const exact = data.exact === false ? "" : ", exact: true";
            const locator = hasName
                ? `.getByRole(${JSON.stringify(String(data.role || ""))}, { name: ${JSON.stringify(String(data.name))}${exact} })`
                : `.getByRole(${JSON.stringify(String(data.role || ""))})`;
            return data.index !== null && data.index !== undefined
                ? `${locator}.nth(${Number(data.index)})`
                : locator;
        }
        if (candidate?.method === "ByTitle") {
            return `.getByTitle(${JSON.stringify(String(data.title || ""))}, { exact: true })`;
        }
        if (candidate?.method === "ByText") {
            return `.getByText(${JSON.stringify(String(data.text || ""))}, { exact: true })`;
        }
        if (candidate?.method === "ByDomPath") {
            const selectors = [
                ...(data.shadowChain || []).map(step => step?.hostSelector).filter(Boolean),
                data.csspath || data.path
            ].filter(Boolean);
            return selectors.map(selector => `.locator(${JSON.stringify(String(selector))})`).join("");
        }
        return "";
    }

    function findLocatorStart(expression, method, chain = []) {
        if (method === "ByPlaywright") {
            const frameBoundary = expression.lastIndexOf(".contentFrame()");
            const searchFrom = frameBoundary >= 0
                ? frameBoundary + ".contentFrame()".length
                : 0;
            if (Array.isArray(chain) && chain.length) {
                const positions = [];
                const pattern = /\.(?:getBy[A-Z]\w*|locator)\(/g;
                let locatorMatch = null;
                pattern.lastIndex = searchFrom;
                while ((locatorMatch = pattern.exec(expression)) !== null) positions.push(locatorMatch.index);
                const locatorCount = Math.max(1, chain.length + 1);
                return positions[Math.max(0, positions.length - locatorCount)] ?? -1;
            }
            const match = /\.(?:getBy[A-Z]\w*|locator)\(/g;
            match.lastIndex = searchFrom;
            return match.exec(expression)?.index ?? -1;
        }

        if (method === "ByGjsToolbarItem") {
            const marker = ".locator(\".gjs-toolbar\")";
            const doubleIndex = expression.lastIndexOf(marker);
            if (doubleIndex >= 0) return doubleIndex;
            return expression.lastIndexOf(".locator('.gjs-toolbar')");
        }

        const methodNames = {
            ByRole: ".getByRole(",
            ByTitle: ".getByTitle(",
            ByText: ".getByText("
        };
        if (methodNames[method]) return expression.lastIndexOf(methodNames[method]);

        if (method === "ByDomPath") {
            const positions = [];
            const pattern = /\.locator\(/g;
            let match = null;
            while ((match = pattern.exec(expression)) !== null) positions.push(match.index);
            const locatorCount = Math.max(1, (Array.isArray(chain) ? chain.length : 0) + 1);
            return positions[Math.max(0, positions.length - locatorCount)] ?? -1;
        }
        return -1;
    }

    function replaceLocatorExpression(expression, oldMethod, oldChain, candidate) {
        const locatorStart = findLocatorStart(expression, oldMethod, oldChain);
        const suffix = buildLocatorSuffix(candidate);
        if (locatorStart < 0 || !suffix) return expression;
        return expression.slice(0, locatorStart) + suffix;
    }

    function findTopLevelArgumentEnd(text, startIndex) {
        let parenDepth = 0;
        let braceDepth = 0;
        let bracketDepth = 0;
        let quote = null;
        let escaped = false;

        for (let index = startIndex; index < text.length; index++) {
            const char = text[index];
            if (quote) {
                if (escaped) escaped = false;
                else if (char === "\\") escaped = true;
                else if (char === quote) quote = null;
                continue;
            }
            if (char === '"' || char === "'" || char === "`") {
                quote = char;
                continue;
            }
            if (char === "(") parenDepth++;
            else if (char === "{") braceDepth++;
            else if (char === "[") bracketDepth++;
            else if (char === ")") {
                if (parenDepth === 0 && braceDepth === 0 && bracketDepth === 0) return index;
                parenDepth--;
            } else if (char === "}") braceDepth--;
            else if (char === "]") bracketDepth--;
            else if (char === "," && parenDepth === 0 && braceDepth === 0 && bracketDepth === 0) {
                return index;
            }
        }
        return text.length;
    }

    function getActionOperation(action) {
        if (action?.type === "dragANDdrop") return ".dragTo(";
        if (action?.type === "input") return ".fill(";
        if (action?.type === "monacoSetValue") return ".evaluate(";
        if (action?.type === "canvasInput") return ".keyboard.type(";
        if (action?.type === "canvasWheel") return ".mouse.wheel(";
        if (action?.type === "change") return ".selectOption(";
        if (action?.type === "ionSelect") return ".click(";
        if (action?.type === "dbclick") return ".dblclick(";
        if (action?.type === "keyboard") return ".press(";
        return ".click(";
    }

    function replaceActionLocatorInCodeLine(action, line, field, candidate, oldMethod, oldChain) {
        const text = String(line || "");

        if (action?.type === "dragANDdrop") {
            const declarationName = field === "target" ? "dropTarget" : "dragSource";
            const declaration = text.match(new RegExp(`^(\\s*const\\s+${declarationName}\\s*=\\s*)(.*?)(;\\s*)$`));
            if (declaration) {
                const nextExpression = replaceLocatorExpression(
                    declaration[2],
                    oldMethod,
                    oldChain,
                    candidate
                );
                return declaration[1] + nextExpression + declaration[3];
            }
        }

        const operation = getActionOperation(action);
        const operationIndex = text.indexOf(operation);
        if (operationIndex < 0) return text;

        if (action?.type === "dragANDdrop") {
            if (field === "source") {
                const expressionStart = text.indexOf("await ") + 6;
                if (expressionStart < 6) return text;
                const expression = text.slice(expressionStart, operationIndex);
                const nextExpression = replaceLocatorExpression(expression, oldMethod, oldChain, candidate);
                return text.slice(0, expressionStart) + nextExpression + text.slice(operationIndex);
            }

            const argumentStart = operationIndex + operation.length;
            const argumentEnd = findTopLevelArgumentEnd(text, argumentStart);
            const expression = text.slice(argumentStart, argumentEnd);
            const nextExpression = replaceLocatorExpression(expression, oldMethod, oldChain, candidate);
            return text.slice(0, argumentStart) + nextExpression + text.slice(argumentEnd);
        }

        const expressionStart = text.indexOf("await ") + 6;
        if (expressionStart < 6) return text;
        const expression = text.slice(expressionStart, operationIndex);
        const nextExpression = replaceLocatorExpression(expression, oldMethod, oldChain, candidate);
        return text.slice(0, expressionStart) + nextExpression + text.slice(operationIndex);
    }

    async function updateLocatorSelection(actionIndex, field, candidate) {
        const action = actions[actionIndex];
        if (!action || !candidate?.method) return;

        const isTriggerField = field === "trigger" && action.type === "dialog" && action.triggerAction;
        const subjectAction = isTriggerField ? action.triggerAction : action;
        const subjectField = isTriggerField ? "source" : field;
        const methodKey = subjectField === "target" ? "targetMethod" : "sourceMethod";
        const dataKey = subjectField === "target" ? "targetData" : "sourceData";
        const chainKey = subjectField === "target" ? "targetDomPathChain" : "sourceDomPathChain";
        const optionsKey = subjectField === "target" ? "targetLocatorOptions" : "sourceLocatorOptions";
        const overrideKey = subjectField === "target"
            ? "targetLocatorSelectionOverridden"
            : "sourceLocatorSelectionOverridden";
        const oldMethod = subjectAction[methodKey];
        const oldValue = subjectAction[dataKey];
        const oldChain = subjectAction[chainKey] || [];
        const nextValue = candidate.currentValue || getLocatorOptionValue(candidate.method, candidate.data);
        const nextChain = candidate.method === "ByDomPath" || candidate.method === "ByPlaywright"
            ? candidate.data?.shadowChain || []
            : [];

        const storage = await chrome.storage.local.get(["generatedCodeBody", "generatedAction"]);
        const codeBody = Array.isArray(storage.generatedCodeBody) ? [...storage.generatedCodeBody] : [];
        const latestStoredActions = Array.isArray(storage.generatedAction)
            ? storage.generatedAction
            : [];
        const codeIndex = isTriggerField
            ? findCodeBodyIndexForDialogTrigger(codeBody, action, subjectAction, oldValue)
            : findCodeBodyIndexForAction(codeBody, actionIndex, oldValue, subjectField);
        const actionLines = getActionGeneratedLines(action);
        const nextLines = actionLines.map(line => {
            const isDragLocatorDeclaration =
                action.type === "dragANDdrop" &&
                new RegExp(`^\\s*const\\s+${subjectField === "target" ? "dropTarget" : "dragSource"}\\s*=`).test(String(line || ""));
            const lineAction = isTriggerField ? subjectAction : action;
            return matchesActionCodeLine(lineAction, line) || isDragLocatorDeclaration
                ? replaceActionLocatorInCodeLine(lineAction, line, subjectField, candidate, oldMethod, oldChain)
                : line;
        });

        subjectAction[methodKey] = candidate.method;
        subjectAction[dataKey] = nextValue;
        subjectAction[chainKey] = nextChain;
        subjectAction[overrideKey] = true;
        if (candidate.method === "ByDomPath") {
            subjectAction[subjectField === "target"
                ? "targetDomPathSelectionOverridden"
                : "sourceDomPathSelectionOverridden"] = true;
        }
        if (nextLines.length) setActionGeneratedLines(action, nextLines);

        if (latestStoredActions.length) {
            const matchingIndex = findMatchingActionIndex(
                latestStoredActions,
                action,
                actionIndex
            );

            if (matchingIndex >= 0 && matchingIndex < latestStoredActions.length) {
                actions = latestStoredActions.map((storedAction, index) => {
                    return index === matchingIndex
                        ? { ...storedAction, ...action }
                        : storedAction;
                });
            }
        }

        if (codeIndex >= 0) {
            codeBody[codeIndex] = replaceActionLocatorInCodeLine(
                isTriggerField ? subjectAction : action,
                codeBody[codeIndex],
                subjectField,
                candidate,
                oldMethod,
                oldChain
            );
        }

        const nextCodeBody = buildCodeBodyFromActions(codeBody);
        const generatedCode = wrapPlaywrightCode(nextCodeBody);
        const recorderPatch = {
            [methodKey]: candidate.method,
            [dataKey]: nextValue,
            [chainKey]: nextChain,
            [optionsKey]: subjectAction[optionsKey] || [],
            [overrideKey]: true,
            generatedCodeLines: getActionGeneratedLines(action),
            generatedCodeLine: action.generatedCodeLine || "",
            generatedCodeReplacesPrevious: action.generatedCodeReplacesPrevious === true
        };
        if (isTriggerField) {
            recorderPatch.triggerAction = { ...subjectAction };
            delete recorderPatch[methodKey];
            delete recorderPatch[dataKey];
            delete recorderPatch[chainKey];
            delete recorderPatch[optionsKey];
            delete recorderPatch[overrideKey];
        }

        await chrome.storage.local.set({
            generatedAction: actions,
            generatedCodeBody: nextCodeBody,
            generatedCode
        });
        setCodeView(normalizeCode(generatedCode));

        try {
            const recorderResponse = await chrome.runtime.sendMessage({
                type: "UPDATE_RECORDED_ACTION",
                actionId: action.id,
                actionIndex,
                patch: recorderPatch
            });
            if (!recorderResponse?.ok) {
                console.warn("[Recorded Actions] Failed to synchronize locator selection with the recorder.");
            }
        } catch (error) {
            console.warn("[Recorded Actions] Unable to contact the recorder.", error);
        }
    }

    async function updateDomPathSelection(actionIndex, field, oldPath, newPath, newChain = []) {
        const storage = await chrome.storage.local.get(["generatedCodeBody", "generatedCode"]);
        const codeBody = Array.isArray(storage.generatedCodeBody) ? [...storage.generatedCodeBody] : [];
        const action = actions[actionIndex];
        const actionLines = getActionGeneratedLines(action);
        const key = field === "target" ? "targetData" : "sourceData";
        const chainKey = field === "target" ? "targetDomPathChain" : "sourceDomPathChain";

        if (action && actionLines.length) {
            const matchedCodeIndex = findCodeBodyIndexForAction(codeBody, actionIndex, oldPath, field);
            const nextLines = actionLines.map(line => replaceDomPathInCodeLine(line, field, oldPath, newPath, newChain));
            setActionGeneratedLines(action, nextLines);

            if (matchedCodeIndex >= 0) {
                codeBody[matchedCodeIndex] = replaceDomPathInCodeLine(
                    codeBody[matchedCodeIndex],
                    field,
                    oldPath,
                    newPath,
                    newChain
                );
            }
        } else {
            const codeIndex = findCodeBodyIndexForAction(codeBody, actionIndex, oldPath, field);
            if (codeIndex >= 0) {
                codeBody[codeIndex] = replaceDomPathInCodeLine(codeBody[codeIndex], field, oldPath, newPath, newChain);
            }
        }

        const nextCodeBody = buildCodeBodyFromActions(codeBody);
        const generatedCode = wrapPlaywrightCode(nextCodeBody);
        const recorderPatch = {
            [key]: newPath,
            [chainKey]: newChain,
            [field === "target"
                ? "targetDomPathSelectionOverridden"
                : "sourceDomPathSelectionOverridden"]: true,
            generatedCodeLines: getActionGeneratedLines(action),
            generatedCodeLine: action?.generatedCodeLine || "",
            generatedCodeReplacesPrevious: action?.generatedCodeReplacesPrevious === true
        };
        await chrome.storage.local.set({
            generatedAction: actions,
            generatedCodeBody: nextCodeBody,
            generatedCode
        });
        setCodeView(normalizeCode(generatedCode));

        try {
            const recorderResponse = await chrome.runtime.sendMessage({
                type: "UPDATE_RECORDED_ACTION",
                actionId: action?.id,
                actionIndex,
                patch: recorderPatch
            });
            if (!recorderResponse?.ok) {
                console.warn("[Recorded Actions] Failed to synchronize selector with the recorder.");
            }
        } catch (error) {
            console.warn("[Recorded Actions] Unable to contact the recorder.", error);
        }
    }

    async function saveActionNote(actionIndex, note) {
        const action = actions[actionIndex];
        if (!action) return;

        action.codeNote = String(note || "");
        const storage = await chrome.storage.local.get(["generatedCodeBody"]);
        const storedCodeBody = Array.isArray(storage.generatedCodeBody)
            ? storage.generatedCodeBody
            : [];
        const nextCodeBody = buildCodeBodyFromActions(storedCodeBody);
        const generatedCode = wrapPlaywrightCode(nextCodeBody);

        await chrome.storage.local.set({
            generatedAction: actions,
            generatedCodeBody: nextCodeBody,
            generatedCode
        });
        setCodeView(normalizeCode(generatedCode));

        try {
            const recorderResponse = await chrome.runtime.sendMessage({
                type: "UPDATE_RECORDED_ACTION",
                actionId: action.id,
                actionIndex,
                patch: { codeNote: action.codeNote }
            });
            if (!recorderResponse?.ok) {
                console.warn("[Recorded Actions] Failed to synchronize code note with the recorder.");
            }
        } catch (error) {
            console.warn("[Recorded Actions] Unable to synchronize code note.", error);
        }
    }

    async function deleteRecordedAction(actionIndex) {
        const action = actions[actionIndex];
        if (!action) throw new Error("Recorded action not found");

        const response = await chrome.runtime.sendMessage({
            type: "DELETE_RECORDED_ACTION",
            actionId: action.id,
            actionIndex
        });
        if (!response?.ok) {
            throw new Error(response?.error || "Recorder rejected the deletion");
        }

        noteSaveTimers.forEach(timer => clearTimeout(timer));
        noteSaveTimers.clear();
        pendingActionsRefresh = null;
        pendingCodeViewRefresh = null;

        const previousActions = actions;
        const nextActions = Array.isArray(response.state?.generatedAction)
            ? response.state.generatedAction
            : previousActions.filter((_, index) => index !== actionIndex);
        applyGeneratedActions(nextActions, previousActions);

        if (response.state?.generatedCode) {
            setCodeView(normalizeCode(response.state.generatedCode));
        } else {
            const storage = await chrome.storage.local.get(["generatedCode"]);
            setCodeView(normalizeCode(storage.generatedCode));
        }
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

                const codeIndex = findCodeBodyIndexForAction(codeBody, actionIndex);
                const generatedActionLine = nextLines.find(line => matchesActionCodeLine(action, line));
                if (codeIndex >= 0 && generatedActionLine && codeBody[codeIndex] !== generatedActionLine) {
                    codeBody[codeIndex] = generatedActionLine;
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
        updateActionsList(actions, { scrollToBottom: true }); // 憿舐內???”
        updateUI(recorderStatus === "recording"); // ???????
        await syncGeneratedCodeWithActions();
    }

    // 8. ?單??踵?嚗??Storage ???????航?祆?撖怠?啗???隞????堆??停?舐隞暻潮?鋆賣??恍??甇亥歲????
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.generatedCode) {
            updateCodeViewWithoutInterruptingSelect(
                normalizeCode(changes.generatedCode.newValue)
            );
        }

        if (changes.generatedAction) {
            const previousActions = changes.generatedAction.oldValue || [];
            const nextActions = preserveLocalLocatorOverrides(
                changes.generatedAction.newValue || [],
                actions
            );

            if (haveSameActionRows(actions, nextActions)) {
                // The rows are unchanged. Keep the existing DOM (especially an
                // open native select) and refresh only the backing action data.
                actions = nextActions;
            } else if (isLocatorSelectActive()) {
                // Rebuilding the list here would destroy an open native select
                // before the user has a chance to choose an option.
                pendingActionsRefresh = {
                    nextActions,
                    previousActions
                };
            } else {
                applyGeneratedActions(nextActions, previousActions);
            }
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
        const loginSettings = getLoginSettings();
        const loginValidationError = validateLoginSettings(loginSettings);
        if (loginValidationError) {
            alert(loginValidationError);
            return;
        }

        await chrome.storage.local.set({
            hoverPreviewSessionEnabled: true,
            loginSettings: {
                enabled: loginSettings.enabled,
                usernameLocator: loginSettings.usernameLocator,
                passwordLocator: loginSettings.passwordLocator,
                loginButtonLocator: loginSettings.loginButtonLocator,
                credentialSource: loginSettings.credentialSource,
                username: loginSettings.username
            }
        });
        const response = await chrome.runtime.sendMessage({
            type: "START_RECORDING",
            dropPositionMode,
            loginSettings
        });
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

    dropPositionModeSelect?.addEventListener("change", async () => {
        const nextMode = ["ratio", "absolute", "center"].includes(dropPositionModeSelect.value)
            ? dropPositionModeSelect.value
            : "ratio";
        dropPositionMode = nextMode;
        await chrome.storage.local.set({ dropPositionMode: nextMode });
        await chrome.runtime.sendMessage({
            type: "SET_DROP_POSITION_MODE",
            dropPositionMode: nextMode
        });
    });

    credentialSourceSelect?.addEventListener("change", updateCredentialSourceUI);

    // 10. ?瑁??????單頛摰敺??餃? Background ?輯???
    const hoverStorage = await chrome.storage.local.get([
        "hoverHighlightEnabled",
        "dropPositionMode",
        "loginSettings"
    ]);
    updateHoverHighlightButton(hoverStorage.hoverHighlightEnabled !== false);
    dropPositionMode = ["ratio", "absolute", "center"].includes(hoverStorage.dropPositionMode)
        ? hoverStorage.dropPositionMode
        : "ratio";
    if (dropPositionModeSelect) dropPositionModeSelect.value = dropPositionMode;
    const storedLoginSettings = hoverStorage.loginSettings || {};
    if (loginEnabledInput) loginEnabledInput.checked = storedLoginSettings.enabled === true;
    if (usernameLocatorInput) usernameLocatorInput.value = storedLoginSettings.usernameLocator || "";
    if (passwordLocatorInput) passwordLocatorInput.value = storedLoginSettings.passwordLocator || "";
    if (loginButtonLocatorInput) loginButtonLocatorInput.value = storedLoginSettings.loginButtonLocator || "";
    if (credentialSourceSelect) {
        credentialSourceSelect.value = storedLoginSettings.credentialSource === "environment"
            ? "environment"
            : "direct";
    }
    if (loginUsernameInput) loginUsernameInput.value = storedLoginSettings.username || "";
    updateCredentialSourceUI();
    await loadInitialState();
});

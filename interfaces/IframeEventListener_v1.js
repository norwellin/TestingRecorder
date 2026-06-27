// iframe 內部事件監聽器，負責處理 iframe 內部事件 (已重構解耦版)
import { DOMElement } from "../entities/DOMElement";
import { ActionInterpreter } from '../usecases/ActionInterpreter.js';
import { HoverInspector } from "./HoverInspector.js";

export class IframeEventListener {
  // 1. 移除 command, userActionDB 等依賴，改為接收 onActionRecorded 回呼函式
  constructor(contexts, domParserService, onActionRecorded) {
    this.contexts = contexts;
    this.iframeWindow = contexts?.iframeWindow || null;
    this.iframeDocument = this.iframeWindow?.document || null;

    this.domParserService = domParserService;

    // 新增：當事件發生時，透過這個 callback 將 action 傳遞給外部 (例如 MainApp / RecorderStore)
    this.onActionRecorded = onActionRecorded;
    
    // 綁定當前 Listener 所在的 contextId，取代原本寫死的 "iframe"
    this.contextId = contexts?.contextId || 'iframe';

    this.DOMElement = new DOMElement();

    this.currentHoveredElement = null;

    // 點擊判定的計時器與狀態
    this.clickFlag = 0;
    this.clickTimeOut = null;
    this.DOUBLE_CLICK_DELAY = 250;

    // 輸入判定的計時器與狀態
    this.inputTimer = 0;
    this.INPUT_DELAY = 500;
    this.initialInputValues = new WeakMap();
    this.lastUserTypedAt = new WeakMap();
    this.userEditedInputs = new WeakSet();
    this.lastColorInput = new WeakMap();

    // 拖曳 (drag) 判定的相對變數
    this.dragStart = { x: 0, y: 0 };
    this.isDragging = false;
    this.DRAG_THRESHOLD = 5; // 移動多少判斷為是 drag
    this.dragSource = null;
    this.mouseDownFlag = false;
    this.dragStepFlag = 0;
    this.hoverInspector = new HoverInspector(this.iframeDocument, this.iframeWindow);
    this.lastPreviewTarget = null;
    this.hoverHighlightEnabled = true;
    this.hoverPreviewSessionEnabled = false;

    // GUI 狀態控制
    this.isRecording = false;
  }

  init() {
    if (!this.iframeWindow || !this.iframeDocument) {
      console.warn('iframe 不存在，跳過 IframeEventListener.init()');
      return;
    }
    
    this.iframeDocument.addEventListener('mousemove', this.mousemoveHandler.bind(this));
    this.iframeDocument.addEventListener('mouseout', this.mouseoutHandler.bind(this), true);
    this.iframeDocument.addEventListener('mouseleave', this.hideHoverPreview.bind(this), true);
    this.iframeDocument.addEventListener('mousedown', this.mousedownHandler.bind(this));
    this.iframeDocument.addEventListener('mouseup', this.mouseupHandler.bind(this));
    this.iframeDocument.addEventListener('keydown', this.keydownHandler.bind(this));
    this.iframeDocument.addEventListener('input', this.inputHandler.bind(this));

    this.iframeWindow.addEventListener('drop', this.dropHandler.bind(this));
    this.iframeWindow.addEventListener('blur', this.hideHoverPreview.bind(this));
    this.iframeDocument.addEventListener("click", this.clickHandler.bind(this), true);

    // 【新增】監聽 change 事件
    this.iframeDocument.addEventListener("change", this.changeHandler.bind(this), true);
    // 必須 preventDefault 才能觸發 drop
    this.iframeDocument.addEventListener("dragover", (e) => {
      if (this.isRecording) e.preventDefault(); 
    });

    // 處理外部控制錄製開關的訊息
    this.iframeWindow.addEventListener('message', this.messageHandler.bind(this));
    this.loadHoverHighlightPreference();
    this.bindHoverHighlightPreference();
  }

  // 【新增】處理 SELECT 與 Checkbox 的改變
  changeHandler(e) {
    if (!this.isRecording || !e.isTrusted) return;
    const tag = e.target.tagName;
    const type = e.target.type;

    const isSelect = tag === "SELECT";
    const isCheckbox = tag === "INPUT" && type === "checkbox";

    if (!isSelect && !isCheckbox) return;

    if (isCheckbox) {
      this.dispatchAction("checkBox", this.getCheckboxClickTarget(e.target));
      return;
    }

    if (isSelect) {
      this.setReloadSuppressWindow();
    }

    const action_type = isSelect ? 'change' : 'checkBox';
    this.dispatchAction(action_type, e.target, null, isSelect ? {
      selectedValue: e.target.value,
      selectedText: e.target.options?.[e.target.selectedIndex]?.text || ""
    } : {});
  }
  messageHandler(e) {
    const msg = e.data;
    switch (msg.type) {
      case 'START_RECORDING':
        this.setRecordingState(true, { allowHoverPreview: true });
        this.snapshotInitialInputValues();
        break;
      case 'STOP_RECORDING':
        this.setRecordingState(false, { allowHoverPreview: false });
        clearTimeout(this.inputTimer);
        break;
    }
  }

  // 2. 建立統一的派發 Action 方法
  dispatchAction(action_type, sourceElement, targetElement = null, extraData = {}) {
    const currentEventElement = sourceElement || targetElement;
    if (currentEventElement) {
      this.DOMElement.setElementData(currentEventElement, action_type);
    }

    console.log("[Debug IframeEventListener] dispatchAction", {
      actionType: action_type,
      contextId: this.contextId,
      sourceTag: sourceElement?.tagName || null,
      sourceId: sourceElement?.id || null,
      sourceClass: sourceElement?.className || null,
      sourceDataGjsType: sourceElement?.getAttribute?.("data-gjs-type") || null,
      targetTag: targetElement?.tagName || null,
      targetId: targetElement?.id || null,
      targetClass: targetElement?.className || null,
      targetDataGjsType: targetElement?.getAttribute?.("data-gjs-type") || null,
      extraData
    });

    // 這裡的 window 參數動態帶入 this.contextId (例如 iframe_1, iframe_2)
    const action = ActionInterpreter.interpretDrag(
      action_type, 
      sourceElement, 
      targetElement, 
      this.contextId, 
      targetElement ? this.contextId : "" 
    );

    // 寫入額外資料
    if (extraData.inputText !== undefined) action.setInputText(extraData.inputText);
    if (extraData.selectedValue !== undefined) action.setSelectedValue(extraData.selectedValue);
    if (extraData.selectedText !== undefined) action.setSelectedText(extraData.selectedText);
    if (extraData.preParsedSourcePath) action.preParsedSourcePath = extraData.preParsedSourcePath;
    console.log("[RecorderDebug][Iframe dispatchAction] action path payload", {
      actionType: action_type,
      contextId: this.contextId,
      sourceElement: this.describeDebugElement(sourceElement),
      targetElement: this.describeDebugElement(targetElement),
      hasPreParsedSourcePath: !!extraData.preParsedSourcePath,
      preParsedSummary: this.summarizeDebugSourcePath(extraData.preParsedSourcePath)
    });
    if (extraData.isDrop && targetElement) action.setTargetElement(targetElement);
    // 【請補上這兩行】將拖拉標記附加到 action 上，否則 MainApp1 會認不出來！
    if (extraData.isDragStart) action.isDragStart = true;
    if (extraData.isDrop) action.isDrop = true;
    // 將組裝好的 Action 派發出去交給中央處理
    if (typeof this.onActionRecorded === 'function') {
      this.onActionRecorded(action);
    } else {
      console.warn('IframeEventListener: onActionRecorded callback 尚未綁定', action);
    }
  }

  clickHandler(e) {
    if (!this.isRecording || !e.isTrusted) return;
    if (this.shouldSuppressSyntheticPageEvent()) return;
    if (this.isFileInput(e.target)) return;
    // 原始 Iframe 邏輯中，真正的 click/dblclick 是在 mouseupHandler 配合 setTimeout 實作的
    // 這裡保留空殼以防後續擴充
  }

  dropHandler(e) {
    if (!this.isRecording) return;
    this.currentHoveredElement = e.target;
    this.dispatchAction("dragANDdrop", null, this.currentHoveredElement, { isDrop: true });
  }

  inputHandler(e) {
    if (!this.isRecording || !e.isTrusted) return;
    if (this.shouldSuppressSyntheticPageEvent()) return;
    // 【新增】過濾機制：確認觸發 input 的元素是不是真的「文字輸入框」
    const tag = e.target.tagName.toLowerCase();
    const type = e.target.getAttribute("type");
    const isRange = this.isRangeInput(e.target);

    if (isRange) {
      clearTimeout(this.inputTimer);
      this.inputTimer = setTimeout(() => {
        this.currentHoveredElement = e.target;
        this.dispatchAction("range", this.currentHoveredElement, null, {
          inputText: e.target.value
        });
      }, 250);
      return;
    }

    const isTextInput =
      (tag === "input" && (!type || ["text", "search", "email", "password", "number"].includes(type))) ||
      tag === "textarea" ||
      e.target.isContentEditable;

    // 如果不是文字輸入框（例如 select），就直接 return 跳出，不記錄 input
    if (!isTextInput) return;
    if (!this.shouldRecordTextInputEvent(e.target)) return;
    clearTimeout(this.inputTimer);
    const target = e.target;
    this.inputTimer = setTimeout(() => {
      if (!this.isRecording || !this.shouldRecordTextInputEvent(target)) return;
      this.currentHoveredElement = target;
      this.dispatchAction("input", this.currentHoveredElement, null, {
        inputText: this.getInputValue(target)
      });
    }, this.INPUT_DELAY);
  }

  keydownHandler(e) {
    if (!this.isRecording || !e.isTrusted || !e.target) return;
    if (!this.isTextEditingKey(e) || !this.isTextInputElement(e.target)) return;
    this.lastUserTypedAt.set(e.target, Date.now());
    this.userEditedInputs.add(e.target);
  }

  mouseupHandler(e) {
    if (!this.isRecording || !e.isTrusted) return;
    if (this.shouldSuppressSyntheticPageEvent()) return;
    const target = this.getComposedEventTarget(e);
    if (this.isFileInput(target)) return;
    if (this.isRangeInput(target)) {
      this.isDragging = false;
      this.dragStart = { x: 0, y: 0 };
      this.mouseDownFlag = false;
      this.dragStepFlag = 0;
      return;
    }

    if (this.isColorInput(e.target)) {
      this.recordColorInput(e.target);
      return;
    }
    if (this.isCheckboxOrCheckboxLabel(target)) return;
    // 【新增】過濾掉 SELECT 和 LABEL 的點擊，這些交由 change 事件去處理
    if (target.tagName === "LABEL" && !this.isRadioOrRadioLabel(target)) return;
    if (target.tagName === "SELECT") return;
// 增加一個 Debug 觀察觸發次數
    console.log("[Debug IframeListener] mouseup 觸發, isDragging:", this.isDragging);
    console.log("[RecorderDebug][Iframe mouseupHandler] resolved target", {
      rawTarget: this.describeDebugElement(e.target),
      composedTarget: this.describeDebugElement(target),
      targetRoot: this.describeDebugRoot(target?.getRootNode?.())
    });
    if (this.isDragging) {
      this.isDragging = false;
      this.dragStart = { x: 0, y: 0 };
      this.currentHoveredElement = target;
      
      ///新
      this.mouseDownFlag = false;
      this.dragStepFlag = 0;
      // 模擬拖曳放開 (drop)
      this.dispatchAction("dragANDdrop", null, this.currentHoveredElement, { isDrop: true });
    } else {
      const preParsedSourcePath = this.preParseSourcePath(target);
      console.log("[RecorderDebug][Iframe mouseupHandler] preParse result before timeout", {
        target: this.describeDebugElement(target),
        targetRoot: this.describeDebugRoot(target?.getRootNode?.()),
        preParsedSummary: this.summarizeDebugSourcePath(preParsedSourcePath)
      });
      this.clickFlag += 1;
      if (this.clickFlag === 1) {
        this.clickTimeOut = setTimeout(() => {
          this.clickFlag = 0;
          this.isDragging = false;
          this.dragStart = { x: 0, y: 0 };

          this.dispatchAction("click", target, null, { preParsedSourcePath });
        }, this.DOUBLE_CLICK_DELAY);

      } else if (this.clickFlag === 2) {
        clearTimeout(this.clickTimeOut);
        this.clickFlag = 0;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };

        this.dispatchAction("dbclick", target, null, { preParsedSourcePath });
      }
    }
    this.mouseDownFlag = false;
    this.dragStepFlag = 0;

  }

  preParseSourcePath(element) {
    try {
      console.log("[RecorderDebug][Iframe preParseSourcePath] start", {
        element: this.describeDebugElement(element),
        root: this.describeDebugRoot(element?.getRootNode?.())
      });
      const result = this.domParserService.getOpenSourcePath(element, this.iframeWindow);
      console.log("[RecorderDebug][Iframe preParseSourcePath] result", {
        element: this.describeDebugElement(element),
        summary: this.summarizeDebugSourcePath(result)
      });
      return result;
    } catch (error) {
      console.warn("[Recorder] Unable to pre-parse iframe click locator", error);
      return null;
    }
  }

  mousedownHandler(e) {
    if (!this.isRecording) return;
    if (this.isRangeInput(e.target)) return;
    this.dragStart = { x: e.clientX, y: e.clientY };
    this.isDragging = false;
    this.dragSource = e.target;
    this.mouseDownFlag = true;
    this.dragStepFlag = 1;
    this.hideHoverPreview();
  }

  mousemoveHandler(e) {
    if (!this.isRecording) return;
    if (this.isRangeInput(e.target)) return;
    this.currentHoveredElement = e.target;
    if (this.shouldPreviewHover()) {
      this.previewHoveredElement(this.currentHoveredElement);
    } else {
      this.hideHoverPreview();
    }
    
    if (!this.dragStart || this.dragStepFlag !== 1) return;
    
    const dx = e.clientX - this.dragStart.x;
    const dy = e.clientY - this.dragStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance >= this.DRAG_THRESHOLD && this.mouseDownFlag) {
      this.isDragging = true;
      this.dragStepFlag = 2;
      this.mouseDownFlag = false;

      // 模擬拖曳開始 (drag start)
      this.dispatchAction("dragANDdrop", this.dragSource, null, { isDragStart: true });
    }
  }

  previewHoveredElement(element) {
    if (!element || element === this.lastPreviewTarget) return;
    this.lastPreviewTarget = element;

    try {
      const sourcePath = this.domParserService.getOpenSourcePath(element, this.iframeWindow);
      console.log("[Source Path in Iframe]: ",sourcePath);
      this.hoverInspector?.show(element, this.formatLocatorPreview(sourcePath));
    } catch (error) {
      console.warn("[Recorder] Unable to preview hovered iframe locator", error);
      this.hoverInspector?.show(element, "");
    }
  }

  shouldPreviewHover() {
    return this.hoverPreviewSessionEnabled && this.hoverHighlightEnabled && !this.mouseDownFlag && !this.isDragging && this.dragStepFlag === 0;
  }

  setRecordingState(isRecording, options = {}) {
    this.isRecording = isRecording === true;
    this.setHoverPreviewSessionEnabled(options.allowHoverPreview === true);
    if (!this.isRecording) this.hideHoverPreview();
  }

  setHoverPreviewSessionEnabled(enabled) {
    this.hoverPreviewSessionEnabled = enabled === true;
    if (!this.hoverPreviewSessionEnabled) this.hideHoverPreview();
  }

  loadHoverHighlightPreference() {
    try {
      if (typeof chrome === "undefined" || !chrome.storage?.local) return;
      chrome.storage.local.get(["hoverHighlightEnabled", "hoverPreviewSessionEnabled"], (result) => {
        this.setHoverHighlightEnabled(result.hoverHighlightEnabled !== false);
        this.setHoverPreviewSessionEnabled(result.hoverPreviewSessionEnabled === true);
      });
    } catch (error) {
      console.warn("[Recorder] Unable to load iframe hover highlight preference", error);
    }
  }

  bindHoverHighlightPreference() {
    try {
      if (typeof chrome === "undefined" || !chrome.storage?.onChanged) return;
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "local" || !changes.hoverHighlightEnabled) return;
        this.setHoverHighlightEnabled(changes.hoverHighlightEnabled.newValue !== false);
      });
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "local" || !changes.hoverPreviewSessionEnabled) return;
        this.setHoverPreviewSessionEnabled(changes.hoverPreviewSessionEnabled.newValue === true);
      });
    } catch (error) {
      console.warn("[Recorder] Unable to bind iframe hover highlight preference", error);
    }
  }

  setHoverHighlightEnabled(enabled) {
    this.hoverHighlightEnabled = enabled !== false;
    if (!this.hoverHighlightEnabled) this.hideHoverPreview();
  }

  mouseoutHandler(e) {
    if (!e.relatedTarget) this.hideHoverPreview();
  }

  hideHoverPreview() {
    this.hoverInspector?.hide();
    this.lastPreviewTarget = null;
  }

  formatLocatorPreview(sourcePath) {
    const best = this.getBestPreviewPath(sourcePath);
    if (!best) return "";

    const { funName, obj } = best;
    const quote = (value) => JSON.stringify(String(value ?? ""));

    if (funName === "ByRole") {
      const role = quote(obj.role);
      if (obj.name !== null && obj.name !== undefined && obj.name !== "") {
        const exactOption = obj.exact === false ? "" : ", exact: true";
        const nth = obj.index !== null && obj.index !== undefined ? `.nth(${obj.index})` : "";
        return `getByRole(${role}, { name: ${quote(obj.name)}${exactOption} })${nth}`;
      }
      return `getByRole(${role})`;
    }

    if (funName === "ByText") return `getByText(${quote(obj.text)}, { exact: true })`;
    if (funName === "ByTitle") return `getByTitle(${quote(obj.title)}, { exact: true })`;
    if (funName === "ByDomPath") return `locator(${quote(obj.csspath)})`;

    return funName;
  }

  getBestPreviewPath(sourcePath) {
    if (!sourcePath) return null;
    for (let i = 0; i < this.domParserService.priSize; i++) {
      if (sourcePath[i]) return sourcePath[i];
    }
    return null;
  }

  isRangeInput(element) {
    return element?.tagName === "INPUT" && element.getAttribute("type") === "range";
  }

  isColorInput(element) {
    return element?.tagName === "INPUT" && element.getAttribute("type") === "color";
  }

  isFileInput(element) {
    return element?.tagName === "INPUT" && element.getAttribute("type") === "file";
  }

  recordColorInput(element) {
    const value = element?.value;
    if (!value) return;

    const lastRecord = this.lastColorInput.get(element);
    if (lastRecord?.value === value && Date.now() - lastRecord.ts < 500) return;

    this.lastColorInput.set(element, { value, ts: Date.now() });
    clearTimeout(this.inputTimer);
    this.inputTimer = setTimeout(() => {
      this.currentHoveredElement = element;
      this.dispatchAction("color", this.currentHoveredElement, null, {
        inputText: value
      });
    }, 150);
  }

  getComposedEventTarget(e) {
    const debugPath = this.describeDebugComposedPath(e);
    const ionicInteractive = this.getFirstComposedElement(e, this.getIonicInteractiveSelector());
    const nativeInteractive = this.getFirstComposedElement(e, this.getNativeInteractiveSelector());
    const resolved = ionicInteractive || nativeInteractive || e.target;

    console.log("[RecorderDebug][Iframe getComposedEventTarget]", {
      rawTarget: this.describeDebugElement(e.target),
      composedPath: debugPath,
      nativeInteractive: this.describeDebugElement(nativeInteractive),
      ionicInteractive: this.describeDebugElement(ionicInteractive),
      resolved: this.describeDebugElement(resolved),
      resolvedRoot: this.describeDebugRoot(resolved?.getRootNode?.())
    });

    return resolved;
  }

  getNativeInteractiveSelector() {
    return "button, a, [role='button'], [onclick], input, textarea, select, label, [data-thread-id], .thread-item";
  }

  getIonicInteractiveSelector() {
    return "ion-tab-button, ion-button, ion-segment-button, ion-menu-button, ion-back-button, ion-item[button], ion-item[routerlink], ion-item[href], ion-card[button], ion-card[routerlink], ion-card[href], ion-card-content[button], ion-card-content[routerlink], ion-card-content[href]";
  }

  getFirstComposedElement(e, selector) {
    const path = typeof e.composedPath === "function" ? e.composedPath() : [];
    for (const item of path) {
      if (item?.nodeType !== 1) continue;
      if (item.matches?.(selector)) return item;
      const closest = item.closest?.(selector);
      if (closest) return closest;
    }
    return null;
  }

  describeDebugComposedPath(e) {
    const path = typeof e.composedPath === "function" ? e.composedPath() : [];
    return path.slice(0, 8).map(item => this.describeDebugElement(item));
  }

  describeDebugElement(element) {
    if (!element || element.nodeType !== 1) return String(element);

    const attrs = {};
    ["id", "class", "type", "part", "tab", "value", "data-gjs-type", "role", "aria-label"].forEach((name) => {
      const value = element.getAttribute?.(name);
      if (value !== null && value !== undefined && value !== "") attrs[name] = value;
    });

    return {
      tagName: element.tagName,
      attrs,
      text: (element.innerText || element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80)
    };
  }

  describeDebugRoot(root) {
    if (!root) return null;
    return {
      nodeType: root.nodeType,
      isShadowRoot: root.nodeType === Node.DOCUMENT_FRAGMENT_NODE && !!root.host,
      host: this.describeDebugElement(root.host)
    };
  }

  summarizeDebugSourcePath(sourcePath) {
    if (!sourcePath) return null;

    const summary = {};
    Object.keys(sourcePath).forEach((key) => {
      const item = sourcePath[key];
      if (!item) return;
      summary[key] = {
        funName: item.funName,
        csspath: item.obj?.csspath || null,
        shadowChain: item.obj?.shadowChain || [],
        options: Array.isArray(item.obj?.options)
          ? item.obj.options.map(option => ({
              path: option.path,
              shadowChain: option.shadowChain || [],
              score: option.score,
              U: option.U
            }))
          : []
      };
    });
    return summary;
  }

  snapshotInitialInputValues() {
    try {
      this.initialInputValues = new WeakMap();
      this.userEditedInputs = new WeakSet();
      this.iframeDocument?.querySelectorAll?.("input, textarea, [contenteditable='true']").forEach((element) => {
        this.initialInputValues.set(element, this.getInputValue(element));
      });
    } catch (error) {
      console.warn("[Recorder] Unable to snapshot initial input values", error);
    }
  }

  getInputValue(element) {
    return element?.value ?? element?.innerText ?? "";
  }

  shouldRecordTextInputEvent(element) {
    if (!this.userEditedInputs.has(element)) return false;

    const value = this.getInputValue(element);
    if (this.initialInputValues.get(element) === value) return false;

    const lastTypedAt = this.lastUserTypedAt.get(element) || 0;
    return Date.now() - lastTypedAt <= 1500;
  }

  isTextEditingKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return false;
    return e.key?.length === 1 || ["Backspace", "Delete"].includes(e.key);
  }

  isTextInputElement(element) {
    const tag = element?.tagName?.toLowerCase();
    const type = element?.getAttribute?.("type");
    return (
      (tag === "input" && (!type || ["text", "search", "email", "password", "number"].includes(type))) ||
      tag === "textarea" ||
      element?.isContentEditable
    );
  }

  setReloadSuppressWindow(ms = 1500) {
    try {
      this.iframeWindow?.sessionStorage?.setItem("__recorderSuppressUntil", String(Date.now() + ms));
    } catch (error) {
      console.warn("[Recorder] Unable to set reload suppress window", error);
    }
  }

  shouldSuppressSyntheticPageEvent() {
    try {
      const until = Number(this.iframeWindow?.sessionStorage?.getItem("__recorderSuppressUntil") || 0);
      return Date.now() < until;
    } catch (error) {
      return false;
    }
  }

  getCheckboxClickTarget(input) {
    const wrappingLabel = input.closest?.("label");
    if (wrappingLabel) return wrappingLabel;

    if (input.id) {
      const escapedId = String(input.id).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      const explicitLabel = input.ownerDocument?.querySelector?.(`label[for="${escapedId}"]`);
      if (explicitLabel) return explicitLabel;
    }

    return input;
  }

  isCheckboxOrCheckboxLabel(element) {
    if (!element) return false;

    if (element.matches?.('input[type="checkbox"]')) return true;

    const label = element.closest?.("label");
    if (!label?.querySelector?.('input[type="checkbox"]')) return false;

    if (element.closest?.('button, a, [role="button"], [onclick]')) return false;

    return true;
  }

  isRadioOrRadioLabel(element) {
    if (!element) return false;
    if (element.matches?.('input[type="radio"]')) return true;
    return !!element.closest?.("label")?.querySelector?.('input[type="radio"]');
  }
}

import { DOMElement } from "../entities/DOMElement";
import { ActionInterpreter } from '../usecases/ActionInterpreter.js';
import { HoverInspector } from "./HoverInspector.js";

export class OuterEventListener {
  constructor(contexts, domParserService, onActionRecorded) {
    this.contexts = contexts;
    this.mainWindow = contexts?.mainWindow || window;
    this.mainDocument = this.mainWindow?.document || document;
    
    this.domParserService = domParserService;
    
    // 透過 callback 將攔截到的動作往外送 (交給 MainApp/RecorderStore)
    this.onActionRecorded = onActionRecorded;
    // 綁定當前 Listener 所在的 contextId (例如 'page', 'popup_1', 'iframe_2')
    this.contextId = contexts?.contextId || 'page';
    this.contextSnapshot = contexts?.contextSnapshot || null;

    this.DOMElement = new DOMElement();
    this.currentHoveredElement = null;
    this.typedText = "";
    this.timer = null;
    this.initialInputValues = new WeakMap();
    this.preEditSourcePaths = new WeakMap();
    this.lastUserTypedAt = new WeakMap();
    this.userEditedInputs = new WeakSet();
    this.composingInputs = new WeakSet();
    this.lastColorInput = new WeakMap();
    this.dragStart = { x: 0, y: 0 };
    this.isDragging = false;
    this.DRAG_THRESHOLD = 5;
    this.dragSource = null;
    this.mouseDownFlag = false;
    this.dragStepFlag = 0;
    this.suppressClickUntil = 0;
    this.hoverInspector = new HoverInspector(this.mainDocument, this.mainWindow);
    this.lastPreviewTarget = null;
    this.hoverHighlightEnabled = true;
    this.hoverPreviewSessionEnabled = false;

    // GUI 狀態控制
    this.isRecording = false;
  }

  init() {
    if (!this.mainWindow || !this.mainDocument) {
      console.warn('mainWindow 不存在，跳過 OuterEventListener.init()');
      return;
    }
    
    this.mainDocument.addEventListener("click", this.clickHandler.bind(this), true);
    this.mainDocument.addEventListener("mousedown", this.mousedownHandler.bind(this), true);
    this.mainDocument.addEventListener("mousemove", this.mousemoveHandler.bind(this), true);
    this.mainDocument.addEventListener("mouseout", this.mouseoutHandler.bind(this), true);
    this.mainDocument.addEventListener("mouseleave", this.hideHoverPreview.bind(this), true);
    this.mainDocument.addEventListener("mouseup", this.mouseupHandler.bind(this), true);
    this.mainWindow.addEventListener("dragstart", this.dragStartHandler.bind(this));
    this.mainDocument.addEventListener('dblclick', this.dblClickHandler.bind(this), true);
    this.mainDocument.addEventListener('keydown', this.keydownHandler.bind(this));
    this.mainDocument.addEventListener("change", this.changeHandler.bind(this), true);
    this.mainDocument.addEventListener("compositionstart", this.compositionStartHandler.bind(this), true);
    this.mainDocument.addEventListener("compositionend", this.compositionEndHandler.bind(this), true);
    this.mainDocument.addEventListener("beforeinput", this.beforeInputHandler.bind(this), true);
    this.mainDocument.addEventListener("input", this.inputHandler.bind(this), true);
    this.mainDocument.addEventListener("paste", this.pasteHandler.bind(this), true);
    
    // 必須 preventDefault 才能觸發 drop
    this.mainDocument.addEventListener("dragover", (e) => {
      if (this.isRecording) e.preventDefault(); 
    });
    this.mainDocument.addEventListener("drop", this.dropHandler.bind(this), true);
    
    // 處理外部控制錄製開關的訊息
    this.mainWindow.addEventListener('message', this.messageHandler.bind(this));
    this.loadHoverHighlightPreference();
    this.bindHoverHighlightPreference();
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
        clearTimeout(this.timer);
        break;
    }
  }

  // 統一封裝與派發 Action 的方法
  dispatchAction(action_type, sourceElement, targetElement = null, extraData = {}) {
    const currentEventElement = sourceElement || targetElement;
    if (currentEventElement) {
      this.DOMElement.setElementData(currentEventElement, action_type);
    }
    
    const action = ActionInterpreter.interpretDrag(
      action_type, 
      sourceElement, 
      targetElement, 
      this.contextId, // 將事件的來源綁定當前的 contextId
      targetElement ? this.contextId : "" 
    );

    // 寫入額外資料
    if (typeof action.setSourceContext === "function") {
      action.setSourceContext(this.contextSnapshot);
    } else {
      action.sourceContext = this.contextSnapshot;
    }
    if (targetElement) {
      if (typeof action.setTargetContext === "function") {
        action.setTargetContext(this.contextSnapshot);
      } else {
        action.targetContext = this.contextSnapshot;
      }
    }

    if (extraData.keyboard) action.setKeyboard(extraData.keyboard);
    if (extraData.inputText !== undefined) action.setInputText(extraData.inputText);
    if (extraData.selectedValue !== undefined) action.setSelectedValue(extraData.selectedValue);
    if (extraData.selectedText !== undefined) action.setSelectedText(extraData.selectedText);
    if (extraData.preParsedSourcePath) action.preParsedSourcePath = extraData.preParsedSourcePath;
    if (extraData.isDrop && targetElement) action.setTargetElement(targetElement);
    if (extraData.dropPosition) action.dropPosition = extraData.dropPosition;

    // 【請補上這兩行】將拖拉標記附加到 action 上，否則 MainApp1 會認不出來！
    if (extraData.isDragStart) action.isDragStart = true;
    if (extraData.isDrop) action.isDrop = true;
    
    // 將組裝好的 Action 派發出去
    if (typeof this.onActionRecorded === 'function') {
      this.onActionRecorded(action);
    } else {
      console.warn('OuterEventListener: onActionRecorded callback 尚未綁定', action);
    }
  }

  dropHandler(e) {
    if (!this.isRecording) return;
    e.preventDefault();
    this.currentHoveredElement = e.target;
    
    this.dispatchAction("dragANDdrop", null, this.currentHoveredElement, {
      isDrop: true,
      dropPosition: this.getDropPosition(e, this.currentHoveredElement)
    });
  }

  getDropPosition(event, targetElement) {
    if (!event || !targetElement?.getBoundingClientRect) return null;
    const rect = targetElement.getBoundingClientRect();
    if (!Number.isFinite(rect.width) || !Number.isFinite(rect.height) || rect.width <= 0 || rect.height <= 0) {
      return null;
    }

    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
    return {
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      xRatio: Math.round((x / rect.width) * 10000) / 10000,
      yRatio: Math.round((y / rect.height) * 10000) / 10000,
      targetWidth: Math.round(rect.width * 100) / 100,
      targetHeight: Math.round(rect.height * 100) / 100
    };
  }

  beforeInputHandler(e) {
    if (!this.isRecording || !e.isTrusted) return;

    const element = this.getTextInputEventTarget(e) || e.target;
    if (!this.isTextInputElement(element) || this.preEditSourcePaths.has(element)) return;

    const sourcePath = this.domParserService.getOpenSourcePath(element, this.mainWindow);
    if (sourcePath && Object.keys(sourcePath).length > 0) {
      this.preEditSourcePaths.set(element, sourcePath);
    }
  }

  pasteHandler(e) {
    if (!this.isRecording || !e.isTrusted) return;
    if (this.shouldSuppressSyntheticPageEvent()) return;

    const target = this.getTextInputEventTarget(e) || e.target;
    if (!this.isTextInputElement(target)) return;

    if (!this.preEditSourcePaths.has(target)) {
      const sourcePath = this.domParserService.getOpenSourcePath(target, this.mainWindow);
      if (sourcePath && Object.keys(sourcePath).length > 0) {
        this.preEditSourcePaths.set(target, sourcePath);
      }
    }

    this.markTextInputEdited(target);

    // Read the resulting field value after the browser/framework applies the paste.
    // The normal trusted input event may reschedule this timer; this is the fallback
    // for components that stop or replace that event.
    setTimeout(() => {
      if (!this.isRecording) return;
      this.scheduleTextInputRecord(target);
    }, 0);
  }

  inputHandler(e) {
    this.debugInputEvent("input:received", e);
    if (!this.isRecording || !e.isTrusted) {
      this.debugInputEvent("input:ignored-recording-or-untrusted", e, {
        isRecording: this.isRecording,
        isTrusted: e.isTrusted
      });
      return;
    }
    if (this.shouldSuppressSyntheticPageEvent()) {
      this.debugInputEvent("input:ignored-suppressed", e);
      return;
    }
    const eventTarget = this.getTextInputEventTarget(e);
    const target = eventTarget || e.target;
    this.debugInputEvent("input:target-resolved", e, {
      resolvedTarget: this.describeDebugElement(target),
      resolvedValue: this.getInputValue(target),
      usedComposedPathTarget: !!eventTarget
    });
    const tag = target.tagName.toLowerCase();
    const type = target.getAttribute("type");
    const isRange = this.isRangeInput(target);

    if (isRange) {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.currentHoveredElement = target;
        this.dispatchAction("range", this.currentHoveredElement, null, {
          inputText: target.value
        });
      }, 250);
      return;
    }

    if (this.isColorInput(target)) {
      this.recordColorInput(target);
      return;
    }

    const isTextInput =
      (tag === "input" && (!type || ["text", "search", "email", "password", "number"].includes(type))) ||
      tag === "textarea" ||
      target.isContentEditable ||
      this.isValueBackedTextHost(target);

    if (!isTextInput) {
      this.debugInputEvent("input:ignored-not-text-input", e, {
        resolvedTarget: this.describeDebugElement(target),
        tag,
        type,
        hasStringValue: typeof target?.value === "string",
        isContentEditable: target?.isContentEditable === true
      });
      return;
    }
    this.markTextInputEdited(target);
    if (e.isComposing || this.composingInputs.has(target)) {
      this.debugInputEvent("input:ignored-composing", e, {
        isComposing: e.isComposing,
        composingSetHasTarget: this.composingInputs.has(target),
        value: this.getInputValue(target)
      });
      return;
    }
    if (!this.shouldRecordTextInputEvent(target)) {
      this.debugInputEvent("input:ignored-should-record-false", e, {
        value: this.getInputValue(target),
        initialValue: this.initialInputValues.get(target),
        userEdited: this.userEditedInputs.has(target)
      });
      return;
    }

    this.debugInputEvent("input:schedule-record", e, {
      value: this.getInputValue(target)
    });
    this.scheduleTextInputRecord(target);
  }

  compositionStartHandler(e) {
    this.debugInputEvent("compositionstart:received", e);
    const target = this.getTextInputEventTarget(e);
    if (!this.isRecording || !e.isTrusted || !this.isTextInputElement(target)) {
      this.debugInputEvent("compositionstart:ignored", e, {
        isRecording: this.isRecording,
        isTrusted: e.isTrusted,
        resolvedTarget: this.describeDebugElement(target)
      });
      return;
    }
    this.composingInputs.add(target);
    this.markTextInputEdited(target);
    this.debugInputEvent("compositionstart:tracked", e, {
      resolvedTarget: this.describeDebugElement(target),
      value: this.getInputValue(target)
    });
  }

  compositionEndHandler(e) {
    this.debugInputEvent("compositionend:received", e);
    const target = this.getTextInputEventTarget(e);
    const hasTrustedInputBeforeCompositionEnd = target && (
      this.userEditedInputs.has(target) ||
      this.composingInputs.has(target)
    );
    if (!this.isRecording || (!e.isTrusted && !hasTrustedInputBeforeCompositionEnd) || !this.isTextInputElement(target)) {
      this.debugInputEvent("compositionend:ignored", e, {
        isRecording: this.isRecording,
        isTrusted: e.isTrusted,
        hasTrustedInputBeforeCompositionEnd,
        resolvedTarget: this.describeDebugElement(target)
      });
      return;
    }
    this.composingInputs.delete(target);
    this.markTextInputEdited(target);
    if (this.shouldSuppressSyntheticPageEvent()) {
      this.debugInputEvent("compositionend:ignored-suppressed", e);
      return;
    }
    if (!this.shouldRecordTextInputEvent(target)) {
      this.debugInputEvent("compositionend:ignored-should-record-false", e, {
        value: this.getInputValue(target),
        initialValue: this.initialInputValues.get(target),
        userEdited: this.userEditedInputs.has(target)
      });
      return;
    }
    this.debugInputEvent("compositionend:schedule-record", e, {
      value: this.getInputValue(target)
    });
    this.scheduleTextInputRecord(target, 100);
  }

  changeHandler(e) {
    if (!this.isRecording || !e.isTrusted) return;
    const tag = e.target.tagName;
    const type = e.target.type;

    if (this.isRangeInput(e.target)) return;
    if (this.isColorInput(e.target)) {
      this.recordColorInput(e.target);
      return;
    }

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

  keydownHandler(e) {
    if (!this.isRecording || !e.isTrusted || e.repeat) return;
    const target = this.getTextInputEventTarget(e);
    if (target && this.isTextEditingKey(e) && this.isTextInputElement(target)) {
      this.markTextInputEdited(target);
      return;
    }
    if (e.key === 'Backspace') {
      this.currentHoveredElement = target || e.target;
      this.dispatchAction("keyboard", this.currentHoveredElement, null, {
        keyboard: e.key
      });
    }
  }

  dblClickHandler(e) {
    if (!this.isRecording) return;
    if (this.shouldSuppressSyntheticPageEvent()) return;
    this.currentHoveredElement = e.target;
    this.dispatchAction("dbclick", this.currentHoveredElement);
  }

  dragStartHandler(e) {
    if (!this.isRecording) return;
    const target = e.target;
    if (!target) return;
    if (this.isRangeInput(target)) return;

    if (target.getAttribute("draggable") === "true") {
      this.hideHoverPreview();
      // 僅向上通報拖拉起始事件，廣播工作交由 MainApp 負責
      this.dispatchAction("dragANDdrop", target, null, { isDragStart: true });
    }
  }

  mousedownHandler(e) {
    if (!this.isRecording || !e.isTrusted) return;
    if (this.isRangeInput(e.target)) return;
    if (!this.isMouseDragCandidate(e.target)) return;
    this.dragStart = { x: e.clientX, y: e.clientY };
    this.isDragging = false;
    this.dragSource = this.getDragSourceElement(e.target);
    this.mouseDownFlag = true;
    this.dragStepFlag = 1;
    this.hideHoverPreview();
  }

  mousemoveHandler(e) {
    if (!this.isRecording || !e.isTrusted) return;
    if (this.isRangeInput(e.target)) return;
    this.currentHoveredElement = this.getDragTargetElement(e.target);
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

      this.dispatchAction("dragANDdrop", this.dragSource, null, { isDragStart: true });
    }
  }

  previewHoveredElement(element) {
    if (!element || element === this.lastPreviewTarget) return;
    this.lastPreviewTarget = element;

    try {
      const sourcePath = this.domParserService.getOpenSourcePath(element, this.mainWindow);
      console.log("[Source Path in Page]: ",sourcePath);
      this.hoverInspector?.show(element, this.formatLocatorPreview(sourcePath));
    } catch (error) {
      console.warn("[Recorder] Unable to preview hovered locator", error);
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
      console.warn("[Recorder] Unable to load hover highlight preference", error);
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
      console.warn("[Recorder] Unable to bind hover highlight preference", error);
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
    if (funName === "ByDomPath") {
      const chain = Array.isArray(obj.shadowChain) ? obj.shadowChain : [];
      return [
        ...chain.map(step => `locator(${quote(step.hostSelector)})`),
        `locator(${quote(obj.csspath)})`
      ].join(".");
    }

    return funName;
  }

  getBestPreviewPath(sourcePath) {
    if (!sourcePath) return null;
    for (let i = 0; i < this.domParserService.priSize; i++) {
      if (sourcePath[i]) return sourcePath[i];
    }
    return null;
  }

  mouseupHandler(e) {
    if (!this.isRecording || !e.isTrusted) return;
    if (this.shouldSuppressSyntheticPageEvent()) return;
    if (this.isFileInput(e.target)) return;

    if (this.isDragging) {
      this.isDragging = false;
      this.dragStart = { x: 0, y: 0 };
      this.currentHoveredElement = this.getDragTargetElement(e.target);
      this.mouseDownFlag = false;
      this.dragStepFlag = 0;
      this.suppressClickUntil = Date.now() + 300;
      this.dispatchAction("dragANDdrop", null, this.currentHoveredElement, {
        isDrop: true,
        dropPosition: this.getDropPosition(e, this.currentHoveredElement)
      });
      return;
    }

    this.resetMouseDragState();
  }

  clickHandler(e) {
    if (!this.isRecording || !e.isTrusted) return;
    if (Date.now() < this.suppressClickUntil) return;
    if (this.shouldSuppressSyntheticPageEvent()) return;
    const target = this.getComposedEventTarget(e);
    const toolbarItem = target?.closest?.(
      ".gjs-toolbar-item, [data-command], [data-cmd]"
    );
    if (toolbarItem) {
      console.log("GJS toolbar clicked:", toolbarItem);
    }
    if (this.isFileInput(target)) return;
    if (this.isRangeInput(target)) return;
    if (this.isCheckboxOrCheckboxLabel(target)) return;
    if (target.tagName === "LABEL" && !this.isRadioOrRadioLabel(target)) return;
    if (target.tagName === "SELECT") return;
    
    const clickableSelector = this.getClickableSelector();
    let clickable = target;
    if (target.tagName === "INPUT") {
      const label = target.parentElement?.querySelector(`label[for="${target.id}"]`);
      clickable = label || target.closest(clickableSelector) || target;
    } else {
      clickable = target.closest(clickableSelector) || target;
    }

    this.currentHoveredElement = clickable;
    console.log("[RecorderDebug][Outer clickHandler] dispatch click target", {
      rawTarget: this.describeDebugElement(e.target),
      composedTarget: this.describeDebugElement(target),
      clickable: this.describeDebugElement(clickable),
      clickableRoot: this.describeDebugRoot(clickable?.getRootNode?.())
    });
    this.dispatchAction("click", this.currentHoveredElement);
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
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.currentHoveredElement = element;
      this.dispatchAction("color", this.currentHoveredElement, null, {
        inputText: value
      });
    }, 150);
  }

  getDragSourceElement(element) {
    return element?.closest?.(".gjs-layer-move, [data-toggle-move]") || element;
  }

  getComposedEventTarget(e) {
    const debugPath = this.describeDebugComposedPath(e);
    const ionicInteractive = this.getFirstComposedElement(e, this.getIonicInteractiveSelector());
    const nativeInteractive = this.getFirstComposedElement(e, this.getNativeInteractiveSelector());
    const resolved = ionicInteractive || nativeInteractive || e.target;

    console.log("[RecorderDebug][Outer getComposedEventTarget]", {
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
    return "ion-select, ion-tab-button, ion-button, ion-segment-button, ion-menu-button, ion-back-button, ion-item[button], ion-item[routerlink], ion-item[href], ion-card[button], ion-card[routerlink], ion-card[href], ion-card-content[button], ion-card-content[routerlink], ion-card-content[href]";
  }

  getClickableSelector() {
    return `${this.getNativeInteractiveSelector()}, i, svg, ${this.getIonicInteractiveSelector()}`;
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

  isMouseDragCandidate(element) {
    return !!element?.closest?.(".gjs-layer-move, [data-toggle-move]");
  }

  getDragTargetElement(element) {
    return element?.closest?.(".gjs-layer, .gjs-layer-item, [data-layer-id], [data-gjs-type]") || element;
  }

  resetMouseDragState() {
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.dragSource = null;
    this.mouseDownFlag = false;
    this.dragStepFlag = 0;
  }

  snapshotInitialInputValues() {
    try {
      this.initialInputValues = new WeakMap();
      this.preEditSourcePaths = new WeakMap();
      this.userEditedInputs = new WeakSet();
      this.composingInputs = new WeakSet();
      this.mainDocument?.querySelectorAll?.("input, textarea, [contenteditable='true']").forEach((element) => {
        this.initialInputValues.set(element, this.getInputValue(element));
      });
    } catch (error) {
      console.warn("[Recorder] Unable to snapshot initial input values", error);
    }
  }

  getInputValue(element) {
    return element?.value ?? element?.innerText ?? element?.textContent ?? "";
  }

  shouldRecordTextInputEvent(element) {
    if (!this.userEditedInputs.has(element)) return false;

    const value = this.getInputValue(element);
    if (this.initialInputValues.get(element) === value) return false;

    return true;
  }

  markTextInputEdited(element) {
    if (!this.isTextInputElement(element)) return;
    this.lastUserTypedAt.set(element, Date.now());
    this.userEditedInputs.add(element);
  }

  scheduleTextInputRecord(element, delay = 500) {
    clearTimeout(this.timer);
    this.debugInputTarget("scheduleTextInputRecord:set-timer", element, {
      delay,
      value: this.getInputValue(element)
    });
    this.timer = setTimeout(() => {
      if (!this.isRecording || this.composingInputs.has(element) || !this.shouldRecordTextInputEvent(element)) {
        this.debugInputTarget("scheduleTextInputRecord:timer-ignored", element, {
          isRecording: this.isRecording,
          composingSetHasTarget: this.composingInputs.has(element),
          shouldRecord: this.shouldRecordTextInputEvent(element),
          value: this.getInputValue(element),
          initialValue: this.initialInputValues.get(element),
          userEdited: this.userEditedInputs.has(element)
        });
        return;
      }
      this.currentHoveredElement = element;
      const preParsedSourcePath = this.preEditSourcePaths.get(element) || null;
      this.debugInputTarget("scheduleTextInputRecord:dispatch-input", element, {
        value: this.getInputValue(element)
      });
      this.dispatchAction("input", this.currentHoveredElement, null, {
        inputText: this.getInputValue(element),
        preParsedSourcePath
      });
      this.preEditSourcePaths.delete(element);
    }, delay);
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
      element?.isContentEditable ||
      this.isValueBackedTextHost(element)
    );
  }

  isValueBackedTextHost(element) {
    if (!element || element.nodeType !== 1) return false;
    const tag = element.tagName?.toLowerCase?.() || "";
    if (["ion-input", "ion-textarea", "md-input", "vaadin-text-field", "vaadin-text-area"].includes(tag)) return true;
    if (element.getAttribute?.("contenteditable") === "true") return true;
    if (typeof element.value !== "string") return false;
    return element.matches?.("[role='textbox'], [data-gjs-type='text'], [data-field], [data-testid], [aria-label]") || tag.includes("input") || tag.includes("textarea");
  }

  getTextInputEventTarget(e) {
    const path = typeof e?.composedPath === "function" ? e.composedPath() : [];
    for (const item of path) {
      if (this.isTextInputElement(item) || this.isRangeInput(item) || this.isColorInput(item)) return item;
    }
    return this.isTextInputElement(e?.target) || this.isRangeInput(e?.target) || this.isColorInput(e?.target)
      ? e.target
      : null;
  }

  debugInputEvent(stage, e, extra = {}) {
    try {
      const path = typeof e?.composedPath === "function" ? e.composedPath() : [];
      console.log("[RecorderInputDebug][Outer]", stage, {
        eventType: e?.type,
        isTrusted: e?.isTrusted,
        isComposing: e?.isComposing,
        inputType: e?.inputType,
        data: e?.data,
        rawTarget: this.describeDebugElement(e?.target),
        rawValue: this.getInputValue(e?.target),
        path: path.slice(0, 6).map(item => this.describeDebugElement(item)),
        ...extra
      });
    } catch (error) {
      console.warn("[RecorderInputDebug][Outer] log failed", stage, error);
    }
  }

  debugInputTarget(stage, element, extra = {}) {
    try {
      console.log("[RecorderInputDebug][Outer]", stage, {
        target: this.describeDebugElement(element),
        value: this.getInputValue(element),
        ...extra
      });
    } catch (error) {
      console.warn("[RecorderInputDebug][Outer] log failed", stage, error);
    }
  }

  setReloadSuppressWindow(ms = 1500) {
    try {
      this.mainWindow?.sessionStorage?.setItem("__recorderSuppressUntil", String(Date.now() + ms));
    } catch (error) {
      console.warn("[Recorder] Unable to set reload suppress window", error);
    }
  }

  shouldSuppressSyntheticPageEvent() {
    try {
      const until = Number(this.mainWindow?.sessionStorage?.getItem("__recorderSuppressUntil") || 0);
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

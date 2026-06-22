import { DOMElement } from "../entities/DOMElement";
import { ActionInterpreter } from '../usecases/ActionInterpreter.js';

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

    this.DOMElement = new DOMElement();
    this.currentHoveredElement = null;
    this.typedText = "";
    this.timer = null;
    this.initialInputValues = new WeakMap();
    this.lastUserTypedAt = new WeakMap();
    this.userEditedInputs = new WeakSet();
    this.lastColorInput = new WeakMap();
    this.dragStart = { x: 0, y: 0 };
    this.isDragging = false;
    this.DRAG_THRESHOLD = 5;
    this.dragSource = null;
    this.mouseDownFlag = false;
    this.dragStepFlag = 0;
    this.suppressClickUntil = 0;

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
    this.mainDocument.addEventListener("mouseup", this.mouseupHandler.bind(this), true);
    this.mainWindow.addEventListener("dragstart", this.dragStartHandler.bind(this));
    this.mainDocument.addEventListener('dblclick', this.dblClickHandler.bind(this), true);
    this.mainDocument.addEventListener('keydown', this.keydownHandler.bind(this));
    this.mainDocument.addEventListener("change", this.changeHandler.bind(this), true);
    this.mainDocument.addEventListener("input", this.inputHandler.bind(this), true);
    
    // 必須 preventDefault 才能觸發 drop
    this.mainDocument.addEventListener("dragover", (e) => {
      if (this.isRecording) e.preventDefault(); 
    });
    this.mainDocument.addEventListener("drop", this.dropHandler.bind(this), true);
    
    // 處理外部控制錄製開關的訊息
    this.mainWindow.addEventListener('message', this.messageHandler.bind(this));
  }

  messageHandler(e) {
    const msg = e.data;
    switch (msg.type) {
      case 'START_RECORDING':
        this.isRecording = true;
        this.snapshotInitialInputValues();
        break;
      case 'STOP_RECORDING':
        this.isRecording = false;
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
    if (extraData.keyboard) action.setKeyboard(extraData.keyboard);
    if (extraData.inputText !== undefined) action.setInputText(extraData.inputText);
    if (extraData.isDrop && targetElement) action.setTargetElement(targetElement);

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
    
    this.dispatchAction("dragANDdrop", null, this.currentHoveredElement, { isDrop: true });
  }

  inputHandler(e) {
    if (!this.isRecording || !e.isTrusted) return;
    if (this.shouldSuppressSyntheticPageEvent()) return;
    const tag = e.target.tagName.toLowerCase();
    const type = e.target.getAttribute("type");
    const isRange = this.isRangeInput(e.target);

    if (isRange) {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.currentHoveredElement = e.target;
        this.dispatchAction("range", this.currentHoveredElement, null, {
          inputText: e.target.value
        });
      }, 250);
      return;
    }

    if (this.isColorInput(e.target)) {
      this.recordColorInput(e.target);
      return;
    }

    const isTextInput =
      (tag === "input" && (!type || ["text", "search", "email", "password", "number"].includes(type))) ||
      tag === "textarea" ||
      e.target.isContentEditable;

    if (!isTextInput) return; 
    if (!this.shouldRecordTextInputEvent(e.target)) return;

    clearTimeout(this.timer);
    const target = e.target;
    this.timer = setTimeout(() => {
      if (!this.isRecording || !this.shouldRecordTextInputEvent(target)) return;
      this.currentHoveredElement = target;
      this.dispatchAction("input", this.currentHoveredElement, null, {
        inputText: this.getInputValue(target)
      });
    }, 500);
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
    this.dispatchAction(action_type, e.target);
  }

  keydownHandler(e) {
    if (!this.isRecording) return;
    if (e.isTrusted && e.target && this.isTextEditingKey(e) && this.isTextInputElement(e.target)) {
      this.lastUserTypedAt.set(e.target, Date.now());
      this.userEditedInputs.add(e.target);
    }
    if (e.key === 'Backspace') {
      this.currentHoveredElement = e.target;
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
  }

  mousemoveHandler(e) {
    if (!this.isRecording || !e.isTrusted) return;
    if (this.isRangeInput(e.target)) return;
    this.currentHoveredElement = this.getDragTargetElement(e.target);

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
      this.dispatchAction("dragANDdrop", null, this.currentHoveredElement, { isDrop: true });
      return;
    }

    this.resetMouseDragState();
  }

  clickHandler(e) {
    if (!this.isRecording || !e.isTrusted) return;
    if (Date.now() < this.suppressClickUntil) return;
    if (this.shouldSuppressSyntheticPageEvent()) return;
    const target = this.getComposedEventTarget(e);
    if (this.isFileInput(target)) return;
    if (this.isRangeInput(target)) return;
    if (this.isCheckboxOrCheckboxLabel(target)) return;
    if (target.tagName === "LABEL" || target.tagName === "SELECT") return;
    
    let clickable = target;
    if (target.tagName === "INPUT") {
      const label = target.parentElement?.querySelector(`label[for="${target.id}"]`);
      clickable = label || target.closest(`button, a, [role="button"], [onclick], i, svg`) || target;
    } else {
      clickable = target.closest(`button, a, [role="button"], [onclick], i, svg`) || target;
    }

    this.currentHoveredElement = clickable;
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
    const interactive = this.getFirstComposedElement(e, "button, a, [role='button'], [onclick], input, textarea, select, label");
    return interactive || e.target;
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
      this.userEditedInputs = new WeakSet();
      this.mainDocument?.querySelectorAll?.("input, textarea, [contenteditable='true']").forEach((element) => {
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
}

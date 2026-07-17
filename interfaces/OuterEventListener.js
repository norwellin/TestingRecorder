import { DOMElement } from "../entities/DOMElement.js";
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
    this.pendingTextInputElement = null;
    this.initialInputValues = new WeakMap();
    this.preEditSourcePaths = new WeakMap();
    this.lastUserTypedAt = new WeakMap();
    this.userEditedInputs = new WeakSet();
    this.composingInputs = new WeakSet();
    this.lastColorInput = new WeakMap();
    this.lastMonacoValues = new WeakMap();
    this.pendingIonSelectInteractions = new WeakMap();
    this.activeIonSelect = null;
    this.dragStart = { x: 0, y: 0 };
    this.isDragging = false;
    this.DRAG_THRESHOLD = 5;
    this.dragSource = null;
    this.canvasDragPath = [];
    this.lastCanvasPointerPosition = new WeakMap();
    this.canvasWheelRecords = new WeakMap();
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
    this.mainDocument.addEventListener("contextmenu", this.contextMenuHandler.bind(this), true);
    this.mainDocument.addEventListener("mousedown", this.mousedownHandler.bind(this), true);
    this.mainDocument.addEventListener("mousemove", this.mousemoveHandler.bind(this), true);
    this.mainDocument.addEventListener("mouseout", this.mouseoutHandler.bind(this), true);
    this.mainDocument.addEventListener("mouseleave", this.hideHoverPreview.bind(this), true);
    this.mainDocument.addEventListener("mouseup", this.mouseupHandler.bind(this), true);
    this.mainDocument.addEventListener("wheel", this.wheelHandler.bind(this), true);
    this.mainWindow.addEventListener("dragstart", this.dragStartHandler.bind(this));
    this.mainDocument.addEventListener('dblclick', this.dblClickHandler.bind(this), true);
    this.mainDocument.addEventListener('keydown', this.keydownHandler.bind(this));
    this.mainDocument.addEventListener("change", this.changeHandler.bind(this), true);
    this.mainDocument.addEventListener("ionChange", this.ionSelectChangeHandler.bind(this), true);
    this.mainDocument.addEventListener("ionCancel", this.ionSelectDismissHandler.bind(this), true);
    this.mainDocument.addEventListener("ionDismiss", this.ionSelectDismissHandler.bind(this), true);
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
        this.timer = null;
        this.pendingTextInputElement = null;
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
    if (extraData.selectInterface) action.selectInterface = extraData.selectInterface;
    if (extraData.selectedTexts) action.selectedTexts = extraData.selectedTexts;
    if (extraData.isMultiple !== undefined) action.isMultiple = extraData.isMultiple === true;
    if (extraData.preParsedSourcePath) action.preParsedSourcePath = extraData.preParsedSourcePath;
    if (extraData.isDrop && targetElement) action.setTargetElement(targetElement);
    if (extraData.dropPosition) action.dropPosition = extraData.dropPosition;
    if (extraData.sourcePosition) action.sourcePosition = extraData.sourcePosition;
    if (extraData.clickPosition) action.clickPosition = extraData.clickPosition;
    if (extraData.canvasDragPath) action.canvasDragPath = extraData.canvasDragPath;
    if (extraData.canvasInputPosition) action.canvasInputPosition = extraData.canvasInputPosition;
    if (extraData.canvasWheel) action.canvasWheel = extraData.canvasWheel;
    if (extraData.monaco) action.monaco = extraData.monaco;

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

  async dropHandler(e) {
    if (!this.isRecording) return;
    e.preventDefault();
    this.currentHoveredElement = this.getDropTargetElement(e);
    const dropPosition = await this.getDropPosition(e, this.currentHoveredElement);
    
    this.dispatchAction("dragANDdrop", null, this.currentHoveredElement, {
      isDrop: true,
      dropPosition
    });
  }

  async getDropPosition(event, targetElement) {
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
      targetHeight: Math.round(rect.height * 100) / 100,
      scrollState: await this.getDropScrollState(targetElement)
    };
  }

  async getDropScrollState(targetElement) {
    const doc = targetElement?.ownerDocument;
    if (!doc) return null;

    const ionContent = this.getClosestIonContent(targetElement);
    if (ionContent) {
      try {
        const scrollingElement = typeof ionContent.getScrollElement === "function"
          ? await ionContent.getScrollElement()
          : ionContent.shadowRoot?.querySelector?.("[part='scroll'], .inner-scroll");
        if (scrollingElement) {
          return {
            scope: "ion-content",
            scrollLeftRatio: this.getScrollRatio(
              scrollingElement.scrollLeft,
              scrollingElement.scrollWidth - scrollingElement.clientWidth
            ),
            scrollTopRatio: this.getScrollRatio(
              scrollingElement.scrollTop,
              scrollingElement.scrollHeight - scrollingElement.clientHeight
            )
          };
        }
      } catch (error) {
        console.warn("[Recorder] Unable to inspect ion-content scroll position", error);
      }
    }

    const view = doc.defaultView;
    let element = targetElement;
    let ancestorDepth = 0;

    while (element && element !== doc.documentElement) {
      const style = view?.getComputedStyle?.(element);
      const overflowX = style?.overflowX || style?.overflow || "";
      const overflowY = style?.overflowY || style?.overflow || "";
      const canScrollX =
        /(auto|scroll|overlay)/.test(overflowX) &&
        element.scrollWidth > element.clientWidth;
      const canScrollY =
        /(auto|scroll|overlay)/.test(overflowY) &&
        element.scrollHeight > element.clientHeight;

      if (canScrollX || canScrollY) {
        return {
          scope: "element",
          ancestorDepth,
          scrollLeftRatio: this.getScrollRatio(
            element.scrollLeft,
            element.scrollWidth - element.clientWidth
          ),
          scrollTopRatio: this.getScrollRatio(
            element.scrollTop,
            element.scrollHeight - element.clientHeight
          )
        };
      }

      element = element.parentElement;
      ancestorDepth += 1;
    }

    const scrollingElement = this.getDocumentScrollingElement(doc);
    if (!scrollingElement) return null;

    return {
      scope: "document",
      rootTag: String(scrollingElement.tagName || "").toLowerCase(),
      scrollLeftRatio: this.getScrollRatio(
        scrollingElement.scrollLeft,
        scrollingElement.scrollWidth - scrollingElement.clientWidth
      ),
      scrollTopRatio: this.getScrollRatio(
        scrollingElement.scrollTop,
        scrollingElement.scrollHeight - scrollingElement.clientHeight
      )
    };
  }

  getDocumentScrollingElement(doc) {
    const candidates = [doc?.scrollingElement, doc?.documentElement, doc?.body]
      .filter((element, index, list) => element && list.indexOf(element) === index);
    return candidates.find(element =>
      Math.abs(Number(element.scrollTop) || 0) > 0 ||
      Math.abs(Number(element.scrollLeft) || 0) > 0
    ) || candidates[0] || null;
  }

  getScrollRatio(position, maximum) {
    const max = Number(maximum);
    if (!Number.isFinite(max) || max <= 0) return 0;
    const ratio = Number(position) / max;
    return Math.round(Math.max(0, Math.min(1, ratio)) * 10000) / 10000;
  }

  beforeInputHandler(e) {
    if (!this.isRecording || !e.isTrusted) return;

    const element = this.getTextInputEventTarget(e) || e.target;
    if (!this.isTextInputElement(element)) return;

    if (this.isDirectUserInputType(e.inputType)) {
      this.markTextInputEdited(element);
    }
    if (this.preEditSourcePaths.has(element)) return;

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

    if (this.isMonacoInputElement(target)) {
      this.scheduleMonacoSetValueRecord(target, 150);
      return;
    }

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

    if (this.isMonacoInputElement(target)) {
      this.scheduleMonacoSetValueRecord(target);
      return;
    }

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
    const canvasTarget = this.getCanvasEventTarget(e);

    if (!target && canvasTarget && this.isCanvasTextKey(e)) {
      this.currentHoveredElement = canvasTarget;
      this.dispatchAction("canvasInput", canvasTarget, null, {
        inputText: e.key,
        canvasInputPosition: this.lastCanvasPointerPosition.get(canvasTarget) || null
      });
      return;
    }

    if (e.key === "Enter" && !e.isComposing && e.keyCode !== 229) {
      if (target) this.flushPendingTextInputRecord(target);
      this.currentHoveredElement = target || e.target || this.mainDocument.activeElement;
      if (!this.currentHoveredElement) return;
      this.dispatchAction("keyboard", this.currentHoveredElement, null, {
        keyboard: this.getEnterShortcut(e)
      });
      return;
    }

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

  ionSelectChangeHandler(e) {
    if (!this.isRecording) return;
    const target = e.target;
    if (target?.tagName !== "ION-SELECT") return;

    const interactionAt = Number(this.pendingIonSelectInteractions.get(target));
    if (!Number.isFinite(interactionAt) || Date.now() - interactionAt > 30000) return;

    const selectedValue = e.detail?.value ?? target.value;
    const selectedTexts = this.getIonSelectSelectedTexts(target, selectedValue);
    const selectedText = selectedTexts.join(", ") || String(selectedValue ?? "");

    this.pendingIonSelectInteractions.delete(target);
    this.activeIonSelect = null;
    this.dispatchAction("ionSelect", target, null, {
      selectedValue,
      selectedText,
      selectedTexts,
      selectInterface: target.getAttribute?.("interface") || "alert",
      isMultiple: target.multiple === true || target.hasAttribute?.("multiple") === true
    });
  }

  ionSelectDismissHandler(e) {
    const target = e.target;
    if (target?.tagName === "ION-SELECT") {
      this.pendingIonSelectInteractions.delete(target);
      if (this.activeIonSelect === target) this.activeIonSelect = null;
    }
  }

  getIonSelectSelectedTexts(target, selectedValue) {
    const selectedValues = Array.isArray(selectedValue) ? selectedValue : [selectedValue];
    const options = [...(target?.querySelectorAll?.("ion-select-option") || [])];
    return selectedValues.map(value => {
      const option = options.find(item => {
        const optionValue = item.value ?? item.getAttribute?.("value");
        return optionValue === value || String(optionValue) === String(value);
      });
      return (option?.textContent || "").trim() || String(value ?? "");
    }).filter(Boolean);
  }
  dblClickHandler(e) {
    if (!this.isRecording || !e.isTrusted) return;
    if (this.shouldSuppressSyntheticPageEvent()) return;
    const target = this.getComposedEventTarget(e);
    if (this.isCanvasElement(target)) {
      const clickPosition = this.getElementPosition(e, target);
      if (clickPosition) this.lastCanvasPointerPosition.set(target, clickPosition);
      this.currentHoveredElement = target;
      this.dispatchAction("dbclick", this.currentHoveredElement, null, { clickPosition });
      return;
    }

    this.currentHoveredElement = e.target;
    this.dispatchAction("dbclick", this.currentHoveredElement);
  }

  wheelHandler(e) {
    if (!this.isRecording || !e.isTrusted) return;
    if (this.shouldSuppressSyntheticPageEvent()) return;

    const target = this.getCanvasEventTarget(e);
    if (!target) return;

    const position = this.getElementPosition(e, target);
    if (position) this.lastCanvasPointerPosition.set(target, position);

    const delta = this.getWheelDelta(e);
    if (!delta) return;

    const existing = this.canvasWheelRecords.get(target);
    if (existing?.timer) clearTimeout(existing.timer);

    const next = {
      deltaX: (existing?.deltaX || 0) + delta.deltaX,
      deltaY: (existing?.deltaY || 0) + delta.deltaY,
      position: position || existing?.position || null,
      timer: null
    };

    next.timer = setTimeout(() => {
      this.canvasWheelRecords.delete(target);
      if (!this.isRecording) return;
      this.currentHoveredElement = target;
      this.dispatchAction("canvasWheel", target, null, {
        canvasWheel: {
          deltaX: Math.round(next.deltaX * 100) / 100,
          deltaY: Math.round(next.deltaY * 100) / 100,
          position: next.position
        }
      });
    }, 150);

    this.canvasWheelRecords.set(target, next);
  }

  dragStartHandler(e) {
    if (!this.isRecording) return;
    const target = e.target;
    if (!target) return;
    if (this.isRangeInput(target)) return;

    if (target.getAttribute("draggable") === "true") {
      this.hideHoverPreview();
      // 僅向上通報拖拉起始事件，廣播工作交由 MainApp 負責
      this.dispatchAction("dragANDdrop", target, null, {
        isDragStart: true,
        sourcePosition: this.getDragSourcePosition(e, target)
      });
    }
  }

  mousedownHandler(e) {
    if (!this.isRecording || !e.isTrusted) return;
    if (this.isRangeInput(e.target)) return;
    if (!this.isMouseDragCandidate(e.target)) return;
    this.dragStart = { x: e.clientX, y: e.clientY };
    this.isDragging = false;
    this.dragSource = this.getDragSourceElement(e.target);
    this.canvasDragPath = [];
    if (this.isCanvasElement(this.dragSource)) {
      const startPoint = this.getElementPosition(e, this.dragSource);
      if (startPoint) {
        this.canvasDragPath = [startPoint];
        this.lastCanvasPointerPosition.set(this.dragSource, startPoint);
      }
    }
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

    if (this.isDragging && this.isCanvasElement(this.dragSource)) {
      return;
    }

    if (!this.dragStart || this.dragStepFlag !== 1) return;

    const dx = e.clientX - this.dragStart.x;
    const dy = e.clientY - this.dragStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance >= this.DRAG_THRESHOLD && this.mouseDownFlag) {
      this.isDragging = true;
      this.dragStepFlag = 2;
      this.mouseDownFlag = false;

      if (this.isCanvasElement(this.dragSource)) {
        return;
      }

      this.dispatchAction("dragANDdrop", this.dragSource, null, {
        isDragStart: true,
        sourcePosition: this.getDragSourcePosition(e, this.dragSource)
      });
    }
  }

  getDragSourcePosition(event, sourceElement) {
    if (!event || !sourceElement?.getBoundingClientRect) return null;
    const rect = sourceElement.getBoundingClientRect();
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
      sourceWidth: Math.round(rect.width * 100) / 100,
      sourceHeight: Math.round(rect.height * 100) / 100
    };
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
    if (funName === "ByPlaywright") {
      const chain = Array.isArray(obj.shadowChain) ? obj.shadowChain : [];
      return [
        ...chain.map(step => `locator(${quote(step.hostSelector)})`),
        obj.locator || obj.selector || "playwright"
      ].join(".");
    }
    if (funName === "ByGjsToolbarItem") {
      return `locator(${quote(obj.toolbarSelector || ".gjs-toolbar")}).locator(${quote(obj.itemSelector || ".gjs-toolbar-item")}).nth(${Math.max(0, Math.floor(Number(obj.index) || 0))})`;
    }
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

  async mouseupHandler(e) {
    if (!this.isRecording || !e.isTrusted) return;
    if (this.shouldSuppressSyntheticPageEvent()) return;
    if (this.isFileInput(e.target)) return;

    if (this.isDragging) {
      this.isDragging = false;
      this.dragStart = { x: 0, y: 0 };

      if (this.isCanvasElement(this.dragSource)) {
        const canvas = this.dragSource;
        const endPoint = this.getElementPosition(e, canvas);
        if (endPoint) {
          this.canvasDragPath.push(endPoint);
          this.lastCanvasPointerPosition.set(canvas, endPoint);
        }
        this.currentHoveredElement = canvas;
        this.mouseDownFlag = false;
        this.dragStepFlag = 0;
        this.suppressClickUntil = Date.now() + 300;
        this.dispatchAction("dragANDdrop", canvas, canvas, {
          sourcePosition: this.canvasDragPath[0] || null,
          dropPosition: endPoint,
          canvasDragPath: this.canvasDragPath.filter(Boolean)
        });
        this.canvasDragPath = [];
        return;
      }

      this.currentHoveredElement = this.getDropTargetElement(e);
      this.mouseDownFlag = false;
      this.dragStepFlag = 0;
      this.suppressClickUntil = Date.now() + 300;
      const dropPosition = await this.getDropPosition(e, this.currentHoveredElement);
      this.dispatchAction("dragANDdrop", null, this.currentHoveredElement, {
        isDrop: true,
        dropPosition
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
    if (this.isCanvasElement(target)) {
      const clickPosition = this.getElementPosition(e, target);
      if (clickPosition) this.lastCanvasPointerPosition.set(target, clickPosition);
      this.currentHoveredElement = target;
      this.dispatchAction("click", this.currentHoveredElement, null, { clickPosition });
      return;
    }

    if (target?.tagName === "ION-SELECT") {
      this.pendingIonSelectInteractions.set(target, Date.now());
      this.activeIonSelect = target;
      return;
    }
    if (this.isActiveIonSelectOverlayInteraction(e)) return;
    const toolbarItem = target?.closest?.(
      ".gjs-toolbar-item, [data-command], [data-cmd]"
    );
    if (toolbarItem) {
      this.currentHoveredElement = toolbarItem;
      console.log("[RecorderDebug][Outer clickHandler] dispatch GJS toolbar click target", {
        rawTarget: this.describeDebugElement(e.target),
        composedTarget: this.describeDebugElement(target),
        toolbarItem: this.describeDebugElement(toolbarItem),
        toolbarRoot: this.describeDebugRoot(toolbarItem?.getRootNode?.())
      });
      this.dispatchAction("click", this.currentHoveredElement);
      return;
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

  contextMenuHandler(e) {
    if (!this.isRecording || !e.isTrusted) return;
    if (this.shouldSuppressSyntheticPageEvent()) return;
    const target = this.getComposedEventTarget(e);
    if (!target) return;

    if (this.isCanvasElement(target)) {
      const clickPosition = this.getElementPosition(e, target);
      if (clickPosition) this.lastCanvasPointerPosition.set(target, clickPosition);
      this.currentHoveredElement = target;
      this.dispatchAction("rightClick", this.currentHoveredElement, null, { clickPosition });
      return;
    }

    const toolbarItem = target?.closest?.(
      ".gjs-toolbar-item, [data-command], [data-cmd]"
    );
    if (toolbarItem) {
      this.currentHoveredElement = toolbarItem;
    } else {
      const clickableSelector = this.getClickableSelector();
      this.currentHoveredElement = target.closest?.(clickableSelector) || target;
    }

    this.dispatchAction("rightClick", this.currentHoveredElement);
  }

  isActiveIonSelectOverlayInteraction(e) {
    if (!this.activeIonSelect) return false;
    const interactionAt = Number(this.pendingIonSelectInteractions.get(this.activeIonSelect));
    if (!Number.isFinite(interactionAt) || Date.now() - interactionAt > 30000) {
      this.pendingIonSelectInteractions.delete(this.activeIonSelect);
      this.activeIonSelect = null;
      return false;
    }
    return (typeof e.composedPath === "function" ? e.composedPath() : []).some(item =>
      item?.matches?.(
        "ion-popover, ion-alert, ion-action-sheet, ion-modal, ion-select-option, ion-radio, ion-checkbox"
      )
    );
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

  isCanvasElement(element) {
    return element?.tagName === "CANVAS";
  }

  getCanvasEventTarget(e) {
    const target = this.getComposedEventTarget(e);
    return this.isCanvasElement(target) ? target : null;
  }

  isCanvasTextKey(e) {
    return !e.isComposing && !e.ctrlKey && !e.metaKey && !e.altKey && e.key?.length === 1;
  }

  getElementPosition(event, element) {
    if (!event || !element?.getBoundingClientRect) return null;
    const rect = element.getBoundingClientRect();
    if (!Number.isFinite(rect.width) || !Number.isFinite(rect.height) || rect.width <= 0 || rect.height <= 0) {
      return null;
    }

    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
    const round = value => Math.round(value * 100) / 100;
    return {
      x: round(x),
      y: round(y),
      xRatio: Math.round((x / rect.width) * 10000) / 10000,
      yRatio: Math.round((y / rect.height) * 10000) / 10000,
      width: round(rect.width),
      height: round(rect.height)
    };
  }

  getWheelDelta(event) {
    if (!event) return null;
    const unit = event.deltaMode === 1
      ? 16
      : event.deltaMode === 2
        ? (this.mainWindow?.innerHeight || 800)
        : 1;
    const deltaX = Number(event.deltaX) * unit;
    const deltaY = Number(event.deltaY) * unit;
    if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) return null;
    if (deltaX === 0 && deltaY === 0) return null;
    return { deltaX, deltaY };
  }

  isMonacoInputElement(element) {
    return !!this.getMonacoRoot(element);
  }

  getMonacoRoot(element) {
    return element?.closest?.(".monaco-editor") || null;
  }

  getMonacoEditorIndex(monacoRoot) {
    const roots = Array.from(monacoRoot?.ownerDocument?.querySelectorAll?.(".monaco-editor") || []);
    const index = roots.indexOf(monacoRoot);
    return index >= 0 ? index : 0;
  }

  scheduleMonacoSetValueRecord(element, delay = 500) {
    const monacoRoot = this.getMonacoRoot(element);
    if (!monacoRoot) return;

    clearTimeout(this.timer);
    this.pendingTextInputElement = monacoRoot;
    this.timer = setTimeout(async () => {
      this.timer = null;
      if (this.pendingTextInputElement === monacoRoot) {
        this.pendingTextInputElement = null;
      }
      if (!this.isRecording) return;

      const snapshot = await this.requestMonacoValueSnapshot(monacoRoot);
      if (!snapshot?.ok || typeof snapshot.value !== "string") {
        console.warn("[Recorder] Unable to read Monaco value", snapshot?.error || snapshot);
        return;
      }

      if (this.lastMonacoValues.get(monacoRoot) === snapshot.value) return;
      this.lastMonacoValues.set(monacoRoot, snapshot.value);

      const sourcePath = this.domParserService.getOpenSourcePath(monacoRoot, this.mainWindow);
      this.currentHoveredElement = monacoRoot;
      this.dispatchAction("monacoSetValue", monacoRoot, null, {
        inputText: snapshot.value,
        preParsedSourcePath: sourcePath,
        monaco: {
          editorIndex: snapshot.editorIndex,
          modelIndex: snapshot.modelIndex,
          modelUri: snapshot.modelUri || ""
        }
      });
    }, delay);
  }

  requestMonacoValueSnapshot(monacoRoot) {
    const targetWindow = monacoRoot?.ownerDocument?.defaultView || this.mainWindow;
    if (!targetWindow?.postMessage) {
      return Promise.resolve({ ok: false, error: "Window is not available" });
    }

    const requestId = `monaco_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const editorIndex = this.getMonacoEditorIndex(monacoRoot);

    return new Promise(resolve => {
      let settled = false;
      const cleanup = () => {
        settled = true;
        targetWindow.removeEventListener("message", onMessage);
      };
      const onMessage = (event) => {
        if (event.source !== targetWindow) return;
        const data = event.data;
        if (data?.source !== "RECORDER_PAGE_HOOK" || data.type !== "RECORDER_MONACO_VALUE") return;
        if (data.requestId !== requestId) return;
        cleanup();
        resolve(data.monacoValue || { ok: false, error: "Missing Monaco response" });
      };

      targetWindow.addEventListener("message", onMessage);
      targetWindow.postMessage({
        source: "RECORDER_CONTENT_SCRIPT",
        type: "RECORDER_MONACO_GET_VALUE",
        requestId,
        editorIndex,
        modelIndex: editorIndex
      }, "*");

      setTimeout(() => {
        if (settled) return;
        cleanup();
        resolve({ ok: false, error: "Timed out waiting for Monaco value" });
      }, 500);
    });
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
    return this.isCanvasElement(element) || !!element?.closest?.(".gjs-layer-move, [data-toggle-move]");
  }

  getDragTargetElement(element) {
    return element?.closest?.(".gjs-layer, .gjs-layer-item, [data-layer-id], [data-gjs-type]") || element;
  }

  getDropTargetElement(event) {
    return this.getDragTargetElement(event?.target);
  }

  getClosestIonContent(element) {
    let current = element;
    while (current) {
      const ionContent = current.closest?.("ion-content");
      if (ionContent) return ionContent;
      const root = current.getRootNode?.();
      current = root?.host || null;
    }
    return null;
  }

  resetMouseDragState() {
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.dragSource = null;
    this.canvasDragPath = [];
    this.mouseDownFlag = false;
    this.dragStepFlag = 0;
  }

  snapshotInitialInputValues() {
    try {
      this.initialInputValues = new WeakMap();
      this.preEditSourcePaths = new WeakMap();
      this.lastUserTypedAt = new WeakMap();
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
    const lastUserEditAt = Number(this.lastUserTypedAt.get(element));
    if (!Number.isFinite(lastUserEditAt) || Date.now() - lastUserEditAt > 2000) return false;

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
    this.pendingTextInputElement = element;
    this.debugInputTarget("scheduleTextInputRecord:set-timer", element, {
      delay,
      value: this.getInputValue(element)
    });
    this.timer = setTimeout(() => {
      this.timer = null;
      if (this.pendingTextInputElement === element) {
        this.pendingTextInputElement = null;
      }
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
      this.userEditedInputs.delete(element);
      this.lastUserTypedAt.delete(element);
      this.preEditSourcePaths.delete(element);
    }, delay);
  }

  flushPendingTextInputRecord(element) {
    if (!element || this.pendingTextInputElement !== element) return;

    clearTimeout(this.timer);
    this.timer = null;
    this.pendingTextInputElement = null;
    if (!this.isRecording || this.composingInputs.has(element) || !this.shouldRecordTextInputEvent(element)) return;

    this.currentHoveredElement = element;
    const preParsedSourcePath = this.preEditSourcePaths.get(element) || null;
    this.dispatchAction("input", element, null, {
      inputText: this.getInputValue(element),
      preParsedSourcePath
    });
    this.userEditedInputs.delete(element);
    this.lastUserTypedAt.delete(element);
    this.preEditSourcePaths.delete(element);
  }

  getEnterShortcut(e) {
    const modifiers = [];
    if (e.ctrlKey) modifiers.push("Control");
    if (e.altKey) modifiers.push("Alt");
    if (e.metaKey) modifiers.push("Meta");
    if (e.shiftKey) modifiers.push("Shift");
    return [...modifiers, "Enter"].join("+");
  }

  isTextEditingKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return false;
    return e.key?.length === 1 || ["Backspace", "Delete"].includes(e.key);
  }

  isDirectUserInputType(inputType) {
    return [
      "insertText",
      "insertLineBreak",
      "insertParagraph",
      "insertCompositionText",
      "insertFromComposition",
      "insertFromPaste",
      "insertFromPasteAsQuotation",
      "insertFromDrop",
      "insertFromYank",
      "deleteContentBackward",
      "deleteContentForward",
      "deleteByCut",
      "historyUndo",
      "historyRedo"
    ].includes(String(inputType || ""));
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

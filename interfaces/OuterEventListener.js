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

    // GUI 狀態控制
    this.isRecording = false;
  }

  init() {
    if (!this.mainWindow || !this.mainDocument) {
      console.warn('mainWindow 不存在，跳過 OuterEventListener.init()');
      return;
    }
    
    this.mainDocument.addEventListener("click", this.clickHandler.bind(this), true);
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
        break;
      case 'STOP_RECORDING':
        this.isRecording = false;
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
    if (extraData.inputText) action.setInputText(extraData.inputText);
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
    if (!this.isRecording) return;
    const tag = e.target.tagName.toLowerCase();
    const type = e.target.getAttribute("type");

    const isTextInput =
      (tag === "input" && (!type || ["text", "search", "email", "password", "number"].includes(type))) ||
      tag === "textarea" ||
      e.target.isContentEditable;

    if (!isTextInput) return; 

    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.currentHoveredElement = e.target;
      this.dispatchAction("input", this.currentHoveredElement, null, {
        inputText: e.target.value || e.target.innerText
      });
    }, 500);
  }

  changeHandler(e) {
    if (!this.isRecording || !e.isTrusted) return;
    const tag = e.target.tagName;
    const type = e.target.type;

    const isSelect = tag === "SELECT";
    const isCheckbox = tag === "INPUT" && type === "checkbox";

    if (!isSelect && !isCheckbox) return;

    const action_type = isSelect ? 'change' : 'checkBox';
    this.dispatchAction(action_type, e.target);
  }

  keydownHandler(e) {
    if (!this.isRecording) return;
    if (e.key === 'Backspace') {
      this.currentHoveredElement = e.target;
      this.dispatchAction("keyboard", this.currentHoveredElement, null, {
        keyboard: e.key
      });
    }
  }

  dblClickHandler(e) {
    if (!this.isRecording) return;
    this.currentHoveredElement = e.target;
    this.dispatchAction("dbclick", this.currentHoveredElement);
  }

  dragStartHandler(e) {
    if (!this.isRecording) return;
    const target = e.target;
    if (!target) return;

    if (target.getAttribute("draggable") === "true") {
      // 僅向上通報拖拉起始事件，廣播工作交由 MainApp 負責
      this.dispatchAction("dragANDdrop", target, null, { isDragStart: true });
    }
  }

  clickHandler(e) {
    if (!this.isRecording) return;
    if (e.target.tagName === "LABEL" || e.target.tagName === "SELECT") return;
    
    let clickable = e.target;
    if (e.target.tagName === "INPUT") {
      const label = e.target.parentElement?.querySelector(`label[for="${e.target.id}"]`);
      clickable = label || e.target.closest(`button, a, [role="button"], [onclick], i, svg`) || e.target;
    } else {
      clickable = e.target.closest(`button, a, [role="button"], [onclick], i, svg`) || e.target;
    }

    this.currentHoveredElement = clickable;
    this.dispatchAction("click", this.currentHoveredElement);
  }
}
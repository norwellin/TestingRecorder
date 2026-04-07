// iframe 內部事件監聽器，負責處理 iframe 內部事件 (已重構解耦版)
import { DOMElement } from "../entities/DOMElement";
import { ActionInterpreter } from '../usecases/ActionInterpreter.js';

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

    // 拖曳 (drag) 判定的相對變數
    this.dragStart = { x: 0, y: 0 };
    this.isDragging = false;
    this.DRAG_THRESHOLD = 5; // 移動多少判斷為是 drag
    this.dragSource = null;
    this.mouseDownFlag = false;
    this.dragStepFlag = 0;

    // GUI 狀態控制
    this.isRecording = false;
  }

  init() {
    if (!this.iframeWindow || !this.iframeDocument) {
      console.warn('iframe 不存在，跳過 IframeEventListener.init()');
      return;
    }
    
    this.iframeDocument.addEventListener('mousemove', this.mousemoveHandler.bind(this));
    this.iframeDocument.addEventListener('mousedown', this.mousedownHandler.bind(this));
    this.iframeDocument.addEventListener('mouseup', this.mouseupHandler.bind(this));
    this.iframeDocument.addEventListener('input', this.inputHandler.bind(this));

    this.iframeWindow.addEventListener('drop', this.dropHandler.bind(this));
    this.iframeDocument.addEventListener("click", this.clickHandler.bind(this), true);

    // 必須 preventDefault 才能觸發 drop
    this.iframeDocument.addEventListener("dragover", (e) => {
      if (this.isRecording) e.preventDefault(); 
    });

    // 處理外部控制錄製開關的訊息
    this.iframeWindow.addEventListener('message', this.messageHandler.bind(this));
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

  // 2. 建立統一的派發 Action 方法
  dispatchAction(action_type, sourceElement, targetElement = null, extraData = {}) {
    const currentEventElement = sourceElement || targetElement;
    if (currentEventElement) {
      this.DOMElement.setElementData(currentEventElement, action_type);
    }

    // 這裡的 window 參數動態帶入 this.contextId (例如 iframe_1, iframe_2)
    const action = ActionInterpreter.interpretDrag(
      action_type, 
      sourceElement, 
      targetElement, 
      this.contextId, 
      targetElement ? this.contextId : "" 
    );

    // 寫入額外資料
    if (extraData.inputText) action.setInputText(extraData.inputText);
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
    if (!this.isRecording) return;
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
    clearTimeout(this.inputTimer);
    this.inputTimer = setTimeout(() => {
      this.currentHoveredElement = e.target;
      this.dispatchAction("input", this.currentHoveredElement, null, {
        inputText: e.target.value || e.target.innerText
      });
    }, this.INPUT_DELAY);
  }

  mouseupHandler(e) {
    if (!this.isRecording) return;
// 增加一個 Debug 觀察觸發次數
    console.log("[Debug IframeListener] mouseup 觸發, isDragging:", this.isDragging);
    if (this.isDragging) {
      this.isDragging = false;
      this.dragStart = { x: 0, y: 0 };
      this.currentHoveredElement = e.target;
      
      ///新
      this.mouseDownFlag = false;
      this.dragStepFlag = 0;
      // 模擬拖曳放開 (drop)
      this.dispatchAction("dragANDdrop", null, this.currentHoveredElement, { isDrop: true });
    } else {
      this.clickFlag += 1;
      if (this.clickFlag === 1) {
        this.clickTimeOut = setTimeout(() => {
          this.clickFlag = 0;
          this.isDragging = false;
          this.dragStart = { x: 0, y: 0 };

          this.dispatchAction("click", e.target);
        }, this.DOUBLE_CLICK_DELAY);

      } else if (this.clickFlag === 2) {
        clearTimeout(this.clickTimeOut);
        this.clickFlag = 0;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };

        this.dispatchAction("dbclick", e.target);
      }
    }
    this.dragStepFlag = 0;

  }

  mousedownHandler(e) {
    if (!this.isRecording) return;
    this.dragStart = { x: e.clientX, y: e.clientY };
    this.isDragging = false;
    this.dragSource = e.target;
    this.mouseDownFlag = true;
    this.dragStepFlag = 1;
  }

  mousemoveHandler(e) {
    if (!this.isRecording) return;
    this.currentHoveredElement = e.target;
    
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
}
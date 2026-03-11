//note: JS 是 by reference傳遞 (不是by value)
// iframe 內部事件監聽器，負責處理 iframe 內部事件
import { DOMElement } from "../entities/DOMElement";
import { PlaywrightCommand } from '../entities/PlaywrightCommand.js';
import { PlaywrightCodeGenerator } from '../usecases/PlaywrightCodeGenerator';
import { ActionInterpreter } from '../usecases/ActionInterpreter.js';
import { UserAction } from '../entities/UserAction.js';

export class IframeEventListener {
  constructor(iframeWindow, domParserService, command, userActionDB) {
    this.iframeWindow = iframeWindow;
    this.domParserService = domParserService;
    this.iframeDocument = iframeWindow.document;
    this.useractionDB = userActionDB;
    this.playwrightCommand = command;
    this.generator = new PlaywrightCodeGenerator(iframeWindow, this.useractionDB);
    this.DOMElement = new DOMElement();
    //this.dragDOMElement = new DOMElement();//用來記錄drag and drop source的來源
    //
    this.target = null;
    this.source = null; //存放的是drag and drop的title
    this.currentHoveredElement = null;
    this.rightNowAction = -1;

    this.clickFlag = 0;
    this.clickTimeOut = null;
    this.DOUBLE_CLICK_DELAY = 250;

    this.inputTimer = 0;
    this.INPUT_DELAY = 500;

    //drag realative variable
    this.dragStart = { x: 0, y: 0 };
    this.isDragging = false;
    this.DRAG_THRESHOLD = 5; //移動多少判斷為是drag
    this.dragSource;
    this.mouseDownFlag = false;

    this.windowDragFlag = false;


    this.dragStepFlag = 0;

  }

  init() {
    this.iframeDocument.addEventListener('mousemove', this.mousemoveHandler.bind(this));
    this.iframeDocument.addEventListener('mousedown', this.mousedownHandler.bind(this));

    this.iframeDocument.addEventListener('mouseup', this.mouseupHandler.bind(this));
    this.iframeDocument.addEventListener('input', this.inputHandler.bind(this));


    this.iframeWindow.addEventListener('drop', this.dropHandler.bind(this));


    this.iframeWindow.addEventListener('message', this.messageHandler.bind(this));


  }
  messageHandler(e) {
    const msg = e.data;
    console.log('msg:', msg);
    switch (msg.type) {
      case 'window_drag_start':
        console.log('iframe 收到 window 傳來的 dragstart');
        this.windowDragFlag = true;
        break;
      case 'actionPosChanged':
        console.log("iframe receive rightNowAction change request~");
        this.rightNowAction = msg.actionPos;
        break;
    }
  }
  dropHandler(e) {
    //e.preventDefault();
    this.currentHoveredElement = e.target;
    if (this.currentHoveredElement && this.windowDragFlag) {
      //console.log("in iframe drop target: ",e.target);
      console.log("in iframe drop: ", this.currentHoveredElement);
      console.log("drag inside iframe (drop)");
      console.log("iframe - rightNowAction: ", this.rightNowAction);
      //在這裡處理轉換成Playwright Code Logic
      const tempAction = this.useractionDB[this.rightNowAction];
      console.log("tempAction inside iframeWindow", tempAction);
      tempAction.setTargetWindow("iframe");
      console.log("inside drop action db: ", this.useractionDB);
      tempAction.setTargetElement(this.currentHoveredElement);
      console.log("tempAction: ", tempAction);
      this.generator.generate(tempAction, this.playwrightCommand, this.rightNowAction);
      console.log('Playwright Command:', this.playwrightCommand.codeGetter());
      //回復狀態
      this.currentHoveredElement = null;

      // 傳送Playwright Code到背景頁面
      const generatedCode = this.playwrightCommand.codeGetter();
      console.log("Playwright Command:", generatedCode);
      chrome.runtime.sendMessage({
        type: "display_code",
        code: generatedCode
      });
      chrome.runtime.sendMessage({
        type: "display_useraction",
        action: this.useractionDB
      });
      //update share variable to chrome storage
      chrome.storage.local.set({ actionPos: this.rightNowAction });
      this.windowDragFlag = false;
    }
  }
  inputHandler(e) {
    if (!e.isTrusted) return;
    clearTimeout(this.inputTimer);
    this.inputTimer = setTimeout(() => {
      console.log("使用者輸入完成：", e.target.value || e.target.innerText);
      //新的串接方法 setting basic variable
      this.rightNowAction = this.rightNowAction + 1;
      console.log("iframe - rightNowAction(input): ", this.rightNowAction);
      const action_type = 'input';
      this.currentHoveredElement = e.target;
      this.DOMElement.setElementData(this.currentHoveredElement, action_type);
      console.log(this.DOMElement.getAllElements());

      //在這裡處理轉換成Playwright Code Logic
      this.useractionDB.push(ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements().event, null, "iframe", ""));
      this.generator.generate(this.useractionDB[this.rightNowAction], this.playwrightCommand, this.rightNowAction);
      console.log('Playwright Command:', this.playwrightCommand.codeGetter());
      console.log('useractionDB: ', this.useractionDB);
      // 傳送Playwright Code到背景頁面
      const generatedCode = this.playwrightCommand.codeGetter();
      console.log("Playwright Command:", generatedCode);
      chrome.runtime.sendMessage({
        type: "display_code",
        code: generatedCode
      });
      chrome.runtime.sendMessage({
          type: "display_useraction",
          action: this.useractionDB
        });
      //每次變更rightnowAction都要給對應的class傳訊息
      window.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");
    }, this.INPUT_DELAY); // 0.5 秒內沒再輸入視為完成
  }
  mouseupHandler(e) {
    //console.log("drag flag - up 入", this.dragStepFlag);
    if (this.isDragging) {
      //console.log("inside mouseup -> drop");
      this.isDragging = false;
      this.dragStart = { x: 0, y: 0 };
      const action_type = "dragANDdrop";
      //this.rightNowAction = this.rightNowAction + 1;
      //this.DOMElement.setElementData(e.target, action_type);
      //this.dragDOMElement.setElementData(this.dragSource, action_type);
      //push into database
      const tempAction = this.useractionDB[this.rightNowAction];
      tempAction.setTargetWindow("iframe");
      //console.log("inside drop action db: ", this.useractionDB);
      tempAction.setTargetElement(this.currentHoveredElement);
      //console.log("tempAction: ", tempAction);
      this.generator.generate(tempAction, this.playwrightCommand, this.rightNowAction);
      //console.log('Playwright Command:', this.playwrightCommand.codeGetter());
      //回復狀態
      this.currentHoveredElement = null;

      // 傳送Playwright Code到背景頁面
      const generatedCode = this.playwrightCommand.codeGetter();
      console.log("Playwright Command:", generatedCode);
      chrome.runtime.sendMessage({
        type: "display_code",
        code: generatedCode
      });
      chrome.runtime.sendMessage({
          type: "display_useraction",
          action: this.useractionDB
        });

      //每次變更rightnowAction都要給對應的class傳訊息
      window.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");

    }
    else {
      this.clickFlag += 1;
      //console.log('iframe mouseup:', e.target);
      if (this.clickFlag == 1) {
        //testing for sibling
        const el = e.target;
        const tag = el.tagName;

        const sameTagSiblings = Array.from(el.parentElement.children)
          .filter(child => child.tagName === tag);

        console.log(`🔹 同樣標籤 <${tag.toLowerCase()}> 的兄弟節點：`, sameTagSiblings);
        /////////////////////
        /////印出所有
        const siblings = Array.from(el.parentElement.children);

        console.log("🧩 包含自己的所有兄弟節點：");
        siblings.forEach((node, i) => {
          console.log(`${i}: <${node.tagName.toLowerCase()}>`, node);
        });
        ///////////////////////
        this.clickTimeOut = setTimeout(() => {
          //console.log("Single click detected");
          this.clickFlag = 0;

          //rerset drag and drop variable
          this.isDragging = false;
          this.dragStart = { x: 0, y: 0 };

          const action_type = "click";
          this.rightNowAction = this.rightNowAction + 1;
          this.DOMElement.setElementData(e.target, 'click');

          //push into database
          this.useractionDB.push(ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements().event, null, "iframe", null));
          this.generator.generate(this.useractionDB[this.rightNowAction], this.playwrightCommand, this.rightNowAction);
          //console.log('Playwright Command:', this.playwrightCommand.codeGetter());
          console.log('useractionDB: ', this.useractionDB);
          // 傳送Playwright Code到背景頁面
          const generatedCode = this.playwrightCommand.codeGetter();
          console.log("Playwright Command:", generatedCode);
          chrome.runtime.sendMessage({
            type: "display_code",
            code: generatedCode
          });
          chrome.runtime.sendMessage({
          type: "display_useraction",
          action: this.useractionDB
        });
          //每次變更rightnowAction都要給對應的class傳訊息
          window.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");
        }, this.DOUBLE_CLICK_DELAY);

      }
      else if (this.clickFlag == 2) {
        clearTimeout(this.clickTimeOut);
        console.log("Double Click Detected!");
        this.clickFlag = 0;
        //reset drag and drop variable
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        const action_type = "dbclick";
        this.rightNowAction = this.rightNowAction + 1;
        this.DOMElement.setElementData(e.target, 'dbclick');

        //push into database
        this.useractionDB.push(ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements().event, null, "iframe", null));
        this.generator.generate(this.useractionDB[this.rightNowAction], this.playwrightCommand, this.rightNowAction);
        console.log('Playwright Command:', this.playwrightCommand.codeGetter());
        console.log('useractionDB: ', this.useractionDB);
        // 傳送Playwright Code到背景頁面
        const generatedCode = this.playwrightCommand.codeGetter();
        console.log("Playwright Command:", generatedCode);
        chrome.runtime.sendMessage({
          type: "display_code",
          code: generatedCode
        });
        chrome.runtime.sendMessage({
          type: "display_useraction",
          action: this.useractionDB
        });
        //每次變更rightnowAction都要給對應的class傳訊息
        window.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");

      }
    }
    this.dragStepFlag = 0;
    console.log("drag flag - up 出", this.dragStepFlag);
  }
  mousedownHandler(e) {
    //console.log("drag flag - down 入", this.dragStepFlag);
    this.dragStart = { x: e.clientX, y: e.clientY };
    this.isDragging = false;
    this.dragSource = e.target;
    //console.log("mousedown detected:", e.target);
    this.mouseDownFlag = true;
    this.dragStepFlag = 1;
    //this.clickFlag = true;
    //console.log("drag flag - down 出", this.dragStepFlag);
  }
  mousemoveHandler(e) {
    this.currentHoveredElement = e.target;
    //console.log("drag flag - move 入", this.dragStepFlag);
    //console.log("in mouseove: ", e.target);
    if (!this.dragStart) return;
    if (this.dragStepFlag != 1) return;
    const dx = e.clientX - this.dragStart.x;
    const dy = e.clientY - this.dragStart.y;

    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance >= this.DRAG_THRESHOLD && this.mouseDownFlag) {
      this.isDragging = true;
      this.dragStepFlag = 2;
      const action_type = "dragANDdrop";
      console.log("iframe - Drgging Start!");
      this.rightNowAction = this.rightNowAction + 1;
      this.DOMElement.setElementData(this.dragSource, "drag");
      this.useractionDB.push(ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements().event, null, "iframe", null));
      this.mouseDownFlag = false;

    }
    //console.log("drag flag - move 出", this.dragStepFlag);
  }
}

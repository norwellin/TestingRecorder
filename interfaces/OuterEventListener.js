// 監聽外部 drag-drop 事件
import { DOMElement } from "../entities/DOMElement";
import { UserAction } from "../entities/UserAction";
import { PlaywrightCommand } from '../entities/PlaywrightCommand.js';
import { PlaywrightCodeGenerator } from '../usecases/PlaywrightCodeGenerator';
import { ActionInterpreter } from '../usecases/ActionInterpreter.js';

// ===============================
// 🔧 MonkeyPatch addEventListener
// ===============================

export class OuterEventListener {
  constructor(iframeWindow, domParserService, command, userActionDB) {
    this.iframeWindow = iframeWindow;
    this.domParserService = domParserService;
    this.dragSources = document.querySelectorAll('[draggable="true"]');
    this.DOMElement = new DOMElement();
    this.useractionDB = userActionDB;
    this.playwrightCommand = command;
    this.generator = new PlaywrightCodeGenerator(iframeWindow, this.useractionDB);
    //
    this.target = null;  //終點
    this.source = null; //起點 // store CSS path
    this.currentHoveredElement = null;
    this.rightNowAction = -1;
    this.typedText = "";

    this.timer;

    //GUI 偵測是否record
    this.isRecording = false;

  }

  init() {

    document.addEventListener("click", this.clickHandler.bind(this), true);
    window.addEventListener("dragstart", this.dragStartHandler.bind(this));
    document.addEventListener('dblclick', this.dblClickHandler.bind(this), true);
    document.addEventListener('keydown', this.keydownHandler.bind(this));
    document.addEventListener("change", this.changeHandler.bind(this), true);
    document.addEventListener("input", this.inputHandler.bind(this), true);

    //message handler
    window.addEventListener('message', this.messageHandler.bind(this));


  }
  messageHandler(e) {
    const msg = e.data;
    console.log("window get msg: ", msg);

    switch (msg.type) {
      case 'actionPosChanged':
        this.rightNowAction = msg.actionPos;
        break;
      case 'START_RECORDING':
        console.log("receive start button");
        this.isRecording = true;
        break;
      // 可以加入更多 case
      case 'STOP_RECORDING':
        console.log("receive stop button");
        this.isRecording = false;
        break;
    }
  }
  inputHandler(e){
    if(!this.isRecording) return;
    const tag = e.target.tagName.toLowerCase();
  const type = e.target.getAttribute("type");

  // ✅ 僅允許文字輸入類型（input[type=text]、textarea、contenteditable）
  const isTextInput =
    (tag === "input" && (!type || type === "text" || type === "search" || type === "email" || type === "password" || type === "number")) ||
    tag === "textarea" ||
    e.target.isContentEditable;

  if (!isTextInput) return; // ❌ 非文字輸入則不處理

  // 🕒 Debounce：等待使用者停止輸入 0.5 秒後再觸發
  clearTimeout(this.timer);
  this.timer = setTimeout(() => {
    console.log("📝 使用者輸入完成：", e.target.value || e.target.innerText);

    // 🧩 基本變數設定
    this.rightNowAction = this.rightNowAction + 1;
    console.log("window - rightNowAction(input): ", this.rightNowAction);

    const action_type = "input";
    this.currentHoveredElement = e.target;
    this.DOMElement.setElementData(this.currentHoveredElement, action_type);
    console.log(this.DOMElement.getAllElements());

    // 🎯 轉換成 Playwright Code
    this.useractionDB.push(
      ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements().event, null, "page", "")
    );

    this.generator.generate(
      this.useractionDB[this.rightNowAction],
      this.playwrightCommand,
      this.rightNowAction
    );

    const generatedCode = this.playwrightCommand.codeGetter();
    console.log("Playwright Command:", generatedCode);
    console.log("useractionDB:", this.useractionDB);

    // 🚀 傳送 Playwright Code 到背景頁面
    chrome.runtime.sendMessage({
      type: "display_code",
      code: generatedCode,
    });
            chrome.runtime.sendMessage({
          type: "display_useraction",
          action: this.useractionDB
        });
    // 🔄 通知 iframe action 位置變更
    this.iframeWindow.postMessage(
      { type: "actionPosChanged", actionPos: this.rightNowAction },
      "*"
    );
  }, 500);
  }
  changeHandler(e){
    if(!this.isRecording) return;
      // ✅ 只接受「使用者真實操作」
  if (!e.isTrusted) return;
  const tag = e.target.tagName;
  const type = e.target.type;

  // 只處理 SELECT 或 CHECKBOX
  const isSelect = tag === "SELECT";
  const isCheckbox = tag === "INPUT" && type === "checkbox";

  if (!isSelect || isCheckbox) return;
  let action_type;
      if(isSelect){
          action_type = 'change';
      //this.currentHoveredElement = e.target;
      let select = e.target.closest('select');
      console.log("inside change!");
    
        console.log("inside change 1!");
        let domTest = this.domParserService.getOpenSourcePath(e.target, "page");
        console.log("checked test: ",domTest);
        this.rightNowAction = this.rightNowAction + 1;
  console.log("window - rightNowAction(change): ", this.rightNowAction);
      this.DOMElement.setElementData(e.target, 'change');
      console.log(this.DOMElement.getAllElements());
      }
      else if(isCheckbox){
      action_type = 'checkBox';
      //this.currentHoveredElement = e.target;
      //let select = e.target.closest('select');
      console.log("inside check box!");
    
        console.log("inside check box 1!");
        let domTest = this.domParserService.getOpenSourcePath(e.target, "page");
        console.log("checked test: ",domTest);
        this.rightNowAction = this.rightNowAction + 1;
  console.log("window - rightNowAction(check box): ", this.rightNowAction);
      this.DOMElement.setElementData(e.target, 'checkBox');
      console.log(this.DOMElement.getAllElements());
      }

      //在這裡處理轉換成Playwright Code Logic
      this.useractionDB.push(ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements().event, null, "page", ""));
   //this.useractionDB[this.rightNowAction].setSelectedValue = select.value;
      
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
      this.iframeWindow.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");

  // 你可以把 pwCode 傳回後端 / UI 顯示
  }
  keydownHandler(e){
    if(!this.isRecording) return;
    if (e.key === 'Backspace') {
    console.log('Backspace key pressed!');
    //新的串接方法 setting basic variable
      this.rightNowAction = this.rightNowAction + 1;
      console.log("window - rightNowAction(keyboard: ", this.rightNowAction);
      const action_type = 'keyboard';
      this.currentHoveredElement = e.target;
      this.DOMElement.setElementData(this.currentHoveredElement, action_type);
      //for keyboard action part we have to set element key
      this.DOMElement.setKeyElement(e.key);
      console.log(this.DOMElement.getAllElements());

      //在這裡處理轉換成Playwright Code Logic
      this.useractionDB.push(ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements().event, null, "page", ""));
      //this line only for keyboard action setting
      this.useractionDB[this.rightNowAction].setKeyboard(e.key);
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
      this.iframeWindow.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");
  }
  }
  dblClickHandler(e){
    if(!this.isRecording) return;
    console.log("double click detected!");
      //新的串接方法 setting basic variable
      this.rightNowAction = this.rightNowAction + 1;
      console.log("window - rightNowAction(dbclick): ", this.rightNowAction);
      const action_type = 'dbclick';
      this.currentHoveredElement = e.target;
      this.DOMElement.setElementData(this.currentHoveredElement, action_type);
      console.log(this.DOMElement.getAllElements());

      //在這裡處理轉換成Playwright Code Logic
      this.useractionDB.push(ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements().event, null, "page", ""));
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
      this.iframeWindow.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");
  }
  dragStartHandler(e){
    //重新改寫 (不用post messenge，因為JS是傳ref的)
      if(!this.isRecording) return;
    try {
        //setting basic variable
        this.rightNowAction = this.rightNowAction + 1;
        console.log("window - rightNowAction (drag stat): ", this.rightNowAction);
        const target = e.target;
        const action_type = "dragANDdrop";
        if (target.getAttribute("draggable") === "true") {
          console.log("拖拉開始:", target);
          this.DOMElement.setElementData(target, "drag");
          //在這裡處理轉換成Playwright Code Logic
          this.useractionDB.push(ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements().event, null, "page", ""));

          this.iframeWindow.postMessage({ type: "window_drag_start", nowAction: this.rightNowAction }, "*");
          //this.source = target;

          //紀錄drag 的來源到chrome storage
          chrome.storage.local.set({ sourceOfDD: "window" });
          //每次變更rightnowAction都要給對應的class傳訊息
          this.iframeWindow.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");
        }

      } catch (error) {

      }
  }
  clickHandler(e){
    if(!this.isRecording) return;
            if (e.target.tagName === "LABEL") return;
        if (e.target.tagName === "SELECT") return;
         // 如果點擊到 input
  const target = e.target;
  let clickable;
        if (target.tagName === "INPUT") {
    const parent = target.parentElement;

    // 1️⃣ 找同 parent 下的 label，且 label 的 for 指向這個 input
    const label = parent?.querySelector(`label[for="${target.id}"]`);

    // 2️⃣ 如果找到就把 target 改成 label
    if (label) {
      clickable = label;
    }
    else{
      clickable = e.target.closest(`
  button,
  a,
  [role="button"],
  [onclick],
  i,           /* \u5305\u542B <i> */
  svg           /* \u6216\u76F4\u63A5 svg */
`) || e.target;
    }
  }
        else{
        console.log("Here is a click event! e: ", e.target);
      clickable = e.target.closest(`
  button,
  a,
  [role="button"],
  [onclick],
  i,           
  svg           
`) || e.target;
        }
        this.rightNowAction = this.rightNowAction + 1;
        console.log("window - rightNowAction(click): ", this.rightNowAction);
        const action_type = "click";
        this.currentHoveredElement = clickable;
        this.DOMElement.setElementData(this.currentHoveredElement, "click");
        console.log(this.DOMElement.getAllElements());
        this.useractionDB.push(ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements().event, null, "page", ""));
        this.generator.generate(this.useractionDB[this.rightNowAction], this.playwrightCommand, this.rightNowAction);
        console.log("Playwright Command:", this.playwrightCommand.codeGetter());
        console.log("useractionDB: ", this.useractionDB);
        const generatedCode = this.playwrightCommand.codeGetter();
        console.log("Playwright Command:", generatedCode);
        chrome.runtime.sendMessage({
          type: "display_code",
          code: generatedCode
        });
        console.log("CLICK!!!");
        chrome.runtime.sendMessage({
          type: "display_useraction",
          action: this.useractionDB
        });
        this.iframeWindow.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");
  }
  AfterAllSteps() { //所有監聽後都要做的事情 (同步到iframe與chrome storage)
    // 傳送Playwright Code到背景頁面
    const generatedCode = this.playwrightCommand.codeGetter();
    console.log("Playwright Command:", generatedCode);
    chrome.runtime.sendMessage({
      type: "display_code",
      code: generatedCode
    });
    //每次變更rightnowAction都要給對應的class傳訊息
    this.iframeWindow.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");
    this.iframeWindow.postMessage({ type: "typedTextChanged", typedText: this.typedText }, "*");
  }
  
}

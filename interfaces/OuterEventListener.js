// 監聽外部 drag-drop 事件
import { DOMElement } from "../entities/DOMElement";
import { UserAction } from "../entities/UserAction";
import { PlaywrightCommand } from '../entities/PlaywrightCommand.js';
import { PlaywrightCodeGenerator } from '../usecases/PlaywrightCodeGenerator';
import { ActionInterpreter } from '../usecases/ActionInterpreter.js';

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
  }

  init() {
    /*this.dragSources.forEach((dragSource) => {
      dragSource.addEventListener('dragstart', (e) => {
        console.log('拖曳開始:', dragSource);

        this.DOMElement.setElementData(e.target);
        this.iframeWindow.postMessage(this.DOMElement.getAllElements('drag'), '*');
        this.source = e.target.getAttribute('title');
      });

      dragSource.addEventListener('dragend', () => {
        console.log('拖曳end:');
      });
    });
*/
/*
    document.addEventListener("mousemove", (e)=>{
      console.log("outer mousemove: ", e.target);
    });
    */
    document.addEventListener("click", (e) => {
      console.log("Here is a click event! e: ", e.target);

      //新的串接方法 setting basic variable
      this.rightNowAction = this.rightNowAction + 1;
      console.log("window - rightNowAction(click): ", this.rightNowAction);
      const action_type = 'click';
      this.currentHoveredElement = e.target;
      this.DOMElement.setElementData(this.currentHoveredElement, 'click');
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
    },true);

    document.addEventListener("drop", (e) => {
      //identify the source

      chrome.storage.local.get(["sourceOfDD"], (result) => {
        const sourceDD = result.sourceOfDD;
      });
      try {
        //1. from iframe
        if (sourceDD == "iframe") {
          console.log("drag & drop: iframe -> main");
        }
        //2. from mainwindow
        else if (sourceDD == "window") {
          console.log("drag & drop: main -> main");
        }
      } catch (error) {

      }

    });

    window.addEventListener("dragstart", (e) => {

      //重新改寫 (不用post messenge，因為JS是傳ref的)
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
    });
    document.addEventListener('dblclick', (e) => {
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
      //每次變更rightnowAction都要給對應的class傳訊息
      this.iframeWindow.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");

    },true);
    document.addEventListener('keydown', (e) => {
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
});


//下拉式選單偵測
document.addEventListener("change", (e) => {
  if (e.target.tagName !== "SELECT") return;
  //新的串接方法 setting basic variable
 
      const action_type = 'change';
      //this.currentHoveredElement = e.target;
      let select = e.target.closest('select');
      console.log("inside change!");
      if(select){
        console.log("inside change 1!");
        let domTest = this.domParserService.getOpenSourcePath(e.target, "page");
        console.log("checked test: ",domTest);
        this.rightNowAction = this.rightNowAction + 1;
  console.log("window - rightNowAction(change): ", this.rightNowAction);
      this.DOMElement.setElementData(e.target, 'change');
      console.log(this.DOMElement.getAllElements());

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
}
  // 你可以把 pwCode 傳回後端 / UI 顯示
},true);

document.addEventListener("input", (e) => {
  const tag = e.target.tagName.toLowerCase();
  const type = e.target.getAttribute("type");

  // ✅ 僅允許文字輸入類型（input[type=text]、textarea、contenteditable）
  const isTextInput =
    (tag === "input" && (!type || type === "text" || type === "search" || type === "email" || type === "password")) ||
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

    // 🔄 通知 iframe action 位置變更
    this.iframeWindow.postMessage(
      { type: "actionPosChanged", actionPos: this.rightNowAction },
      "*"
    );
  }, 500);
});

/*

    document.addEventListener("input", (e) => {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        console.log("使用者輸入完成：", e.target.value || e.target.innerText);
        //新的串接方法 setting basic variable
        this.rightNowAction = this.rightNowAction + 1;
        console.log("window - rightNowAction(input): ", this.rightNowAction);
        const action_type = 'input';
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
        //每次變更rightnowAction都要給對應的class傳訊息
        this.iframeWindow.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");
      }, 500); // 0.5 秒內沒再輸入視為完成
    });
*/
    /*document.addEventListener("keydown", (e) => {  
      this.typedText = "";//先清空之前存的
      if(e.key.length === 1){
        this.typedText += e.key;
      }else if(e.key === "Backspace"){
        this.typedText.slice(0,-1); //刪除最後一個字元
      }

      //新的串接方法 setting basic variable
      this.rightNowAction = this.rightNowAction + 1;
      console.log("window - rightNowAction(keydown): ", this.rightNowAction);
      const action_type = 'keydown';
      this.currentHoveredElement = e.target;
      this.DOMElement.setElementData(this.currentHoveredElement, 'keydown');
      console.log(this.DOMElement.getAllElements());

      //在這裡處理轉換成Playwright Code Logic
      this.useractionDB.push(ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements().event, null, "page", ""));
      this.generator.generate(this.useractionDB[this.rightNowAction], this.playwrightCommand, this.rightNowAction);
      console.log('Playwright Command:', this.playwrightCommand.codeGetter());
      console.log('useractionDB: ', this.useractionDB);
      
      //最後做同步
      this.AfterAllSteps();
    });
    */
    window.addEventListener('message', (e) => {
      const msg = e.data;
      console.log("window get msg: ", msg);

      switch (msg.type) {
        case 'actionPosChanged':
          this.rightNowAction = msg.actionPos;
          break;
      }
    });

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

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
    this.generator = new PlaywrightCodeGenerator(iframeWindow);
    //
    this.target = null;  //終點
    this.source = null; //起點 // store CSS path
    this.currentHoveredElement = null;
    this.rightNowAction = -1;
    this.typedText = "";
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
    document.addEventListener("click", (e) => {
      console.log("Here is a click event! e: ",e.target);

      //新的串接方法 setting basic variable
      this.rightNowAction = this.rightNowAction + 1;
      console.log("window - rightNowAction(click): ", this.rightNowAction);
      const action_type = 'click';
      this.currentHoveredElement = e.target;
      this.DOMElement.setElementData(this.currentHoveredElement, 'click');
      console.log(this.DOMElement.getAllElements());

      //在這裡處理轉換成Playwright Code Logic
      this.useractionDB.push(ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements().event, null));
      this.generator.generate(this.useractionDB[this.rightNowAction], this.playwrightCommand);
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
    });

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

    document.addEventListener("dragstart", (e) => {

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
          this.useractionDB.push(ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements().event, null));

          this.iframeWindow.postMessage({ type: "drag_start", nowAction: this.rightNowAction }, "*");
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
      this.useractionDB.push(ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements().event, null));
      this.generator.generate(this.useractionDB[this.rightNowAction], this.playwrightCommand);
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

    });
    document.addEventListener("keydown", (e) => {  
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
      this.useractionDB.push(ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements().event, null));
      this.generator.generate(this.useractionDB[this.rightNowAction], this.playwrightCommand);
      console.log('Playwright Command:', this.playwrightCommand.codeGetter());
      console.log('useractionDB: ', this.useractionDB);
      
      //最後做同步
      this.AfterAllSteps();
    });
    this.iframeWindow.addEventListener('messenge', (e) => {
      const msg = e.data;
      console.log("window get msg: ", msg);

      switch (msg.type) {
        case 'actionPosChanged':
          this.rightNowAction = msg.actionPos;
          break;
      }
    });

  }
  AfterAllSteps(){ //所有監聽後都要做的事情 (同步到iframe與chrome storage)
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

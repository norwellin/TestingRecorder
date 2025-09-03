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
    //
    this.target = null;  //終點
    this.source = null; //起點 // store CSS path
    this.currentHoveredElement = null;
    this.rightNowAction = -1;
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
      console.log("Here is a click event!");

      //新的串接方法 setting basic variable
      this.rightNowAction = this.rightNowAction + 1;
      console.log("window - rightNowAction(click): ", this.rightNowAction);
      const action_type = 'click';
      this.currentHoveredElement = e.target;
      this.DOMElement.setElementData(this.currentHoveredElement, 'click');
      console.log(this.DOMElement.getAllElements());

      //在這裡處理轉換成Playwright Code Logic
      this.useractionDB.push(ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements().event, null));
      PlaywrightCodeGenerator.generate(this.useractionDB[this.rightNowAction], this.playwrightCommand);
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

      /*
      try {
        if (this.iframeWindow) {
          const target = e.target;
          if (target.getAttribute("draggable") === "true") {
            console.log("拖拉開始:", target);
            this.DOMElement.setElementData(target, "drag");
            this.iframeWindow.postMessage(this.DOMElement.getAllElements(), "*");
            this.source = target;

            //紀錄drag 的來源到chrome storage
            chrome.storage.local.set({ sourceOfDD: "window" });
          }
        }
        else {

        }

      } catch (err) {
        console.log("ERROR: " + err);
      }
        */
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
}

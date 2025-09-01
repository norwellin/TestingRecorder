// 監聽外部 drag-drop 事件
import { DOMElement } from "../entities/DOMElement";
import { UserAction } from "../entities/UserAction";
import { PlaywrightCommand } from '../entities/PlaywrightCommand.js';
import { PlaywrightCodeGenerator } from '../usecases/PlaywrightCodeGenerator';
import { ActionInterpreter } from '../usecases/ActionInterpreter.js';

export class OuterEventListener {
  constructor(iframeWindow, domParserService, command, userActionDB, rightNowAction) {
    this.iframeWindow = iframeWindow;
    this.domParserService = domParserService;
    this.dragSources = document.querySelectorAll('[draggable="true"]');
    this.DOMElement = new DOMElement();
    this.useractionDB = userActionDB;
    this.rightNowAction = rightNowAction;
    this.playwrightCommand = command;
    //
    this.target = null;  //終點
    this.source = null; //起點 // store CSS path
    this.currentHoveredElement = null;
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
      const action_type = 'click';
      this.currentHoveredElement = e.target;
     this.DOMElement.setElementData(this.currentHoveredElement);
      //在這裡處理轉換成Playwright Code Logic
      this.rightNowAction = this.rightNowAction + 1;
      this.useractionDB[this.rightNowAction] = ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements('click'), null);
      PlaywrightCodeGenerator.generate(this.useractionDB[this.rightNowAction], this.playwrightCommand);
      console.log('Playwright Command:', this.playwrightCommand.codeGetter());
      // 傳送Playwright Code到背景頁面
      const generatedCode = this.playwrightCommand.codeGetter();
      console.log("Playwright Command:", generatedCode);
      chrome.runtime.sendMessage({
        type: "display_code",
        code: generatedCode
      });
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
      try {
        if (this.iframeWindow) {
          const target = e.target;
          if (target.getAttribute("draggable") === "true") {
            console.log("拖拉開始:", target);
            this.DOMElement.setElementData(target);
            this.iframeWindow.postMessage(this.DOMElement.getAllElements("drag"), "*");
            this.source = target.getAttribute("title");

            //紀錄drag 的來源到chrome storage
            chrome.storage.local.set({ sourceOfDD: "window" });
          }
        }
        else {

        }

      } catch (err) {
        console.log("ERROR: " + err);
      }

    });

  }
}

//note: JS 是 by reference傳遞 (不是by value)
// iframe 內部事件監聽器，負責處理 iframe 內部事件
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
    //
    this.target = null;
    this.source = null; //存放的是drag and drop的title
    this.currentHoveredElement = null;
    this.rightNowAction = -1;
  }

  init() {
    this.iframeDocument.addEventListener('mousemove', (e) => {
      this.currentHoveredElement = e.target;
    });

   /* this.iframeDocument.addEventListener('mouseup', (e) => {
      console.log('iframe mouseup:', e.target);
    });
    */
    this.iframeWindow.addEventListener('dragover', (e) => {
      //e.preventDefault();
      console.log('拖曳滑過目標區');
    });

    this.iframeWindow.addEventListener('drop', async (e) => {
      //e.preventDefault();

      if (this.currentHoveredElement) {
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

        //update share variable to chrome storage
        chrome.storage.local.set({ actionPos: this.rightNowAction });

      }
    });
    
    this.iframeDocument.addEventListener('click', (e) => {
      console.log("偵測到click!!!!!!!!!!!!!!!");
/*
      //新的串接方法 setting basic variable
      this.rightNowAction = this.rightNowAction + 1;
      console.log("iframe - rightNowAction(click): ", this.rightNowAction);
      const action_type = 'click';
      
      this.DOMElement.setElementData(e.target, 'click');
      console.log(this.DOMElement.getAllElements());

      //在這裡處理轉換成Playwright Code Logic
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
      //每次變更rightnowAction都要給對應的class傳訊息
      this.iframeWindow.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");
    */
      });
    this.iframeWindow.addEventListener('message', (e) => {
      const msg = e.data;
      console.log('msg:', msg);
      switch (msg.type) {
        case 'drag_start':
          console.log('iframe 收到 window 傳來的 dragstart');
          break;
        case 'actionPosChanged':
          console.log("iframe receive rightNowAction change request~");
          this.rightNowAction = msg.actionPos;
          break;
      }
    });
    //用來等待存在chrome local storage的變數改變 (目前失效) 
    function waitForLocalSotrageChanged() {
      return new Promise((resolve) => {
        function listener(changes, areaName) {
          if (areaName === "local" && changes.actionPos) {
            resolve(changes.actionPos.newValue);
          }
        }
        chrome.storage.onChanged.addListener(listener);
      });

    }
    
  }

}

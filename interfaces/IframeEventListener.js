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

    this.iframeDocument.addEventListener('mouseup', (e) => {
      console.log('iframe mouseup:', e.target);
    });
    this.iframeWindow.addEventListener('dragover', (e) => {
      e.preventDefault();
      console.log('拖曳滑過目標區');
    });

    this.iframeWindow.addEventListener('drop', async (e) => {
      e.preventDefault();
      //const data = e.dataTransfer.getData('text/plain');
      // console.log('放開了:', data);

      //get share variable from chrome storage
      this.rightNowAction = await waitForLocalSotrageChanged();

      console.log("Right now action: ", this.rightNowAction);
      console.log('iframe進行drop事件處理');
      console.log("type: ", Array.isArray(this.useractionDB));
      const action_type = "drag";
      if (this.currentHoveredElement) {

        //在這裡處理轉換成Playwright Code Logic
        const tempAction = this.useractionDB[this.rightNowAction];

        console.log("action db: ", this.useractionDB);
        console.log("tempAction: ", tempAction);
        tempAction.setTargetElement(this.currentHoveredElement);

        PlaywrightCodeGenerator.generate(tempAction, this.playwrightCommand);
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
    this.iframeWindow.addEventListener('message', (e) => {
      const msg = e.data;
      console.log('msg:', msg);
      switch (msg.type) {
        case 'drag_start':
          console.log('iframe 收到 window 傳來的 dragstart');

          break;
      }
    });
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

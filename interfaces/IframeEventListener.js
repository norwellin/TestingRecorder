//note: JS 是 by reference傳遞 (不是by value)
// iframe 內部事件監聽器，負責處理 iframe 內部事件
import { PlaywrightCommand } from '../entities/PlaywrightCommand.js';
import { PlaywrightCodeGenerator } from '../usecases/PlaywrightCodeGenerator';
import { ActionInterpreter } from '../usecases/ActionInterpreter.js';
import { UserAction } from '../entities/UserAction.js';

export class IframeEventListener {
  constructor(iframeWindow, domParserService, command, userActionDB, rightNowAction) {
    this.iframeWindow = iframeWindow;
    this.domParserService = domParserService;
    this.iframeDocument = iframeWindow.document;
    this.useractionDB = userActionDB;
    this.rightNowAction = rightNowAction;
    this.playwrightCommand = command;
    //
    this.target = null;
    this.source = null; //存放的是drag and drop的title
    this.currentHoveredElement = null;
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

    this.iframeWindow.addEventListener('drop', (e) => {
      e.preventDefault();
      const data = e.dataTransfer.getData('text/plain');
      console.log('放開了:', data);
      console.log('iframe進行drop事件處理');
      console.log("type: ", Array.isArray(this.useractionDB));
      const action_type = "drag";
      if (this.currentHoveredElement) {

        //在這裡處理轉換成Playwright Code Logic
        this.rightNowAction = this.rightNowAction + 1;
        this.useractionDB[this.rightNowAction] = ActionInterpreter.interpretDrag(action_type, this.source, this.currentHoveredElement);
        PlaywrightCodeGenerator.generate(this.useractionDB[this.rightNowAction], this.playwrightCommand);
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
        
      }
    });
    this.iframeWindow.addEventListener('message', (e) => {
      const msg = e.data;
      console.log('msg:', msg);
      switch (msg.type) {
        case 'drag':
          console.log('iframe 收到 parent 傳來的 dragstart');
          this.source = msg.elementData;
          break;
      }
    });
  }
}

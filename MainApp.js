import { IframeEventListener } from './interfaces/IframeEventListener.js';
import { OuterEventListener } from './interfaces/OuterEventListener.js';
import { DOMParserService } from './usecases/DOMParserService.js';
import { PlaywrightCommand } from './entities/PlaywrightCommand.js';
import { WindowsCatcher } from './WindowsCatcher.js';
import { UserAction } from './entities/UserAction.js';

//https://iot.ttu.edu.tw/SnapIonic8.1/
export class MainApp {
  constructor() {
    this.allwindows = new WindowsCatcher(); //contain all windows (include: iframe, mainwindow) base on the website
    this.userActionDB = []; // record all user action
    this.rightNowAction = -1; // to remember the action right now
  }

  start() {
    console.log('程式活著!');
    const {mainWindow, iframeWindow} = this.allwindows.catch();

    const domParserService = new DOMParserService();
    const command = new PlaywrightCommand();
    // 初始化 iframe 內事件監聽f

    if (iframeWindow){
      const iframeListener = new IframeEventListener(iframeWindow, domParserService, command, this.userActionDB, this.rightNowAction);
      iframeListener.init();
    }

    // 初始化外部 drag-drop 事件監聽
    const outerListener = new OuterEventListener(iframeWindow, this.userActionDB);
    outerListener.init();

    // 傳送Playwright Code到背景頁面
    

  }
}

import { IframeEventListener } from '../interfaces/IframeEventListener.js';
import { OuterEventListener } from '../interfaces/OuterEventListener.js';
import { DOMParserService } from '../usecases/DOMParserService.js';
import { PlaywrightCommand } from '../entities/PlaywrightCommand.js';
import { WindowsCatcher } from '../WindowsCatcher.js';
import { UserAction } from './entities/UserAction.js';

//預設先用iframeWindow[0]，之後改成可以選擇
//https://iot.ttu.edu.tw/SnapIonic8.1/
export class ComTester {
  constructor() {
    this.allwindows = new WindowsCatcher(); //contain all windows (include: iframe, mainwindow) base on the website
    this.userActionDB = []; // record all user action
  }

  start() {
    console.log('程式活著!');
    const { mainWindow, iframeWindow } = this.allwindows.getWindows();

    const domParserService = new DOMParserService(iframeWindow);
    const command = new PlaywrightCommand();
    
    // 初始化 iframe 內事件監聽
    if (iframeWindow) {
      const iframeListener = new IframeEventListener(iframeWindow, domParserService, command, this.userActionDB);
      iframeListener.init();
    }

    // 初始化外部 drag-drop 事件監聽
    const outerListener = new OuterEventListener(iframeWindow, domParserService, command, this.userActionDB);
    outerListener.init();

    // 清空所有storage
    chrome.storage.local.clear(() => {
      console.log("storage 已清空");
    });
    


  }
}

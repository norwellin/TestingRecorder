import { IframeEventListener } from './interfaces/IframeEventListener.js';
import { OuterEventListener } from './interfaces/OuterEventListener.js';
import { DOMParserService } from './usecases/DOMParserService.js';
import { PlaywrightCommand } from './entities/PlaywrightCommand.js';
import { WindowsCatcher } from './WindowsCatcher.js';
import { UserAction } from './entities/UserAction.js';

//預設先用iframeWindow[0]，之後改成可以選擇
//https://iot.ttu.edu.tw/SnapIonic8.1/
export class MainApp {
  constructor() {
    this.allwindows = new WindowsCatcher(); //contain all windows (include: iframe, mainwindow) base on the website
    this.userActionDB = []; // record all user action
    this.command = new PlaywrightCommand();
  }

  start() {
    console.log('程式活著!');
    const { mainWindow, iframeWindows } = this.allwindows.getWindows();
    this.init_codeSetter();

    const domParserService = new DOMParserService(iframeWindows);

    
    // 初始化 iframe 內事件監聽
    if (iframeWindows) {
      const iframeListener = new IframeEventListener(iframeWindows, domParserService, this.command, this.userActionDB);
      iframeListener.init();
    }

    // 初始化外部 drag-drop 事件監聽
    const outerListener = new OuterEventListener(iframeWindows, domParserService, this.command, this.userActionDB);
    outerListener.init();

    // 清空所有storage
    chrome.storage.local.clear(() => {
      console.log("storage 已清空");
    });
    


  }
  init_codeSetter(){
    const iframesId = this.allwindows.getIframesId();
    const codeline = `const iframe = await page.frameLocator('iframe#${iframesId}');`;
    this.command.codeWindowsSetter(codeline);
  }
}

import { IframeEventListener } from './interfaces/IframeEventListener.js';
import { OuterEventListener } from './interfaces/OuterEventListener.js';
import { DOMParserService } from './usecases/DOMParserService.js';

export class MainApp {
  constructor() {
    this.iframe = document.querySelector('iframe');
  }

  start() {
    if (!this.iframe) {
      console.error('找不到 iframe');
      return;
    }
    console.log('程式活著!');

    const iframeWindow = this.iframe.contentWindow;
    const domParserService = new DOMParserService();

    // 初始化 iframe 內事件監聽
    const iframeListener = new IframeEventListener(iframeWindow, domParserService);
    iframeListener.init();

    // 初始化外部 drag-drop 事件監聽
    const outerListener = new OuterEventListener(iframeWindow);
    outerListener.init();
  }
}

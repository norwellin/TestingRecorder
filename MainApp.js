import { IframeEventListener } from './interfaces/IframeEventListener.js';
import { OuterEventListener } from './interfaces/OuterEventListener.js';
import { DOMParserService } from './usecases/DOMParserService.js';
import { PlaywrightCommand } from './entities/PlaywrightCommand.js';
import { WindowsCatcher } from './WindowsCatcher.js';

export class MainApp {
  constructor() {
    this.allwindows = new WindowsCatcher();
    this.userActionDB = [];
    this.command = new PlaywrightCommand();
  }

  start() {
    console.log('程式活著!');

    const {
      mainWindow,
      iframeWindow,
      iframeElement,
      iframeId
    } = this.allwindows.getWindows();

    const hasMainWindow = this.isUsableWindow(mainWindow);
    const hasIframeWindow = this.isUsableWindow(iframeWindow);

    this.init_codeSetter(iframeId, hasIframeWindow);

    if (!hasMainWindow && !hasIframeWindow) {
      console.warn('沒有可用的 mainWindow 或 iframeWindow，停止初始化');
      return;
    }

    const contexts = {
      mainWindow: hasMainWindow ? mainWindow : null,
      iframeWindow: hasIframeWindow ? iframeWindow : null,
      iframeElement: iframeElement || null,
      iframeId: iframeId || null
    };

    const domParserService = new DOMParserService(contexts);

    if (hasIframeWindow) {
      const iframeListener = new IframeEventListener(
        contexts,
        domParserService,
        this.command,
        this.userActionDB
      );
      iframeListener.init();
    } else {
      console.log('沒有 iframe，跳過 IframeEventListener');
    }

    if (hasMainWindow) {
      const outerListener = new OuterEventListener(
        contexts,
        domParserService,
        this.command,
        this.userActionDB
      );
      outerListener.init();
    } else {
      console.log('沒有 mainWindow，跳過 OuterEventListener');
    }

    if (hasMainWindow && hasIframeWindow) {
      this.initCrossWindowTracking(contexts);
    } else {
      console.log('缺少 mainWindow 或 iframeWindow，跳過 cross-window tracking');
    }

    chrome.storage.local.clear(() => {
      console.log('storage 已清空');
    });
  }

  init_codeSetter(iframeId, hasIframeWindow) {
    if (!hasIframeWindow || !iframeId) {
      this.command.codeWindowsSetter('// no iframe detected, use page directly');
      return;
    }

    const codeline = `const iframe = page.frameLocator('iframe#${iframeId}');`;
    this.command.codeWindowsSetter(codeline);
  }

  initCrossWindowTracking(contexts) {
    const { mainWindow, iframeWindow } = contexts;

    if (!this.isUsableWindow(mainWindow) || !this.isUsableWindow(iframeWindow)) {
      return;
    }

    console.log('cross-window tracking 已啟用');

    // 這裡只做跨 context 的 message / 同步協調
    mainWindow.addEventListener('message', (event) => {
      const msg = event.data;
      if (!msg || typeof msg !== 'object') return;

      // 你可以在這裡統一處理 page <-> iframe bridge
      // 例如 drag 狀態同步、action index 同步等
    });
  }

  isUsableWindow(win) {
    return !!win && !!win.document;
  }
}
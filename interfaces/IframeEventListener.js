// iframe 內部事件監聽器，負責處理 iframe 內部事件
import { PlaywrightCommand } from '../entities/PlaywrightCommand.js';
import { PlaywrightCodeGenerator } from '../usecases/PlaywrightCodeGenerator';
import { ActionInterpreter } from '../usecases/ActionInterpreter.js';

export class IframeEventListener {
  constructor(iframeWindow, domParserService) {
    this.iframeWindow = iframeWindow;
    this.domParserService = domParserService;
    this.iframeDocument = iframeWindow.document;
    this.PlaywrightCommand = PlaywrightCommand;
    //
    this.target = null;
    this.source = null;
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
      this.iframeWindow.postMessage('mouseup-from-parent', '*');
      console.log('iframe進行drop事件處理');
        if (this.currentHoveredElement) {
          console.log('滑鼠停留在 iframe 中的元素:', path);
          

          //在這裡處理轉換成Playwright Code Logic
          this.PlaywrightCommand = PlaywrightCodeGenerator.generate(ActionInterpreter.interpretDrag(this.source, this.currentHoveredElement),this.iframeWindow, this.source, this.currentHoveredElement);
          console.log('Playwright Command:', this.PlaywrightCommand.codeGetter());
          //回復狀態
          this.currentHoveredElement = null;
        }
    });
    this.iframeWindow.addEventListener('message', (e) => {
      const msg = e.data;

      switch (msg.type) {
        case 'dragstart':
          console.log('iframe 收到 parent 傳來的 dragstart');
          this.source = msg.target;
          break;
      }
    });
  }
}

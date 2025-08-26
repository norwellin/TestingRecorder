// 監聽外部 drag-drop 事件
import { DOMElement } from "../entities/DOMElement";

export class OuterEventListener {
  constructor(iframeWindow) {
    this.iframeWindow = iframeWindow;
    this.dragSources = document.querySelectorAll('[draggable="true"]');
    this.DOMElement = new DOMElement();
    //
    this.target = null;
    this.source = null;
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
document.addEventListener("dragstart", (e) => {
    const target = e.target;
    if (target.getAttribute("draggable") === "true") {
      console.log("拖拉開始:", target);
      this.DOMElement.setElementData(target);
      this.iframeWindow.postMessage(this.DOMElement.getAllElements("drag"), "*");
      this.source = target.getAttribute("title");
    }
  });

  }
}

// 監聽外部 drag-drop 事件
import { DOMElement } from "../entities/DOMElement";
import { UserAction } from "../entities/UserAction";

export class OuterEventListener {
  constructor(iframeWindow, useractionDB) {
    this.iframeWindow = iframeWindow;
    this.dragSources = document.querySelectorAll('[draggable="true"]');
    this.DOMElement = new DOMElement();
    this.useractionDB = useractionDB;
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
  document.addEventListener("drop", (e) => {
    //identify the source
   
    chrome.storage.local.get(["sourceOfDD"], (result) => {
      const sourceDD = result.sourceOfDD;
    });
    try {
      //1. from iframe
      if(sourceDD == "iframe"){
        console.log("drag & drop: iframe -> main");
      }
      //2. from mainwindow
      else if (sourceDD == "window"){
        console.log("drag & drop: main -> main");
      }
    } catch (error) {
      
    }
    
  });  
  document.addEventListener("dragstart", (e) => {
      try {
        if (this.iframeWindow) {
          const target = e.target;
          if (target.getAttribute("draggable") === "true") {
            console.log("拖拉開始:", target);
            this.DOMElement.setElementData(target);
            this.iframeWindow.postMessage(this.DOMElement.getAllElements("drag"), "*");
            this.source = target.getAttribute("title");

            //紀錄drag 的來源到chrome storage
            chrome.storage.local.set({sourceOfDD: "window"});
          }
        }
        else{

        }

      } catch (err) {
        console.log("ERROR: " + err);
      }

    });

  }
}

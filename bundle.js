(() => {
  // entities/PlaywrightCommand.js
  var PlaywrightCommand = class {
    constructor() {
      this.code = [];
    }
    codeSetter(codeline) {
      this.code.push(codeline);
    }
    codeGetter() {
      return this.code;
    }
  };

  // entities/DOMElement.js
  var DOMElement = class {
    constructor() {
      this.tag = "";
      this.id = "";
      this.title = "";
      this.event = null;
      this.type = "";
    }
    setElementData(element, type) {
      this.type = type;
      this.tag = element.tagName.toLowerCase();
      this.id = element.id || "";
      this.title = element.getAttribute("title") || "";
      this.event = element;
    }
    getAllElements() {
      return {
        type: this.type,
        elementData: {
          id: this.id,
          title: this.title,
          tagname: this.tag
        },
        event: this.event
      };
    }
    resetElement() {
      this.tag = "";
      this.id = "";
      this.title = "";
      this.event = null;
    }
  };

  // usecases/DOMParserService.js
  var DOMParserService = class {
    constructor() {
    }
    static getDomPath(el) {
      console.log("el: ", el);
      const path = [];
      while (el && el.nodeType === Node.ELEMENT_NODE) {
        let name = el.nodeName.toLowerCase();
        let siblingIndex = 1;
        let sibling = el;
        while (sibling = sibling.previousElementSibling) {
          if (sibling.nodeName === el.nodeName) {
            siblingIndex++;
          }
        }
        if (siblingIndex > 1) {
          name += `:nth-of-type(${siblingIndex})`;
        }
        path.unshift(name);
        el = el.parentElement;
      }
      return path.join(" > ");
    }
  };

  // usecases/PlaywrightCodeGenerator.js
  var PlaywrightCodeGenerator = class {
    static generate(action, playwrightCommand) {
      console.log("action: ", action);
      const targetpath = DOMParserService.getDomPath(action.getTargetElement());
      const sourcepath = DOMParserService.getDomPath(action.getSourceElement());
      console.log("\u6ED1\u9F20\u505C\u7559\u5728 iframe \u4E2D\u7684\u5143\u7D20:", targetpath);
      console.log("source path: ", sourcepath);
      if (action.getActionType() === "dragANDdrop") {
        playwrightCommand.codeSetter(`await page.locator('css=${sourcepath}').dragTo(iframe.locator('css=${targetpath}');`);
      } else if (action.getActionType() === "click") {
        playwrightCommand.codeSetter(`await page.click('css=${sourcepath}')`);
      }
    }
  };

  // entities/UserAction.js
  var UserAction = class {
    constructor(type, source, target) {
      this.type = type;
      this.source = source;
      this.target = target;
    }
    setActionType(type) {
      this.type = type;
    }
    setSourceElement(source) {
      this.source = source;
    }
    setTargetElement(target) {
      this.target = target;
    }
    getActionType() {
      return this.type;
    }
    getSourceElement() {
      return this.source;
    }
    getTargetElement() {
      return this.target;
    }
  };

  // usecases/ActionInterpreter.js
  var ActionInterpreter = class {
    static interpretDrag(action_type, sourceEl, targetEl) {
      return new UserAction(action_type, sourceEl, targetEl);
    }
  };

  // interfaces/IframeEventListener.js
  var IframeEventListener = class {
    constructor(iframeWindow, domParserService, command, userActionDB) {
      this.iframeWindow = iframeWindow;
      this.domParserService = domParserService;
      this.iframeDocument = iframeWindow.document;
      this.useractionDB = userActionDB;
      this.playwrightCommand = command;
      this.target = null;
      this.source = null;
      this.currentHoveredElement = null;
      this.rightNowAction = -1;
    }
    init() {
      this.iframeDocument.addEventListener("mousemove", (e) => {
        this.currentHoveredElement = e.target;
      });
      this.iframeDocument.addEventListener("mouseup", (e) => {
        console.log("iframe mouseup:", e.target);
      });
      this.iframeWindow.addEventListener("dragover", (e) => {
        e.preventDefault();
        console.log("\u62D6\u66F3\u6ED1\u904E\u76EE\u6A19\u5340");
      });
      this.iframeWindow.addEventListener("drop", async (e) => {
        e.preventDefault();
        const action_type = "drag";
        if (this.currentHoveredElement) {
          console.log("iframe - rightNowAction: ", this.rightNowAction);
          const tempAction = this.useractionDB[this.rightNowAction];
          console.log("action db: ", this.useractionDB);
          tempAction.setTargetElement(this.currentHoveredElement);
          console.log("tempAction: ", tempAction);
          PlaywrightCodeGenerator.generate(tempAction, this.playwrightCommand);
          console.log("Playwright Command:", this.playwrightCommand.codeGetter());
          this.currentHoveredElement = null;
          const generatedCode = this.playwrightCommand.codeGetter();
          console.log("Playwright Command:", generatedCode);
          chrome.runtime.sendMessage({
            type: "display_code",
            code: generatedCode
          });
          chrome.storage.local.set({ actionPos: this.rightNowAction });
        }
      });
      this.iframeWindow.addEventListener("message", (e) => {
        const msg = e.data;
        console.log("msg:", msg);
        switch (msg.type) {
          case "drag_start":
            console.log("iframe \u6536\u5230 window \u50B3\u4F86\u7684 dragstart");
            this.rightNowAction = msg.nowAction;
            break;
          case "actionPosChanged":
            this.rightNowAction = msg.actionPos;
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
  };

  // interfaces/OuterEventListener.js
  var OuterEventListener = class {
    constructor(iframeWindow, domParserService, command, userActionDB) {
      this.iframeWindow = iframeWindow;
      this.domParserService = domParserService;
      this.dragSources = document.querySelectorAll('[draggable="true"]');
      this.DOMElement = new DOMElement();
      this.useractionDB = userActionDB;
      this.playwrightCommand = command;
      this.target = null;
      this.source = null;
      this.currentHoveredElement = null;
      this.rightNowAction = -1;
    }
    init() {
      document.addEventListener("click", (e) => {
        console.log("Here is a click event!");
        this.rightNowAction = this.rightNowAction + 1;
        console.log("window - rightNowAction(click): ", this.rightNowAction);
        const action_type = "click";
        this.currentHoveredElement = e.target;
        this.DOMElement.setElementData(this.currentHoveredElement, "click");
        console.log(this.DOMElement.getAllElements());
        this.useractionDB.push(ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements().event, null));
        PlaywrightCodeGenerator.generate(this.useractionDB[this.rightNowAction], this.playwrightCommand);
        console.log("Playwright Command:", this.playwrightCommand.codeGetter());
        console.log("useractionDB: ", this.useractionDB);
        const generatedCode = this.playwrightCommand.codeGetter();
        console.log("Playwright Command:", generatedCode);
        chrome.runtime.sendMessage({
          type: "display_code",
          code: generatedCode
        });
        this.iframeWindow.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");
      });
      document.addEventListener("drop", (e) => {
        chrome.storage.local.get(["sourceOfDD"], (result) => {
          const sourceDD2 = result.sourceOfDD;
        });
        try {
          if (sourceDD == "iframe") {
            console.log("drag & drop: iframe -> main");
          } else if (sourceDD == "window") {
            console.log("drag & drop: main -> main");
          }
        } catch (error) {
        }
      });
      document.addEventListener("dragstart", (e) => {
        try {
          this.rightNowAction = this.rightNowAction + 1;
          console.log("window - rightNowAction (drag stat): ", this.rightNowAction);
          const target = e.target;
          const action_type = "dragANDdrop";
          if (target.getAttribute("draggable") === "true") {
            console.log("\u62D6\u62C9\u958B\u59CB:", target);
            this.DOMElement.setElementData(target, "drag");
            this.useractionDB.push(ActionInterpreter.interpretDrag(action_type, this.DOMElement.getAllElements().event, null));
            this.iframeWindow.postMessage({ type: "drag_start", nowAction: this.rightNowAction }, "*");
            chrome.storage.local.set({ sourceOfDD: "window" });
            this.iframeWindow.postMessage({ type: "actionPosChanged", actionPos: this.rightNowAction }, "*");
          }
        } catch (error) {
        }
      });
      this.iframeWindow.addEventListener("messenge", (e) => {
        const msg = e.data;
        console.log("window get msg: ", msg);
        switch (msg.type) {
          case "actionPosChanged":
            this.rightNowAction = msg.actionPos;
            break;
        }
      });
    }
  };

  // WindowsCatcher.js
  var WindowsCatcher = class {
    constructor(doucumentRef = document) {
      this.documentRef = doucumentRef;
    }
    catch() {
      const iframe = this.documentRef.querySelector("iframe");
      const iframeWindow = iframe?.contentWindow || null;
      const mainWindow = window;
      return { mainWindow, iframeWindow };
    }
  };

  // MainApp.js
  var MainApp = class {
    constructor() {
      this.allwindows = new WindowsCatcher();
      this.userActionDB = [];
    }
    start() {
      console.log("\u7A0B\u5F0F\u6D3B\u8457!");
      const { mainWindow, iframeWindow } = this.allwindows.catch();
      const domParserService = new DOMParserService();
      const command = new PlaywrightCommand();
      if (iframeWindow) {
        const iframeListener = new IframeEventListener(iframeWindow, domParserService, command, this.userActionDB);
        iframeListener.init();
      }
      const outerListener = new OuterEventListener(iframeWindow, domParserService, command, this.userActionDB);
      outerListener.init();
      chrome.storage.local.clear(() => {
        console.log("storage \u5DF2\u6E05\u7A7A");
      });
    }
  };
  const app = new MainApp();
app.start();
})();

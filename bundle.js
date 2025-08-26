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
    }
    setElementData(element) {
      this.tag = element.tagName.toLowerCase();
      this.id = element.id || "";
      this.title = element.getAttribute("title") || "";
    }
    getAllElements(type) {
      return {
        type,
        elementData: {
          id: this.id,
          title: this.title,
          tagname: this.tag
        }
      };
    }
  };

  // usecases/DOMParserService.js
  var DOMParserService = class {
    constructor() {
    }
    static getDomPath(el) {
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
      const targetpath = DOMParserService.getDomPath(action.getTargetElement());
      console.log("\u6ED1\u9F20\u505C\u7559\u5728 iframe \u4E2D\u7684\u5143\u7D20:", targetpath);
      if (action.getActionType() === "drag") {
        playwrightCommand.codeSetter(`await page.locator('[title = '${action.getSourceElement().title}']').dragTo(iframe.locator(css=${targetpath}));`);
      }
    }
  };

  // entities/UserAction.js
  var UserAction = class {
    constructor({ type, source, target }) {
      this.type = type;
      this.source = source;
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
    static interpretDrag(sourceEl, targetEl) {
      return new UserAction({
        type: "drag",
        source: sourceEl,
        target: targetEl
      });
    }
  };

  // interfaces/IframeEventListener.js
  var IframeEventListener = class {
    constructor(iframeWindow, domParserService, playwrightCommand) {
      this.iframeWindow = iframeWindow;
      this.domParserService = domParserService;
      this.iframeDocument = iframeWindow.document;
      this.playwrightCommand = playwrightCommand;
      this.target = null;
      this.source = null;
      this.currentHoveredElement = null;
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
      this.iframeWindow.addEventListener("drop", (e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData("text/plain");
        console.log("\u653E\u958B\u4E86:", data);
        console.log("iframe\u9032\u884Cdrop\u4E8B\u4EF6\u8655\u7406");
        if (this.currentHoveredElement) {
          PlaywrightCodeGenerator.generate(ActionInterpreter.interpretDrag(this.source, this.currentHoveredElement), this.playwrightCommand);
          console.log("Playwright Command:", this.playwrightCommand.codeGetter());
          this.currentHoveredElement = null;
          const generatedCode = this.playwrightCommand.codeGetter();
          console.log("Playwright Command:", generatedCode);
          chrome.runtime.sendMessage({
            type: "display_code",
            code: generatedCode
          });
        }
      });
      this.iframeWindow.addEventListener("message", (e) => {
        const msg = e.data;
        console.log("msg:", msg);
        switch (msg.type) {
          case "drag":
            console.log("iframe \u6536\u5230 parent \u50B3\u4F86\u7684 dragstart");
            this.source = msg.elementData;
            break;
        }
      });
    }
  };

  // interfaces/OuterEventListener.js
  var OuterEventListener = class {
    constructor(iframeWindow) {
      this.iframeWindow = iframeWindow;
      this.dragSources = document.querySelectorAll('[draggable="true"]');
      this.DOMElement = new DOMElement();
      this.target = null;
      this.source = null;
    }
    init() {
      document.addEventListener("dragstart", (e) => {
        const target = e.target;
        if (target.getAttribute("draggable") === "true") {
          console.log("\u62D6\u62C9\u958B\u59CB:", target);
          this.DOMElement.setElementData(target);
          this.iframeWindow.postMessage(this.DOMElement.getAllElements("drag"), "*");
          this.source = target.getAttribute("title");
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
    }
    start() {
      console.log("\u7A0B\u5F0F\u6D3B\u8457!");
      const { mainWindow, iframeWindow } = this.allwindows.catch();
      const domParserService = new DOMParserService();
      const command = new PlaywrightCommand();
      if (iframeWindow) {
        const iframeListener = new IframeEventListener(iframeWindow, domParserService, command);
        iframeListener.init();
      }
      const outerListener = new OuterEventListener(iframeWindow);
      outerListener.init();
    }
  };
  const app = new MainApp();
app.start();
})();

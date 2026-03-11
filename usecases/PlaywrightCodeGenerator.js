//import { act } from 'react';
//import { act } from 'react';
import { PlaywrightCommand } from '../entities/PlaywrightCommand.js';
import { DOMParserService } from './DOMParserService.js';


export class PlaywrightCodeGenerator {
  constructor(iframeWindow, userActionDB) {
    this.typedText = '';
    this.domService = new DOMParserService(iframeWindow);
    this.userActionDB = userActionDB;
    this.rightNowAction;
  }
  generate(action, playwrightCommand, rightNowAction) {
    this.rightNowAction = rightNowAction;
    console.log("action: ", action);
    let sourcepath = null;
    let targetpath = null;
    let inputText = "default";
    let inputKey = "default";
    //let selectValue = "default";
    let selectLabel = "default";
    //if (action.type != "keyboard")

    sourcepath = this.domService.getOpenSourcePath(action.getSourceElement(), action.getSourceWindow(), action.type); //取得所有方法的值

    if (action.type === "dragANDdrop") {
      targetpath = this.domService.getOpenSourcePath(action.getTargetElement(), action.getTargetWindow());
      console.log("inside generate: targetpath  ", targetpath);
    }
    if (action.type === "input") {
      inputText = action.getSourceElement().innerText || action.getSourceElement().value;
      this.userActionDB[this.rightNowAction].setInputText(inputText);
      console.log("InputTEXT: ", inputText);
    }
    if (action.type === "keyboard") {
      inputKey = action.getKeyboard();
    }
    if (action.type === "change") {
      //selectValue = action.getSourceElement().value;
      selectLabel = action.getSourceElement().options[action.getSourceElement().selectedIndex].text;
      this.userActionDB[this.rightNowAction].setSelectedText(selectLabel);
    }
    //取得來源window (iframe || main)
    console.log("inside generate: ", this.userActionDB, rightNowAction);
    let sourceWindow = this.userActionDB[rightNowAction].getSourceWindow();
    let targetWindow = this.userActionDB[rightNowAction].getTargetWindow();
    console.log("userDB inside generator: ", this.userActionDB);
    console.log("sourceWin, targetWin, rightnowACT: ", sourceWindow, targetWindow, rightNowAction);
    //解析回傳的元素
    console.log('滑鼠停留在 iframe 中的元素:', targetpath);
    console.log('source path: ', sourcepath);

    if (action.getActionType() === 'dragANDdrop') {
      this.dragAndDropCodeSetter(playwrightCommand, targetpath, sourcepath, sourceWindow, targetWindow);
    }
    else if (action.getActionType() === 'click' || action.getActionType() === 'checkBox') {
      this.clickSetter(playwrightCommand, sourcepath, sourceWindow);
    }
    else if (action.getActionType() === 'dbclick') {
      this.doubleClickSetter(playwrightCommand, sourcepath, sourceWindow);
      ///playwrightCommand.codeSetter(`await page.dbclick('css=${sourcepath}');`);
    }
    else if (action.getActionType() === 'input') {
      this.inputSetter(playwrightCommand, sourcepath, sourceWindow, inputText);
    }
    else if (action.getActionType() === 'keydown') {
      playwrightCommand.codeSetter(`await page.locator('${sourcepath}').fill(${this.typedText});`);
    }
    else if (action.getActionType() === 'keyboard') {
      this.keyboardSetter(playwrightCommand, inputKey);
    }
    else if (action.getActionType() === "change") {
      //console.log("change: sourcepath, ",sourcepath, "select value: ",selectValue);
      //this.changeSetter(playwrightCommand, sourcepath, selectValue);
      //console.log("change: sourcepath, ",sourcepath, "select value: ",selectValue);
      this.changeSetter(playwrightCommand, sourcepath, selectLabel);
    }
  }

  changeSetter(playwrightCommand, sourcepath, selectedValue) {
    let priMin = -1;
    for (let i = 0; i < this.domService.priSize; i++) {
      if (sourcepath[i]) {
        priMin = i;
        break;
      }
    }
    console.log("priMin: ", priMin);
    let funName = sourcepath[priMin].funName;
    let obj = sourcepath[priMin].obj;
    console.log("funName: ", funName, "obj", obj);

    if (funName === "ByDomPath") {
      let code = `await page.selectOption('${obj.csspath}', { label:'${selectedValue}'});`;
      //{ label: 'test1.vue' }
      playwrightCommand.codeSetter(code);
    }

    //新增到useraction
    this.updateUserActionDB(funName, obj, act);
  }
  keyboardSetter(playwrightCommand, inputKey) {
    if (inputKey === "Backspace") {
      let code = `await page.keyboard.press('Backspace');`;
      playwrightCommand.codeSetter(code);
    }
  }
  dragAndDropCodeSetter(playwrightCommand, targetpath, sourcepath, sourceWindow, targetWindow) {
    //Object.keys(tar)
    //找到存在的最優先順序
    let souPriMin = -1;
    let tarPriMin = -1;
    //找source min最小
    for (let i = 0; i < this.domService.priSize; i++) {
      if (sourcepath[i]) {
        souPriMin = i;
        break;
      }
    }
    //找target min最小
    for (let i = 0; i < this.domService.priSize; i++) {
      if (targetpath[i]) {
        tarPriMin = i;
        break;
      }
    }
    console.log("Source priMin: ", souPriMin, "Target Primin: ", tarPriMin);
    let souFunName = sourcepath[souPriMin].funName;
    let souObj = sourcepath[souPriMin].obj;
    console.log("source funName: ", souFunName, "source obj", souObj);

    let tarFunName = targetpath[tarPriMin].funName;
    let tarObj = targetpath[tarPriMin].obj;
    console.log("target funName: ", tarFunName, "target obj: ", tarObj);

    //產出code
    let actDrag = { type: "dragANDdrop", ddConfig: "drag", sourceWindow: sourceWindow, targetWindow: targetWindow };
    let actDrop = { type: "dragANDdrop", ddConfig: "drop", sourceWindow: sourceWindow, targetWindow: targetWindow };
    const souCommand = this.playwrightCodeSetter(souFunName, souObj, actDrag);
    const tarCommand = this.playwrightCodeSetter(tarFunName, tarObj, actDrop);

    console.log("tarComnd: ", tarCommand);
    playwrightCommand.codeSetter(`${souCommand}.dragTo(${tarCommand});`);

    //新增到useraction
    console.log("souFunName: ", souFunName, " tarFunName: ", tarFunName);
    this.updateUserActionDB(souFunName, souObj, actDrag);
    this.updateUserActionDB(tarFunName, tarObj, actDrop);
  }
  clickSetter(playwrightCommand, sourcepath, sourceWindow) {
    //找到存在的最優先順序
    console.log("inside CLICK SETTER: ", sourceWindow);
    let priMin = -1;
    for (let i = 0; i < this.domService.priSize; i++) {
      if (sourcepath[i]) {
        priMin = i;
        break;
      }
    }
    console.log("priMin: ", priMin);
    let funName = sourcepath[priMin].funName;
    let obj = sourcepath[priMin].obj;
    console.log("funName: ", funName, "obj", obj);

    //產出code
    let act = { type: "click", addConfig: "", sourceWindow: sourceWindow, targetWindow: "" };
    const command = this.playwrightCodeSetter(funName, obj, act);
    playwrightCommand.codeSetter(command);


    //新增到useraction
    this.updateUserActionDB(funName, obj, act);
  }
  doubleClickSetter(playwrightCommand, sourcepath, sourceWindow) {
    console.log("inside DOUBLE CLICK SETTER: ", sourceWindow);
    let priMin = -1;
    for (let i = 0; i < this.domService.priSize; i++) {
      if (sourcepath[i]) {
        priMin = i;
        break;
      }
    }
    console.log("priMin: ", priMin);
    let funName = sourcepath[priMin].funName;
    let obj = sourcepath[priMin].obj;
    console.log("funName: ", funName, "obj", obj);

    //產出code
    let act = { type: "dbclick", addConfig: "", sourceWindow: sourceWindow, targetWindow: "" };
    const command = this.playwrightCodeSetter(funName, obj, act);
    playwrightCommand.codeSetter(command);

    //新增到useraction
    this.updateUserActionDB(funName, obj, act);
  }
  inputSetter(playwrightCommand, sourcepath, sourceWindow, inputText) {
    console.log("inside input Setter!");
    let priMin = -1;
    for (let i = 0; i < this.domService.priSize; i++) {
      if (sourcepath[i]) {
        priMin = i;
        break;
      }
    }
    console.log("priMin: ", priMin);
    let funName = sourcepath[priMin].funName;
    let obj = sourcepath[priMin].obj;
    console.log("funName: ", funName, "obj", obj);

    //產出code
    let act = { type: "input", addConfig: "", sourceWindow: sourceWindow, targetWindow: "", inputText: inputText };
    const command = this.playwrightCodeSetter(funName, obj, act);
    playwrightCommand.codeSetter(command);

    //新增到useraction
    this.updateUserActionDB(funName, obj, act);
  }
  keydownSetter() {

  }
  //避免playwright code裡面外面都用"
  replacePath(cssPath) {
    return cssPath.replace(/\\/g, '\\\\')   // 先處理反斜線
      .replace(/"/g, '\\"');   // escape 雙引號
  }

  playwrightCodeSetter(funName, obj, act) {//all action have the same code setter. 
    console.log("variable in codeSetter: funName= ", funName, "obg= ", obj, "act = ", act);
    //新版寫法更清晰
    let sourceWinVar = act.sourceWindow;
    let targetWinVar = act.targetWindow;

    if (funName === "ByDomPath") {
      obj.csspath = this.replacePath(obj.csspath);
    }
    const getLocator = (windowVar, winName) => {
      switch (funName) {
        case "ByRole":
          if (obj.index <= 0)
            return `${windowVar}.getByRole("${obj.role}", { name: "${obj.name}" })`;
          else
            return `${windowVar}.getByRole("${obj.role}", { name: "${obj.name}" }).nth(${obj.index})`;
        case "ByTitle":
          return `${windowVar}.getByTitle("${obj.title}", {exact: true})`;
        case "ByText":
          return `${windowVar}.getByText("${obj.text}", { exact: true })`;
        case "ByDomPath":
          return `${windowVar}.locator("${obj.csspath}")`;
        default:
          return new Error(funName, " Not found!!");
      }
    };
    //rewrite version3 (page and iframe的click功能不同)
    //先用最直接的寫法再改
    switch (act.type) {
      case "click":
        if (sourceWinVar === "page") {
          if (funName === "ByDomPath") {
            return `await ${sourceWinVar}.click("${obj.csspath}");`;
          }
          return `await ${getLocator(sourceWinVar)}.click();`;
        }
        else if (sourceWinVar === "iframe") {
          if (funName === "ByDomPath") {
            return `await ${sourceWinVar}.locator("${obj.csspath}").click();`;
          }
          return `await ${getLocator(sourceWinVar)}.click();`;
        }
        break;
      case "dbclick":
        if (sourceWinVar === "page") {
          if (funName === "ByDomPath") {
            return `await ${sourceWinVar}.dblclick("${obj.csspath}");`;
          }
          return `await ${getLocator(sourceWinVar)}.dblclick();`;
        }
        else if (sourceWinVar === "iframe") {
          if (funName === "ByDomPath") {
            return `await ${sourceWinVar}.locator("${obj.csspath}".dblclick());`;
          }
          return `await ${getLocator(sourceWinVar)}.dblclick();`;
        }
        break;
      case "input":
        let text = act.inputText;
        console.log("Inner Text: ", text);

        if (funName === "ByDomPath") {
          return `await ${sourceWinVar}.locator("${obj.csspath}").fill('${text}');`;
        }
        else if (funName === "ByRole") {
          return `await ${sourceWinVar}.getByRole("${obj.role}", { name: "${obj.name}" }).fill('${text}')`;
        }
        else if (funName === "ByTitle") {
          return `await ${sourceWinVar}.getByTitle("${obj.title}", {exact: true}).fill('${text}')`;
        }
        break;
      case "dragANDdrop":
        if (act.ddConfig === "drag") {
          return `await ${getLocator(sourceWinVar)}`;
        }
        if (act.ddConfig === "drop") {
          return `${getLocator(targetWinVar)}`;
        }
        break;
      default:
        console.log("Unknown action~");
        break;
    }

  }
  static initListener() {
    window.addEventListener("message", (event) => {

      const data = event.data;
      console.log("📩 PlaywrightCodeGenerator 收到訊息:", data);

      // 假設傳過來是 { type: "generate", action, command }
      if (data.type === "keydown") {
        this.typedText = data.typedText;
      }
    });
  }
  updateUserActionDB(funName, obj, act) {
    //新增到useraction
    if (act.type === "dragANDdrop" && act.ddConfig === "drop") {
      this.userActionDB[this.rightNowAction].setTargetMethod(funName);
      if (funName === "ByTitle") {
        this.userActionDB[this.rightNowAction].setTargetData(obj.title);
      }
      else if (funName === "ByText") {
        this.userActionDB[this.rightNowAction].setTargetData(obj.text);
      }
      else if (funName === "ByDomPath") {
        this.userActionDB[this.rightNowAction].setTargetData(obj.csspath);
      }
    }
    else {
      this.userActionDB[this.rightNowAction].setSourceMethod(funName);
      if (funName === "ByTitle") {
        this.userActionDB[this.rightNowAction].setSourceData(obj.title);
      }
      else if (funName === "ByText") {
        this.userActionDB[this.rightNowAction].setSourceData(obj.text);
      }
      else if (funName === "ByDomPath") {
        this.userActionDB[this.rightNowAction].setSourceData(obj.csspath);
      }
    }
    //else if(funName === )
  }

}

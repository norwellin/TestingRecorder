//import { act } from 'react';
import { PlaywrightCommand } from '../entities/PlaywrightCommand.js';
import { DOMParserService } from './DOMParserService.js';


export class PlaywrightCodeGenerator {
  constructor(iframeWindow, userActionDB){
    this.typedText = '';
    this.domService = new DOMParserService(iframeWindow);
    this.userActionDB = userActionDB;
  }
  generate(action, playwrightCommand, rightNowAction) {
    console.log("action: ",action);
    const sourcepath = this.domService.getAllPath(action.getSourceElement()); //取得所有方法的值
    let targetpath;
    let inputText = "default";
    if (action.type === "dragANDdrop"){
      targetpath = this.domService.getAllPath(action.getTargetElement());
      console.log("inside generate: targetpath  ", targetpath);
    }
    if (action.type === "input"){
      inputText = action.getSourceElement().innerText || action.getSourceElement().value;
      console.log("InputTEXT: ",inputText);
    }
      
    //取得來源window (iframe || main)
    console.log("inside generate: ",this.userActionDB, rightNowAction);
    let sourceWindow = this.userActionDB[rightNowAction].getSourceWindow();
    let targetWindow = this.userActionDB[rightNowAction].getTargetWindow();
    console.log("userDB inside generator: ",this.userActionDB);
    console.log("sourceWin, targetWin, rightnowACT: ", sourceWindow, targetWindow, rightNowAction);
    //解析回傳的元素
    console.log('滑鼠停留在 iframe 中的元素:', targetpath);
    console.log('source path: ', sourcepath);

    if (action.getActionType() === 'dragANDdrop') {
      this.dragAndDropCodeSetter(playwrightCommand, targetpath, sourcepath, sourceWindow, targetWindow);
    }
    else if(action.getActionType() === 'click'){   
      this.clickSetter(playwrightCommand, sourcepath, sourceWindow);
    }
    else if(action.getActionType() === 'dbclick'){
      this.doubleClickSetter(playwrightCommand, sourcepath, sourceWindow);
      ///playwrightCommand.codeSetter(`await page.dbclick('css=${sourcepath}');`);
    }
    else if (action.getActionType() === 'input'){
      this.inputSetter(playwrightCommand, sourcepath, sourceWindow, inputText);
    }
    else if(action.getActionType() === 'keydown'){
      playwrightCommand.codeSetter(`await page.locator('css=${sourcepath}').fill(${this.typedText});`);
    }
  }

  dragAndDropCodeSetter(playwrightCommand, targetpath, sourcepath, sourceWindow, targetWindow){
    //Object.keys(tar)
    //找到存在的最優先順序
    let souPriMin = -1;
    let tarPriMin = -1;
    //找source min最小
    for(let i=0; i<this.domService.priSize; i++){
      if(sourcepath[i]){
        souPriMin = i; 
      }
    }
    //找target min最小
    for(let i=0; i<this.domService.priSize; i++){
      if(targetpath[i]){
        tarPriMin = i;
      }
    }
    console.log("Source priMin: ", souPriMin, "Target Primin: ",tarPriMin);
    let souFunName = sourcepath[souPriMin].funName;
    let souObj = sourcepath[souPriMin].obj;
    console.log("source funName: ",souFunName,"source obj", souObj);

    let tarFunName = targetpath[tarPriMin].funName;
    let tarObj = targetpath[tarPriMin].obj;
    console.log("target funName: ", tarFunName, "target obj: ", tarObj);

    //產出code
    let actDrag = {type: "dragANDdrop", ddConfig: "drag", sourceWindow: sourceWindow, targetWindow: targetWindow};
    let actDrop = {type: "dragANDdrop", ddConfig: "drop", sourceWindow: sourceWindow, targetWindow: targetWindow};
    const souCommand = this.playwrightCodeSetter(souFunName, souObj,  actDrag);
    const tarCommand = this.playwrightCodeSetter(tarFunName, tarObj,  actDrop);

    console.log("tarComnd: ", tarCommand);
    playwrightCommand.codeSetter(`${souCommand}.dragTo(${tarCommand});`);
  }
  clickSetter(playwrightCommand, sourcepath, sourceWindow){
    //找到存在的最優先順序
    console.log("inside CLICK SETTER: ", sourceWindow);
    let priMin = -1;
    for(let i=0; i<this.domService.priSize; i++){
      if(sourcepath[i]){
        priMin = i; 
      }
    }
    console.log("priMin: ", priMin);
    let funName = sourcepath[priMin].funName;
    let obj = sourcepath[priMin].obj;
    console.log("funName: ",funName,"obj", obj);

    //產出code
    let act = {type: "click", addConfig: "", sourceWindow: sourceWindow, targetWindow : ""};
    const command = this.playwrightCodeSetter(funName, obj,  act);
    playwrightCommand.codeSetter(command);
  }
  doubleClickSetter(playwrightCommand, sourcepath, sourceWindow){
    console.log("inside DOUBLE CLICK SETTER: ", sourceWindow);
    let priMin = -1;
    for(let i=0; i<this.domService.priSize; i++){
      if(sourcepath[i]){
        priMin = i; 
      }
    }
    console.log("priMin: ", priMin);
    let funName = sourcepath[priMin].funName;
    let obj = sourcepath[priMin].obj;
    console.log("funName: ",funName,"obj", obj);

    //產出code
    let act = {type: "dbclick", addConfig: "", sourceWindow: sourceWindow, targetWindow : ""};
    const command = this.playwrightCodeSetter(funName, obj,  act);
    playwrightCommand.codeSetter(command);
  }
  inputSetter(playwrightCommand, sourcepath, sourceWindow, inputText){
    console.log("inside input Setter!");
     let priMin = -1;
    for(let i=0; i<this.domService.priSize; i++){
      if(sourcepath[i]){
        priMin = i; 
        break;
      }
    }
    console.log("priMin: ", priMin);
    let funName = sourcepath[priMin].funName;
    let obj = sourcepath[priMin].obj;
    console.log("funName: ",funName,"obj", obj);

    //產出code
    let act = {type: "input", addConfig: "", sourceWindow: sourceWindow, targetWindow : "", inputText: inputText};
    const command = this.playwrightCodeSetter(funName, obj,  act);
    playwrightCommand.codeSetter(command);
  }
  keydownSetter(){

  }
  playwrightCodeSetter(funName, obj, act){//all action have the same code setter. 
    console.log("variable in codeSetter: funName= ", funName, "obg= ",obj, "act = ", act);
    //新版寫法更清晰
    let sourceWinVar = act.sourceWindow;
    let targetWinVar = act.targetWindow;
  
    const getLocator = (windowVar) => {
      switch(funName){
        case "ByRole":
          return `${windowVar}.getByRole("${obj.role}", { name: "${obj.name}" })`;
        case "ByTitle":
          return `${windowVar}.getByTitle("${obj.title}")`;
        case "ByDomPath":
          return `${windowVar}.locator('css=${obj.csspath}')`;
        default:
          return new Error (funName, " Not found!!");
      }
    };
    if(act.type === "click"){
      if(funName === "ByDomPath"){
        return `await ${sourceWinVar}.click('css=${obj.csspath}');`;
      }
      return `await ${getLocator(sourceWinVar)}.click();`;
    }
    else if (act.type === "dbclick"){
      if(funName === "ByDomPath"){
        return `await ${sourceWinVar}.dblclick('css=${obj.csspath}');`;
      }
      return `await ${getLocator(sourceWinVar)}.dblclick();`;
    }
    else if (act.type === 'input'){
      let text = act.inputText;
      console.log("Inner Text: ",text);

      if(funName === "ByDomPath"){
        return `await ${sourceWinVar}.locator('${obj.csspath}').fill('${text}');`;
      }
      else if(funName === "ByRole"){
        return `${windowVar}.getByRole("${obj.role}", { name: "${obj.name}" }).fill('${text}')`;
      }
      else if (funName === "ByTitle"){
        return `${windowVar}.getByTitle("${obj.title}").fill('${text}')`;
      }
    }
    else if (act.type === "dragANDdrop"){
      if (act.ddConfig === "drag") {
        return `await ${getLocator(sourceWinVar)}`;
      }
      if (act.ddConfig === "drop") {
        return `${getLocator(targetWinVar)}`;
      }
    }
//舊版
    /*
    if(funName === "ByRole"){
      if (act.type === "click")
        return `await page.getByRole("${obj.role}", { name: "${obj.name}" }).click();`;
      else if (act.type === "dragANDdrop"){
        if (act.ddConfig === "drag")
          return `await page.getByRole("${obj.role}", { name: "${obj.name}" })`;
        else if (act.ddConfig === "drop")
          return `page.getByRole("${obj.role}", { name: "${obj.name}" })`;
      }
        
    } 
    else if(funName === "ByTitle"){
      if (act.type === "click")
        return `await page.getByTitle("${obj.title}").click();`;
      else if (act.type === "dragANDdrop"){
        if (act.ddConfig === "drag")
          return `await page.getByTitle("${obj.title}")`;
        else if (act.ddConfig === "drop")
          return `page.getByTitle("${obj.title}")`;
      }
        
    }
    else if(funName === "ByDomPath"){
      console.log("in by dom path!!");
      if (act.type === "click")
        return `await page.click('css=${obj.csspath}');`;
      else if (act.type === "dragANDdrop"){
        if (act.ddConfig === "drag")
          return `await page.locator('css=${obj.csspath}')`;
        else if (act.ddConfig === "drop"){
          console.log("in by dom path!! drop");
          return `page.locator('css=${obj.csspath}')`;
        }
          
      }
        
    }
*/
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

}

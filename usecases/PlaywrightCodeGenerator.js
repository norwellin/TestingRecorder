//import { act } from 'react';
import { PlaywrightCommand } from '../entities/PlaywrightCommand.js';
import { DOMParserService } from './DOMParserService.js';


export class PlaywrightCodeGenerator {
  constructor(iframeWindow){
    this.typedText = '';
    this.domService = new DOMParserService(iframeWindow);
  }
  generate(action, playwrightCommand) {
    console.log("action: ",action);
    const sourcepath = this.domService.getAllPath(action.getSourceElement());
    let targetpath;
    if (action.type === "dragANDdrop"){
      targetpath = this.domService.getAllPath(action.getTargetElement());
      console.log("inside generate: targetpath  ", targetpath);
    }
      

    //解析回傳的元素
    console.log('滑鼠停留在 iframe 中的元素:', targetpath);
    console.log('source path: ', sourcepath);

    if (action.getActionType() === 'dragANDdrop') {
      this.dragAndDropCodeSetter(playwrightCommand, targetpath, sourcepath);
    }
    else if(action.getActionType() === 'click'){   
      this.clickSetter(playwrightCommand, sourcepath);
    }
    else if(action.getActionType() === 'dbclick'){
      playwrightCommand.codeSetter(`await page.dbclick('css=${sourcepath}');`);
    }
    else if(action.getActionType() === 'keydown'){
      playwrightCommand.codeSetter(`await page.locator('css=${sourcepath}').fill(${this.typedText});`);
    }
  }

  dragAndDropCodeSetter(playwrightCommand, targetpath, sourcepath){
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
    let actDrag = {type: "dragANDdrop", ddConfig: "drag"};
    let actDrop = {type: "dragANDdrop", ddConfig: "drop"};
    const souCommand = this.playwrightCodeSetter(souFunName, souObj,  actDrag);
    const tarCommand = this.playwrightCodeSetter(tarFunName, tarObj,  actDrop);

    console.log("tarComnd: ", tarCommand);
    playwrightCommand.codeSetter(`${souCommand}.dragTo(${tarCommand});`);
  }
  clickSetter(playwrightCommand, sourcepath){
    //找到存在的最優先順序
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
    let act = {type: "click", addConfig: ""};
    const command = this.playwrightCodeSetter(funName, obj,  act);
    playwrightCommand.codeSetter(command);
  }
  
  keydownSetter(){

  }
  playwrightCodeSetter(funName, obj, act){//all action have the same code setter. 
    console.log("variable in codeSetter: funName= ", funName, "obg= ",obj, "act = ", act);
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
        return `await page.getByTitle(${obj.title}).click();`;
      else if (act.type === "dragANDdrop"){
        if (act.ddConfig === "drag")
          return `await page.getByTitle(${obj.title})`;
        else if (act.ddConfig === "drop")
          return `page.getByTitle(${obj.title})`;
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

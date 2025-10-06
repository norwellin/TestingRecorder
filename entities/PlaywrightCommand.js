export class PlaywrightCommand {
  constructor() {
    this.code = []; // string, e.g., page.click('text=Submit');存放操作內容
    this.code_import = [];
    this.codeOutsider_up = [];
    this.codeOutsider_down = [];
    this.codeWindows = [];

    //一些初始化
    this.code_import.push("import { test, expect } from '@playwright/test'");
    this.codeOutsider_up.push("test.beforeEach('Set up', async ({page}) => {");
    this.codeOutsider_down.push("});");

  }
  codeSetter(codeline) {
    //每次存在倒數第一個前面
    //this.code.splice(this.code.length - 1, 0, codeline);  
    this.code.push(codeline);
  }
  codeImportSetter(codeline){
    //codeline Should be string
    this.code_import.push(codeline);
  }
  codeWindowsSetter(codeline){
    this.codeWindows.push(codeline);
  }
  codeGetter(){
    let all_code = [...this.code_import, ...this.codeOutsider_up, ...this.codeWindows, ...this.code, ...this.codeOutsider_down];

    return all_code;
  }
}

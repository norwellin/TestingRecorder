export class PlaywrightCommand {
  constructor() {
    this.init();
  }

  // 將原本在 constructor 的邏輯抽出來，方便後續 clearCode 時呼叫
  init() {
    this.code = []; 
    this.code_import = [];
    this.codeOutsider_up = [];
    this.codeOutsider_down = [];
    this.codeWindows = [];

    // 一些初始化
    this.code_import.push("import { test, expect } from '@playwright/test'");
    this.codeOutsider_up.push("test('Set up', async ({page}) => {");
    this.codeOutsider_down.push("});");
    this.href = window.location.href;
    this.codeSetter(`await page.goto('${this.href}');`);
  }

  codeSetter(codeline) {
    this.code.push(codeline);
  }
  
  codeImportSetter(codeline){
    this.code_import.push(codeline);
  }
  
  codeWindowsSetter(codeline){
    this.codeWindows.push(codeline);
  }
  
  codeGetter(){
    return [...this.code_import, ...this.codeOutsider_up, ...this.codeWindows, ...this.code, ...this.codeOutsider_down];
  }

  // ==========================================
  // 新增：相容新版 MainApp1.js 所需的介面方法
  // ==========================================
  appendCode(line) {
    this.codeSetter(line);
  }

  getCode() {
    return this.codeGetter();
  }

  clearCode() {
    this.init(); // 呼叫 init 重新給予乾淨的陣列與起手式
  }
}
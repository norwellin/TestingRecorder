export class PlaywrightCommand {
  constructor() {
    this.code = []; // string, e.g., page.click('text=Submit');
  }
  codeSetter(codeline) {
    this.code.push(codeline);
  }
  codeGetter(){
    return this.code;
  }
}

export class PlaywrightCommand {
  constructor(code) {
    this.code = code; // string, e.g., page.click('text=Submit');
  }
  codeGetter(){
    return this.code;
  }
}

export class PlaywrightCommand {
  constructor(code) {
    this.code = code; // string, e.g., page.click('text=Submit');
  }
  static codeGetter(){
    return this.code;
  }
}

import { PlaywrightCommand } from '../entities/PlaywrightCommand.js';
import { DOMParserService } from './DOMParserService.js';


export class PlaywrightCodeGenerator {
  static generate(action, playwrightCommand) {
    console.log("action: ",action);
    const targetpath = DOMParserService.getDomPath(action.getTargetElement());
    const sourcepath = DOMParserService.getDomPath(action.getSourceElement());
    console.log('滑鼠停留在 iframe 中的元素:', targetpath);
    console.log('source path: ', sourcepath);
    if (action.getActionType() === 'dragANDdrop') {
      playwrightCommand.codeSetter(`await page.locator('css=${sourcepath}').dragTo(iframe.locator('css=${targetpath}');`);
    }
    else if(action.getActionType() === 'click'){
      playwrightCommand.codeSetter(`await page.click('css=${sourcepath}')`);
    }
  }
}

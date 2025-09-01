import { PlaywrightCommand } from '../entities/PlaywrightCommand.js';
import { DOMParserService } from './DOMParserService.js';


export class PlaywrightCodeGenerator {
  static generate(action, playwrightCommand) {
    const targetpath = DOMParserService.getDomPath(action.getTargetElement());
    const sourcepath = DOMParserService.getDomPath(action.getSourceElement());
    console.log('滑鼠停留在 iframe 中的元素:', targetpath);
    console.log('source path: ', sourcepath);
    if (action.getActionType() === 'drag') {
      playwrightCommand.codeSetter(`await page.locator('[title = '${action.getSourceElement().title}']').dragTo(iframe.locator(css=${targetpath}));`);
    }
    else if(action.getActionType() === 'click'){
      playwrightCommand.codeSetter(`await page.click('${sourcepath}')`);
    }
  }
}

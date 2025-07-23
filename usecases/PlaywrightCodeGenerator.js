import { PlaywrightCommand } from '../entities/PlaywrightCommand.js';
import { DOMParserService } from './DOMParserService.js';


export class PlaywrightCodeGenerator {
  static generate(action) {
    const targetpath = DOMParserService.getDomPath(action.getTargetElement());
    console.log('滑鼠停留在 iframe 中的元素:', targetpath);
    if (action.getActionType() === 'drag') {
      return new PlaywrightCommand(
        //`await page.dragAndDrop('${action.source.textContent}', '${action.target.textContent}')`
        //await page.locator('[title = "ion-tabs"]').dragTo(frame.locator('ion-content'));
        `await page.locator('[title = '${action.getSourceElement().title}']').dragTo(iframe.locator(css=${targetpath}));`
      );
    }
    return new PlaywrightCommand('// Unknown action');
  }
}

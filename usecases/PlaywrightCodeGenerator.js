import { PlaywrightCommand } from '../entities/PlaywrightCommand.js';
import { DOMParserService } from './DOMParserService.js';


export class PlaywrightCodeGenerator {
  static generate(action, iframe, sourceEl, targetEl) {
    const sourcepath = DOMParserService.getDomPath(sourceEl);
    const targetpath = DOMParserService.getDomPath(targetEl);

    if (action.type === 'drag') {
      return new PlaywrightCommand(
        //`await page.dragAndDrop('${action.source.textContent}', '${action.target.textContent}')`
        `await page.locator(${sourcepath}).dragTo(${iframe}.locator(${targetpath}));`
      );
    }
    return new PlaywrightCommand('// Unknown action');
  }
}

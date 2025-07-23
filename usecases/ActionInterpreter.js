import { UserAction } from '../entities/UserAction.js';

import { DOMParserService } from './DOMParserService.js';

export class ActionInterpreter {

  static interpretDrag(sourceEl, targetEl) {
    return new UserAction({
      type: 'drag',
      source: sourceEl,
      target: targetEl,
  });
  }
}

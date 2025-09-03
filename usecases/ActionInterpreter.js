import { UserAction } from '../entities/UserAction.js';

import { DOMParserService } from './DOMParserService.js';

export class ActionInterpreter {

  static interpretDrag(action_type, sourceEl, targetEl) {
    return new UserAction(action_type,sourceEl,targetEl); 
  }
}

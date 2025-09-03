// usecases 負責邏輯層
import { DOMElement } from './../entities/DOMElement.js';

export class DOMParserService {
  constructor() { }

  static getDomPath(el) {
    console.log("el: ",el);
    const path = [];
    while (el && el.nodeType === Node.ELEMENT_NODE) {
      let name = el.nodeName.toLowerCase();

      let siblingIndex = 1;
      let sibling = el;
      while ((sibling = sibling.previousElementSibling)) {
        if (sibling.nodeName === el.nodeName) {
          siblingIndex++;
        }
      }
      if (siblingIndex > 1) {
        name += `:nth-of-type(${siblingIndex})`;
      }
      path.unshift(name);
      el = el.parentElement;

    }
    return path.join(' > ');
  }
}

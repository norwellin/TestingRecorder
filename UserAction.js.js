export class UserAction {
  constructor(type, target) {
    this.type = type; // 'click' or 'drag'
    this.target = target; // DOMElement
  }
}

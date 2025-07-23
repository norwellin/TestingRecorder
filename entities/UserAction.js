export class UserAction {
  constructor(type, source,target) {
    this.type = type; // 'click' or 'drag'
    this.source = source; // Could be NULL for click actions
    this.target = target; // DOMElement
  }
}

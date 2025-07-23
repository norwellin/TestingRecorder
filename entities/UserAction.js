export class UserAction {
  constructor({ type, source, target }) {
    this.type = type;
    this.source = source;
    this.target = target;
  }

  getActionType() {
    return this.type;
  }
  getSourceElement() {
    return this.source;
  }
  getTargetElement() {
    return this.target;
  }
}

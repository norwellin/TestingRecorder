export class UserAction {
  constructor(type, source, target) {
    this.type = type; //string event type
    this.source = source; // event.target (whole node of the event)
    this.target = target;
  }

  setActionType(type) {
    this.type = type;
  }
  setSourceElement(source){
    this.source = source;
  }
  setTargetElement(target){
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

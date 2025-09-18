export class UserAction {
  constructor(type, source, target, sourceWindow, targetWindow) {
    this.type = type; //string event type
    this.source = source; // event.target (whole node of the event)
    this.target = target;
    this.sourceWindow = sourceWindow;
    this.targetWindow = targetWindow;
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
  setSourceWindow(sourceWindow){
    this.soureWindow = sourceWindow;
  }
  setTargetWindow(targetWindow){
    this.targetWindow = targetWindow;
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
  getSourceWindow(){
    return this.sourceWindow;
  }
  getTargetWindow(){
    return this.targetWindow;
  }
}

export class UserAction {
  constructor(type, source, target, sourceWindow, targetWindow) {
    this.type = type; //string event type
    this.source = source; // event.target (whole node of the event) //keyboard 存放key
    this.target = target;
    this.sourceWindow = sourceWindow;//存放變數名稱，main window無變數就叫window
    this.targetWindow = targetWindow;
    this.sourceMethod = null;
    this.sourceData = null;
    this.targetMethod = null;
    this.targetData = null;
    this.keyboard = null; //only use for keyboard event - type: text
  }
  setKeyboard(key){
    this.keyboard = key;
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
  setSourceMethod(sourceMethod){
    this.sourceMethod = sourceMethod;
  }
  setSourceData(sourceData){
    this.sourceData = sourceData;
  }
  setTargetMethod(targetMethod){
    this.targetMethod = targetMethod;
  }
  setTargetData(targetData){
    this.targetData = targetData;
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
  getSourceMethod(){
    return this.sourceMethod;
  }
  getSourceData(){
    return this.sourceData;
  }
  getTargetMethod(){
    return this.targetMethod;
  }
  getTargetData(){
    return this.targetData;
  }
  getKeyboard(){
    return this.keyboard;
  }
}

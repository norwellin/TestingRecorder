export class UserAction {
  constructor(type, source, target, sourceWindow, targetWindow) {
    this.type = type; //string event type
    this.source = source; // event.target (whole node of the event) //keyboard 存放key
    this.target = target;
    this.sourceWindow = sourceWindow;//存放變數名稱，main window無變數就叫window
    this.targetWindow = targetWindow;
    this.sourceContext = null;
    this.targetContext = null;
    this.sourceMethod = null;
    this.sourceData = null;
    this.sourceDomPathChain = [];
    this.sourceDomPathOptions = [];
    this.sourceLocatorOptions = [];
    this.targetMethod = null;
    this.targetData = null;
    this.targetDomPathChain = [];
    this.targetDomPathOptions = [];
    this.targetLocatorOptions = [];
    this.keyboard = null; //only use for keyboard event - type: text
    this.selectedText = null;// only use for drop-down menu - type: text
    this.selectedValue = null;
    this.path = null; //csspath
    this.inputText = ""; //only use for input event - type: text 

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
    this.sourceWindow = sourceWindow;
  }
  setTargetWindow(targetWindow){
    this.targetWindow = targetWindow;
  }
  setSourceContext(sourceContext){
    this.sourceContext = sourceContext || null;
  }
  setTargetContext(targetContext){
    this.targetContext = targetContext || null;
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
  setSelectedText(text){
    this.selectedText = text; 
  }
  setSelectedValue(value){
    this.selectedValue = value;
  }
  setInputText(text){
    this.inputText = text;
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
  getSourceContext(){
    return this.sourceContext;
  }
  getTargetContext(){
    return this.targetContext;
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
  getSelectedText(){
    return this.selectedText;
  }
  getSelectedValue(){
    return this.selectedValue;
  }
  getInputText(){
    return this.inputText;
  }
}

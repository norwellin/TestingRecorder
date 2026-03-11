//https://www.npmjs.com/package/css-selector-generator?utm_source=chatgpt.com
import { getCssSelector } from "css-selector-generator";

document.addEventListener("click", (e) => {
  document.addEventListener("change", (e) => {
  console.log("selector change detected");
    const element = e.target;
    //css selector
    const selector = getCssSelector(element);
    console.log("selecstor change: ", selector);
    console.log("selector e.target.value: ",e.target.value);
    findUnique(selector);
});
 // get reference to the element user clicked on
  const element = e.target;
  // get unique CSS selector for that element
  const selector = getCssSelector(element, { selectors: ["class", "tag"] });
  // do whatever you need to do with that selector
  console.log("selector", selector);
  findUnique(selector);
});
  
function findUnique(path){
  const element = document.querySelectorAll(path);
  if(element.length === 1){
    console.log("This csspath is unique");
  }
  else{
    console.log("This is not unique");
  }
}
function wirteToDoc(){

}
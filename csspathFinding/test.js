//https://www.npmjs.com/package/css-selector-generator?utm_source=chatgpt.com
import { getCssSelector } from "css-selector-generator";

document.addEventListener("click", (e) => {
  // get reference to the element user clicked on
  const element = e.target;
  // get unique CSS selector for that element
  const selector = getCssSelector(element, { selectors: ["id", "class", "tag"] });
  // do whatever you need to do with that selector
  console.log("selector", selector);
});
  document.addEventListener("change", (e) => {
  console.log("selector change detected");
    const element = e.target;
    const selector = getCssSelector(element);
    console.log("selector change: ", selector);
    console.log("selector e.target.value: ",e.target.value);
});
import getDomPath from "chrome-dompath";

document.addEventListener("click", (e) => {
 console.log("click  event detcted");
    const element = e.target;
    const DOMPath = require('chrome-dompath');
    console.log("1: ",DOMPath.fullQualifiedSelector(element, true));
    console.log("2: ",DOMPath.jsPath(element, true));
    console.log("3: ", DOMPath.xPath(element, true));
},true);
  document.addEventListener("change", (e) => {
  console.log("selector change detected");
    const element = e.target;
    const DOMPath = require('chrome-dompath');
console.log("1: ",DOMPath.fullQualifiedSelector(element, true));
    console.log("2: ",DOMPath.jsPath(element, true));
    console.log("3: ", DOMPath.xPath(element, true))
});
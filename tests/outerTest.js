//https://www.npmjs.com/package/css-selector-generator?utm_source=chatgpt.com
import { getCssSelector } from "css-selector-generator";
import { select } from 'optimal-select' // global: 'OptimalSelect'
const XLSX = require("xlsx");
// 用來存所有輸入紀錄
const records_css = [], reocrds_opt = [], records_dom = [];
const pressedKeys = new Set();

document.addEventListener("keydown", (e) => {
  // 忽略重複觸發（長按）
  if (e.repeat) return;

  pressedKeys.add(e.key.toLowerCase());

  // 同時按下 s + a + e
  if (
    pressedKeys.has("s") &&
    pressedKeys.has("a") 
  ) {
    console.log("🔥 S + A + E detected → save");

    writeToExcel(records_css, reocrds_opt, records_dom);

    // 防止連續觸發
    pressedKeys.clear();
  }
});

document.addEventListener("keyup", (e) => {
  pressedKeys.delete(e.key.toLowerCase());
});
document.addEventListener("click", (e) => {
 // get reference to the element user clicked on
  const element = e.target;
    let css_record, opt_record, dom_record;

  // css selector
  const selector = getCssSelector(element, { selectors: ["class", "tag"], blacklist: ["id"] });
  // do whatever you need to do with that selector,
  console.log("selector", selector);
  
  if(findUnique(selector)){
    css_record = {event: "click", path: selector, unique: "yes"};
  }
  else{
    css_record = {event: "click", path: selector, unique: "no"};
  }
  records_css.push(css_record);
  //optimal select
    let opt_selector = select(e.target, {
      root: document,
      ignore: {
        id: true
      }
    });
    if(findUnique(opt_selector)){
    opt_record = {event: "click", path: opt_selector, unique: "yes"};
  }
  else{
    opt_record = {event: "click", path: opt_selector, unique: "no"};
  }
  reocrds_opt.push(opt_record);
  //dompath
    const DOMPath = require('chrome-dompath');

    let dom_selector = DOMPath.fullQualifiedSelector(e, true);
    if(findUnique(dom_selector)){
    dom_record = {event: "click", path: opt_selector, unique: "yes"};
  }
  else{
    dom_record = {event: "click", path: opt_selector, unique: "no"};
  }
  records_dom.push(dom_record);
});
 document.addEventListener("change", (e) => {
   const element = e.target;
    let css_record, opt_record, dom_record;

  // css selector
  const selector = getCssSelector(element, { selectors: ["class", "tag"], blacklist: ["id"] });
  // do whatever you need to do with that selector,
  console.log("selector", selector);
  
  if(findUnique(selector)){
    css_record = {event: "click", path: selector, unique: "yes"};
  }
  else{
    css_record = {event: "click", path: selector, unique: "no"};
  }
  records_css.push(css_record);
  //optimal select
    let opt_selector = select(e.target, {
      root: document,
      ignore: {
        id: true
      }
    });
    if(findUnique(opt_selector)){
    opt_record = {event: "click", path: opt_selector, unique: "yes"};
  }
  else{
    opt_record = {event: "click", path: opt_selector, unique: "no"};
  }
  reocrds_opt.push(opt_record);
  //dompath
    const DOMPath = require('chrome-dompath');
  try {
    let dom_selector = DOMPath.fullQualifiedSelector(e, true);
    console.log("dom: ",dom_selector);
    if(findUnique(dom_selector)){
    dom_record = {event: "click", path: dom_selector, unique: "yes"};
  }
  else{
    dom_record = {event: "click", path: dom_selector, unique: "no"};
  }
  } catch (error) {
    dom_record = {event: "click", path: "not find!", unique: "no"};
  }
    
  records_dom.push(dom_record);
}); 
function findUnique(path){
  const element = document.querySelectorAll(path);
  console.log("element: ",element);
  if(element.length === 1){  
    console.log("This csspath is unique");
    return true;
}
  else{
    console.log("This is not unique");
    return false;
  }
}
function writeToExcel(css, opt, dom) {
  if (css.length === 0 || opt.length === 0) {
    alert("沒有資料可以匯出");
    return;
  }

  const ws = XLSX.utils.json_to_sheet(css);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "UserInput");

  XLSX.writeFile(wb, "target_record/css.xlsx");

    const ws1 = XLSX.utils.json_to_sheet(opt);
  const wb1 = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb1, ws1, "UserInput");

  XLSX.writeFile(wb1, "target_record/opt.xlsx");

    const ws2 = XLSX.utils.json_to_sheet(dom);
  const wb2 = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb2, ws2, "UserInput");

  XLSX.writeFile(wb2, "target_record/dom.xlsx");
}

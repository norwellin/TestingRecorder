import { select } from 'optimal-select' // global: 'OptimalSelect'
import { DOMParserService } from '../usecases/DOMParserService';
import { WindowsCatcher } from '../WindowsCatcher';
//window.global ||= window;
//https://github.com/autarc/optimal-select/

document.addEventListener('click', (e) => {
  console.log("TEST FILE: click detected");


  
  // 使用 Optimal-Select 嚴格模式參數
  const selector = select(e.target);

  console.log("Generated unique selector:", selector);
},true);
document.addEventListener("change", (e) => {
  if (e.target.tagName !== "SELECT") return;
  let window = new WindowsCatcher();
  const { mainWindow, iframeWindows } = window.getWindows();
    let domService = new DOMParserService(iframeWindows);
     const selectEl = e.target.closest("select");
  if (selectEl) {
    console.log("SELECT changed →", selectEl.value);
    console.log("DOMPATH →", domService.getOpenSourcePath(e.target, "page"));
  }
},true);
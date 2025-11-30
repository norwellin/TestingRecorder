import { select } from 'optimal-select' // global: 'OptimalSelect'
//window.global ||= window;
//https://github.com/autarc/optimal-select/
console.log("TEST FILE!");
 const iframe = document.querySelector('iframe');
const iframeWindows = iframe?.contentWindow || null;
const iframeDoc = iframeWindows.document;
iframeWindows.document.addEventListener('mousedown', (e) => {
  console.log("TEST FILE: click detected");


  
  // 使用 Optimal-Select 嚴格模式參數
  const selector = select(e.target, {
    root: iframeDoc,
    ignore: {
      id: true
    }
  });

  console.log("Generated unique selector:", selector);
});

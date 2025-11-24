import { select } from 'optimal-select' // global: 'OptimalSelect'
//window.global ||= window;
//https://github.com/autarc/optimal-select/

document.addEventListener('click', (e) => {
  console.log("TEST FILE: click detected");

  // 使用 Optimal-Select 嚴格模式參數
  const selector = select(e.target, {
    selector: {
      type: 'all',            // 使用所有可用條件
      combination: 'combine', // 多個條件組合
      root: document          // 從 document 開始
    },
    includeTag: true,         // 包含 tag
    includeId: true,          // 包含 id
    includeClass: true,       // 包含 class
    includeAttribute: true,   // 包含其他 attribute
    attribute: {
      blacklist: ['style', 'data-reactid'] // 忽略容易重複的屬性
    },
    validateSelector: true    // 驗證唯一性
  });

  console.log("Generated unique selector:", selector);
},true);

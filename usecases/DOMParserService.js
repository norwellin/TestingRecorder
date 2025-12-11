// usecases 負責邏輯層
import { DOMElement } from './../entities/DOMElement.js';
import { DIALOG_SELECTORS as ds} from './../config.js';
import { optimize, select } from 'optimal-select' // global: 'OptimalSelect'
import cssPath from 'css-path';

export class DOMParserService {
  constructor(iframeWindow) {
    this.iframeWindow = iframeWindow;
    this.iframeDoc = iframeWindow.document;

    this.DIALOG_SELECTORS = ds;

    this.priSize = 4;
    this.priority = { //要新增方法改這裡就可以
      0: "ByRole",
      1: "ByTitle",
      2: "ByText",
      3: "ByDomPath",
      4: "ByPlaceholder",
      5: "ByAltText",
      6: "ByLabel"
    };
    this.allAttributeInfo = { //根據節點取到所有可以找到唯一path的屬性
      tagName: null,
      id: null,
      className: null,
      title: null,
      text: null,
      placeholder: null,
      alt: null,
      ariaLabel: null,
      role: null
    };
    this.playwrightObj = { //playwright所有方法與要存的內容
      ByRole: { name: null, role: null, index: null },
      ByLabel: {},
      ByPlaceholder: {},
      ByText: { text: null },
      ByTitle: { title: null },
      ByAltText: {},
      ByDomPath: { csspath: null }
    };
    this.playwrightMethodsStatus = {
      ByRole: false,
      ByLabel: false,
      ByPlaceholder: false,
      ByText: true,
      ByTitle: true,
      ByAltText: false,
      ByDomPath: true
    };
  }
  getOpenSourcePath(e, sourceWin, type){
    // 使用 Optimal-Select 嚴格模式參數
    //iframe部參考id
    this.cleanInfo();
    this.setInfo(e);
    this.clearPlaywrightObj();
    console.log("All Attribute Info: ", this.allAttributeInfo);
        let isUniqueObj = {
      ByTitle: false,
      ByDomPath: false,
      ByText: false
    };

    if (type === "change"){ //<select>用別的處理
      const DOMPath = require('chrome-dompath');

      let selector = DOMPath.fullQualifiedSelector(e, true);
      isUniqueObj.ByDomPath = true;
      this.playwrightObj.ByDomPath.csspath = selector;
      console.log("Generated unique selector_change:",selector);
    }
    else{
        let doc = document;
    let myBlacklist = ['style', 'data-reactid'];
    let myPri = ['id','div'];
    let myIgnore = {
        id: true,
        attribute (name, value, defaultPredicate) {
      // exclude HTML5 data attributes
      return (/data-*/).test(name) || defaultPredicate(name, value)
    }
    };
    if (sourceWin === "iframe"){
      console.log("inside iframe!!!");
      doc = this.iframeDoc;
      myBlacklist = ['style', 'data-reactid', 'id'];
      myPri = ['div'];
      myIgnore =  {
        id: true,
        attribute (name, value, defaultPredicate) {
      // exclude HTML5 data attributes
      return (/data-*/).test(name) || defaultPredicate(name, value)
    }
    };
  }

let selector = select(e, {
  root: doc,
      ignore: myIgnore,
      priority: myPri
});

isUniqueObj.ByDomPath = true;
this.playwrightObj.ByDomPath.csspath = selector;
  console.log("Generated unique selector:", selector);
    }
    
//找bytitle
    if (this.checkUniqueByTitle(this.allAttributeInfo.title)) {
      this.playwrightObj.ByTitle.title = this.allAttributeInfo.title;
      isUniqueObj.ByTitle = true;
    } else {
      isUniqueObj.ByTitle = false;
    }

    //find byText
    if (this.checkUniqueByText(this.allAttributeInfo.text)) {
      this.playwrightObj.ByText.text = this.allAttributeInfo.text;
      isUniqueObj.ByText = true;
    } else {
      isUniqueObj.ByText = false;
    }

     //決定回傳物件
    let newObj = {};
    // 遍歷 priority (保證按照數字順序 0 → 6)
    for (let i = 0; i < this.priSize; i++) {
      let key = this.priority[i];
      if (isUniqueObj[key]) {
        newObj[i] = { funName: key, obj: this.playwrightObj[key] };
      }
    }
    if (Object.keys(newObj).length === 0){
      throw new Error ("Can't find the unique path here!");
    }
    console.log("newObj: ", newObj);
    return newObj; //return 按照優先順序排列的array path,ex: [{},{},{}]
  }
  getAllPath(el, sourceWin) {
    console.log("el:", el);
    this.cleanInfo();
    this.setInfo(el);
    this.clearPlaywrightObj();
    console.log("All Attribute Info: ", this.allAttributeInfo);
    let isUniqueObj = {
      ByRole: false,
      ByTitle: false,
      ByDomPath: false,
      ByText: false
    };
    //先找dompath
    //const dompath = this.getShortUniqueDomPath(el);
    //console.log("dompath inside getAllPath: ",dompath);
    const dompath = this.getUniquePath(el);
    if (this.checkUniqueByDompath(dompath)) {
      console.log("DOMPATH is UNIQUE!!!!");
      //this.playwrightObj.ByDomPath.csspath = dompath;
      this.playwrightObj.ByDomPath.csspath = dompath;
      console.log("dompah inside playwrightObj: ", this.playwrightObj);
      isUniqueObj.ByDomPath = true;
    }
    else {
      console.log("dompath is not unique~");
      isUniqueObj.ByDomPath = false;
    }


    //找byrole
    //let roleIndex = this.getRoleNthIndex(el, this.allAttributeInfo.role, this.allAttributeInfo.tagName);
    if (this.getPlaywrightRole(el, sourceWin)) {
      console.log("Role - attributeInfo: ", this.allAttributeInfo," obj: ", this.playwrightObj);
      
      //this.playwrightObj.ByRole.name = this.allAttributeInfo.tagName;
      //this.playwrightObj.ByRole.role = this.allAttributeInfo.role;
      isUniqueObj.ByRole = true;
    } else {
      isUniqueObj.ByRole = false;
    }

    //找bytitle
    if (this.checkUniqueByTitle(this.allAttributeInfo.title)) {
      this.playwrightObj.ByTitle.title = this.allAttributeInfo.title;
      isUniqueObj.ByTitle = true;
    } else {
      isUniqueObj.ByTitle = false;
    }

    //find byText
    if (this.checkUniqueByText(this.allAttributeInfo.text)) {
      this.playwrightObj.ByText.text = this.allAttributeInfo.text;
      isUniqueObj.ByText = true;
    } else {
      isUniqueObj.ByText = false;
    }

    //決定回傳物件
    let newObj = {};


    // 遍歷 priority (保證按照數字順序 0 → 6)
    for (let i = 0; i < this.priSize; i++) {
      let key = this.priority[i];
      if (isUniqueObj[key]) {
        newObj[i] = { funName: key, obj: this.playwrightObj[key] };
      }
    }
    if (Object.keys(newObj).length === 0){
      throw new Error ("Can't find the unique path here!");
    }
    console.log("newObj: ", newObj);
    return newObj; //return 按照優先順序排列的array path,ex: [{},{},{}]
  }

  inferRole(el) {
  if (el.hasAttribute('role')) return el.getAttribute('role');

  switch (el.tagName.toLowerCase()) {
    case 'button': return 'button';
    case 'a': return el.hasAttribute('href') ? 'link' : null;
    case 'input': {
      const type = el.getAttribute('type') || 'text';
      if (type === 'checkbox') return 'checkbox';
      if (type === 'radio') return 'radio';
      return 'textbox';
    }
    case 'img': return 'img';
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6': return 'heading';
    default: return null;
  }
}
getPlaywrightRole(el, sourceWin) {
  if (!(el instanceof Element)) return null;

  // 1️⃣ 取得角色
  const role = el.getAttribute('role') || this.inferRole(el);
  if (!role) return null;

  // 2️⃣ 取得名稱
  const name =
    el.getAttribute('aria-label') ||
    el.getAttribute('alt') ||
    el.getAttribute('placeholder') ||
    el.textContent.trim();

  // 🔍 3️⃣ 找出要搜尋的文件對象（支援 window / iframe）
  let targetDoc;
  if (sourceWin === "page") {
    targetDoc = document;
  } else if (sourceWin === "iframe") {
    targetDoc = this.iframeDoc;
  } else {
    throw new Error("❌ sourceWin must be 'page' or 'iframe'");
  }

  // 🧱 4️⃣ 嘗試找出最近的對話框 / modal 容器
  /*
  const DIALOG_SELECTORS = [
    '[role="dialog"]',
    '.modal',
    'dialog',
    '.gjs-mdl-container',
    '.gjs-mdl-dialog',
    '.ant-modal',
    '.MuiDialog-root',
    '.chakra-modal__content',
    '.ion-modal',
    '.swal2-popup'
  ];
*/
  let containerEl = null;
  for (const sel of this.DIALOG_SELECTORS) {
    containerEl = el.closest(sel);
    if (containerEl) break;
  }
  console.log("Role - container: ",containerEl);

  // 如果找到對話框，就只在該容器內搜尋；
  // 否則 fallback 回整個 document。
  const searchRoot = containerEl || targetDoc;

  // 🧭 5️⃣ 搜尋所有相同 role + name 的元素（限制範圍在 searchRoot）
  const allSame = Array.from(searchRoot.querySelectorAll('*')).filter(e => {
  const style = window.getComputedStyle(e);
  if (style.display === 'none' || style.visibility === 'hidden') return false;

  const r = e.getAttribute('role') || this.inferRole(e);
  if (r !== role) return false;

  const n =
    e.getAttribute('aria-label') ||
    e.getAttribute('alt') ||
    e.getAttribute('placeholder') ||
    e.textContent.trim();

  return n === name;
});

  const index = allSame.indexOf(el);
  const isUnique = allSame.length === 1;

  // 🧾 儲存結果
  this.playwrightObj.ByRole.index = index;
  this.playwrightObj.ByRole.name = name;
  this.playwrightObj.ByRole.role = role;

  // ✅ 如果唯一就回傳 true
  console.log("Role - Dialoog Selectors: ",this.DIALOG_SELECTORS);
  console.log("Role - AllSame: ",allSame);
  if (isUnique) {
    console.log(`Role - ✅ 唯一 getByRole(${role}, { name: '${name}' })`);
    return true;
  } else {
    console.log(
      `Role - ⚠️ 找到 ${allSame.length} 個相同 role/name 的元素（搜尋範圍：${containerEl ? 'dialog' : 'document'}）`
    );
    return false;
  }
}


/*
 getPlaywrightRole(el, sourceWin) {
  if (!(el instanceof Element)) return null;

  // 1️⃣ 取得角色
  const role = el.getAttribute('role') || this.inferRole(el);
  if (!role) return null;

  // 2️⃣ 取得名稱
  const name =
    el.getAttribute('aria-label') ||
    el.getAttribute('alt') ||
    el.getAttribute('placeholder') ||
    el.textContent.trim();


    
  // 3️⃣ 找出全頁面相同 role 的元素
  //在window找
  let allSameRole;
  let index = 0;
  
  console.log("Role - sourceWIn: ",sourceWin);
  //console.log("Role - view: ", el.ownerDocument.defaultView);
  if(sourceWin === "page"){
      console.log("Role- :element inside window");
  allSameRole = Array.from(document.querySelectorAll('*'))
    .filter(e => (e.getAttribute('role') || this.inferRole(e)) === role);

  // 4️⃣ 找出 el 在這些元素中的第幾個
  index = allSameRole.indexOf(el);
  console.log("Role - allSame: ",allSameRole);
  }
  //*******目前只支援一個iframe因此這樣寫
  else if (sourceWin === "iframe") {
    console.log("Role- :element inside iframe");
      allSameRole = Array.from(this.iframeDoc.querySelectorAll('*'))
    .filter(e => (e.getAttribute('role') || this.inferRole(e)) === role);

  // 4️⃣ 找出 el 在這些元素中的第幾個
  index = allSameRole.indexOf(el);
  console.log("Role - allSame: ",allSameRole);
  }
  else{
    throw new Error("source Window Not Exit!");
  }

  if(index < 0) index = 0;

  this.playwrightObj.ByRole.index = index;
  this.playwrightObj.ByRole.name = name;
  this.playwrightObj.ByRole.role = role;

  if(role){
    return true;
  }
  return false;

}

*/
  getDomPath(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';

    const path = [];

    while (el && el.nodeType === Node.ELEMENT_NODE) {
      let selector = el.nodeName.toLowerCase();

      /*
      // 如果有 ID，直接回傳
      if (el.id) {
        selector += `#${el.id}`;
        path.unshift(selector);
        break; // 因為 ID 已經唯一，不用再往上
      }
  */
      // 如果有 class，加上 class
      if (el.className) {
        // 避免有多個 class，只取第一個
        const className = el.className.split(' ')[0];
        if (className) {
          selector += `.${className}`;
        }
      }

      // 檢查是否需要 nth-of-type
      let siblingIndex = 1;
      let sibling = el;
      while ((sibling = sibling.previousElementSibling)) {
        if (sibling.nodeName === el.nodeName) {
          siblingIndex++;
        }
      }
      if (siblingIndex > 1) {
        selector += `:nth-of-type(${siblingIndex})`;
      }

      path.unshift(selector);
      el = el.parentElement;
    }
    //console.log(this.isUnique(path.join('>')));
    let newpath = path.join('>');
    console.log("dom path: ", newpath);
    return newpath;
  }
  ///////自己寫
  getUniquePath(el){
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';
    const path = [];

    while (el && el.nodeType === Node.ELEMENT_NODE){
      let tag = el.tagName.toLowerCase();

      const parent = el.parentElement;
      if(parent){
        console.log("parent children: ",Array.from(parent.children));
        const siblings = Array.from(parent.children).filter(
        sib => sib.tagName === el.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(el) + 1;
        tag += `:nth-of-type(${index})`;
      }
            // 組成 fullPath 並檢查是否唯一
      const fullPath = path.length ? `${tag} > ${path.join(' > ')}` : tag;
      if (document.querySelectorAll(fullPath).length === 1) {
        path.unshift(tag);
        console.log("short: full path只有一個");
        console.log("short path:" ,path);
        console.log("short -----------------");
        break;
      }
    }
      
      
    path.unshift(tag);
    el = el.parentElement;
    }
    console.log("parent children path: ",path);
    return path.join(' > ');
  }


 

  getShortUniqueDomPath(el, opts = {}) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';
    const maxDepth = typeof opts.maxDepth === 'number' ? opts.maxDepth : 8;
    //console.log("short unique: ", el);
    /*
    // 如果有 ID，且確定唯一，直接回傳
    if (el.id) {
      const escapedId = CSS.escape(el.id);
      if (document.querySelectorAll(`#${escapedId}`).length === 1) return `#${escapedId}`;
    }
  */
    const path = [];
    let current = el;
    let depth = 0;

      // ✅ Step 1: 若有 aria-labelledby 屬性，嘗試取得對應文字
  const labelledById = el.getAttribute('aria-labelledby');
  if (labelledById) {
    const labelElement = document.getElementById(labelledById);
    if (labelElement) {
      console.log('🔹 有 aria-labelledby，對應 label 文字：', labelElement.textContent.trim());
      // 這裡可以選擇回傳 label 內容或 selector
      return '#'+labelledById;
    } else {
      console.warn('⚠️ 找不到對應的 label 元素：', labelledById);
    }
  }
    while (current && current.nodeType === Node.ELEMENT_NODE && depth < maxDepth) {
      depth++;
      let selector = current.tagName.toLowerCase();

      // 如果有 class，嘗試用某個唯一 class（需 escape）
      if (current.className && typeof current.className === 'string') {
        const classList = current.className.trim().split(/\s+/).filter(Boolean);
        for (const cls of classList) {
          const esc = CSS.escape(cls);
          const testSelector = `${selector}.${esc}`;
          if (document.querySelectorAll(testSelector).length === 1) {
            selector = testSelector;
            break;
          }
        }
      }

      // 組成 fullPath 並檢查是否唯一
      const fullPath = path.length ? `${selector} > ${path.join(' > ')}` : selector;
      if (document.querySelectorAll(fullPath).length === 1) {
        path.unshift(selector);
        console.log("short: full path只有一個");
        console.log("short path:" ,path);
        console.log("short -----------------");
        break;
      }

      // nth-of-type 作為最後手段（只在必要時加）
      let siblingIndex = 1;
      let sibling = current;
      while ((sibling = sibling.previousElementSibling)) {
        if (sibling.nodeName === current.nodeName) siblingIndex++;
      }
      if (siblingIndex > 1) selector += `:nth-of-type(${siblingIndex})`;

      path.unshift(selector);
      console.log("short: sibling finded siblingIndex: ",siblingIndex);
        console.log("short path:" ,path);
        console.log("short -----------------");
      current = current.parentElement;
    }
    console.log("short unique path: ", path.join(' > '));
    return path.join(' > ');
  }



  checkUniqueByDompath(path) {
    //console.log("iframeDOC: ", this.iframeDoc)
    //console.log("all dom path", document.querySelectorAll(path));
    let main_findLength = 0;
    let iframe_findLength = 0;
    //先檢查main window
    main_findLength = document.querySelectorAll(path).length;

    //check iframe window
    iframe_findLength = this.iframeDoc.querySelectorAll(path).length;
    //console.log("DOM iframe find: ",iframe_findLength);
    if (main_findLength === 1 || iframe_findLength === 1)
      return true;
    else
      return false;
  }
  /*
  checkUniqueByRole(role, name, roleIndex) {
    // 找出所有 role 對應的元素
    const elements = Array.from(document.querySelectorAll(`[role="${role}"]`));
    const iframe_elements = Array.from(this.iframeDoc.querySelectorAll(`[role="${role}"]`));
    // 過濾出 innerText 與 name 相符的元素
    const matched = elements.filter(el => el.innerText.trim() === name);
    const iframe_matched = iframe_elements.filter(el => el.innerText.trim() === name);

    if (matched.length === 0) {
      console.log("ByRole: X unique, X exists");
      return false;
    } else if (matched.length === 1 || iframe_matched === 1) {
      console.log("ByRole: IS unique, Is exists");
      return true;
    } else {
      console.log("ByRole: X unique, Is exists");
      return false;
    }
  }
    */
  checkUniqueByRole(role, name, roleIndex) {
  if (!role || !name) return { isUnique: false, total: 0 };

  // 🔹 找出所有符合 role 的元素（含 main 和 iframe）
  const mainElements = Array.from(document.querySelectorAll(`[role="${role}"]`));
  const iframeElements = window.myIframeDoc
    ? Array.from(window.myIframeDoc.querySelectorAll(`[role="${role}"]`))
    : [];

  // 🔹 過濾出文字內容相符的元素
  const matchText = (el) => el.innerText.trim() === name;
  const matchedMain = mainElements.filter(matchText);
  const matchedIframe = iframeElements.filter(matchText);

  // 🔹 計算總數
  const total = matchedMain.length + matchedIframe.length;

  // 🔹 判斷唯一性
  const isUnique = total === 1;

  // 🔹 檢查傳入的 roleIndex 是否合理
  //const isValidIndex = roleIndex >= 0 && roleIndex < total;

  // 🔹 Debug log
  if (total === 0) {
    console.log(`❌ No element found for role="${role}" and name="${name}"`);
    return false;
  } else if (isUnique) {
    console.log(`✅ Unique element found (${role}, "${name}")`);
    return true;
  } else {
    console.log(`⚠️ ${total} elements found (${role}, "${name}"), current index: ${roleIndex}`);
    return false;
  }


}


  checkUniqueByTitle(title) {
    // 找所有符合 title 的元素
    const elements = document.querySelectorAll(`[title="${title}"]`);
    const iframe_elements = this.iframeDoc.querySelectorAll(`[title="${title}"]`);
    console.log("check title: ", elements, "check iframe title: ", iframe_elements);
    if (elements.length === 1 || iframe_elements === 1) {
      return true;
    } else {
      return false;
    }
  }
  checkUniqueByText(text) {
    const elements = Array.from(document.querySelectorAll('*'));
    const matched = elements.filter(el => el.textContent.trim() === text);

    if (matched.length === 1) {
      console.log("這個文字在頁面中是唯一的", matched[0]);
      return true;
    } else if (matched.length > 1) {
      console.log(`找到 ${matched.length} 個相同文字的元素`);
      return false;
    } else {
      console.log("沒有找到該文字");
      return false;
    }

  }
  setInfo(el) {
  this.allAttributeInfo.tagName = el.tagName || null;
  this.allAttributeInfo.id = el.id || null;
  this.allAttributeInfo.className = el.className || null;
  this.allAttributeInfo.title = el.title || null;

  // innerText 安全處理
  const text = el.innerText;
  this.allAttributeInfo.text = (typeof text === "string") ? text.trim() : null;

  this.allAttributeInfo.placeholder = el.placeholder || null;
  this.allAttributeInfo.alt = el.alt || null;

  this.allAttributeInfo.ariaLabel = el.getAttribute?.('aria-label') || null;
  this.allAttributeInfo.role = el.getAttribute?.('role') || null;
}

  cleanInfo() {
    this.allAttributeInfo.tagName = null;
    this.allAttributeInfo.id = null;
    this.allAttributeInfo.className = null;
    this.allAttributeInfo.title = null;
    this.allAttributeInfo.text = null;
    this.allAttributeInfo.placeholder = null;
    this.allAttributeInfo.alt = null;
    this.allAttributeInfo.ariaLabel = null;
    this.allAttributeInfo.role = null;
  }
  clearPlaywrightObj() {
    this.playwrightObj = {
      ByRole: { name: null, role: null },
      ByLabel: {},
      ByPlaceholder: {},
      ByText: { text: null },
      ByTitle: { title: null },
      ByAltText: {},
      ByDomPath: { csspath: null }
    };
  }
  getPriority() {
    return this.priority;
  }
  getPriSize() {
    return this.priSize;
  }
}

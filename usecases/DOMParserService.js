// usecases 負責邏輯層
import { DOMElement } from './../entities/DOMElement.js';

export class DOMParserService {
  constructor(iframeWindow) {
    this.iframeWindow = iframeWindow;
    this.iframeDoc = iframeWindow.document;
    
    this.priSize = 7;
    this.priority = { //要新增方法改這裡就可以
      0: "ByRole",
      1: "ByDomPath",
      2: "ByTitle",
      3: "ByText",
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
      ByRole: { name: null, role: null },
      ByLabel: {},
      ByPlaceholder: {},
      ByText: {},
      ByTitle: { title: null },
      ByAltText: {},
      ByDomPath: { csspath: null }
    };
    this.playwrightMethodsStatus = {
      ByRole: true,
      ByLabel: false,
      ByPlaceholder: false,
      ByText: false,
      ByTitle: true,
      ByAltText: false,
      ByDomPath: true
    };
  }
  getAllPath(el) {
    console.log("el:" ,el);
    this.cleanInfo();
    this.setInfo(el);

    let isUniqueObj = {
      ByRole: false,
      ByTitle: false,
      ByDomPath: false
    };
    //先找dompath
    let dompath = this.getShortUniqueDomPath(el);
    if (this.checkUniqueByDompath(dompath)) {
      console.log("DOMPATH is UNIQUE!!!!");
      this.playwrightObj.ByDomPath.csspath = dompath;
      isUniqueObj.ByDomPath = true;
    }
    else {
      console.log("dompath is not unique~");
      isUniqueObj.ByDomPath = false;
    }

    //找byrole
    if (this.checkUniqueByRole(this.allAttributeInfo.role, this.allAttributeInfo.tagName)) {
      this.playwrightObj.ByRole.name = this.allAttributeInfo.tagName;
      this.playwrightObj.ByRole.role = this.allAttributeInfo.role;
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

    //決定回傳物件
    let newObj = {};

    // 遍歷 priority (保證按照數字順序 0 → 6)
    for(let i = 0; i< this.priSize; i++){
      let key = this.priority[i];
      if(isUniqueObj[key]){
        newObj[i] = {funName: key, obj: this.playwrightObj[key]}
      }
    }

    console.log("newObj: ", newObj);
    return newObj; //return 按照優先順序排列的array path,ex: [{},{},{}]
  }
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
    console.log("dom path: ",newpath);
    return newpath;
  }

getShortUniqueDomPath(el, opts = {}) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';
  const maxDepth = typeof opts.maxDepth === 'number' ? opts.maxDepth : 8;

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
    current = current.parentElement;
  }

  return path.join(' > ');
}



  checkUniqueByDompath(path) {
    console.log("iframeDOC: ", this.iframeDoc)
    console.log("all dom path", document.querySelectorAll(path));
    let main_findLength = 0;
    let iframe_findLength = 0;
    //先檢查main window
    main_findLength = document.querySelectorAll(path).length;

    //check iframe window
    iframe_findLength = this.iframeDoc.querySelectorAll(path).length;
    console.log("DOM iframe find: ",iframe_findLength);
    if (main_findLength === 1 || iframe_findLength === 1)
      return true;
    else
      return false;
  }
  checkUniqueByRole(role, name) {
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
  setInfo(el) {
    this.allAttributeInfo.tagName = el.tagName || null;
    this.allAttributeInfo.id = el.id || null;
    this.allAttributeInfo.className = el.className || null;
    this.allAttributeInfo.title = el.title || null;
    this.allAttributeInfo.text = el.innerText.trim() || null;
    this.allAttributeInfo.placeholder = el.placeholder || null;
    this.allAttributeInfo.alt = el.alt || null;
    this.allAttributeInfo.ariaLabel = el.getAttribute('aria-label') || null;
    this.allAttributeInfo.role = el.getAttribute('role') || null;
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
  getPriority(){
    return this.priority;
  }
  getPriSize(){
    return this.priSize;
  }
}

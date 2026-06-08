// usecases 負責邏輯層
import { DOMElement } from '../entities/DOMElement.js';
import { DIALOG_SELECTORS as ds } from '../config.js';
import { getCssSelector } from "css-selector-generator";
import { select } from 'optimal-select' // global: 'OptimalSelect'
import unique from 'unique-selector';


export class DOMParserService {
  constructor(contexts = {}) {
    this.mainWindow = contexts?.mainWindow || window;
    
    // 【修改】移除舊版寫死的 iframeWindow 與 iframeDoc 依賴
    this.currentDoc = null; // 動態儲存當前正在處理的元素的所屬 Document

    this.DIALOG_SELECTORS = ds;
    this.priSize = 4;
    this.priority = {
      0: "ByRole", 1: "ByTitle", 2: "ByText", 3: "ByDomPath", 4: "ByPlaceholder", 5: "ByAltText", 6: "ByLabel"
    };
    this.allAttributeInfo = {
      tagName: null, id: null, className: null, title: null, text: null, placeholder: null, alt: null, ariaLabel: null, role: null
    };
    this.playwrightObj = {
      ByRole: { name: null, role: null, index: null },
      ByLabel: {}, ByPlaceholder: {}, ByText: { text: null }, ByTitle: { title: null }, ByAltText: {}, ByDomPath: { csspath: null }
    };
    
    this.weight = { WL: 0.4, Wc: 0.6, Wa: 1.0, Wcl: 1.0, Wt: 1.0, Wn: 3.0 };
  }
  getDocumentByWindowType(windowType) {
  if (windowType === 'iframe') {
    return this.iframeWindow?.document || null;
  }
  return this.mainWindow?.document || document;
}
  getOpenSourcePath(e, sourceWin = null) {
    if(!e) return [null, null ,null];
    // 改良檢查方式：檢查元素是否掛載在它自己的 ownerDocument 下
    const ownerDoc = e.ownerDocument;
    if (!ownerDoc || !ownerDoc.contains(e)) {
        console.warn("[DOMParser] 元素已不在所屬的文件中，嘗試解析失敗", e);
        // 如果是 DnD 且元素剛好消失，這裡可以回傳一個標記，讓 CodeGenerator 用座標或最後已知路徑
        return null; 
    }
    // 新增 Debug Console
    console.log("[Debug DOMParser] 正在解析元素:", e);
    console.log("[Debug DOMParser] 元素所屬 Document:", e.ownerDocument);
    console.log("[Debug DOMParser] 傳入的 sourceWin:", sourceWin);
    console.log("[Debug DOMParser] 當前 Service 的 currentDoc:", this.currentDoc);
    // 【重要修復】取得元素真正的根節點 (可能是 Document 或 ShadowRoot)
    const realRoot = e.getRootNode();
    this.cleanInfo();
    this.setInfo(e); // 這裡會同步更新 this.currentDoc
    this.clearPlaywrightObj();


    
    
    let isUniqueObj = { ByRole: false, ByTitle: false, ByDomPath: false, ByText: false };
    
    // 【修改】統一使用元素自己的 Document 進行解析
    let doc = this.currentDoc; 
    let cssatt, optPri, uniPri;

    // 簡單判斷是否為頂層主網頁，給予不同的演算法優先度
    if (realRoot !== this.mainWindow.document){
      cssatt = ["tag", "class", "nthchild"];
      optPri = ['tag', 'class'];
      uniPri = [ 'Tag', 'Class', 'NthChild' ];
    } else {
      // main page：優先使用 id / test id
  cssatt = ["id", "attribute", "class", "tag", "nthchild"];
  optPri = ["id", "attribute", "class", "tag"];
  uniPri = ["ID", "Attributes", "Class", "Tag", "NthChild"];
    } 

    let csskey = 0, optkey = 0, unikey = 0;
    const selector = getCssSelector(e, { selectors: cssatt, blacklist: ["id"], root: realRoot });
    if(this.findUnique(selector, realRoot)){
      isUniqueObj.ByDomPath = true; csskey = 1;
    }
  
    let opt_selector = select(e, { root: realRoot, priority: optPri, ignore: { id: true } });
    if(this.findUnique(opt_selector, realRoot)){
      isUniqueObj.ByDomPath = true; optkey = 1;
    }

    let dom_selector = unique( e, { selectorTypes : uniPri } ); 
    if(this.findUnique(dom_selector, realRoot)){
      isUniqueObj.ByDomPath = true; unikey = 1;
    }

    let csspath = this.analyzeCssPath(selector, csskey);
    let optpath = this.analyzeCssPath(opt_selector, optkey);
    let unipath = this.analyzeCssPath(dom_selector, unikey);

    this.playwrightObj.ByDomPath.csspath = this.bestDomPath([csspath, optpath, unipath]);

    if (this.getPlaywrightRole(e, sourceWin)) {
      isUniqueObj.ByRole = true;
    }
    if (this.checkUniqueByTitle(this.allAttributeInfo.title)) {
      this.playwrightObj.ByTitle.title = this.allAttributeInfo.title; isUniqueObj.ByTitle = true;
    }
    if (this.checkUniqueByText(this.allAttributeInfo.text)) {
      this.playwrightObj.ByText.text = this.allAttributeInfo.text; isUniqueObj.ByText = true;
    }

    let newObj = {};
    for (let i = 0; i < this.priSize; i++) {
      let key = this.priority[i];
      if (isUniqueObj[key]) newObj[i] = { funName: key, obj: this.playwrightObj[key] };
    }
    return newObj; 
  }

 bestDomPath(paths) {
  // 設定權重
  const WL = this.weight.WL;
  const Wc = this.weight.Wc;
  const Wa = this.weight.Wa;
  const Wcl = this.weight.Wcl;
  const Wt = this.weight.Wt;
  const Wn = this.weight.Wn;

  let bestScore = -Infinity;
  let bestPath = null;

  for (const p of paths) {
    const { length, a, cl, t, n, U } = p;

    // 計算 Lscore
    const Lscore = 1 / (1 + length);

    // 計算 Cscore
    const Cscore = 1 / (1 + Wa * a + Wcl * cl + Wt * t + Wn * n);

    // 計算總 Score
    const Score = U * (WL * Lscore + Wc * Cscore);
    
    console.log("Score - path1: ", p.path);
    console.log("Score - score: ",Score);
    console.log("Score - Others: LS", Lscore, " CS: ",Cscore, "wa, a, wcl, cl, wt, t, wn, n: ",Wa,a,Wcl,cl,Wt,t,Wn,n);

    // 比較最大值
    if (Score > bestScore) {
      bestScore = Score;
      bestPath = p.path;
    }
  }

  return bestPath;
}
analyzeCssPath(cssPath, unique) {
  const obj = {
    path: cssPath,
    length: 0,
    a: 0,
    cl: 0,
    t: 0,
    n: 0,
    U: unique
  };
// 【新增防呆檢查】如果 cssPath 是 undefined, null 或是空字串，直接回傳預設的 obj
    if (!cssPath || typeof cssPath !== 'string') {
      return obj;
    }
  // 計算 length (用 > 或空格拆層級)
  obj.length = cssPath
  .split(/>|\s+/)
  .filter(Boolean).length;


  // 計算 attribute 數量 (簡單判斷 [])
  const attrMatches = cssPath.match(/\[[^\]]+\]/g);
  obj.a = attrMatches ? attrMatches.length : 0;

  // 計算 class 數量 (用 .)
  const classMatches = cssPath.match(/\.[^\s\#\.\[:>]+/g);
  obj.cl = classMatches ? classMatches.length : 0;

  // 計算 tag 數量 (用正則匹配標籤名，排除 . # [])
const cleanedForTag = cssPath
  .replace(/:[a-zA-Z-]+\([^)]+\)/g, '') // 移除 pseudo
  .replace(/\.[a-zA-Z0-9_-]+/g, '')     // 移除 class
  .replace(/\[[^\]]+\]/g, '');          // 移除 attribute

const tagMatches = cleanedForTag.match(/\b[a-zA-Z][a-zA-Z0-9]*\b/g);

console.log("Score: tag", tagMatches);

obj.t = tagMatches ? tagMatches.length : 0;

// 計算 nth（nth-child + nth-of-type）
const nthMatches = cssPath.match(/:nth-(child|of-type)\([^)]+\)/g);
obj.n = nthMatches ? nthMatches.length : 0;


  return obj;
}

findUnique(path, doc){
  const element = doc.querySelectorAll(path);
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
      console.log("Role - attributeInfo: ", this.allAttributeInfo, " obj: ", this.playwrightObj);

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
    if (Object.keys(newObj).length === 0) {
      throw new Error("Can't find the unique path here!");
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
  // 新增：模擬無障礙名稱計算
  computeAccessibleName(el) {
    if (!el) return "";
    
    // 優先級 1: aria-label
    if (el.getAttribute?.('aria-label')) return el.getAttribute('aria-label').trim();
    
    // 優先級 2: alt (常出現在 img)
    if (el.getAttribute?.('alt')) return el.getAttribute('alt').trim();
    
    // 優先級 3: placeholder (常出現在 input/textarea)
    if (el.getAttribute?.('placeholder')) return el.getAttribute('placeholder').trim();
    
    // 優先級 4: 如果內部包了圖片，且圖片有 alt，這通常是按鈕的代稱
    const imgChild = el.querySelector?.('img[alt]');
    if (imgChild) return imgChild.getAttribute('alt').trim();
    
    // 優先級 5: 自身的純文字內容
    return (el.innerText || el.textContent || "").trim().replace(/\s+/g, ' ');
  }

  getPlaywrightRole(el, sourceWin) {
    if (!(el instanceof Element)) return null;
    const role = el.getAttribute('role') || this.inferRole(el);
    if (!role) return null;

    // 使用優化後的無障礙名稱計算
    const name = this.computeAccessibleName(el);

    let targetDoc = this.currentDoc || el.ownerDocument || document;

    let containerEl = null;
    for (const sel of this.DIALOG_SELECTORS) {
      containerEl = el.closest(sel);
      if (containerEl) break;
    }

    const searchRoot = containerEl || targetDoc;

    // 全域搜尋具備相同 Role 與 Name 的可見元素
    const allSame = Array.from(searchRoot.querySelectorAll('*')).filter(e => {
      // 確保元素可見
      const style = window.getComputedStyle(e);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      
      const r = e.getAttribute('role') || this.inferRole(e);
      if (r !== role) return false;
      
      // 比對對方的無障礙名稱是否相同
      const n = this.computeAccessibleName(e);
      return n === name;
    });

    const index = allSame.indexOf(el);
    const isUnique = allSame.length === 1;

    this.playwrightObj.ByRole.index = index;
    this.playwrightObj.ByRole.name = name;
    this.playwrightObj.ByRole.role = role;

    return isUnique;
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
    console.log("dom path: ", newpath);
    return newpath;
  }




checkUniqueByDompath(path) {
    if (!this.currentDoc) return false;
    return this.currentDoc.querySelectorAll(path).length === 1;
  }

  checkUniqueByRole(role, name, roleIndex) {
    if (!role || !name || !this.currentDoc) return { isUnique: false, total: 0 };
    const elements = Array.from(this.currentDoc.querySelectorAll(`[role="${role}"]`));
    const matched = elements.filter(el => el.innerText.trim() === name);
    return matched.length === 1;
  }

checkUniqueByTitle(title) {
    if (!this.currentDoc || !title) return false;
    
    // 直接撈取所有帶有 title 屬性的元素，再用 JavaScript 比對內容，完美避開 CSS Selector 轉義問題
    const elements = Array.from(this.currentDoc.querySelectorAll('[title]'));
    const matched = elements.filter(el => el.getAttribute('title') === title);
    
    return matched.length === 1;
  }

  checkUniqueByDom(path) {
    if (!this.currentDoc) return false;
    return this.currentDoc.querySelectorAll(path).length === 1;
  }

checkUniqueByText(text) {
    if (!this.currentDoc || !text) return false;
    
    const allElements = Array.from(this.currentDoc.querySelectorAll('*'));
    
    const matched = allElements.filter(el => {
      // 1. 檢查當前元素的文字是否與目標相符
      const elText = (el.innerText || el.textContent || "").trim().replace(/\s+/g, ' ');
      if (elText !== text) return false;
      
      // 2. 關鍵優化：檢查其子元素是否也包含完全一樣的文字。
      // 如果有子元素的文字也等於整個 text，說明當前元素只是個包裝容器，應交由子元素去觸發。
      const hasChildWithSameText = Array.from(el.children).some(child => {
        const childText = (child.innerText || child.textContent || "").trim().replace(/\s+/g, ' ');
        return childText === text;
      });
      
      return !hasChildWithSameText;
    });

    return matched.length === 1;
  }
  // 設定當前解析元素的屬性，並動態綁定其所屬的 Document
setInfo(el) {
    if (!el) return;
    this.currentDoc = el.ownerDocument || document;

    this.allAttributeInfo.tagName = el.tagName || null;
    this.allAttributeInfo.id = el.id || null;
    this.allAttributeInfo.className = el.className || null;
    this.allAttributeInfo.title = el.title || null;
    
    // 統一進行空白與換行符號的正規化 (將多個連續空白/換行轉為單一空格)
    const rawText = el.innerText || el.textContent || "";
    this.allAttributeInfo.text = rawText.trim().replace(/\s+/g, ' ') || null;
    
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
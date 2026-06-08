// usecases 負責邏輯層
import { DOMElement } from './../entities/DOMElement.js';
import { DIALOG_SELECTORS as ds } from './../config.js';
import { getCssSelector } from "css-selector-generator";
import { select } from 'optimal-select'; // global: 'OptimalSelect'
import unique from 'unique-selector';

// ====== 新增：引入 @medv/finder ======
import { finder } from '@medv/finder';

// ====== 新增：引入 Testing Library 與無障礙 API ======
// 加入 getRoles
import { queryAllByRole, queryAllByText, queryAllByTitle, getRoles } from '@testing-library/dom';
import { computeAccessibleName } from 'dom-accessibility-api';

export class DOMParserService {
  constructor(contexts = {}) {
    this.mainWindow = contexts?.mainWindow || window;

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
    if (!e) return [null, null, null];

    const ownerDoc = e.ownerDocument;
    if (!ownerDoc || !ownerDoc.contains(e)) {
      console.warn("[DOMParser] 元素已不在所屬的文件中，嘗試解析失敗", e);
      return null;
    }

    console.log("[Debug DOMParser] 正在解析元素:", e);

    const realRoot = e.getRootNode();
    this.cleanInfo();
    this.setInfo(e); // 這裡會同步更新 this.currentDoc
    this.clearPlaywrightObj();

    // 狀態記錄物件，記錄各種類型的 Locator 是否能唯一找到元素
    let isUniqueObj = { ByRole: false, ByTitle: false, ByDomPath: false, ByText: false };

    // ==========================================
    // 1. 統一的屬性優先級設定 (保留 class，但交由我們的過濾器嚴格審查)
    // ==========================================
    const cssatt = ["id", "attribute", "class", "tag", "nthchild"];
    const optPri = ['id', 'class', 'name', 'placeholder', 'data-testid', 'href', 'src']; 
    const uniPri = ["ID", "Attributes", "Class", "Tag", "NthChild"];

    // 針對 unique-selector 製作的綜合正規表達式 (同時包含動態 ID 與不穩定 Class)
    const dynamicIdOrClassRegex = new RegExp(
        // 動態 ID 的特徵
        `(#(i[a-z0-9]{3,5}|ion-(input|textarea|select|checkbox|radio|toggle|range|datetime)-\\d+(-lbl)?|[0-9a-f]{8}-.*|[a-z0-9_-]{10,}))|` + 
        // 狀態與 Utility Class 的特徵 (如選取狀態、Tailwind 排版等)
        `(\\.(active|focus|hover|disabled|selected|checked|hydrated|md|ios|gjs-[\\w-]+|css-[\\w-]+|sc-[\\w-]+|styled-[\\w-]+|p-\\d|m-\\d|px-\\d|py-\\d|mx-\\d|my-\\d|w-\\w+|h-\\w+|text-\\w+|bg-\\w+|flex|grid|col|row|rounded|shadow|border))`
    , 'i');

    let csskey = 0, optkey = 0, unikey = 0, finderkey = 0;

    // ==========================================
    // 2. 各大 CSS Selector 套件解析 (加入 ID 與 Class 雙重攔截機制)
    // ==========================================

    // (A) css-selector-generator
    let selector = "";
    try {
        selector = getCssSelector(e, { 
            selectors: cssatt, 
            root: realRoot,
            blacklist: [
                (sel) => {
                    if (typeof sel === 'string') {
                        // 如果是 ID，檢查是否為動態亂碼
                        if (sel.startsWith('#')) return this.isDynamicGeneratedId(sel.slice(1)); 
                        // 如果是 Class，檢查是否為不穩定/純排版的 Class
                        if (sel.startsWith('.')) return this.isDynamicOrUnstableClass(sel.slice(1)); 
                    }
                    return false;
                }
            ]
        });
        if (this.findUnique(selector, realRoot)) {
            isUniqueObj.ByDomPath = true; csskey = 1;
        }
    } catch (err) {
        console.warn("[DOMParser] css-selector-generator 解析失敗", err);
    }

    // (B) optimal-select
    let opt_selector = "";
    try {
        opt_selector = select(e, { 
            root: realRoot, 
            priority: optPri, 
            ignore: { 
                // 讓我們的過濾函數決定這個 class 該不該用 (回傳 true 代表忽略)
                class: (className) => this.isDynamicOrUnstableClass(className),
                attribute: (name, value, defaultPredicate) => {
                    if (name === 'id') return this.isDynamicGeneratedId(value);
                    return typeof defaultPredicate === 'function' ? defaultPredicate(name, value) : false;
                }
            }
        });
        if (this.findUnique(opt_selector, realRoot)) {
            isUniqueObj.ByDomPath = true; optkey = 1;
        }
    } catch (err) {
        console.warn("[DOMParser] optimal-select 解析失敗", err);
    }

    // (C) unique-selector
    let dom_selector = "";
    try {
        dom_selector = unique(e, { 
            selectorTypes: uniPri,
            // 傳入我們剛剛寫好的 ID 與 Class 綜合黑名單正規表達式
            excludeRegex: dynamicIdOrClassRegex 
        });
        if (this.findUnique(dom_selector, realRoot)) {
            isUniqueObj.ByDomPath = true; unikey = 1;
        }
    } catch (err) {
        console.warn("[DOMParser] unique-selector 解析失敗", err);
    }

    // (D) @medv/finder
    let finder_selector = "";
    try {
        finder_selector = finder(e, {
            root: realRoot,
            idName: (name) => !this.isDynamicGeneratedId(name),
            // 只有「不是」不穩定 Class 的，才允許被 finder 使用
            className: (name) => !this.isDynamicOrUnstableClass(name),
        });
        if (this.findUnique(finder_selector, realRoot)) {
            isUniqueObj.ByDomPath = true; finderkey = 1;
        }
    } catch (err) {
        console.warn("[DOMParser] finder 解析失敗", err);
    }

    // ==========================================
    // 3. 評估與競爭最佳 DOM Path
    // ==========================================
    let csspath = this.analyzeCssPath(selector, csskey);
    let optpath = this.analyzeCssPath(opt_selector, optkey);
    let unipath = this.analyzeCssPath(dom_selector, unikey);
    let finderpath = this.analyzeCssPath(finder_selector, finderkey);

    console.log("csspath: ", csspath);
    console.log("optpath: ", optpath);
    console.log("unipath: ", unipath);
    console.log("finderpath: ", finderpath);
    
    // 利用我們優化過的權重系統 (Class 最高，嚴格懲罰 [style]) 選出最後的贏家
    this.playwrightObj.ByDomPath.csspath = this.bestDomPath([csspath, optpath, unipath, finderpath]);

    // ==========================================
    // 4. Playwright 特有語義定位分析 (ByRole, ByTitle, ByText)
    // ==========================================
    if (this.getPlaywrightRole(e, sourceWin)) {
      isUniqueObj.ByRole = true;
    }
    if (this.checkUniqueByTitle(e)) {
      isUniqueObj.ByTitle = true;
    }
    if (this.checkUniqueByText(e)) {
      isUniqueObj.ByText = true;
    }

    // ==========================================
    // 5. 按照優先級 (Priority) 輸出結果
    // ==========================================
    let newObj = {};
    for (let i = 0; i < this.priSize; i++) {
      let key = this.priority[i];
      if (isUniqueObj[key]) {
          newObj[i] = { funName: key, obj: this.playwrightObj[key] };
      }
    }
    
    return newObj;
  }

  bestDomPath(paths) {
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
      const Lscore = 1 / (1 + length);
      const Cscore = 1 / (1 + Wa * a + Wcl * cl + Wt * t + Wn * n);
      const Score = U * (WL * Lscore + Wc * Cscore);

      if (Score > bestScore) {
        bestScore = Score;
        bestPath = p.path;
      }
    }
    return bestPath;
  }

  analyzeCssPath(cssPath, unique) {
    const obj = {
      path: cssPath || "",
      length: 0,
      a: 0,
      cl: 0,
      t: 0,
      n: 0,
      U: unique
    };

    if (!cssPath || typeof cssPath !== 'string') {
      return obj;
    }

    obj.length = cssPath.split(/>|\s+/).filter(Boolean).length;
    const attrMatches = cssPath.match(/\[[^\]]+\]/g);
    obj.a = attrMatches ? attrMatches.length : 0;
    const classMatches = cssPath.match(/\.[^\s\#\.\[:>]+/g);
    obj.cl = classMatches ? classMatches.length : 0;

    const cleanedForTag = cssPath
      .replace(/:[a-zA-Z-]+\([^)]+\)/g, '')
      .replace(/\.[a-zA-Z0-9_-]+/g, '')
      .replace(/\[[^\]]+\]/g, '');

    const tagMatches = cleanedForTag.match(/\b[a-zA-Z][a-zA-Z0-9]*\b/g);
    obj.t = tagMatches ? tagMatches.length : 0;

    const nthMatches = cssPath.match(/:nth-(child|of-type)\([^)]+\)/g);
    obj.n = nthMatches ? nthMatches.length : 0;

    return obj;
  }

  findUnique(path, doc) {
    if (!path) return false;
    try {
      const element = doc.querySelectorAll(path);
      return element.length === 1;
    } catch (e) {
      return false;
    }
  }

  getTestingLibraryRole(el) {
    if (!el) return null;

    if (el.hasAttribute('role')) {
      return el.getAttribute('role');
    }

    try {
      const rolesMap = getRoles(el);

      for (const [roleName, elements] of Object.entries(rolesMap)) {
        if (elements.includes(el)) {
          return roleName;
        }
      }
    } catch (e) {
      console.warn("[DOMParser] Testing Library getRoles 解析失敗", e);
    }

    return null;
  }

  getPlaywrightRole(el, sourceWin) {
    if (!(el instanceof Element)) return false;
    const container = this.currentDoc.body || this.currentDoc;

    const role = this.getTestingLibraryRole(el);
    
    // 🌟 修正 1：直接在這裡排除沒有語意的 generic 與 presentation
    if (!role || role === 'generic' || role === 'presentation') {
        return false; 
    }

    let name = "";
    try {
      name = computeAccessibleName(el);
    } catch (e) {
      console.warn("[DOMParser] computeAccessibleName 發生錯誤", e);
    }

    try {
      const options = name ? { name: name, exact: true } : {};
      const matches = queryAllByRole(container, role, options);

      const index = matches.indexOf(el);

      // 🌟 修正 2：拔除嚴格的 isUnique，只要畫面上有找到 (index !== -1) 就視為成功
      if (index !== -1) {
        this.playwrightObj.ByRole.index = index;
        this.playwrightObj.ByRole.name = name || null;
        this.playwrightObj.ByRole.role = role;
        
        return true; // 允許回傳 true，讓後續產生器可以補上 .nth(index)
      }
      return false;
      
    } catch (error) {
      console.warn("[DOMParser] Testing Library ByRole 解析失敗", error);
      return false;
    }
  }

  checkUniqueByText(el) {
    if (!this.currentDoc) return false;
    const container = this.currentDoc.body || this.currentDoc;

    const text = (el.innerText || el.textContent || "").trim().replace(/\s+/g, ' ');
    if (!text) return false;

    try {
      const matches = queryAllByText(container, text, { exact: true });
      if (matches.length === 1 && matches[0] === el) {
        this.playwrightObj.ByText.text = text;
        return true;
      }
    } catch (error) {
      console.warn("[DOMParser] Testing Library ByText 解析失敗", error);
    }
    return false;
  }

  checkUniqueByTitle(el) {
    if (!this.currentDoc) return false;
    const container = this.currentDoc.body || this.currentDoc;
    const title = el.getAttribute('title');

    if (!title) return false;

    try {
      const matches = queryAllByTitle(container, title, { exact: true });
      if (matches.length === 1 && matches[0] === el) {
        this.playwrightObj.ByTitle.title = title;
        return true;
      }
    } catch (error) {
      console.warn("[DOMParser] Testing Library ByTitle 解析失敗", error);
    }
    return false;
  }
// 🌟 新增：過濾不穩定、無語意、或純狀態的 Class
  isDynamicOrUnstableClass(className) {
    if (typeof className !== 'string') return true;
    const val = className.trim();
    if (!val) return true;

    // 1. 狀態與框架生命週期 Class (如選取中、載入中、特定平台)
    const stateClasses = /^(active|focus|hover|visited|disabled|selected|checked|hydrated|md|ios|gjs-[a-zA-Z0-9_-]+)$/i;
    
    // 2. CSS-in-JS Hash 亂碼 (如 React Styled-components 產生的 css-1k2x3y, sc-bdVaJa)
    const cssInJsLike = /^(css-|sc-|styled-).*[a-zA-Z0-9_-]{4,}$/i;
    
    // 3. Tailwind / Bootstrap 等純排版 Utility Class (如 p-4, m-2, text-center, flex, w-full)
    const utilityClasses = /^(p|m|px|py|mx|my|w|h|text|bg|flex|grid|col|row|rounded|shadow|border)-[a-z0-9]+$/i;
    
    // 4. 純粹的亂碼 (例如編譯打包後出現的 8 碼以上隨機字串)
    const pureHash = /^[a-z0-9]{8,15}$/i; 

    // 如果符合任何一種「不穩定特徵」，就回傳 true (代表這是壞的 Class，應該被忽略)
    return stateClasses.test(val) || cssInJsLike.test(val) || utilityClasses.test(val) || pureHash.test(val);
  }
  setInfo(el) {
    if (!el) return;
    this.currentDoc = el.ownerDocument || document;

    this.allAttributeInfo.tagName = el.tagName || null;
    this.allAttributeInfo.id = el.id || null;
    this.allAttributeInfo.className = el.className || null;
    this.allAttributeInfo.title = el.title || null;

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
      ByRole: { name: null, role: null, index: null },
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

  isDynamicGeneratedId(id) {
    if (typeof id !== 'string') return false;

    const value = id.trim();
    if (!value) return false;

    // 例如：ihim, iiq4k, ieq7o, i0381, idgu4
    const grapesLikeId = /^i[a-z0-9]{3,5}$/i;

    // 例如：ion-input-0-lbl, ion-textarea-0-lbl
    const ionicGeneratedId = /^ion-(input|textarea|select|checkbox|radio|toggle|range|datetime)-\d+(-lbl)?$/i;

    // 常見 UUID
    const uuidLike =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    // 常見 hash / bundle 產生的長亂碼
    const hashLike = /^[a-z0-9_-]{10,}$/i;

    return (
      grapesLikeId.test(value) ||
      ionicGeneratedId.test(value) ||
      uuidLike.test(value) ||
      hashLike.test(value)
    );
  }
}
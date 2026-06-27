// usecases 鞎痊?摩撅?
import { DOMElement } from './../entities/DOMElement.js';
import { DIALOG_SELECTORS as ds } from './../config.js';
import { getCssSelector } from "css-selector-generator";
import { select } from 'optimal-select'; // global: 'OptimalSelect'

// ====== ?啣?嚗???@medv/finder ======
import { finder } from '@medv/finder';

// ====== ?啣?嚗???Testing Library ??? API ======
// ? getRoles
import { queryAllByRole, queryAllByText, queryAllByTitle, getRoles } from '@testing-library/dom';
import { computeAccessibleName } from 'dom-accessibility-api';

export class DOMParserService {
  constructor(contexts = {}) {
    this.mainWindow = contexts?.mainWindow || window;

    this.currentDoc = null; // ???脣??嗅?甇?????蝝??撅?Document

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
      ByLabel: {}, ByPlaceholder: {}, ByText: { text: null }, ByTitle: { title: null }, ByAltText: {}, ByDomPath: { csspath: null, shadowChain: [], options: [] }
    };

    this.weight = { WL: 0.4, Wc: 0.6, Wa: 1.0, Wcl: 1.0, Wt: 1.0, Wn: 3.0 };
    // ?? ?啣?嚗靘??曉?憭 (靘?頧?敺? Excel JSON) 霈??摰儔 Regex 閬?
    this.customDynamicIdPatterns = [];
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
    const realRoot = e.getRootNode();
    const isElementInDocument = ownerDoc?.contains(e) || (realRoot?.host && ownerDoc?.contains(realRoot.host));
    if (!ownerDoc || !isElementInDocument) {
      return null;
    }

    this.cleanInfo();
    this.setInfo(e); 
    this.clearPlaywrightObj();
    const shadowChain = this.getShadowChain(e);
    console.log("[Shadow chain info: ]",e, shadowChain);
    let isUniqueObj = { ByRole: false, ByTitle: false, ByDomPath: false, ByText: false };

    const cssatt = ["id", "attribute", "class", "tag", "nthchild"];
    const optPri = ['id', 'data-testid', 'data-thread-id', 'data-action', 'class', 'name', 'placeholder', 'href', 'src'];

    let csskey = 0, optkey = 0, finderkey = 0, structuralkey = 0;


    // (A) css-selector-generator
    let selector = "";
    try {
        selector = getCssSelector(e, { 
            selectors: cssatt, 
            root: realRoot,
            blacklist: [
                (sel) => {
                    if (typeof sel === 'string') {
                        // 憒???ID嚗炎?交?衣??鈭Ⅳ
                        if (sel.startsWith('#')) return this.isDynamicGeneratedId(sel.slice(1)); 
                        // 憒???Class嚗炎?交?衣銝帘摰?蝝??? Class
                        if (sel.startsWith('.')) return this.isDynamicOrUnstableClass(sel.slice(1)); 
                    }
                    return false;
                }
            ]
        });
        if (this.findUniqueWithShadowChain(selector, shadowChain, e)) {
            isUniqueObj.ByDomPath = true; csskey = 1;
        }
    } catch (err) {
        console.warn("[DOMParser] css-selector-generator 閫??憭望?", err);
    }

    // (B) optimal-select
    let opt_selector = "";
    try {
        opt_selector = select(e, { 
            root: realRoot, 
            priority: optPri, 
            ignore: { 
                // 霈????蕪?賣瘙箏???class 閰脖?閰脩 (? true 隞?”敹賜)
                class: (className) => this.isDynamicOrUnstableClass(className),
                attribute: (name, value, defaultPredicate) => {
                    if (name === 'id') return this.isDynamicGeneratedId(value);
                    return typeof defaultPredicate === 'function' ? defaultPredicate(name, value) : false;
                }
            }
        });
        if (this.findUniqueWithShadowChain(opt_selector, shadowChain, e)) {
            isUniqueObj.ByDomPath = true; optkey = 1;
        }
    } catch (err) {
        console.warn("[DOMParser] optimal-select 閫??憭望?", err);
    }

    // (C) @medv/finder
    let finder_selector = "";
    try {
        finder_selector = finder(e, {
            root: realRoot,
            idName: (name) => !this.isDynamicGeneratedId(name),
            // ?芣????胯?蝛拙? Class ????閮梯◤ finder 雿輻
            className: (name) => !this.isDynamicOrUnstableClass(name),
        });
        if (this.findUniqueWithShadowChain(finder_selector, shadowChain, e)) {
            isUniqueObj.ByDomPath = true; finderkey = 1;
        }
    } catch (err) {
        console.warn("[DOMParser] finder 閫??憭望?", err);
    }

    // (D) 純 HTML 結構關聯 path：只使用 tag 與兄弟位置，不依賴 id/class/attribute/text
    const structural_selector = this.getStructuralCssPath(e, realRoot);
    if (this.findUniqueWithShadowChain(structural_selector, shadowChain, e)) {
      isUniqueObj.ByDomPath = true;
      structuralkey = 1;
    }
    console.log("structural select: ",structural_selector);
    // ==========================================
    // 3. 閰摯?奎?剜?雿?DOM Path
    // ==========================================
    let csspath = this.analyzeCssPath(selector, csskey);
    let optpath = this.analyzeCssPath(opt_selector, optkey);
    let finderpath = this.analyzeCssPath(finder_selector, finderkey);
    let structuralpath = this.analyzeCssPath(structural_selector, structuralkey);

    console.log("csspath: ", csspath);
    console.log("optpath: ", optpath);
    console.log("finderpath: ", finderpath);
    console.log("structuralpath: ", structuralpath);
    
    // ?拍??????頂蝯?(Class ?擃??湔?脩蔑 [style]) ?詨?敺?韐振
    const rankedDomPathOptions = this.rankDomPaths([csspath, optpath, finderpath, structuralpath])
      .filter(option => !this.hasUnstableAttributeSelector(option.path));
    const bestDomPathOption = rankedDomPathOptions[0];
    const structuralOption = rankedDomPathOptions.find(option => option.path === structuralpath.path);
    const orderedDomPathOptions = structuralOption
      ? [
          ...rankedDomPathOptions.filter(option => option.path !== structuralOption.path),
          structuralOption
        ]
      : rankedDomPathOptions;
    const domPathOptions = orderedDomPathOptions.map(option => ({ ...option, shadowChain }));
    this.playwrightObj.ByDomPath.csspath = bestDomPathOption?.path || "";
    this.playwrightObj.ByDomPath.shadowChain = bestDomPathOption ? shadowChain : [];
    this.playwrightObj.ByDomPath.options = domPathOptions;

    // ==========================================
    // 4. Playwright ?寞?隤儔摰??? (ByRole, ByTitle, ByText)
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
    // 5. ??芸?蝝?(Priority) 頛詨蝯?
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
    return this.rankDomPaths(paths)[0]?.path || null;
  }

  rankDomPaths(paths) {
    const WL = this.weight.WL;
    const Wc = this.weight.Wc;
    const Wa = this.weight.Wa;
    const Wcl = this.weight.Wcl;
    const Wt = this.weight.Wt;
    const Wn = this.weight.Wn;

    const ranked = [];
    const seen = new Set();

    for (const p of paths) {
      if (!p || !p.path || seen.has(p.path)) continue;

      const { length, a, cl, t, n, U } = p;
      const Lscore = 1 / (1 + length);
      const Cscore = 1 / (1 + Wa * a + Wcl * cl + Wt * t + Wn * n);
      const Score = U * (WL * Lscore + Wc * Cscore);

      seen.add(p.path);
      ranked.push({ ...p, score: Score });
    }

    return ranked.sort((a, b) => b.score - a.score);
  }
// ?? ?啣??寞?嚗?憭?喳閫??憟賜??? ID 閬?
  setCustomDynamicIdRules(rulesArray) {
    if (!Array.isArray(rulesArray)) return;
    
    this.customDynamicIdPatterns = rulesArray.map(ruleStr => {
      try {
        // 撠?銝脰??甇??銵券?撘隞塚?'i' 銵函內敹賜憭批?撖?
        return new RegExp(ruleStr, 'i');
      } catch (e) {
        console.error(`[DOMParser] ?⊥??迤?”??閬?: ${ruleStr}`, e);
        return null;
      }
    }).filter(regex => regex !== null);
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

  getStructuralCssPath(el, root) {
    if (el?.nodeType !== 1 || !root) return "";

    const candidates = [];
    const addCandidate = (selector) => {
      if (!selector || typeof selector !== "string") return;

      let isUniqueTarget = false;
      try {
        const matches = Array.from(root.querySelectorAll(selector));
        isUniqueTarget = matches.length === 1 && matches[0] === el;
      } catch (e) {
        return;
      }

      candidates.push(this.analyzeCssPath(selector, isUniqueTarget ? 1 : 0));
    };

    try {
      addCandidate(finder(el, {
        root,
        idName: () => false,
        className: () => false,
        attr: () => false,
        tagName: () => true
      }));
    } catch (err) {
      console.warn("[DOMParser] finder structural selector generation failed", err);
    }

    try {
      addCandidate(select(el, {
        root,
        ignore: {
          id: true,
          class: true,
          attribute: true
        }
      }));
    } catch (err) {
      console.warn("[DOMParser] optimal-select structural selector generation failed", err);
    }

    try {
      addCandidate(getCssSelector(el, {
        root,
        selectors: ["tag", "nthoftype"]
      }));
    } catch (err) {
      console.warn("[DOMParser] css-selector-generator structural selector generation failed", err);
    }

    const bestGeneratedPath = this.rankDomPaths(candidates)
      .find(candidate => candidate.U === 1)?.path;
    console.log("[structure path: ]", candidates);
    console.log("[structure path, best: ]", bestGeneratedPath);
    if (bestGeneratedPath) return bestGeneratedPath;

    return this.getFallbackStructuralCssPath(el, root);
  }

  getFallbackStructuralCssPath(el, root) {
    const parts = [];
    let current = el;

    while (current?.nodeType === 1 && current !== root) {
      const tagName = current.tagName.toLowerCase();
      const parent = current.parentElement;

      parts.unshift(`${tagName}:nth-of-type(${this.getElementTypeIndex(current)})`);

      if (!parent || parent === root || tagName === "html") break;
      current = parent;
    }

    return parts.join(" > ");
  }

  getElementTypeIndex(el) {
    let index = 1;
    let sibling = el.previousElementSibling;
    const tagName = el.tagName;

    while (sibling) {
      if (sibling.tagName === tagName) index++;
      sibling = sibling.previousElementSibling;
    }

    return index;
  }

  hasUnstableAttributeSelector(selector) {
    if (typeof selector !== "string") return true;
    return /\[style\b(?:[~|^$*]?=)?/i.test(selector);
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

  isShadowRoot(root) {
    return root && root.nodeType === Node.DOCUMENT_FRAGMENT_NODE && root.host instanceof Element;
  }

  getBestOpenSourceSelector(el, root) {
    if (!el || !root) return "";

    const candidates = [];
    const cssatt = ["id", "attribute", "class", "tag", "nthchild"];
    const optPri = ['id', 'data-testid', 'data-thread-id', 'data-action', 'class', 'name', 'placeholder', 'href', 'src'];

    try {
      const selector = getCssSelector(el, {
        selectors: cssatt,
        root,
        blacklist: [
          (sel) => {
            if (typeof sel !== 'string') return false;
            if (sel.startsWith('#')) return this.isDynamicGeneratedId(sel.slice(1));
            if (sel.startsWith('.')) return this.isDynamicOrUnstableClass(sel.slice(1));
            return false;
          }
        ]
      });
      candidates.push(this.analyzeCssPath(selector, this.findUnique(selector, root) ? 1 : 0));
    } catch (err) {
      console.warn("[DOMParser] css-selector-generator shadow host 閫??憭望?", err);
    }

    try {
      const selector = select(el, {
        root,
        priority: optPri,
        ignore: {
          class: (className) => this.isDynamicOrUnstableClass(className),
          attribute: (name, value, defaultPredicate) => {
            if (name === 'id') return this.isDynamicGeneratedId(value);
            return typeof defaultPredicate === 'function' ? defaultPredicate(name, value) : false;
          }
        }
      });
      candidates.push(this.analyzeCssPath(selector, this.findUnique(selector, root) ? 1 : 0));
    } catch (err) {
      console.warn("[DOMParser] optimal-select shadow host 閫??憭望?", err);
    }

    try {
      const selector = finder(el, {
        root,
        idName: (name) => !this.isDynamicGeneratedId(name),
        className: (name) => !this.isDynamicOrUnstableClass(name),
      });
      candidates.push(this.analyzeCssPath(selector, this.findUnique(selector, root) ? 1 : 0));
    } catch (err) {
      console.warn("[DOMParser] finder shadow host 閫??憭望?", err);
    }

    return this.rankDomPaths(candidates)
      .filter(option => !this.hasUnstableAttributeSelector(option.path))[0]?.path || "";
  }

  getShadowChain(el) {
    const chain = [];
    let root = el?.getRootNode?.();

    while (this.isShadowRoot(root)) {
      const host = root.host;
      const parentRoot = host.getRootNode();
      const hostSelector = this.getBestOpenSourceSelector(host, parentRoot);

      if (!hostSelector) break;
      chain.unshift({ hostSelector });
      root = parentRoot;
    }

    return chain;
  }

  resolveShadowMatches(baseRoot, shadowChain, targetSelector) {
    let roots = [baseRoot];

    for (const step of shadowChain || []) {
      const nextRoots = [];

      for (const root of roots) {
        const hosts = Array.from(root.querySelectorAll(step.hostSelector));
        for (const host of hosts) {
          if (host.shadowRoot) nextRoots.push(host.shadowRoot);
        }
      }

      roots = nextRoots;
    }

    return roots.flatMap(root => Array.from(root.querySelectorAll(targetSelector)));
  }

  findUniqueWithShadowChain(path, shadowChain, targetEl) {
    if (!path || !targetEl?.ownerDocument) return false;

    try {
      if (!shadowChain?.length) {
        const root = targetEl.getRootNode();
        const matches = Array.from(root.querySelectorAll(path));
        return matches.length === 1 && matches[0] === targetEl;
      }

      const matches = this.resolveShadowMatches(targetEl.ownerDocument, shadowChain, path);
      return matches.length === 1 && matches[0] === targetEl;
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
      console.warn("[DOMParser] Testing Library getRoles 閫??憭望?", e);
    }

    return null;
  }

  getPlaywrightRole(el, sourceWin) {
    if (!(el instanceof Element)) return false;
    const container = this.currentDoc.body || this.currentDoc;

    if (el.tagName === "ION-BUTTON") {
      const name = (el.textContent || el.innerText || "").trim().replace(/\s+/g, " ");
      if (name && this.isUniqueIonButtonText(el, name, container)) {
        this.playwrightObj.ByRole.index = null;
        this.playwrightObj.ByRole.name = name;
        this.playwrightObj.ByRole.role = "button";
        this.playwrightObj.ByRole.exact = false;
        this.playwrightObj.ByRole.index = this.getFuzzyRoleNameIndex(el, "button", name, container);
        return true;
      }
    }

    const role = this.getTestingLibraryRole(el);
    
    // ?? 靽格迤 1嚗?亙?ㄐ?瘝?隤???generic ??presentation
    if (!role || role === 'generic' || role === 'presentation') {
        return false; 
    }

    let name = "";
    try {
      name = computeAccessibleName(el);
    } catch (e) {
      console.warn("[DOMParser] computeAccessibleName ?潛??航炊", e);
    }

    try {
      const options = name ? { name: name, exact: true } : {};
      const matches = queryAllByRole(container, role, options);

      const index = matches.indexOf(el);

      // ?? 靽格迤 2嚗??文?潛? isUnique嚗閬?Ｖ????(index !== -1) 撠梯??箸???
      if (index !== -1) {
        const hasIconRisk = this.hasGeneratedIconNameRisk(el);
        this.playwrightObj.ByRole.index = index;
        this.playwrightObj.ByRole.name = name || null;
        this.playwrightObj.ByRole.role = role;
        this.playwrightObj.ByRole.exact = !hasIconRisk;
        if (hasIconRisk) {
          this.playwrightObj.ByRole.index = this.getFuzzyRoleNameIndex(el, role, name, container);
        }
        
        return true; // ?迂? true嚗?敺??Ｙ??典隞亥?銝?.nth(index)
      }
      return false;
      
    } catch (error) {
      console.warn("[DOMParser] Testing Library ByRole 閫??憭望?", error);
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
      console.warn("[DOMParser] Testing Library ByText 閫??憭望?", error);
    }
    return false;
  }

  hasGeneratedIconNameRisk(el) {
    return !!el.querySelector?.(
      'i[class*="fa"], span[class*="fa-"], [class*="glyphicon"], [class*="material-icons"], [class*="icon-"]'
    );
  }

  getFuzzyRoleNameIndex(el, role, name, container) {
    const targetName = String(name || "").trim().replace(/\s+/g, " ");
    if (!targetName) return null;

    try {
      const lowerTargetName = targetName.toLocaleLowerCase();
      const roleMatches = queryAllByRole(container, role);
      const fuzzyMatches = roleMatches.filter((candidate) => {
        let candidateName = "";
        try {
          candidateName = computeAccessibleName(candidate);
        } catch (e) {
          return false;
        }

        const normalizedCandidateName = String(candidateName || "").trim().replace(/\s+/g, " ");
        return normalizedCandidateName.toLocaleLowerCase().includes(lowerTargetName);
      });

      const fuzzyIndex = fuzzyMatches.indexOf(el);
      return fuzzyIndex === -1 ? null : fuzzyIndex;
    } catch (e) {
      console.warn("[DOMParser] Fuzzy role name index check failed", e);
      return null;
    }
  }

  isUniqueIonButtonText(el, text, container) {
    if (el.tagName !== "ION-BUTTON") return false;

    const matches = Array.from(container.querySelectorAll("ion-button")).filter((button) => {
      const buttonText = (button.textContent || button.innerText || "").trim().replace(/\s+/g, " ");
      return buttonText === text;
    });

    return matches.length === 1 && matches[0] === el;
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
      console.warn("[DOMParser] Testing Library ByTitle 閫??憭望?", error);
    }
    return false;
  }
// ?? ?啣?嚗?瞈曆?蝛拙??隤???蝝??? Class
  isDynamicOrUnstableClass(className) {
    if (typeof className !== 'string') return true;
    const val = className.trim();
    if (!val) return true;

    // 1. ???獢??望? Class (憒?葉???乩葉?摰像??
    const stateClasses = /^(active|focus|hover|visited|disabled|selected|checked|hydrated|md|ios|ion-activated|ion-focused|ion-touched|ion-dirty|ion-valid|ion-invalid|gjs-[a-zA-Z0-9_-]+)$/i;
    
    // 2. CSS-in-JS Hash 鈭Ⅳ (憒?React Styled-components ?Ｙ???css-1k2x3y, sc-bdVaJa)
    const cssInJsLike = /^(css-|sc-|styled-).*[a-zA-Z0-9_-]{4,}$/i;
    
    // 3. Tailwind / Bootstrap 蝑??? Utility Class (憒?p-4, m-2, text-center, flex, w-full)
    const utilityClasses = /^(p|m|px|py|mx|my|w|h|text|bg|flex|grid|col|row|rounded|shadow|border)-[a-z0-9]+$/i;
    
    // 4. 蝝硃??蝣?(靘?蝺刻陌??敺?曄? 8 蝣潔誑銝璈?銝?
    const pureHash = /^[a-z0-9]{8,15}$/i; 

    // 憒?蝚血?隞颱?銝蝔柴?蝛拙??孵噩??撠勗???true (隞?”?憯? Class嚗?閰脰◤敹賜)
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
      ByDomPath: { csspath: null, shadowChain: [], options: [] }
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


    for (const pattern of this.customDynamicIdPatterns) {
      if (pattern.test(value)) {
        console.log(`[DOMParser] ??啁泵?摰儔(Excel)閬?????ID: ${value}`);
        return true; 
      }
    }

    const grapesLikeId = /^i[a-z0-9]{3,5}$/i;
    const ionicGeneratedId = /^ion-(input|textarea|select|checkbox|radio|toggle|range|datetime)-\d+(-lbl)?$/i;
    const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const hashLike = /^[a-z0-9_-]{10,}$/i;
    const frameworkDynamic = /^(mui-|radix-|chakra-|el-|headlessui-|rc-tabs-).*\d+.*$/i;
    const pureNumbers = /^\d+$/;

    return (
      grapesLikeId.test(value) ||
      ionicGeneratedId.test(value) ||
      uuidLike.test(value) ||
      hashLike.test(value) ||
      frameworkDynamic.test(value) ||
      pureNumbers.test(value)
    );
  }
}

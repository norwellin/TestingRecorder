// usecases 
import { DIALOG_SELECTORS as ds } from './../config.js';

// ====== @medv/finder ======
import { finder } from '@medv/finder';
import { InjectedScript } from 'playwright-injected';


export class DOMParserService {
  constructor(contexts = {}) {
    this.mainWindow = contexts?.mainWindow || window;

    this.currentDoc = null; 

    this.DIALOG_SELECTORS = ds;
    this.priSize = 3;
    this.priority = { 0: "ByGjsToolbarItem", 1: "ByPlaywright", 2: "ByDomPath" };
    this.allAttributeInfo = {
      tagName: null, id: null, className: null, title: null, text: null, placeholder: null, alt: null, ariaLabel: null, role: null
    };
    this.playwrightObj = {
      ByGjsToolbarItem: { toolbarSelector: null, itemSelector: null, index: null },
      ByPlaywright: { selector: null, selectors: [], selectorRisks: [], shadowChain: [] },
      ByDomPath: { csspath: null, shadowChain: [], options: [] }
    };

    this.weight = { WL: 0.4, Wc: 0.6, Wa: 1.0, Wcl: 1.0, Wt: 1.0, Wn: 3.0 };

    this.customDynamicIdPatterns = [];
    this.playwrightInjectedScripts = new WeakMap();
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

    const gjsToolbarItem = this.getGjsToolbarItemLocator(e);
    if (gjsToolbarItem) {
      this.playwrightObj.ByGjsToolbarItem = gjsToolbarItem;
      return {
        0: {
          funName: "ByGjsToolbarItem",
          obj: this.playwrightObj.ByGjsToolbarItem
        }
      };
    }

    const generated = this.generateLocatorCandidatesWithPlaywrightInjected(e, realRoot);
    const result = {};
    let resultIndex = 0;

    const shadowChain = this.getShadowChain(e);

    if (generated.playwrightSelector) {
      this.playwrightObj.ByPlaywright = {
        selector: generated.playwrightSelector,
        selectors: generated.playwrightSelectors,
        selectorRisks: generated.playwrightSelectorRisks,
        shadowChain
      };
      result[resultIndex++] = {
        funName: "ByPlaywright",
        obj: this.playwrightObj.ByPlaywright
      };
    }

    if (generated.finderWithoutIdSelector) {
      const finderCheck = this.inspectSelectorUniqueness(
        generated.finderWithoutIdSelector,
        shadowChain,
        e,
        sourceWin
      );

      if (finderCheck.isUnique) {
        const finderPath = this.analyzeCssPath(generated.finderWithoutIdSelector, 1);
        this.playwrightObj.ByDomPath = {
          csspath: generated.finderWithoutIdSelector,
          shadowChain,
          options: [{ ...finderPath, shadowChain }]
        };
        result[resultIndex++] = {
          funName: "ByDomPath",
          obj: this.playwrightObj.ByDomPath
        };
      }
    }

    console.log("[DOMParser] locator candidates", {
      playwright: generated.playwrightSelector,
      playwrightAlternatives: generated.playwrightSelectors,
      finderWithoutId: generated.finderWithoutIdSelector
    });
    return resultIndex ? result : null;
  }

  getGjsToolbarItemLocator(el) {
    const item = el?.closest?.(".gjs-toolbar-item");
    if (!item) return null;

    const toolbar = item.closest?.(".gjs-toolbar");
    if (!toolbar?.querySelectorAll) return null;

    const items = Array.from(toolbar.querySelectorAll(".gjs-toolbar-item"));
    const index = items.indexOf(item);
    if (index < 0) return null;

    return {
      toolbarSelector: ".gjs-toolbar",
      itemSelector: ".gjs-toolbar-item",
      index
    };
  }
//做Playwright inject的初始化


  getPlaywrightInjectedScript(targetDocument) {
    if (!targetDocument) {
      throw new Error("[DOMParser] playwright-injected requires an owner document");
    }

    let injected = this.playwrightInjectedScripts.get(targetDocument);
    if (injected) return injected;

    const targetWindow = targetDocument.defaultView;
    if (!targetWindow) {
      throw new Error("[DOMParser] The target document does not have a window");
    }

    injected = new InjectedScript(targetWindow, {
      isUnderTest: false,
      sdkLanguage: "javascript",
      testIdAttributeName: "data-testid",
      stableRafCount: 0,
      browserName: "chromium",
      customEngines: []
    });
    this.playwrightInjectedScripts.set(targetDocument, injected);
    return injected;
  }

  decodeCssIdentifier(value) {
    return String(value || "").replace(
      /\\([0-9a-fA-F]{1,6})(?:\s)?|\\(.)/g,
      (_match, hex, escapedCharacter) => hex
        ? String.fromCodePoint(parseInt(hex, 16))
        : escapedCharacter
    );
  }

  //輸入selector回傳id陣列，目前支援過濾: css, playwright, normal
  extractSelectorIds(selector) {
    if (typeof selector !== "string" || !selector) return [];

    const ids = [];
    const addId = value => {
      const decoded = this.decodeCssIdentifier(value).trim();
      if (decoded) ids.push(decoded);
    };

    // Extract exact CSS attribute selectors before quoted text is masked.
    const attributeIdPattern = /\[\s*id\s*=\s*(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|([^\]\s]+))\s*\]/gi;
    for (const match of selector.matchAll(attributeIdPattern)) {
      addId(match[1] ?? match[2] ?? match[3]);
    }

    // Playwright may also represent an ID with an explicit id= selector engine.
    const idEnginePattern = /(?:^|>>\s*)id\s*=\s*(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|([^\s>]+))/gi;
    for (const match of selector.matchAll(idEnginePattern)) {
      addId(match[1] ?? match[2] ?? match[3]);
    }

    const selectorWithoutQuotedText = selector.replace(
      /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,
      ""
    );
    const cssIdPattern = /#((?:\\[0-9a-fA-F]{1,6}\s?|\\.|[a-zA-Z0-9_-])+)/g;
    for (const match of selectorWithoutQuotedText.matchAll(cssIdPattern)) {
      addId(match[1]);
    }

    return [...new Set(ids)];
  }
//從 selector 字串中提取所有 CSS class 名稱，解碼後移除重複，最後以陣列回傳。
  extractSelectorClasses(selector) {
    if (typeof selector !== "string" || !selector) return [];

    const classes = [];
    const addClass = value => {
      const decoded = this.decodeCssIdentifier(value).trim();
      if (decoded) classes.push(decoded);
    };

    // Support exact class attribute selectors in addition to the usual .class form.
    const attributeClassPattern = /\[\s*class\s*=\s*(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|([^\]\s]+))\s*\]/gi;
    for (const match of selector.matchAll(attributeClassPattern)) {
      const value = match[1] ?? match[2] ?? match[3] ?? "";
      value.split(/\s+/).forEach(addClass);
    }

    const selectorWithoutQuotedText = selector.replace(
      /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,
      ""
    );
    const cssClassPattern = /\.((?:\\[0-9a-fA-F]{1,6}\s?|\\.|[a-zA-Z0-9_-])+)/g;
    for (const match of selectorWithoutQuotedText.matchAll(cssClassPattern)) {
      addClass(match[1]);
    }

    return [...new Set(classes)];
  }

  analyzeClassRisk(className) {
    if (typeof className !== "string" || !className.trim()) {
      return { level: "dynamic", reason: "Empty or invalid class" };
    }

    const value = className.trim();
    const dynamicStateClass = /^(active|focus|has-focus|hover|visited|disabled|selected|checked|ion-activated|ion-focused|ion-touched|ion-dirty|ion-valid|ion-invalid|gjs-[a-zA-Z0-9_-]+)$/i;
    const platformOrRuntimeClass = /^(hydrated|md|ios)$/i;
    const cssInJsLike = /^(css-|sc-|styled-).*[a-zA-Z0-9_-]{4,}$/i;
    const utilityClass = /^(p|m|px|py|mx|my|w|h|text|bg|flex|grid|col|row|rounded|shadow|border)-[a-z0-9]+$/i;
    const pureHash = /^[a-z0-9]{8,15}$/i;

    if (dynamicStateClass.test(value)) {
      return { level: "dynamic", reason: "Runtime state class" };
    }
    if (platformOrRuntimeClass.test(value)) {
      return { level: "unstable", reason: "Platform or runtime class" };
    }
    if (cssInJsLike.test(value)) {
      return { level: "unstable", reason: "CSS-in-JS generated class" };
    }
    if (utilityClass.test(value)) {
      return { level: "unstable", reason: "Utility class" };
    }
    if (pureHash.test(value)) {
      return { level: "unstable", reason: "Hash-like class" };
    }
    return { level: "stable", reason: "No dynamic class rule matched" };
  }

  analyzeSelectorRisk(selector) {
    const dynamicClasses = [];
    const unstableClasses = [];

    for (const className of this.extractSelectorClasses(selector)) {
      const risk = this.analyzeClassRisk(className);
      if (risk.level === "dynamic") dynamicClasses.push(className);
      if (risk.level === "unstable") unstableClasses.push(className);
    }

    const dynamicIds = this.extractSelectorIds(selector)
      .filter(id => this.isDynamicGeneratedId(id));
    return {
      selector,
      possibleDynamicId: dynamicIds.length > 0,
      possibleDynamicClass: dynamicClasses.length > 0 || unstableClasses.length > 0,
      dynamicIds,
      dynamicClasses: [...new Set(dynamicClasses)],
      unstableClasses: [...new Set(unstableClasses)]
    };
  }

  filterAndRankPlaywrightSelectors(selectors) {
    const stableSelectors = [];
    const dynamicIdSelectors = [];
    const riskBySelector = new Map();

    for (const selector of selectors || []) {
      const risk = this.analyzeSelectorRisk(selector);
      riskBySelector.set(selector, risk);

      // Dynamic and unstable classes are unsafe across replays, so never retain
      // locator candidates that depend on either kind of class.
      if (risk.dynamicClasses.length || risk.unstableClasses.length) continue;
      if (risk.possibleDynamicId) dynamicIdSelectors.push(selector);
      else stableSelectors.push(selector);
    }

    const rankedSelectors = [
      ...stableSelectors,
      ...dynamicIdSelectors
    ];
    return {
      selectors: rankedSelectors,
      risks: rankedSelectors.map(selector => riskBySelector.get(selector))
    };
  }
//禁止使用: .gjs-selected-parent，此class表示: 目前有子元素處於 GrapesJS 選取狀態。

  isBlockedSelectorCandidate(selector) {
    return /\.gjs-selected-parent(?![a-zA-Z0-9_-])/.test(
      String(selector || "")
    );
  }

  generateLocatorCandidatesWithPlaywrightInjected(el, root = el?.getRootNode?.()) {
    if (el?.nodeType !== 1 || !root) { //el存在且，為element
      return {
        playwrightSelector: "",
        playwrightSelectors: [],
        playwrightSelectorRisks: [],
        finderWithoutIdSelector: ""
      };
    }

    let playwrightSelector = "";
    let playwrightSelectors = [];
    let playwrightSelectorRisks = [];
    try {
      const injected = this.getPlaywrightInjectedScript(el.ownerDocument);
      const generated = injected.generateSelector(el, {
        testIdAttributeName: "data-testid",
        multiple: true,
        root
      });
      const generatedSelectors = [...new Set(
        [generated.selector, ...(generated.selectors || [])].filter(Boolean)
      )].filter(selector => !this.isBlockedSelectorCandidate(selector));
      const filtered = this.filterAndRankPlaywrightSelectors(generatedSelectors);
      playwrightSelectors = filtered.selectors;
      playwrightSelectorRisks = filtered.risks;
      playwrightSelector = playwrightSelectors[0] || "";
    } catch (err) {
      console.warn("[DOMParser] playwright-injected selector generation failed", err);
    }

    let finderWithoutIdSelector = "";
    try {
      finderWithoutIdSelector = finder(el, {
        root,
        idName: () => false,
        className: name => !this.isDynamicOrUnstableClass(name)
      });
      if (this.isBlockedSelectorCandidate(finderWithoutIdSelector)) {
        finderWithoutIdSelector = "";
      }
    } catch (err) {
      console.warn("[DOMParser] finder selector generation without id failed", err);
    }

    return {
      playwrightSelector,
      playwrightSelectors,
      playwrightSelectorRisks,
      finderWithoutIdSelector
    };
  }

  bestDomPath(paths) {
    return this.rankDomPaths(paths)[0]?.path || null;
  }
//沒有用了
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

    try {
      const selector = finder(el, {
        root,
        idName: () => false,
        className: name => !this.isDynamicOrUnstableClass(name)
      });
      if (this.findUnique(selector, root)) return selector;
    } catch (err) {
      console.warn("[DOMParser] finder shadow host selector generation without id failed", err);
    }

    return "";
  }
//找出目標元素從最外層 Document 到它所在 Shadow DOM 之間，必須依序經過的所有 Shadow Host，並為每個 Shadow Host 產生 Selector
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

  getSelectorContextInfo(targetEl, sourceWin = null) {
    const ownerWindow = targetEl?.ownerDocument?.defaultView || sourceWin;
    let isIframe = false;
    let frameUrl = "";

    try {
      isIframe = !!ownerWindow?.frameElement;
      frameUrl = ownerWindow?.location?.href || "";
    } catch (e) {
      isIframe = !!sourceWin && sourceWin !== this.mainWindow;
    }

    return {
      context: isIframe ? "iframe" : "page",
      url: frameUrl || targetEl?.ownerDocument?.URL || "",
      scope: isIframe ? "目前 iframe document" : "目前 page document"
    };
  }

  inspectSelectorUniqueness(path, shadowChain, targetEl, sourceWin = null) {
    const contextInfo = this.getSelectorContextInfo(targetEl, sourceWin);
    const usesShadowRootTraversal = !!shadowChain?.length;
    const baseResult = {
      path: path || "",
      context: contextInfo.context,
      uniquenessScope: contextInfo.scope,
      url: contextInfo.url,
      usesShadowRootTraversal,
      shadowRootDepth: shadowChain?.length || 0,
      shadowHostPath: (shadowChain || []).map(step => step.hostSelector).join(" >>> "),
      matchCount: 0,
      targetMatched: false,
      isUnique: false,
      error: ""
    };

    if (!path || !targetEl?.ownerDocument) return baseResult;

    try {
      const matches = usesShadowRootTraversal
        ? this.resolveShadowMatches(targetEl.ownerDocument, shadowChain, path)
        : Array.from(targetEl.getRootNode().querySelectorAll(path));

      return {
        ...baseResult,
        matchCount: matches.length,
        targetMatched: matches.includes(targetEl),
        isUnique: matches.length === 1 && matches[0] === targetEl
      };
    } catch (e) {
      return {
        ...baseResult,
        error: e?.message || String(e)
      };
    }
  }

  createFailedSelectorCheck(generator, path, shadowChain, targetEl, sourceWin, error) {
    return {
      generator,
      ...this.inspectSelectorUniqueness(path, shadowChain, targetEl, sourceWin),
      error: error?.message || String(error)
    };
  }

  logDomSelectorChecks(targetEl, checks, shadowChain, selectedPath) {
    const contextInfo = this.getSelectorContextInfo(targetEl);
    console.groupCollapsed(
      `[RecorderDebug][DOM selectors] ${contextInfo.context} | ${checks.length} paths | shadow traversal: ${shadowChain?.length ? "YES" : "NO"}`
    );
    console.log("Target element:", targetEl);
    console.log("Selector check context:", {
      context: contextInfo.context,
      url: contextInfo.url,
      uniquenessScope: contextInfo.scope,
      usedShadowRootTraversalFunction: !!shadowChain?.length,
      shadowRootDepth: shadowChain?.length || 0,
      shadowChain
    });
    console.table(checks.map(check => ({
      generator: check.generator,
      path: check.path || "(empty / generation failed)",
      context: check.context,
      uniquenessScope: check.uniquenessScope,
      usedShadowTraversal: check.usesShadowRootTraversal ? "YES" : "NO",
      shadowDepth: check.shadowRootDepth,
      shadowHostPath: check.shadowHostPath || "(none)",
      matchCount: check.matchCount,
      targetMatched: check.targetMatched ? "YES" : "NO",
      uniqueInContext: check.isUnique ? "YES" : "NO",
      selected: check.path && check.path === selectedPath ? "YES" : "NO",
      error: check.error || ""
    })));
    console.log("Selected DOM path:", selectedPath || "(none)");
    console.groupEnd();
  }

  findUniqueWithShadowChain(path, shadowChain, targetEl) {
    return this.inspectSelectorUniqueness(path, shadowChain, targetEl).isUnique;
  }


  isDynamicOrUnstableClass(className) {
    return this.analyzeClassRisk(className).level !== "stable";
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
      ByGjsToolbarItem: { toolbarSelector: null, itemSelector: null, index: null },
      ByPlaywright: { selector: null, selectors: [], selectorRisks: [], shadowChain: [] },
      ByDomPath: { csspath: null, shadowChain: [], options: [] }
    };
  }

  getPriority() {
    return this.priority;
  }

  getPriSize() {
    return this.priSize;
  }

  analyzeDynamicId(id) {
    if (typeof id !== 'string' || !id.trim()) {//移除id不是字串，id前後空白後為空
      return {
        isDynamic: false,
        reason: "Element has no ID"
      };
    }

    const value = id.trim();

    //先測自訂規則
    for (const pattern of this.customDynamicIdPatterns) {
      // Reset stateful regular expressions (for example, patterns using /g).
      pattern.lastIndex = 0;
      if (pattern.test(value)) {
        return {
          isDynamic: true,
          reason: `Matches custom dynamic ID pattern: ${pattern}`
        };
      }
    }

    const rules = [
      {
        pattern: /^i[a-z0-9]{3,5}$/i,
        reason: "Matches a GrapesJS-like generated ID"
      },
      {
        pattern: /^ion-(input|textarea|select|checkbox|radio|toggle|range|datetime)-\d+(-lbl)?$/i,
        reason: "Matches an Ionic-generated ID"
      },
      {
        pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        reason: "Matches a UUID"
      },
      {
        pattern: /^(mui-|radix-|chakra-|el-|headlessui-|rc-tabs-).*\d+.*$/i,
        reason: "Matches a framework-generated ID"
      },
      {
        pattern: /^\d+$/,
        reason: "Contains only numbers"
      },
      {
        pattern: /^[a-z0-9_-]{10,}$/i,
        reason: "Looks like a long generated hash (10 or more characters)"
      }
    ];
    //測試上面規則
    const matchedRule = rules.find(rule => rule.pattern.test(value));
    if (matchedRule) {
      return {
        isDynamic: true,
        reason: matchedRule.reason
      };
    }

    return {
      isDynamic: false,
      reason: "Does not match any known dynamic ID pattern"
    };
  }
//判斷是不是dynamic id，回傳true or false
  isDynamicGeneratedId(id) {
    return this.analyzeDynamicId(id).isDynamic;
  }
}

export class ContextScanner {
  constructor(rootDoc = document, rootWin = window, options = {}) {
    this.options = {
      preferTopWindow: true,
      waitForDynamicFrames: true,
      quietTime: 800,
      maxWait: 8000,
      ...options
    };

    const resolvedRoot = this.resolveRootContext(rootDoc, rootWin);
    this.rootDocument = resolvedRoot.document;
    this.rootWindow = resolvedRoot.window;
    this.contextCounter = 0;
    this.iframePathMap = new Map();
  }

  //等頁面上的 iframe 載入穩定，再執行 scanAllContexts()
  async scanAllContextsAsync() {
    if (this.options.waitForDynamicFrames) {
      await this.waitForFramesOrStable(this.rootDocument, {
        quietTime: this.options.quietTime,
        maxWait: this.options.maxWait
      });
    }

    return this.scanAllContexts();
  }

  scanAllContexts() {
    const rootContext = this.createPageContext();
    const contexts = [rootContext];
    const contextMap = {
      [rootContext.contextId]: rootContext
    };

    this.scanChildFrames(rootContext, contexts, contextMap);

    return {
      rootContext,
      contexts,
      contextMap
    };
  }

  resolveRootContext(rootDoc, rootWin) {
    if (!this.options.preferTopWindow) {
      return {
        document: rootDoc || document,
        window: rootWin || window
      };
    }

    try {
      if (rootWin && rootWin.top && rootWin.top !== rootWin) {
        // 盡量提升到 top window
        return {
          document: rootWin.top.document,
          window: rootWin.top
        };
      }
    } catch (error) {
      // 若無法存取 top（例如跨網域），就退回目前 window
      console.warn('無法提升到 top window，改用目前 window', error);
    }

    return {
      document: rootDoc || document,
      window: rootWin || window
    };
  }

  createPageContext() {
    return {
      contextId: this.createContextId('page'),
      type: 'page',
      name: 'page',
      parentContextId: null,
      openerContextId: null,
      windowRef: this.rootWindow || null,
      documentRef: this.rootDocument || null,
      frameElement: null,
      frameSelector: null,
      url: this.safeGetUrl(this.rootWindow),
      children: []
    };
  }

  scanChildFrames(parentContext, contexts, contextMap) {
    const parentDoc = parentContext?.documentRef;
    if (!parentDoc) return;

    const frameElements = this.collectFrameElementsDeep(parentDoc);

    frameElements.forEach((frameEl, index) => {
      const frameSelector = this.buildFrameSelector(frameEl, index);
      console.log('[Debug ContextScanner] scanning iframe', this.getFrameDebugInfo(frameEl, index, frameSelector));

      const frameWin = this.safeGetFrameWindow(frameEl);
      const frameDoc = this.safeGetFrameDocument(frameWin, frameEl, index, frameSelector);

      const frameContext = {
        contextId: this.createContextId('iframe'),
        type: 'iframe',
        name: `${parentContext.name}_iframe_${index}`,
        parentContextId: parentContext.contextId,
        openerContextId: null,
        windowRef: frameWin,
        documentRef: frameDoc,
        frameElement: frameEl,
        frameSelector,
        url: this.safeGetUrl(frameWin),
        children: []
      };

      parentContext.children.push(frameContext.contextId);
      contexts.push(frameContext);
      contextMap[frameContext.contextId] = frameContext;

      // 即使拿不到 frameDoc，也保留這個 context
      if (frameDoc) {
        this.scanChildFrames(frameContext, contexts, contextMap);
      }
    });
  }

  collectFrameElementsDeep(rootNode) {
    const results = [];
    const visitedShadowRoots = new WeakSet();

    const walk = (node) => {
      if (!node) return;

      // 1. 一般 DOM 內的 iframe / frame
      if (node.querySelectorAll) {
        const localFrames = Array.from(node.querySelectorAll('iframe, frame'));
        results.push(...localFrames);
      }

      // 2. 走訪所有 element，檢查 shadowRoot
      const walker = node.ownerDocument
        ? node.ownerDocument.createTreeWalker(
            node,
            NodeFilter.SHOW_ELEMENT
          )
        : document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT);

      let current = walker.currentNode;
      while (current) {
        if (current.shadowRoot && !visitedShadowRoots.has(current.shadowRoot)) {
          visitedShadowRoots.add(current.shadowRoot);
          walk(current.shadowRoot);
        }
        current = walker.nextNode();
      }
    };

    walk(rootNode);

    // 去重，避免重複加入
    return Array.from(new Set(results));
  }

  buildFrameSelector(frameEl, index = 0) {
    if (!frameEl) return null;

    const escapeCss = (value) => {
      if (globalThis.CSS?.escape) return globalThis.CSS.escape(value);
      return String(value).replace(/"/g, '\\"');
    };
    const uniqueFrameSelector = (selector) => {
      if (!selector) return null;
      try {
        const root = frameEl.ownerDocument || this.rootDocument;
        const matches = Array.from(root.querySelectorAll(selector));
        return matches.length === 1 && matches[0] === frameEl ? selector : null;
      } catch (error) {
        return null;
      }
    };

    const tagName = (frameEl.tagName || 'iframe').toLowerCase();

    if (frameEl.id) {
      const selector = uniqueFrameSelector(`${tagName}#${escapeCss(frameEl.id)}`);
      if (selector) return selector;
    }

    if (frameEl.name) {
      const selector = uniqueFrameSelector(`${tagName}[name="${escapeCss(frameEl.name)}"]`);
      if (selector) return selector;
    }

    const title = frameEl.getAttribute('title');
    if (title) {
      const selector = uniqueFrameSelector(`${tagName}[title="${escapeCss(title)}"]`);
      if (selector) return selector;
    }

    const testId = frameEl.getAttribute('data-testid');
    if (testId) {
      const selector = uniqueFrameSelector(`${tagName}[data-testid="${escapeCss(testId)}"]`);
      if (selector) return selector;
    }

    const containerSelector = this.buildStableAncestorSelector(frameEl);
    if (containerSelector) {
      const selector = uniqueFrameSelector(`${containerSelector} ${tagName}`);
      if (selector) return selector;
    }

    const src = frameEl.getAttribute('src');
    if (src) {
      const selector = uniqueFrameSelector(`${tagName}[src="${escapeCss(src)}"]`);
      if (selector) return selector;
    }

    return `${tagName}:nth-of-type(${index + 1})`;
  }

  buildStableAncestorSelector(frameEl) {
    const escapeCss = (value) => {
      if (globalThis.CSS?.escape) return globalThis.CSS.escape(value);
      return String(value).replace(/"/g, '\\"');
    };

    let current = frameEl?.parentElement;
    while (current && current !== this.rootDocument?.documentElement) {
      const tagName = (current.tagName || '').toLowerCase();

      if (current.id && !this.isLikelyDynamicValue(current.id)) {
        return `#${escapeCss(current.id)}`;
      }

      const testId = current.getAttribute?.('data-testid');
      if (testId) {
        return `${tagName}[data-testid="${escapeCss(testId)}"]`;
      }

      const stableDataAttr = this.getStableDataAttributeSelector(current, tagName, escapeCss);
      if (stableDataAttr) {
        return stableDataAttr;
      }

      const classSelector = this.getStableClassSelector(current, tagName, escapeCss);
      if (classSelector) {
        return classSelector;
      }

      current = current.parentElement;
    }

    return null;
  }

  getStableDataAttributeSelector(element, tagName, escapeCss) {
    const ignored = new Set(['style', 'class', 'id', 'data-gjs-type']);
    for (const attr of Array.from(element.attributes || [])) {
      if (!attr.name.startsWith('data-') || ignored.has(attr.name)) continue;
      if (!attr.value || this.isLikelyDynamicValue(attr.value)) continue;
      return `${tagName}[${attr.name}="${escapeCss(attr.value)}"]`;
    }
    return null;
  }

  getStableClassSelector(element, tagName, escapeCss) {
    const stableClasses = Array.from(element.classList || [])
      .filter((className) => !this.isLikelyDynamicValue(className));
    if (!stableClasses.length) return null;
    return `${tagName}.${stableClasses.map(escapeCss).join('.')}`;
  }

  isLikelyDynamicValue(value) {
    const text = String(value || '').trim();
    if (!text) return true;
    return (
      /\d{4,}/.test(text) ||
      /[a-f0-9]{8,}/i.test(text) ||
      /^(active|selected|open|show|hidden|visible|disabled)$/i.test(text)
    );
  }

  createContextId(type) {
    const id = `ctx_${type}_${this.contextCounter}`;
    this.contextCounter += 1;
    return id;
  }
//安全取得 iframe 的 contentWindow，跨網域存取失敗時回傳 null 並警告
  safeGetFrameWindow(frameEl) {
    try {
      return frameEl?.contentWindow || null;
    } catch (error) {
      console.warn('無法取得 iframe.contentWindow', error);
      return null;
    }
  }
//安全取得 iframe 的 document，失敗（跨網域）時記錄詳細除錯資訊並回傳 null。
  safeGetFrameDocument(frameWin, frameEl = null, index = 0, frameSelector = null) {
    try {
      return frameWin?.document || null;
    } catch (error) {
      console.warn('[Debug ContextScanner] Failed to access iframe.document', {
        frame: this.getFrameDebugInfo(frameEl, index, frameSelector),
        frameUrl: this.safeGetUrl(frameWin),
        errorName: error?.name,
        errorMessage: error?.message,
        error
      });
      return null;
    }
  }

  getFrameDebugInfo(frameEl, index = 0, frameSelector = null) {
    if (!frameEl) return null;

    return {
      index,
      id: frameEl.id || null,
      name: frameEl.name || null,
      title: frameEl.getAttribute?.('title') || null,
      src: frameEl.getAttribute?.('src') || null,
      resolvedSrc: frameEl.src || null,
      selector: frameSelector || this.buildFrameSelector(frameEl, index),
      tagName: frameEl.tagName || null
    };
  }

  safeGetUrl(win) {
    try {
      return win?.location?.href || null;
    } catch (error) {
      return null;
    }
  }

  waitForFramesOrStable(doc, { quietTime = 800, maxWait = 8000 } = {}) {
    return new Promise((resolve) => {
      if (!doc) {
        resolve();
        return;
      }

      let quietTimer = null;
      let maxTimer = null;
      let resolved = false;

      const finish = () => {
        if (resolved) return;
        resolved = true;
        observer.disconnect();
        clearTimeout(quietTimer);
        clearTimeout(maxTimer);
        resolve();
      };

      const hasAnyFrameNow = () => {
        try {
          return this.collectFrameElementsDeep(doc).length > 0;
        } catch (error) {
          return false;
        }
      };

      // 如果一開始就已經有 iframe，也不要立刻 resolve，
      // 而是等一小段 quietTime，避免載入過程又持續變動
      const resetQuietTimer = () => {
        clearTimeout(quietTimer);
        quietTimer = setTimeout(() => {
          finish();
        }, quietTime);
      };

      const observer = new MutationObserver(() => {
        resetQuietTimer();

        // 只要已經出現 iframe，就給它 quietTime 後完成
        if (hasAnyFrameNow()) {
          resetQuietTimer();
        }
      });

      observer.observe(doc, {
        childList: true,
        subtree: true,
        attributes: true
      });

      // 初始檢查
      resetQuietTimer();

      // 最長等待時間
      maxTimer = setTimeout(() => {
        finish();
      }, maxWait);
    });
  }

  //Debug
  // 視覺化顯示目前已經建立的 Tree
  printContextTree(rootContext, contextMap, depth = 0) {
    const indent = '  '.repeat(depth);
    console.log(
      `${indent}- ${rootContext.name} [${rootContext.type}] (${rootContext.contextId})`
    );

    rootContext.children.forEach((childId) => {
      const child = contextMap[childId];
      if (child) {
        this.printContextTree(child, contextMap, depth + 1);
      }
    });
  }
//Debug
  debugTable(contexts) {
    console.table(
      contexts.map((ctx) => ({
        contextId: ctx.contextId,
        type: ctx.type,
        name: ctx.name,
        parentContextId: ctx.parentContextId,
        frameSelector: ctx.frameSelector,
        hasWindow: !!ctx.windowRef,
        hasDocument: !!ctx.documentRef,
        childrenCount: ctx.children.length,
        url: ctx.url,
        frameTitle: ctx.frameElement?.getAttribute?.('title') || null,
        frameSrc: ctx.frameElement?.getAttribute?.('src') || null
      }))
    );
  }
}

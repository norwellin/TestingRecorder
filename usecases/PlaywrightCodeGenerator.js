import { PlaywrightCommand } from '../entities/PlaywrightCommand.js';
import { DOMParserService } from './DOMParserService.js';
import { asLocator } from 'playwright-injected';

export class PlaywrightCodeGenerator {
  // 1. 移除 userActionDB 依賴，改為單純接收 DOM 服務與 Command 參照
  constructor(domService, command, pageAlias = 'page') {
    this.domService = domService;
    this.command = command; 
    this.typedText = '';
    // 🌟 記住目前這台 Generator 負責的視窗變數名稱 (預設是 'page')
    this.pageAlias = pageAlias;
    // 🌟 [新增] 儲存 ContextId 與對應 Playwright 變數名稱的查找表
    this.contextAliasMap = new Map();
    this.contextMap = new Map();
  }

  // 2. 改為直接回傳程式碼字串，將寫入動作交還給 MainApp1 處理
  generate(action) {
    if (!action) {
      console.warn("generate: action 不存在");
      return null;
    }
    console.log("Generating code for action: ", action);
    this.mergeActionContextSnapshots(action);

    // ==========================================
    // A. 處理無 DOM 元素的環境級別動作 (新架構新增)
    // ==========================================
    if (action.type === 'navigate') {
      const width = Math.floor(Number(action.viewport?.width));
      const height = Math.floor(Number(action.viewport?.height));
      const gotoLine = `await page.goto('${action.url}');`;

      if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
        return [
          `await page.setViewportSize({ width: ${width}, height: ${height} });`,
          gotoLine
        ];
      }
      return gotoLine;
    }
    if (action.type === 'dialog') {
      const winPrefix = this._getDialogPagePrefix(action.sourceWindow);
      let dialogAction = "await dialog.dismiss();";

      if (action.dialogType === "alert") {
        dialogAction = "await dialog.accept();";
      } else if (action.dialogType === "confirm") {
        dialogAction = action.result ? "await dialog.accept();" : "await dialog.dismiss();";
      } else if (action.dialogType === "prompt") {
        dialogAction = action.result === null
          ? "await dialog.dismiss();"
          : `await dialog.accept(${this.quoteForCode(action.result)});`;
      }

      const dialogCode = [
        `${winPrefix}.once('dialog', async dialog => {`,
        "  console.log(`Dialog message: ${dialog.message()}`);",
        `  ${dialogAction}`,
        "});"
      ];
      const codeArr = this.command.code;
      const lastLine = codeArr.length > 0 ? codeArr[codeArr.length - 1] : null;

      if (lastLine && lastLine.trim().startsWith("await ")) {
        return {
          isReplace: true,
          code: [
            ...dialogCode,
            lastLine
          ]
        };
      }

      return dialogCode;
    }
    // 🌟 核心修改：將 Promise.all 的組合邏輯封裝在 Generator 內
    if (action.type === 'popup') {
      const popupName = action.popupId || 'newPopup';
      const popupWidth = Math.floor(Number(action.viewport?.width));
      const popupHeight = Math.floor(Number(action.viewport?.height));
      const popupViewportLine =
        Number.isFinite(popupWidth) && Number.isFinite(popupHeight) &&
        popupWidth > 0 && popupHeight > 0
          ? `await ${popupName}.setViewportSize({ width: ${popupWidth}, height: ${popupHeight} });`
          : "";
      // 從本地的 Command 陣列取出最後一行程式碼 (通常是剛剛的 click)
      const codeArr = this.command.code;
      const lastLine = codeArr.length > 0 ? codeArr[codeArr.length - 1] : null;

      if (lastLine && lastLine.includes('await')) {
          const contextMatch = lastLine.match(/await\s+([^\.]+)\./);
          const contextPrefix = contextMatch ? contextMatch[1] : this.pageAlias;
          const cleanAction = lastLine.trim().replace(/^await\s+/, '').replace(/;$/, '');

          // 回傳一個物件，標記這是一個需要「覆寫上一行」的複合動作
          return {
              isReplace: true, 
              code: [
                  `const [${popupName}] = await Promise.all([`,
                  `  ${contextPrefix}.waitForEvent('popup'),`,
                  `  ${cleanAction}`,
                  `]);`,
                  ...(popupViewportLine ? [popupViewportLine] : [])
              ]
          };
      }
      const popupLines = [
        `const ${popupName} = await ${this.pageAlias}.waitForEvent('popup');`,
        ...(popupViewportLine ? [popupViewportLine] : [])
      ];
      return popupLines.length === 1 ? popupLines[0] : popupLines;
    }

    // ==========================================
    // B. 處理基於 DOM 的互動動作
    // ==========================================
    let sourcepath = action.preParsedSourcePath || null;
    console.log("[RecorderDebug][CodeGenerator generate] initial source path", {
      actionType: action.type,
      sourceWindow: action.sourceWindow,
      hasPreParsedSourcePath: !!action.preParsedSourcePath,
      preParsedSummary: this.summarizeDebugSourcePath(action.preParsedSourcePath),
      sourceElement: this.describeDebugElement(
        typeof action.getSourceElement === 'function' ? action.getSourceElement() : null
      )
    });
    let targetpath = null;
    let inputText = action.inputText || "default";
    let inputKey = action.keyboard || "default";
    let selectValue = action.selectedValue || "default";

    // 從封裝好的 UserAction 實體中取得元素與視窗資訊
    // 從封裝好的 UserAction 實體中取得元素與視窗資訊
    if (typeof action.getSourceElement === 'function') {
       
       // 【🌟 核心修改 🌟】
       // 判斷是否需要重新解析 source：如果預解析沒拿到東西，才去解析
       const needsSourceParsing = !sourcepath || (Array.isArray(sourcepath) && sourcepath[0] === null);
       console.log("[RecorderDebug][CodeGenerator generate] parse decision", {
         actionType: action.type,
         hasSourcePath: !!sourcepath,
         needsSourceParsing,
         currentSourcePathSummary: this.summarizeDebugSourcePath(sourcepath)
       });
       
       if (needsSourceParsing && action.getSourceElement()) {
           // 只有一般動作 (click, input) 或是 dragStart 漏抓，才會進來這裡
           sourcepath = this.domService.getOpenSourcePath(action.getSourceElement(), action.getSourceWindow(), action.type);
           console.log("[RecorderDebug][CodeGenerator generate] reparsed source path", {
             actionType: action.type,
             sourcePathSummary: this.summarizeDebugSourcePath(sourcepath)
           });
       }
       
       // 【解析 target】 (Drop 的目標在放開滑鼠當下是活著的，所以現場解析沒問題)
       if (action.type === "dragANDdrop" && typeof action.getTargetElement === "function" && action.getTargetElement()) {
           targetpath = this.domService.getOpenSourcePath(action.getTargetElement(), action.getTargetWindow());
       }
       
       // 同步補充輸入或選單的遺漏文字 (保持不變)
       if (action.type === 'input' && !action.inputText) {
           const srcEl = action.getSourceElement();
           inputText = srcEl ? (srcEl.innerText || srcEl.value || "") : "";
       }
        if (action.type === 'change' && !action.selectedValue) {
            const srcEl = action.getSourceElement();
            if (srcEl && srcEl.options && srcEl.selectedIndex >= 0) {
                selectValue = srcEl.value || srcEl.options[srcEl.selectedIndex]?.value || "";
            }
        }
    }

    // 解析動作發生的目標視窗環境 (動態 ContextId: 例如 'page', 'popup_1', 'iframe_2')
    const sourceWindow = action.sourceWindow || (typeof action.getSourceWindow === 'function' ? action.getSourceWindow() : 'page');
    const targetWindow = action.targetWindow || (typeof action.getTargetWindow === 'function' ? action.getTargetWindow() : 'page');

    // 根據事件類型分派，並將結果回傳給外層
    let generatedCode = null;
    if (action.type === 'dragANDdrop') {
      generatedCode = this.dragAndDropCodeSetter(action, targetpath, sourcepath, sourceWindow, targetWindow);
    } else if (action.type === 'click' || action.type === 'rightClick' || action.type === 'checkBox') {
      generatedCode = this.clickSetter(action, sourcepath, sourceWindow);
    } else if (action.type === 'dbclick') {
      generatedCode = this.doubleClickSetter(action, sourcepath, sourceWindow);
    } else if (action.type === 'input' || action.type === 'color') {
      generatedCode = this.inputSetter(action, sourcepath, sourceWindow, inputText);
    } else if (action.type === 'monacoSetValue') {
      generatedCode = this.monacoSetValueSetter(action, sourcepath, sourceWindow, inputText);
    } else if (action.type === 'canvasInput') {
      generatedCode = this.canvasInputSetter(action, sourcepath, sourceWindow, inputText);
    } else if (action.type === 'canvasWheel') {
      generatedCode = this.canvasWheelSetter(action, sourcepath, sourceWindow);
    } else if (action.type === 'range') {
      generatedCode = this.rangeSetter(action, sourcepath, sourceWindow, inputText);
    } else if (action.type === 'keyboard') {
      generatedCode = this.keyboardSetter(action, sourcepath, inputKey, sourceWindow);
    } else if (action.type === 'change') {
      generatedCode = this.changeSetter(action, sourcepath, selectValue, sourceWindow);
    } else if (action.type === 'ionSelect') {
      generatedCode = this.ionSelectSetter(action, sourcepath, sourceWindow);
    }

    console.log("[Debug PlaywrightCodeGenerator] generatedCode", {
      actionType: action.type,
      sourceWindow,
      sourcepath,
      generatedCode
    });
    console.log("[RecorderDebug][CodeGenerator generate] final", {
      actionType: action.type,
      sourceWindow,
      sourcePathSummary: this.summarizeDebugSourcePath(sourcepath),
      generatedCode
    });

    return generatedCode;
  }

  // ==========================================
  // 以下為具體的生成與組裝邏輯 Helper
  // ==========================================

  // 從解析結果中挑出權重最高(最優先)的 Selector 方法
  summarizeDebugSourcePath(sourcePath) {
    if (!sourcePath) return null;

    const summary = {};
    Object.keys(sourcePath).forEach((key) => {
      const item = sourcePath[key];
      if (!item) return;
      summary[key] = {
        funName: item.funName,
        selector: item.obj?.selector || null,
        locator: item.obj?.locator || null,
        csspath: item.obj?.csspath || null,
        shadowChain: item.obj?.shadowChain || [],
        options: Array.isArray(item.obj?.options)
          ? item.obj.options.map(option => ({
              path: option.path,
              shadowChain: option.shadowChain || [],
              score: option.score,
              U: option.U
            }))
          : []
      };
    });
    return summary;
  }

  describeDebugElement(element) {
    if (!element || element.nodeType !== 1) return String(element);

    const attrs = {};
    ["id", "class", "type", "part", "tab", "value", "data-gjs-type", "role", "aria-label"].forEach((name) => {
      const value = element.getAttribute?.(name);
      if (value !== null && value !== undefined && value !== "") attrs[name] = value;
    });

    return {
      tagName: element.tagName,
      attrs,
      text: (element.innerText || element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80)
    };
  }

  _isBlockedSelectorCandidate(selector) {
    return /\.gjs-selected-parent(?![a-zA-Z0-9_-])/.test(
      String(selector || "")
    );
  }

  _isBlockedPathCandidate(candidate) {
    if (candidate?.funName === "ByPlaywright") {
      return this._isBlockedSelectorCandidate(
        candidate.obj?.selector || candidate.obj?.locator
      );
    }
    if (candidate?.funName === "ByDomPath") {
      return this._isBlockedSelectorCandidate(candidate.obj?.csspath);
    }
    return false;
  }

  _getBestPath(paths) {
    if (!paths) return null;
    for (let i = 0; i < this.domService.priSize; i++) {
      if (paths[i] && !this._isBlockedPathCandidate(paths[i])) return paths[i];
    }
    return null;
  }

  _getBestDragTargetPath(paths) {
    const best = this._getBestPath(paths);
    if (best?.funName !== "ByText" || String(best.obj?.text || "").length <= 80) return best;

    const candidates = Array.isArray(paths) ? paths : Object.values(paths || {});
    return candidates.find(candidate =>
      candidate?.funName === "ByDomPath" &&
      candidate?.obj?.csspath &&
      !this._isBlockedPathCandidate(candidate)
    ) || best;
  }

  _getBestIonSelectPath(paths) {
    const best = this._getBestPath(paths);
    if (!best) return null;

    const locatorText = best.funName === "ByPlaywright"
      ? String(best.obj?.locator || this._playwrightSelectorToLocator(best.obj?.selector) || "")
      : "";
    const labelLocatorMatch = locatorText.match(/^(getByLabel\((?:"[^"]*"|'[^']*')(?:,\s*\{[^}]*\})?\))(?:\..*)?$/);
    if (labelLocatorMatch) {
      return {
        ...best,
        obj: {
          ...best.obj,
          locator: labelLocatorMatch[1]
        }
      };
    }

    const textTargetedSelect = best.funName === "ByText" || /\.getByText\(/.test(locatorText) || /^getByText\(/.test(locatorText);
    if (!textTargetedSelect) return best;

    const candidates = Array.isArray(paths) ? paths : Object.values(paths || {});
    return candidates.find(candidate => {
      if (candidate?.funName !== "ByPlaywright") return false;
      const candidateLocator = String(candidate.obj?.locator || this._playwrightSelectorToLocator(candidate.obj?.selector) || "");
      return candidateLocator && !/getByText\(/.test(candidateLocator);
    }) || best;
  }

  _buildLocatorOptions(paths) {
    if (!paths) return [];

    const options = [];
    const best = this._getBestPath(paths);
    for (let i = 0; i < this.domService.priSize; i++) {
      const candidate = paths[i];
      if (!candidate?.funName || !candidate?.obj) continue;

      if (candidate.funName === "ByPlaywright") {
        const selectors = Array.isArray(candidate.obj.selectors) && candidate.obj.selectors.length
          ? candidate.obj.selectors
          : [candidate.obj.selector];

        selectors.forEach((selector, selectorIndex) => {
          const locator = this._playwrightSelectorToLocator(selector);
          if (!selector || !locator || this._isBlockedSelectorCandidate(selector) || this._isBlockedSelectorCandidate(locator)) return;
          options.push({
            id: `ByPlaywright-${selectorIndex}`,
            method: "ByPlaywright",
            data: {
              selector,
              locator,
              shadowChain: candidate.obj.shadowChain || []
            },
            recommended: selector === candidate.obj.selector
          });
        });
        continue;
      }

      if (candidate.funName === "ByGjsToolbarItem") {
        options.push({
          id: "ByGjsToolbarItem-0",
          method: "ByGjsToolbarItem",
          data: {
            toolbarSelector: candidate.obj.toolbarSelector || ".gjs-toolbar",
            itemSelector: candidate.obj.itemSelector || ".gjs-toolbar-item",
            index: Math.max(0, Math.floor(Number(candidate.obj.index) || 0))
          },
          recommended: best?.funName === "ByGjsToolbarItem"
        });
        continue;
      }

      if (candidate.funName === "ByDomPath") {
        const domOptions = Array.isArray(candidate.obj.options) && candidate.obj.options.length
          ? candidate.obj.options
          : [{
              path: candidate.obj.csspath,
              shadowChain: candidate.obj.shadowChain || []
            }];

        domOptions.forEach((option, domIndex) => {
          if (!option?.path || this._isBlockedSelectorCandidate(option.path)) return;
          options.push({
            id: `ByDomPath-${domIndex}`,
            method: "ByDomPath",
            data: {
              csspath: option.path,
              shadowChain: option.shadowChain || candidate.obj.shadowChain || []
            },
            recommended: best?.funName === "ByDomPath" && option.path === candidate.obj.csspath
          });
        });
        continue;
      }

      options.push({
        id: `${candidate.funName}-0`,
        method: candidate.funName,
        data: { ...candidate.obj },
        recommended: best?.funName === candidate.funName
      });
    }

    return options;
  }

  // 特殊字元跳脫，避免 Playwright 語法出錯
  replacePath(cssPath) {
    return cssPath.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  quoteForCode(value) {
    return JSON.stringify(String(value ?? ""));
  }

  // 3. 解析 ContextId 為 Playwright 的操作變數前綴
  // 3. 解析 ContextId 為 Playwright 的操作變數前綴
  // 檔案：myrecorderRestructure/usecases/PlaywrightCodeGenerator.js

mergeActionContextSnapshots(action) {
    [action?.sourceContext, action?.targetContext].forEach(snapshot => {
      if (!snapshot?.contextId) return;
      const existing = this.contextMap.get(snapshot.contextId) || {};
      this.contextMap.set(snapshot.contextId, {
        ...existing,
        ...snapshot,
        frameElement: existing.frameElement || null,
        windowRef: existing.windowRef || null,
        documentRef: existing.documentRef || null
      });
    });
}

_getContextPrefix(winVar) {
    const context = this.contextMap.get(winVar);
    console.log("[Debug PlaywrightCodeGenerator] _getContextPrefix", {
        winVar,
        contextType: context?.type || null,
        contextId: context?.contextId || null,
        parentContextId: context?.parentContextId || null,
        frameSelector: context?.frameSelector || null,
        url: context?.url || null
    });
    if (context?.type === 'iframe') {
        if (this._isUsableIframeContext(context) || context.frameSelector) {
            return this._buildFrameLocatorChain(context);
        }

        console.warn("[PlaywrightCodeGenerator] iframe context is stale or mismatched; falling back to parent context", {
            contextId: context.contextId,
            parentContextId: context.parentContextId,
            frameSelector: context.frameSelector
        });
        return this._getBaseContextAlias(this.contextMap.get(context.parentContextId));
    }

    // 優先檢查 Map
    if (this.contextAliasMap && this.contextAliasMap.has(winVar)) {
        const alias = this.contextAliasMap.get(winVar);
        // 🌟 修正：如果映射到 page_0，強制回傳 page
        return (alias === 'page_0' || alias === 'page') ? this.pageAlias : alias;
    }
    
    // 自動轉換邏輯
    if (typeof winVar === 'string' && winVar.startsWith('ctx_')) {
        const autoAlias = winVar.replace('ctx_', '');
        return (autoAlias === 'page_0' || autoAlias === 'page') ? this.pageAlias : autoAlias;
    }

    return this.pageAlias; // 預設回傳 'page'
}
// 檔案：myrecorderRestructure/usecases/PlaywrightCodeGenerator.js

// 檔案：myrecorderRestructure/usecases/PlaywrightCodeGenerator.js

// 檔案：myrecorderRestructure/usecases/PlaywrightCodeGenerator.js

// 檔案：myrecorderRestructure/usecases/PlaywrightCodeGenerator.js

// 檔案：myrecorderRestructure/usecases/PlaywrightCodeGenerator.js

  _getDialogPagePrefix(sourceWindow) {
      const context = this.contextMap.get(sourceWindow);
      if (!context) return this._getContextPrefix(sourceWindow);

      let current = context;
      while (current?.parentContextId) {
          const parent = this.contextMap.get(current.parentContextId);
          if (!parent) break;
          current = parent;
      }

      return this._getBaseContextAlias(current);
  }

setContexts(contexts = [], rootAlias = this.pageAlias) {
      if (!Array.isArray(contexts)) return;
      const baseAlias = rootAlias || this.pageAlias;

      contexts.forEach(ctx => {
          if (!ctx?.contextId) return;

          this.contextMap.set(ctx.contextId, ctx);

          let alias = "";
          if (!ctx.contextId || ctx.contextId === 'ctx_page_0') {
              alias = baseAlias;
          } else {
              alias = ctx.contextId.replace(/^ctx_/, '');
              if (ctx.type === 'iframe' && baseAlias && baseAlias !== 'page') {
                  alias = `${baseAlias}_${alias}`;
              }
          }

          this.contextAliasMap.set(ctx.contextId, alias);
      });
  }

  _buildFrameLocatorChain(context) {
      const chain = [];
      let current = context;

      while (current?.type === 'iframe') {
          if (!this._isUsableIframeContext(current) && !current.frameSelector) {
              console.warn("[PlaywrightCodeGenerator] skipped unusable iframe context in locator chain", {
                  contextId: current.contextId,
                  parentContextId: current.parentContextId,
                  frameSelector: current.frameSelector
              });
              current = this.contextMap.get(current.parentContextId);
              break;
          }
          chain.unshift(current);
          current = this.contextMap.get(current.parentContextId);
      }

      let prefix = this._getBaseContextAlias(current);
      console.log("[Debug PlaywrightCodeGenerator] _buildFrameLocatorChain", {
          baseContextId: current?.contextId || null,
          baseType: current?.type || null,
          initialPrefix: prefix,
          chain: chain.map(frameContext => ({
              contextId: frameContext.contextId,
              parentContextId: frameContext.parentContextId,
              frameSelector: frameContext.frameSelector,
              url: frameContext.url
          }))
      });
      chain.forEach(frameContext => {
          const selector = this._frameSelectorToLocatorSelector(frameContext);
          console.log("[Debug PlaywrightCodeGenerator] frame selector resolved", {
              contextId: frameContext.contextId,
              rawFrameSelector: frameContext.frameSelector,
              locatorSelector: selector
          });
          prefix += `.locator(${this.quoteForCode(selector)}).contentFrame()`;
      });

      return prefix;
  }

  _getBaseContextAlias(context) {
      if (!context) return this.pageAlias;

      if (this.contextAliasMap.has(context.contextId)) {
          const alias = this.contextAliasMap.get(context.contextId);
          return (alias === 'page_0' || alias === 'page') ? this.pageAlias : alias;
      }

      if (context.type === 'page') return this.pageAlias;
      return context.contextId?.replace(/^ctx_/, '') || this.pageAlias;
  }

  _isUsableIframeContext(context) {
      if (context?.type !== 'iframe') return false;

      const frameElement = context.frameElement;
      const tagName = frameElement?.tagName?.toLowerCase();
      if (!frameElement || (tagName !== 'iframe' && tagName !== 'frame')) return false;
      if (frameElement.isConnected === false) return false;

      const parentContext = this.contextMap.get(context.parentContextId);
      if (parentContext?.documentRef && frameElement.ownerDocument !== parentContext.documentRef) {
          return false;
      }

      return true;
  }

  _frameSelectorToLocatorSelector(frameContextOrSelector) {
      if (typeof frameContextOrSelector === "string") return frameContextOrSelector || "iframe";

      const context = frameContextOrSelector || {};
      const frameElement = context.frameElement;
      const rebuiltSelector = this._buildLiveFrameSelector(frameElement);

      if (rebuiltSelector) return rebuiltSelector;

      const snapshotSelector = this._buildSnapshotFrameSelector(context);
      if (snapshotSelector) return snapshotSelector;

      const frameSelector = context.frameSelector;
      if (!frameSelector) return "iframe";

      if (this._selectorTargetsFrameElement(frameSelector, frameElement, context.parentContextId)) {
          return frameSelector;
      }

      const tagName = frameElement?.tagName?.toLowerCase?.();
      if (/^\s*(iframe|frame)([#.\[:\s]|$)/i.test(frameSelector)) {
          return frameSelector;
      }
      if (this._selectorResolvesToFrameElement(frameSelector, context.parentContextId)) {
          return frameSelector;
      }
      if (tagName === "iframe" || tagName === "frame") {
          return `${frameSelector} ${tagName}`;
      }

      return `${frameSelector} iframe`;
  }

  _buildLiveFrameSelector(frameElement) {
      const tagName = frameElement?.tagName?.toLowerCase?.();
      if (tagName !== "iframe" && tagName !== "frame") return "";

      const escapeCss = (value) => {
          if (globalThis.CSS?.escape) return globalThis.CSS.escape(value);
          return String(value).replace(/"/g, '\\"');
      };

      if (frameElement.id) return `${tagName}#${escapeCss(frameElement.id)}`;
      if (frameElement.name) return `${tagName}[name="${escapeCss(frameElement.name)}"]`;

      const title = frameElement.getAttribute?.("title");
      if (title) return `${tagName}[title="${escapeCss(title)}"]`;

      const testId = frameElement.getAttribute?.("data-testid");
      if (testId) return `${tagName}[data-testid="${escapeCss(testId)}"]`;

      return "";
  }

  _buildSnapshotFrameSelector(context) {
      const escapeCss = (value) => {
          if (globalThis.CSS?.escape) return globalThis.CSS.escape(value);
          return String(value).replace(/"/g, '\\"');
      };

      if (context?.frameId) return `iframe#${escapeCss(context.frameId)}`;
      if (context?.frameName) return `iframe[name="${escapeCss(context.frameName)}"]`;
      if (context?.frameTitle) return `iframe[title="${escapeCss(context.frameTitle)}"]`;
      if (context?.frameSrc) return `iframe[src="${escapeCss(context.frameSrc)}"]`;
      return "";
  }

  _selectorTargetsFrameElement(selector, frameElement, parentContextId) {
      if (!selector || !frameElement) return false;

      try {
          const parentDoc = this.contextMap.get(parentContextId)?.documentRef || frameElement.ownerDocument;
          const matches = Array.from(parentDoc.querySelectorAll(selector));
          return matches.length === 1 && matches[0] === frameElement;
      } catch (error) {
          return false;
      }
  }

  _selectorResolvesToFrameElement(selector, parentContextId) {
      if (!selector) return false;

      try {
          const parentDoc = this.contextMap.get(parentContextId)?.documentRef;
          if (!parentDoc) return false;
          const matches = Array.from(parentDoc.querySelectorAll(selector));
          if (matches.length !== 1) return false;
          const tagName = matches[0]?.tagName?.toLowerCase?.();
          return tagName === "iframe" || tagName === "frame";
      } catch (error) {
          return false;
      }
  }

declareContexts(contexts, rootAlias) {
      this.setContexts(contexts, rootAlias);
      return [];
      if (!contexts || !Array.isArray(contexts)) return [];
      const generatedDeclarations = [];

      // 第一階段：建立 ID 映射 (對齊名稱)
      contexts.forEach(ctx => {
          let alias = "";
          if (!ctx.contextId || ctx.contextId === 'ctx_page_0') {
              alias = rootAlias; // 通常是 'page' 或 'popup_xxx'
          } else {
              // 預設去掉 ctx_ 前綴，例如 ctx_iframe_1 變成 iframe_1
              alias = ctx.contextId.replace(/^ctx_/, '');
              
              // 🌟 關鍵新增邏輯：如果這個環境是 iframe，且所屬的根視窗不是 'page' (也就是它是 popup)
              // 就把 popup 的名字當作前綴加進去，例如 popup_359793_iframe_1
              if (ctx.type === 'iframe' && rootAlias && rootAlias !== 'page') {
                  alias = `${rootAlias}_${alias}`;
              }
          }
          this.contextAliasMap.set(ctx.contextId, alias);
      });

      // 第二階段：產生宣告
      contexts.forEach(ctx => {
          if (ctx.type === 'iframe') {
              // 從 Map 裡面取出已經轉換好的正確名稱
              const alias = this.contextAliasMap.get(ctx.contextId);
              const parentAlias = this.contextAliasMap.get(ctx.parentContextId) || rootAlias;
              const selector = ctx.frameSelector || `iframe:nth-of-type(1)`;
              
              // 產生代碼 (例如：const popup_123_iframe_1 = popup_123.frameLocator('...'))
              const declaration = `const ${alias} = ${parentAlias}.frameLocator(${this.quoteForCode(selector)});`;
              
              if (this.command && typeof this.command.appendCode === 'function') {
                  this.command.appendCode(declaration);
              }
              generatedDeclarations.push(declaration);
          }
      });

      return generatedDeclarations;
  }
  // 4. 新增共用的 Locator 字串組裝器，統整舊版 switch 邏輯
  _buildLocatorString(winPrefix, methodObj) {
    const { funName, obj } = methodObj;
    switch (funName) {
      case "ByPlaywright": {
        const locator = obj.locator || this._playwrightSelectorToLocator(obj.selector);
        return locator
          ? `${this._buildShadowHostLocatorPrefix(winPrefix, obj)}.${locator}`
          : `${winPrefix}.locator("unknown")`;
      }
      case "ByGjsToolbarItem":
        return this._buildGjsToolbarItemLocator(winPrefix, obj);
      case "ByRole": {
        const hasName = obj.name !== null && obj.name !== undefined && obj.name !== "";
        const exactOption = obj.exact === false ? "" : ", exact: true";
        const roleLocator = hasName
          ? `${winPrefix}.getByRole("${obj.role}", { name: "${obj.name}"${exactOption} })`
          : `${winPrefix}.getByRole("${obj.role}")`;
        const hasIndex = obj.index !== null && obj.index !== undefined;
        return hasIndex ? `${roleLocator}.nth(${obj.index})` : roleLocator;
      }
      case "ByTitle":
        return `${winPrefix}.getByTitle("${obj.title}", { exact: true })`;
      case "ByText":
        return `${winPrefix}.getByText("${obj.text}", { exact: true })`;
      case "ByDomPath":
        return this._buildDomPathLocator(winPrefix, obj);
      default:
        return `${winPrefix}.locator("unknown")`;
    }
  }

  _playwrightSelectorToLocator(selector) {
    if (!selector) return "";
    try {
      return asLocator("javascript", selector);
    } catch (error) {
      console.warn("[PlaywrightCodeGenerator] Could not convert injected selector to locator", {
        selector,
        error
      });
      return "";
    }
  }

  _buildShadowHostLocatorPrefix(winPrefix, obj = {}) {
    let locator = winPrefix;
    for (const step of obj.shadowChain || []) {
      locator += `.locator(${this.quoteForCode(step.hostSelector)})`;
    }
    return locator;
  }

  _buildDomPathLocator(winPrefix, obj) {
    let locator = this._buildShadowHostLocatorPrefix(winPrefix, obj);

    locator += `.locator(${this.quoteForCode(obj.csspath)})`;
    return locator;
  }

  _buildGjsToolbarItemLocator(winPrefix, obj) {
    const toolbarSelector = obj.toolbarSelector || ".gjs-toolbar";
    const itemSelector = obj.itemSelector || ".gjs-toolbar-item";
    const index = Math.max(0, Math.floor(Number(obj.index) || 0));
    return `${winPrefix}.locator(${this.quoteForCode(toolbarSelector)}).locator(${this.quoteForCode(itemSelector)}).nth(${index})`;
  }

  changeSetter(action, sourcepath, selectedValue, sourceWindow) {
    const best = this._getBestPath(sourcepath);
    if (!best) return null;
    
    const winPrefix = this._getContextPrefix(sourceWindow);
    const code = `await ${this._buildLocatorString(winPrefix, best)}.selectOption({ value: ${JSON.stringify(selectedValue)} });`;
    
    this.updateUserActionDB(action, best.funName, best.obj, "source", sourcepath);
    return code;
  }

  ionSelectSetter(action, sourcepath, sourceWindow) {
    const best = this._getBestIonSelectPath(sourcepath);
    if (!best) return null;

    const winPrefix = this._getContextPrefix(sourceWindow);
    const selectLocator = this._buildLocatorString(winPrefix, best);
    const selectInterface = ["popover", "alert", "action-sheet", "modal"].includes(action.selectInterface)
      ? action.selectInterface
      : "alert";
    const overlayTag = {
      popover: "ion-popover",
      alert: "ion-alert",
      "action-sheet": "ion-action-sheet",
      modal: "ion-modal"
    }[selectInterface];
    const selectedTexts = Array.isArray(action.selectedTexts) && action.selectedTexts.length
      ? action.selectedTexts
      : [action.selectedText || String(action.selectedValue ?? "")].filter(Boolean);
    const optionRole = selectInterface === "action-sheet"
      ? "button"
      : action.isMultiple === true
        ? "checkbox"
        : "radio";

    this.updateUserActionDB(action, best.funName, best.obj, "source", sourcepath);

    const optionClickLines = selectedTexts.map(text => {
      if (selectInterface === "popover") {
        const optionTag = action.isMultiple === true ? "ion-checkbox" : "ion-radio";
        return `await ${winPrefix}.locator("ion-popover").locator(${this.quoteForCode(optionTag)}).filter({ hasText: ${this.quoteForCode(text)} }).click();`;
      }
      return `await ${winPrefix}.locator(${this.quoteForCode(overlayTag)}).getByRole(${this.quoteForCode(optionRole)}, { name: ${this.quoteForCode(text)}, exact: true }).click();`;
    });

    const lines = [
      `await ${selectLocator}.click();`,
      ...optionClickLines
    ];

    if (selectInterface === "alert") {
      lines.push(
        `await ${winPrefix}.locator("ion-alert").getByRole("button", { name: "OK", exact: true }).click();`
      );
    }
    return lines;
  }

  _getKeyboardPagePrefix(sourceWindow) {
    let context = this.contextMap.get(sourceWindow);

    while (context?.type === "iframe") {
      context = this.contextMap.get(context.parentContextId);
    }

    return context
      ? this._getBaseContextAlias(context)
      : this._getContextPrefix(sourceWindow);
  }

  keyboardSetter(action, sourcepath, inputKey, sourceWindow) {
    const best = this._getBestPath(sourcepath);
    if (best) {
      const winPrefix = this._getContextPrefix(sourceWindow);
      const locator = this._buildLocatorString(winPrefix, best);
      this.updateUserActionDB(action, best.funName, best.obj, "source", sourcepath);
      return `await ${locator}.press(${this.quoteForCode(inputKey)});`;
    }

    const pagePrefix = this._getKeyboardPagePrefix(sourceWindow);
    return `await ${pagePrefix}.keyboard.press(${this.quoteForCode(inputKey)});`;
  }

  canvasInputSetter(action, sourcepath, sourceWindow, inputText) {
    const best = this._getBestPath(sourcepath);
    if (!best) return null;

    this.mergeActionContextSnapshots(action);
    const winPrefix = this._getContextPrefix(sourceWindow);
    const locator = this._buildLocatorString(winPrefix, best);
    const pagePrefix = this._getMousePageAliasForAction(action, sourceWindow, sourceWindow);
    const position = this._normalizeCanvasPoint(action?.canvasInputPosition);

    this.updateUserActionDB(action, best.funName, best.obj, "source", sourcepath);

    const lines = [
      "{",
      `  const canvas = ${locator};`,
      "  await canvas.scrollIntoViewIfNeeded();"
    ];

    if (position) {
      lines.push(
        "  const box = await canvas.boundingBox();",
        "  if (!box) throw new Error('Unable to calculate canvas input coordinates');",
        `  const point = ${JSON.stringify(position)};`,
        "  await canvas.click({ position: { x: box.width * point.xRatio, y: box.height * point.yRatio } });"
      );
    } else {
      lines.push("  await canvas.click();");
    }

    lines.push(
      `  await ${pagePrefix}.keyboard.type(${this.quoteForCode(inputText)});`,
      "}"
    );

    return lines;
  }

  canvasWheelSetter(action, sourcepath, sourceWindow) {
    const best = this._getBestPath(sourcepath);
    if (!best) return null;

    this.mergeActionContextSnapshots(action);
    const winPrefix = this._getContextPrefix(sourceWindow);
    const locator = this._buildLocatorString(winPrefix, best);
    const pagePrefix = this._getMousePageAliasForAction(action, sourceWindow, sourceWindow);
    const position = this._normalizeCanvasPoint(action?.canvasWheel?.position);
    const deltaX = Number(action?.canvasWheel?.deltaX);
    const deltaY = Number(action?.canvasWheel?.deltaY);
    if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) return null;

    this.updateUserActionDB(action, best.funName, best.obj, "source", sourcepath);

    const lines = [
      "{",
      `  const canvas = ${locator};`,
      "  await canvas.scrollIntoViewIfNeeded();"
    ];

    if (position) {
      lines.push(
        `  const wheelPoint = ${JSON.stringify(position)};`,
        "  const wheelBox = await canvas.boundingBox();",
        "  if (!wheelBox) throw new Error('Unable to calculate canvas wheel coordinates');",
        "  await canvas.hover({ position: { x: wheelBox.width * wheelPoint.xRatio, y: wheelBox.height * wheelPoint.yRatio } });"
      );
    } else {
      lines.push("  await canvas.hover();");
    }

    lines.push(
      `  await ${pagePrefix}.mouse.wheel(${Math.round(deltaX * 100) / 100}, ${Math.round(deltaY * 100) / 100});`,
      "}"
    );

    return lines;
  }

  canvasDragSetter(action, sourcepath, sourceWindow, targetWindow) {
    const best = this._getBestPath(sourcepath);
    if (!best) return null;

    this.mergeActionContextSnapshots(action);
    const winPrefix = this._getContextPrefix(sourceWindow);
    const locator = this._buildLocatorString(winPrefix, best);
    const mousePageAlias = this._getMousePageAliasForAction(action, sourceWindow, targetWindow || sourceWindow);
    const path = action.canvasDragPath
      .map(point => this._normalizeCanvasPoint(point))
      .filter(Boolean);

    if (path.length < 2) return null;

    this.updateUserActionDB(action, best.funName, best.obj, "source", sourcepath);
    this.updateUserActionDB(action, best.funName, best.obj, "target", sourcepath);

    return [
      "{",
      `  const canvas = ${locator};`,
      "  await canvas.scrollIntoViewIfNeeded();",
      "  const box = await canvas.boundingBox();",
      "  if (!box) throw new Error('Unable to calculate canvas drag coordinates');",
      `  const path = ${JSON.stringify(path)};`,
      "  const toPagePoint = point => ({",
      "    x: box.x + box.width * point.xRatio,",
      "    y: box.y + box.height * point.yRatio",
      "  });",
      "  const start = toPagePoint(path[0]);",
      `  await ${mousePageAlias}.mouse.move(start.x, start.y);`,
      `  await ${mousePageAlias}.mouse.down();`,
      "  for (const point of path.slice(1)) {",
      "    const pagePoint = toPagePoint(point);",
      `    await ${mousePageAlias}.mouse.move(pagePoint.x, pagePoint.y);`,
      "  }",
      `  await ${mousePageAlias}.mouse.up();`,
      "}"
    ];
  }

  _normalizeCanvasPoint(point) {
    if (!point) return null;

    let xRatio = Number(point.xRatio);
    let yRatio = Number(point.yRatio);
    const width = Number(point.width || point.sourceWidth || point.targetWidth);
    const height = Number(point.height || point.sourceHeight || point.targetHeight);
    const x = Number(point.x);
    const y = Number(point.y);

    if (!Number.isFinite(xRatio) && Number.isFinite(x) && Number.isFinite(width) && width > 0) {
      xRatio = x / width;
    }
    if (!Number.isFinite(yRatio) && Number.isFinite(y) && Number.isFinite(height) && height > 0) {
      yRatio = y / height;
    }
    if (!Number.isFinite(xRatio) || !Number.isFinite(yRatio)) return null;

    return {
      xRatio: Math.max(0, Math.min(1, Math.round(xRatio * 10000) / 10000)),
      yRatio: Math.max(0, Math.min(1, Math.round(yRatio * 10000) / 10000))
    };
  }

  dragAndDropCodeSetter(action, targetpath, sourcepath, sourceWindow, targetWindow) {
    const bestSou = this._getBestPath(sourcepath);
    if (Array.isArray(action?.canvasDragPath) && action.canvasDragPath.length >= 2) {
      return this.canvasDragSetter(action, sourcepath, sourceWindow, targetWindow);
    }

    const bestTar = this._getBestDragTargetPath(targetpath);
    if (!bestSou || !bestTar) return null;

    this.mergeActionContextSnapshots(action);
    const souWinPrefix = this._getActionContextPrefix(action, "source", sourceWindow);
    const tarWinPrefix = this._getActionContextPrefix(action, "target", targetWindow);

    const souLocator = this._buildLocatorString(souWinPrefix, bestSou);
    const tarLocator = this._buildLocatorString(tarWinPrefix, bestTar);

    this.updateUserActionDB(action, bestSou.funName, bestSou.obj, "source", sourcepath);
    this.updateUserActionDB(action, bestTar.funName, bestTar.obj, "target", targetpath);

    const dropXRatio = Number(action?.dropPosition?.xRatio);
    const dropYRatio = Number(action?.dropPosition?.yRatio);
    const hasDropRatio = Number.isFinite(dropXRatio) && Number.isFinite(dropYRatio);
    const dropX = Number(action?.dropPosition?.x);
    const dropY = Number(action?.dropPosition?.y);
    const hasAbsolutePosition = Number.isFinite(dropX) && Number.isFinite(dropY);
    const positionMode = ["ratio", "absolute", "center"].includes(action?.dropPositionMode)
      ? action.dropPositionMode
      : "ratio";
    const useRatio = positionMode === "ratio"
      ? hasDropRatio
      : positionMode === "absolute" && !hasAbsolutePosition && hasDropRatio;
    const useAbsolute = positionMode === "absolute"
      ? hasAbsolutePosition
      : positionMode === "ratio" && !hasDropRatio && hasAbsolutePosition;
    const xRatio = Math.max(0, Math.min(1, dropXRatio));
    const yRatio = Math.max(0, Math.min(1, dropYRatio));
    const recordedScrollState = action?.dropPosition?.scrollState;
    const scrollState = recordedScrollState?.scope === "element"
      ? {
          scope: "element",
          ancestorDepth: Math.max(0, Math.floor(Number(recordedScrollState.ancestorDepth) || 0)),
          scrollLeftRatio: Math.max(0, Math.min(1, Number(recordedScrollState.scrollLeftRatio) || 0)),
          scrollTopRatio: Math.max(0, Math.min(1, Number(recordedScrollState.scrollTopRatio) || 0))
        }
      : recordedScrollState?.scope === "document"
        ? {
            scope: "document",
            rootTag: ["html", "body"].includes(String(recordedScrollState.rootTag || "").toLowerCase())
              ? String(recordedScrollState.rootTag).toLowerCase()
              : "",
            scrollLeftRatio: Math.max(0, Math.min(1, Number(recordedScrollState.scrollLeftRatio) || 0)),
            scrollTopRatio: Math.max(0, Math.min(1, Number(recordedScrollState.scrollTopRatio) || 0))
          }
        : recordedScrollState?.scope === "ion-content"
          ? {
              scope: "ion-content",
              scrollLeftRatio: Math.max(0, Math.min(1, Number(recordedScrollState.scrollLeftRatio) || 0)),
              scrollTopRatio: Math.max(0, Math.min(1, Number(recordedScrollState.scrollTopRatio) || 0))
            }
        : null;

    if (this._shouldUseMouseDragForGrapesIframe(action)) {
      return this._buildGrapesIframeMouseDragCode({
        action,
        souLocator,
        tarLocator,
        sourceWindow,
        targetWindow,
        scrollState,
        useRatio,
        useAbsolute,
        xRatio,
        yRatio,
        dropX,
        dropY
      });
    }

    if (useRatio || scrollState) {
      const lines = [
        "{",
        `  const dropTarget = ${tarLocator};`
      ];

      if (scrollState) {
        if (scrollState.scope === "ion-content") {
          lines.push(
            "  await dropTarget.evaluate(async (element, state) => {",
            "    const ionContent = element.matches('ion-content') ? element : element.closest('ion-content');",
            "    if (!ionContent) return;",
            "    const scroller = await ionContent.getScrollElement();",
            "    const x = (scroller.scrollWidth - scroller.clientWidth) * state.scrollLeftRatio;",
            "    const y = (scroller.scrollHeight - scroller.clientHeight) * state.scrollTopRatio;",
            "    await ionContent.scrollToPoint(x, y, 0);",
            `  }, ${JSON.stringify(scrollState)});`
          );
        } else if (scrollState.scope === "element") {
          lines.push(
            "  await dropTarget.evaluate((element, state) => {",
            "    let scroller = element;",
            "    for (let depth = 0; depth < state.ancestorDepth && scroller; depth += 1) scroller = scroller.parentElement;",
            "    if (!scroller) return;",
            "    scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) * state.scrollLeftRatio;",
            "    scroller.scrollTop = (scroller.scrollHeight - scroller.clientHeight) * state.scrollTopRatio;",
            `  }, ${JSON.stringify(scrollState)});`
          );
        } else {
          lines.push(
            "  await dropTarget.evaluate((element, state) => {",
            "    const doc = element.ownerDocument;",
            "    const scroller = (state.rootTag && doc.querySelector(state.rootTag)) || doc.scrollingElement || doc.documentElement;",
            "    scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) * state.scrollLeftRatio;",
            "    scroller.scrollTop = (scroller.scrollHeight - scroller.clientHeight) * state.scrollTopRatio;",
            `  }, ${JSON.stringify(scrollState)});`
          );
        }
      }

      lines.push(
        `  await safeScrollIntoViewIfNeeded(${souLocator});`,
        "  await safeScrollIntoViewIfNeeded(dropTarget);",
        "  await dropTarget.waitFor({ state: 'visible' });"
      );

      if (useRatio) {
        lines.push(
          "  const dropSize = await dropTarget.evaluate(element => { const rect = element.getBoundingClientRect(); return { width: rect.width, height: rect.height }; });",
          `  await ${souLocator}.dragTo(dropTarget, { targetPosition: { x: dropSize.width * ${xRatio}, y: dropSize.height * ${yRatio} } });`
        );
      } else if (useAbsolute) {
        lines.push(
          `  await ${souLocator}.dragTo(dropTarget, { targetPosition: { x: ${dropX}, y: ${dropY} } });`
        );
      } else {
        lines.push(`  await ${souLocator}.dragTo(dropTarget);`);
      }
      lines.push("}");
      return lines;
    }

    if (useAbsolute) {
      return `await ${souLocator}.dragTo(${tarLocator}, { targetPosition: { x: ${dropX}, y: ${dropY} } });`;
    }
    return `await ${souLocator}.dragTo(${tarLocator});`;
  }

  _shouldUseMouseDragForGrapesIframe(action) {
    return this._isGrapesIframeContext(action?.sourceContext)
      && this._isGrapesIframeContext(action?.targetContext);
  }

  _isGrapesIframeContext(context) {
    if (!context || context.type !== "iframe") return false;
    const mapContext = context.contextId ? this.contextMap.get(context.contextId) : null;
    const frameElement = context.frameElement || mapContext?.frameElement || null;
    const values = [
      context.frameSelector,
      context.frameId,
      context.frameName,
      context.frameTitle,
      context.frameSrc,
      context.resolvedFrameSrc,
      context.url,
      frameElement?.id,
      frameElement?.name,
      frameElement?.title,
      frameElement?.getAttribute?.("id"),
      frameElement?.getAttribute?.("name"),
      frameElement?.getAttribute?.("title"),
      frameElement?.getAttribute?.("src"),
      frameElement?.src
    ];
    return values.some(value => /grapes|grapejs|gjs/i.test(String(value || "")));
  }

  _getMousePageAliasForAction(action, sourceWindow, targetWindow) {
    const candidates = [
      action?.targetContext,
      action?.sourceContext,
      this.contextMap.get(targetWindow),
      this.contextMap.get(sourceWindow)
    ].filter(Boolean);

    for (const candidate of candidates) {
      let context = candidate;
      while (context?.type === "iframe") {
        context = this.contextMap.get(context.parentContextId);
      }
      if (context?.type === "page") return this._getBaseContextAlias(context);
    }

    return this.pageAlias;
  }

  _appendDropScrollRestoreLines(lines, scrollState) {
    if (!scrollState) return;

    if (scrollState.scope === "ion-content") {
      lines.push(
        "  await dropTarget.evaluate(async (element, state) => {",
        "    const ionContent = element.matches('ion-content') ? element : element.closest('ion-content');",
        "    if (!ionContent) return;",
        "    const scroller = await ionContent.getScrollElement();",
        "    const x = (scroller.scrollWidth - scroller.clientWidth) * state.scrollLeftRatio;",
        "    const y = (scroller.scrollHeight - scroller.clientHeight) * state.scrollTopRatio;",
        "    await ionContent.scrollToPoint(x, y, 0);",
        `  }, ${JSON.stringify(scrollState)});`
      );
      return;
    }

    if (scrollState.scope === "element") {
      lines.push(
        "  await dropTarget.evaluate((element, state) => {",
        "    let scroller = element;",
        "    for (let depth = 0; depth < state.ancestorDepth && scroller; depth += 1) scroller = scroller.parentElement;",
        "    if (!scroller) return;",
        "    scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) * state.scrollLeftRatio;",
        "    scroller.scrollTop = (scroller.scrollHeight - scroller.clientHeight) * state.scrollTopRatio;",
        `  }, ${JSON.stringify(scrollState)});`
      );
      return;
    }

    lines.push(
      "  await dropTarget.evaluate((element, state) => {",
      "    const doc = element.ownerDocument;",
      "    const scroller = (state.rootTag && doc.querySelector(state.rootTag)) || doc.scrollingElement || doc.documentElement;",
      "    scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) * state.scrollLeftRatio;",
      "    scroller.scrollTop = (scroller.scrollHeight - scroller.clientHeight) * state.scrollTopRatio;",
      `  }, ${JSON.stringify(scrollState)});`
    );
  }

  _buildGrapesIframeMouseDragCode({
    action,
    souLocator,
    tarLocator,
    sourceWindow,
    targetWindow,
    scrollState,
    useRatio,
    useAbsolute,
    xRatio,
    yRatio,
    dropX,
    dropY
  }) {
    const mousePageAlias = this._getMousePageAliasForAction(action, sourceWindow, targetWindow);
    const sourceXRatio = Number.isFinite(Number(action?.sourcePosition?.xRatio))
      ? Math.max(0, Math.min(1, Number(action.sourcePosition.xRatio)))
      : 0.5;
    const sourceYRatio = Number.isFinite(Number(action?.sourcePosition?.yRatio))
      ? Math.max(0, Math.min(1, Number(action.sourcePosition.yRatio)))
      : 0.5;

    const lines = [
      "{",
      `  const dragSource = ${souLocator};`,
      `  const dropTarget = ${tarLocator};`
    ];

    this._appendDropScrollRestoreLines(lines, scrollState);

    lines.push(
      "  await safeScrollIntoViewIfNeeded(dragSource);",
      "  await safeScrollIntoViewIfNeeded(dropTarget);",
      "  await dragSource.waitFor({ state: 'visible' });",
      "  await dropTarget.waitFor({ state: 'visible' });",
      "  const sourceBox = await dragSource.boundingBox();",
      "  const targetBox = await dropTarget.boundingBox();",
      "  if (!sourceBox || !targetBox) throw new Error('Unable to calculate GrapesJS drag coordinates');",
      `  const sourcePoint = { x: sourceBox.x + sourceBox.width * ${sourceXRatio}, y: sourceBox.y + sourceBox.height * ${sourceYRatio} };`
    );

    if (useRatio) {
      lines.push(`  const targetPoint = { x: targetBox.x + targetBox.width * ${xRatio}, y: targetBox.y + targetBox.height * ${yRatio} };`);
    } else if (useAbsolute) {
      lines.push(`  const targetPoint = { x: targetBox.x + ${dropX}, y: targetBox.y + ${dropY} };`);
    } else {
      lines.push("  const targetPoint = { x: targetBox.x + targetBox.width / 2, y: targetBox.y + targetBox.height / 2 };");
    }

    lines.push(
      `  await ${mousePageAlias}.mouse.move(sourcePoint.x, sourcePoint.y);`,
      `  await ${mousePageAlias}.mouse.down();`,
      `  await ${mousePageAlias}.mouse.move((sourcePoint.x + targetPoint.x) / 2, (sourcePoint.y + targetPoint.y) / 2, { steps: 10 });`,
      `  await ${mousePageAlias}.mouse.move(targetPoint.x, targetPoint.y, { steps: 20 });`,
      `  await ${mousePageAlias}.mouse.up();`,
      "}"
    );

    return lines;
  }

  _getActionContextPrefix(action, field, fallbackContextId) {
    const context = field === "target" ? action?.targetContext : action?.sourceContext;
    if (context?.contextId) return this._getContextPrefix(context.contextId);
    return this._getContextPrefix(fallbackContextId);
  }

  clickSetter(action, sourcepath, sourceWindow) {
    const best = this._getBestPath(sourcepath);
    if (!best) return null;

    const winPrefix = this._getContextPrefix(sourceWindow);
    const locator = this._buildLocatorString(winPrefix, best);
    
    this.updateUserActionDB(action, best.funName, best.obj, "source", sourcepath);

    const clickX = Number(action?.clickPosition?.x);
    const clickY = Number(action?.clickPosition?.y);
    if (action?.type === "rightClick") {
      const options = [`button: "right"`];
      if (Number.isFinite(clickX) && Number.isFinite(clickY)) {
        options.push(`position: { x: ${clickX}, y: ${clickY} }`);
      }
      return `await ${locator}.click({ ${options.join(", ")} });`;
    }

    if (action?.type === "click" && Number.isFinite(clickX) && Number.isFinite(clickY)) {
      return `await ${locator}.click({ position: { x: ${clickX}, y: ${clickY} } });`;
    }

    return `await ${locator}.click();`;
  }

  doubleClickSetter(action, sourcepath, sourceWindow) {
    const best = this._getBestPath(sourcepath);
    if (!best) return null;

    const winPrefix = this._getContextPrefix(sourceWindow);
    const locator = this._buildLocatorString(winPrefix, best);
    
    this.updateUserActionDB(action, best.funName, best.obj, "source", sourcepath);

    const clickX = Number(action?.clickPosition?.x);
    const clickY = Number(action?.clickPosition?.y);
    if (Number.isFinite(clickX) && Number.isFinite(clickY)) {
      return `await ${locator}.dblclick({ position: { x: ${clickX}, y: ${clickY} } });`;
    }

    return `await ${locator}.dblclick();`;
  }

  inputSetter(action, sourcepath, sourceWindow, inputText) {
    const best = this._getBestPath(sourcepath);
    if (!best) return null;

    const winPrefix = this._getContextPrefix(sourceWindow);
    const locator = this._buildLocatorString(winPrefix, best);
    
    this.updateUserActionDB(action, best.funName, best.obj, "source", sourcepath);
    
    return `await ${locator}.fill(${this.quoteForCode(inputText)});`;
  }

  monacoSetValueSetter(action, sourcepath, sourceWindow, inputText) {
    const best = this._getBestPath(sourcepath);
    if (!best) return null;

    const winPrefix = this._getContextPrefix(sourceWindow);
    const locator = this._buildLocatorString(winPrefix, best);
    const monaco = action?.monaco || {};
    const payload = {
      editorIndex: Math.max(0, Math.floor(Number(monaco.editorIndex) || 0)),
      modelIndex: Math.max(0, Math.floor(Number(monaco.modelIndex) || 0)),
      modelUri: String(monaco.modelUri || ""),
      code: String(inputText ?? "")
    };

    this.updateUserActionDB(action, best.funName, best.obj, "source", sourcepath);

    return [
      "{",
      `  const editorRoot = ${locator};`,
      "  await editorRoot.evaluate((element, payload) => {",
      "    const win = element.ownerDocument.defaultView;",
      "    const monaco = win?.monaco;",
      "    if (!monaco?.editor) throw new Error('Monaco is not available');",
      "    const editors = monaco.editor.getEditors?.() || [];",
      "    const models = monaco.editor.getModels?.() || [];",
      "    const editorFromDom = editors.find(candidate => {",
      "      const domNode = candidate?.getDomNode?.();",
      "      return domNode === element || domNode?.contains?.(element) || element.contains?.(domNode);",
      "    });",
      "    const editor = editorFromDom || editors[payload.editorIndex];",
      "    if (editor?.setValue) {",
      "      editor.setValue(payload.code);",
      "      return;",
      "    }",
      "    const modelByUri = payload.modelUri",
      "      ? models.find(model => String(model.uri?.toString?.() || model.uri || '') === payload.modelUri)",
      "      : null;",
      "    const model = modelByUri || editor?.getModel?.() || models[payload.modelIndex] || models[0];",
      "    if (!model?.setValue) throw new Error('Monaco editor/model not found');",
      "    model.setValue(payload.code);",
      `  }, ${JSON.stringify(payload)});`,
      "}"
    ];
  }

  rangeSetter(action, sourcepath, sourceWindow, value) {
    const best = this._getBestPath(sourcepath);
    if (!best) return null;

    const winPrefix = this._getContextPrefix(sourceWindow);
    const locator = this._buildLocatorString(winPrefix, best);

    this.updateUserActionDB(action, best.funName, best.obj, "source", sourcepath);

    return `await ${locator}.fill(${this.quoteForCode(value)});`;
  }

  // 5. 將原本對全域陣列 Index 的更新，改為直接對傳入的 Action 實體屬性做更新 (解耦)
  updateUserActionDB(action, funName, obj, targetType = "source", locatorCandidates = null) {
    if (!action || typeof action.setSourceMethod !== 'function') return;

    let data = "";
    if (funName === "ByPlaywright") {
      data = obj.locator || this._playwrightSelectorToLocator(obj.selector);
    }
    else if (funName === "ByGjsToolbarItem") {
      data = `${obj.toolbarSelector || ".gjs-toolbar"} ${obj.itemSelector || ".gjs-toolbar-item"} nth=${Math.max(0, Math.floor(Number(obj.index) || 0))}`;
    }
    else if (funName === "ByTitle") data = obj.title;
    else if (funName === "ByText") data = obj.text;
    else if (funName === "ByDomPath") data = obj.csspath;
    else if (funName === "ByRole") {
      const parts = [`role: ${obj.role}`];
      if (obj.name !== null && obj.name !== undefined && obj.name !== "") {
        parts.push(`name: "${obj.name}"`);
      }
      if (obj.index !== null && obj.index !== undefined) {
        parts.push(`index: ${obj.index}`);
      }
      data = parts.join(" ");
    }

    if (targetType === "drop" || targetType === "target") {
      action.setTargetMethod(funName);
      action.setTargetData(data);
      action.targetLocatorOptions = this._buildLocatorOptions(locatorCandidates);
      if (funName === "ByDomPath" || funName === "ByPlaywright") {
        action.targetDomPathChain = obj.shadowChain || [];
      }
      if (funName === "ByDomPath") {
        action.targetDomPathOptions = Array.isArray(obj.options)
          ? obj.options.filter(option => !this._isBlockedSelectorCandidate(option?.path))
          : [];
      }
      console.log("[RecorderDebug][CodeGenerator updateUserActionDB] target stored", {
        actionType: action.type,
        funName,
        data,
        csspath: obj.csspath,
        shadowChain: obj.shadowChain || [],
        options: obj.options || []
      });
    } else {
      action.setSourceMethod(funName);
      action.setSourceData(data);
      action.sourceLocatorOptions = this._buildLocatorOptions(locatorCandidates);
      if (funName === "ByDomPath" || funName === "ByPlaywright") {
        action.sourceDomPathChain = obj.shadowChain || [];
      }
      if (funName === "ByDomPath") {
        action.sourceDomPathOptions = Array.isArray(obj.options)
          ? obj.options.filter(option => !this._isBlockedSelectorCandidate(option?.path))
          : [];
      }
      console.log("[RecorderDebug][CodeGenerator updateUserActionDB] source stored", {
        actionType: action.type,
        funName,
        data,
        csspath: obj.csspath,
        shadowChain: obj.shadowChain || [],
        options: obj.options || []
      });
    }
  }

  static initListener() {
    window.addEventListener("message", (event) => {
      const data = event.data;
      if (data.type === "keydown") {
        this.typedText = data.typedText;
      }
    });
  }
}

import { PlaywrightCommand } from '../entities/PlaywrightCommand.js';
import { DOMParserService } from './DOMParserService.js';

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
      return `await page.goto('${action.url}');`;
    }
    if (action.type === 'dialog') {
      const winPrefix = this._getContextPrefix(action.sourceWindow);
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
                  `]);`
              ]
          };
      }
      return `const ${popupName} = await ${this.pageAlias}.waitForEvent('popup');`;
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
    } else if (action.type === 'click' || action.type === 'checkBox') {
      generatedCode = this.clickSetter(action, sourcepath, sourceWindow);
    } else if (action.type === 'dbclick') {
      generatedCode = this.doubleClickSetter(action, sourcepath, sourceWindow);
    } else if (action.type === 'input' || action.type === 'color') {
      generatedCode = this.inputSetter(action, sourcepath, sourceWindow, inputText);
    } else if (action.type === 'range') {
      generatedCode = this.rangeSetter(action, sourcepath, sourceWindow, inputText);
    } else if (action.type === 'keyboard') {
      generatedCode = this.keyboardSetter(inputKey, sourceWindow);
    } else if (action.type === 'change') {
      generatedCode = this.changeSetter(action, sourcepath, selectValue, sourceWindow);
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

  _getBestPath(paths) {
    if (!paths) return null;
    for (let i = 0; i < this.domService.priSize; i++) {
      if (paths[i]) return paths[i];
    }
    return null;
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

  _buildDomPathLocator(winPrefix, obj) {
    let locator = winPrefix;

    for (const step of obj.shadowChain || []) {
      locator += `.locator(${this.quoteForCode(step.hostSelector)})`;
    }

    locator += `.locator(${this.quoteForCode(obj.csspath)})`;
    return locator;
  }

  changeSetter(action, sourcepath, selectedValue, sourceWindow) {
    const best = this._getBestPath(sourcepath);
    if (!best) return null;
    
    const winPrefix = this._getContextPrefix(sourceWindow);
    const code = `await ${this._buildLocatorString(winPrefix, best)}.selectOption({ value: ${JSON.stringify(selectedValue)} });`;
    
    this.updateUserActionDB(action, best.funName, best.obj, "source");
    return code;
  }

  keyboardSetter(inputKey, sourceWindow) {
    const winPrefix = this._getContextPrefix(sourceWindow);
    if (inputKey === "Backspace") {
      return `await ${winPrefix}.keyboard.press('Backspace');`;
    }
    return `await ${winPrefix}.keyboard.press(${this.quoteForCode(inputKey)});`;
  }

  dragAndDropCodeSetter(action, targetpath, sourcepath, sourceWindow, targetWindow) {
    const bestSou = this._getBestPath(sourcepath);
    const bestTar = this._getBestPath(targetpath);
    if (!bestSou || !bestTar) return null;

    this.mergeActionContextSnapshots(action);
    const souWinPrefix = this._getActionContextPrefix(action, "source", sourceWindow);
    const tarWinPrefix = this._getActionContextPrefix(action, "target", targetWindow);

    const souLocator = this._buildLocatorString(souWinPrefix, bestSou);
    const tarLocator = this._buildLocatorString(tarWinPrefix, bestTar);

    this.updateUserActionDB(action, bestSou.funName, bestSou.obj, "source");
    this.updateUserActionDB(action, bestTar.funName, bestTar.obj, "target");

    return `await ${souLocator}.dragTo(${tarLocator});`;
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
    
    this.updateUserActionDB(action, best.funName, best.obj, "source");
    
    return `await ${locator}.click();`;
  }

  doubleClickSetter(action, sourcepath, sourceWindow) {
    const best = this._getBestPath(sourcepath);
    if (!best) return null;

    const winPrefix = this._getContextPrefix(sourceWindow);
    const locator = this._buildLocatorString(winPrefix, best);
    
    this.updateUserActionDB(action, best.funName, best.obj, "source");
    
    return `await ${locator}.dblclick();`;
  }

  inputSetter(action, sourcepath, sourceWindow, inputText) {
    const best = this._getBestPath(sourcepath);
    if (!best) return null;

    const winPrefix = this._getContextPrefix(sourceWindow);
    const locator = this._buildLocatorString(winPrefix, best);
    
    this.updateUserActionDB(action, best.funName, best.obj, "source");
    
    return `await ${locator}.fill(${this.quoteForCode(inputText)});`;
  }

  rangeSetter(action, sourcepath, sourceWindow, value) {
    const best = this._getBestPath(sourcepath);
    if (!best) return null;

    const winPrefix = this._getContextPrefix(sourceWindow);
    const locator = this._buildLocatorString(winPrefix, best);

    this.updateUserActionDB(action, best.funName, best.obj, "source");

    return `await ${locator}.fill(${this.quoteForCode(value)});`;
  }

  // 5. 將原本對全域陣列 Index 的更新，改為直接對傳入的 Action 實體屬性做更新 (解耦)
  updateUserActionDB(action, funName, obj, targetType = "source") {
    if (!action || typeof action.setSourceMethod !== 'function') return;

    let data = "";
    if (funName === "ByTitle") data = obj.title;
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
      if (funName === "ByDomPath") {
        action.targetDomPathChain = obj.shadowChain || [];
        action.targetDomPathOptions = Array.isArray(obj.options) ? obj.options : [];
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
      if (funName === "ByDomPath") {
        action.sourceDomPathChain = obj.shadowChain || [];
        action.sourceDomPathOptions = Array.isArray(obj.options) ? obj.options : [];
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

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
  }

  // 2. 改為直接回傳程式碼字串，將寫入動作交還給 MainApp1 處理
  generate(action) {
    if (!action) {
      console.warn("generate: action 不存在");
      return null;
    }
    console.log("Generating code for action: ", action);

    // ==========================================
    // A. 處理無 DOM 元素的環境級別動作 (新架構新增)
    // ==========================================
    if (action.type === 'navigate') {
      return `await page.goto('${action.url}');`;
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
    let sourcepath = null;
    let targetpath = null;
    let inputText = action.inputText || "default";
    let inputKey = action.keyboard || "default";
    let selectLabel = action.selectedText || "default";

    // 從封裝好的 UserAction 實體中取得元素與視窗資訊
    if (typeof action.getSourceElement === 'function') {
       sourcepath = this.domService.getOpenSourcePath(action.getSourceElement(), action.getSourceWindow(), action.type);
       
       if (action.type === "dragANDdrop" && typeof action.getTargetElement === 'function') {
         targetpath = this.domService.getOpenSourcePath(action.getTargetElement(), action.getTargetWindow());
       }
       
       // 同步補充輸入或選單的遺漏文字
       if (action.type === 'input' && !action.inputText) {
           const srcEl = action.getSourceElement();
           inputText = srcEl ? (srcEl.innerText || srcEl.value || "") : "";
       }
       if (action.type === 'change' && !action.selectedText) {
           const srcEl = action.getSourceElement();
           if (srcEl && srcEl.options && srcEl.selectedIndex >= 0) {
               selectLabel = srcEl.options[srcEl.selectedIndex]?.text || "";
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
    } else if (action.type === 'input') {
      generatedCode = this.inputSetter(action, sourcepath, sourceWindow, inputText);
    } else if (action.type === 'keyboard') {
      generatedCode = this.keyboardSetter(inputKey, sourceWindow);
    } else if (action.type === 'change') {
      generatedCode = this.changeSetter(action, sourcepath, selectLabel, sourceWindow);
    }

    return generatedCode;
  }

  // ==========================================
  // 以下為具體的生成與組裝邏輯 Helper
  // ==========================================

  // 從解析結果中挑出權重最高(最優先)的 Selector 方法
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

  // 3. 解析 ContextId 為 Playwright 的操作變數前綴
  // 3. 解析 ContextId 為 Playwright 的操作變數前綴
  _getContextPrefix(winVar) {
    // 優先從 Map 尋找是否有被註冊過名稱
    if (this.contextAliasMap && this.contextAliasMap.has(winVar)) {
        return this.contextAliasMap.get(winVar);
    }
    // 2. 增加防禦性處理：如果 winVar 是 "ctx_iframe_1" 但 Map 沒查到，自動轉換為 "iframe_1"
  if (typeof winVar === 'string' && winVar.startsWith('ctx_')) {
      const autoAlias = winVar.replace('ctx_', '');
      return autoAlias === 'page_0' ? this.pageAlias : autoAlias;
  }
    // 預設容錯
    if (!winVar || winVar === "page" || winVar === "ctx_page_0") {
        return this.pageAlias;
    }
    
    // 如果未來有支援 Iframe，可能 winVar 會傳入 iframe 的 ID，這邊可以保留彈性
    return winVar;
  }
// 檔案：myrecorderRestructure/usecases/PlaywrightCodeGenerator.js

// 檔案：myrecorderRestructure/usecases/PlaywrightCodeGenerator.js

// 檔案：myrecorderRestructure/usecases/PlaywrightCodeGenerator.js

// 檔案：myrecorderRestructure/usecases/PlaywrightCodeGenerator.js

declareContexts(contexts, rootAlias) {
    if (!contexts || !Array.isArray(contexts)) return [];
    const generatedDeclarations = [];

    // 第一階段：對照表
    contexts.forEach(ctx => {
        let alias = "";
        // 修正：如果是主頁面 ID，強制對應到 rootAlias (page)
        if (!ctx.contextId || ctx.contextId === 'ctx_page_0') {
            alias = rootAlias;
        } else {
            alias = ctx.contextId.replace(/^ctx_/, '');
        }
        this.contextAliasMap.set(ctx.contextId, alias);
    });

    // 第二階段：產生 code
    contexts.forEach(ctx => {
        if (ctx.type === 'iframe') {
            const alias = this.contextAliasMap.get(ctx.contextId);
            const parentAlias = this.contextAliasMap.get(ctx.parentContextId) || rootAlias;
            const selector = ctx.frameSelector || `iframe:nth-of-type(1)`;
            
            const declaration = `const ${alias} = ${parentAlias}.frameLocator('${this.replacePath(selector)}');`;
            
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
      case "ByRole":
        if (obj.index <= 0) return `${winPrefix}.getByRole("${obj.role}", { name: "${obj.name}" })`;
        return `${winPrefix}.getByRole("${obj.role}", { name: "${obj.name}" }).nth(${obj.index})`;
      case "ByTitle":
        return `${winPrefix}.getByTitle("${obj.title}", { exact: true })`;
      case "ByText":
        return `${winPrefix}.getByText("${obj.text}", { exact: true })`;
      case "ByDomPath":
        return `${winPrefix}.locator("${this.replacePath(obj.csspath)}")`;
      default:
        return `${winPrefix}.locator("unknown")`;
    }
  }

  changeSetter(action, sourcepath, selectedValue, sourceWindow) {
    const best = this._getBestPath(sourcepath);
    if (!best) return null;
    
    const winPrefix = this._getContextPrefix(sourceWindow);
    let code = "";
    
    if (best.funName === "ByDomPath") {
        code = `await ${winPrefix}.locator('${this.replacePath(best.obj.csspath)}').selectOption({ label: ${JSON.stringify(selectedValue)} });`;
    } else {
        code = `await ${this._buildLocatorString(winPrefix, best)}.selectOption({ label: ${JSON.stringify(selectedValue)} });`;
    }
    
    this.updateUserActionDB(action, best.funName, best.obj, "source");
    return code;
  }

  keyboardSetter(inputKey, sourceWindow) {
    const winPrefix = this._getContextPrefix(sourceWindow);
    if (inputKey === "Backspace") {
      return `await ${winPrefix}.keyboard.press('Backspace');`;
    }
    return `await ${winPrefix}.keyboard.press('${inputKey}');`;
  }

  dragAndDropCodeSetter(action, targetpath, sourcepath, sourceWindow, targetWindow) {
    const bestSou = this._getBestPath(sourcepath);
    const bestTar = this._getBestPath(targetpath);
    if (!bestSou || !bestTar) return null;

    const souWinPrefix = this._getContextPrefix(sourceWindow);
    const tarWinPrefix = this._getContextPrefix(targetWindow);

    const souLocator = this._buildLocatorString(souWinPrefix, bestSou);
    const tarLocator = this._buildLocatorString(tarWinPrefix, bestTar);

    this.updateUserActionDB(action, bestSou.funName, bestSou.obj, "source");
    this.updateUserActionDB(action, bestTar.funName, bestTar.obj, "target");

    return `await ${souLocator}.dragTo(${tarLocator});`;
  }

  clickSetter(action, sourcepath, sourceWindow) {
    const best = this._getBestPath(sourcepath);
    if (!best) return null;

    const winPrefix = this._getContextPrefix(sourceWindow);
    const locator = this._buildLocatorString(winPrefix, best);
    
    this.updateUserActionDB(action, best.funName, best.obj, "source");
    
    if (best.funName === "ByDomPath") {
        return `await ${winPrefix}.click("${this.replacePath(best.obj.csspath)}");`;
    }
    return `await ${locator}.click();`;
  }

  doubleClickSetter(action, sourcepath, sourceWindow) {
    const best = this._getBestPath(sourcepath);
    if (!best) return null;

    const winPrefix = this._getContextPrefix(sourceWindow);
    const locator = this._buildLocatorString(winPrefix, best);
    
    this.updateUserActionDB(action, best.funName, best.obj, "source");
    
    if (best.funName === "ByDomPath") {
        return `await ${winPrefix}.dblclick("${this.replacePath(best.obj.csspath)}");`;
    }
    return `await ${locator}.dblclick();`;
  }

  inputSetter(action, sourcepath, sourceWindow, inputText) {
    const best = this._getBestPath(sourcepath);
    if (!best) return null;

    const winPrefix = this._getContextPrefix(sourceWindow);
    const locator = this._buildLocatorString(winPrefix, best);
    
    this.updateUserActionDB(action, best.funName, best.obj, "source");
    
    return `await ${locator}.fill('${inputText}');`;
  }

  // 5. 將原本對全域陣列 Index 的更新，改為直接對傳入的 Action 實體屬性做更新 (解耦)
  updateUserActionDB(action, funName, obj, targetType = "source") {
    if (!action || typeof action.setSourceMethod !== 'function') return;

    let data = "";
    if (funName === "ByTitle") data = obj.title;
    else if (funName === "ByText") data = obj.text;
    else if (funName === "ByDomPath") data = obj.csspath;

    if (targetType === "drop" || targetType === "target") {
      action.setTargetMethod(funName);
      action.setTargetData(data);
    } else {
      action.setSourceMethod(funName);
      action.setSourceData(data);
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
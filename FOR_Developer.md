# My Note

//note: JS 是 by reference傳遞 (不是by value)
JS 的 物件 (object, array, function, class instance) → 是 by reference。
JS 的 原始型別 (number, string, boolean, null, undefined, symbol, bigint) → 是 by value。
//note: JS的ARRAY可以直接存CLASS物件
//note: 靜態方法屬於 class 本身，而不是屬於 class 的實例（instance）
必須用 ClassName.methodName() 來呼叫，而不是用 new 出來的物件呼叫
靜態方法通常用在 跟某個類別有關，但不需要針對個別物件的行為
//note
=== 嚴格比較 (不回座型別轉換的比較)， == 則會先轉換型別
## API
DOMParserService.js
- getDomPath(el): el: 為event.target (完整的node節點)

UserAction.js
只是一個action的架構物件 (算是最底層物件)
- this.type (string)為事件名稱
- this.source (event.target)

Post Massenge structure:
- {
    type: "dragANDdrop" || "click",
    actionPos: this.rightNowAction (協助iframe和window互相及時同步更新action database現在位置)
}
## Functions in this version
✅Only support one iframe with one main window

## Documents Structure

```bash

File
├── entities/
│   ├── DOMElement.js
│   ├── UserAction.js
│   └── PlaywrightCommand.js
├── usecases/
│   ├── ActionInterpreter.js
│   ├── DOMParserService.js
│   └── PlaywrightCodeGenerator.js
├── interfaces/
│   ├── IframeEventListener.js
│   ├── OuterEventListener.js
│   └── CodeViewPresenter.js
├── infrastructure/
│   ├── EventBridge.js
│   ├── GUI.js
└── └── MainApp.js
```
## Execution
✅ Step 1: Install esbuild
initialized your project
```bash
npm init -y
```
install esbuild
```bash
npm install esbuild --save-dev
```
✅ Step 2: Bundle MainApp.js
```bash
npx esbuild MainApp.js --bundle --outfile=bundle.js
```
✅ Step 3: Add these lines at the end of bundle.js file
```bash
const app = new MainApp();
app.start();
```

## Usage

```bash
# Example command to run your project
python main.py
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first.

## Update
[31.08.2025] Click event can be detect at window.
[31.08.2025 Error] The code of the click event is incomplete
[31.08.2025] 串接方法改寫 (click)
[03.09.2025] 一堆bug還在修，drag and drop改寫
[03.09.2025] 用存在Chrome storage會有同步問題 (公共variable)，嘗試改成用post messenge的方式
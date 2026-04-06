# Project Title

A brief description of what your project does and who it's for.

## Features

- List key features or use cases

## Functions in this version
✅Only support one iframe with one main window

## Documents Structure

#The original Version of the structure
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
npx esbuild index.js --bundle --outfile=bundle.js
```
✅ Step 3: Add these lines at the end of bundle.js file
```bash
const app = new MainApp();
app.start();
```
✅ Step4 : Copy this command to the first line
```bash
window.global ||= window;
```

## Githuub basic command
✅ To check your current branch: git branch
✅ git add . 
✅ git commit -m "your command inside"
✅ git push
✅ git checkout -b **new branch name**
✅ push -u origin **new branch name** // must be used when you first push into your branch
## Usage

```bash
# Example command to run your project
python main.py
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first.

## Update
[31.08.2025] Click event can be detect at window.




[MIT](LICENSE)
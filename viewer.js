let editor = CodeMirror(document.getElementById("editor"), {
  value: "// No code has been generated yet",
  mode: "javascript",
  lineNumbers: true,
  theme: "eclipse",
  readOnly: false, // 設為 false，使用者可以編輯,
  smartIndent: true,
  indentUnit: 2,
  tabSize: 2,
});


// 先抓一次
  chrome.storage.local.get(["generatedCode"], (result) => {
    let code = "";
    
    if(result.generatedCode){
      code = result.generatedCode.join("\n");
    }
    else{
      code = "// No code has been generated yet";
    }
    editor.setValue(code);
  });

  // 偵測 storage 更新 → 即時更新 popup
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.generatedCode) {
      const code = changes.generatedCode.newValue.join("\n");
      editor.setOption("value", code);
      autoIndentAll(editor);
    }
  });

  //設定視窗開啟
  document.getElementById('btn_setting').addEventListener('click', () => {
  chrome.windows.create({
    url: chrome.runtime.getURL("settings.html"),
    type: "popup",
    width:500,
    height: 500
  });

  function autoIndentAll(editor) {
  const lastLine = editor.lineCount();
  editor.operation(() => {
    editor.setSelection({line: 0, ch: 0}, {line: lastLine - 1, ch: editor.getLine(lastLine - 1).length});
    editor.indentSelection("smart");
    editor.setCursor(0, 0); // 回到檔案開頭（避免游標停在最後）
  });
}

});
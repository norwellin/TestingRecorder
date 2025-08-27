let editor = CodeMirror(document.getElementById("editor"), {
  value: "// No code has been generated yet",
  mode: "javascript",
  lineNumbers: true,
  theme: "eclipse",
  readOnly: false // 設為 false，使用者可以編輯
});


// 先抓一次
  chrome.storage.local.get(["generatedCode"], (result) => {
    const code = "";
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
      editor.setValue(code);
    }
  });

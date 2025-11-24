//For the start button
const startBtn = document.getElementById('startBtn');
const recordIcon = document.getElementById('recordIcon');

let isRecording = false;

startBtn.addEventListener("click", () => {
  isRecording = !isRecording;

  if(isRecording){
    startBtn.setAttribute('color','danger');
    recordIcon.setAttribute('name','stop-circle');
    console.log("start recording");
  }
  else{
    startBtn.setAttribute('color','primary');
    recordIcon.setAttribute('name','stop-circle-outline');
    console.log("stop recording");
  }
  
});

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

  // 先抓一次
  chrome.storage.local.get(["generatedAction"], (result) => {
    
    if(result.generatedAction){
      updateTable(result.generatedAction);
    }
    else{
      console.log("no user action generated yet!")
    }
  });
  // 偵測 storage 更新 → 即時更新 popup
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.generatedCode) {
      const code = changes.generatedCode.newValue.join("\n");
      editor.setOption("value", code);
      this.autoIndentAll(editor);
    }
    else if (changes.generatedAction){
      console.log("storage change!")
      const useractionDB = changes.generatedAction.newValue || [];
      console.log(useractionDB);
      updateTable(useractionDB);
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

});
  function autoIndentAll(editor) {
  const lastLine = editor.lineCount();
  editor.operation(() => {
    editor.setSelection({line: 0, ch: 0}, {line: lastLine - 1, ch: editor.getLine(lastLine - 1).length});
    editor.indentSelection("smart");
    editor.setCursor(0, 0); // 回到檔案開頭（避免游標停在最後）
  });
  
}
function updateTable(list) {
  const table = document.getElementById("actionTable"); 
  const tbody = table.querySelector("tbody");
  
  // 清空 tbody
  tbody.innerHTML = "";

  console.log("list: ", list);

  // 依序新增每一筆資料
  list.forEach((item, index) => {
    const row = tbody.insertRow(); // ← 改成 tbody
    row.insertCell().textContent = index + 1;
    row.insertCell().textContent = item.type || "";
    row.insertCell().textContent = item.sourceWindow || "";
    row.insertCell().textContent = item.targetWindow || "";
    row.insertCell().textContent = item.sourceMethod || "";
    row.insertCell().textContent = item.sourceData || "";
    row.insertCell().textContent = item.targetMethod || "";
    row.insertCell().textContent = item.targetData || "";
  });
}

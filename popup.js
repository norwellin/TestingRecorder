


document.addEventListener('DOMContentLoaded', function() {
    const startButton = document.getElementById('start-recording');
    const stopButton = document.getElementById('stop-recording');
    const clearButton = document.getElementById('clear-recording');
    const exportButton = document.getElementById('export-script');
    const statusDiv = document.getElementById('status');
    const actionsDiv = document.getElementById('recorded-actions');
    const actionsCountSpan = document.getElementById('actions-count');
    const recordingIndicator = document.getElementById('recording-indicator');
    const scriptTextarea = document.getElementById('script-textarea');
    const languageSelect = document.getElementById('language-select');
    const languageIndicator = document.getElementById('language-indicator');


    console.log('exportButton:', exportButton);
console.log('exportButton exists?', !!exportButton);
console.log('exportButton disabled?', exportButton?.disabled);

    // Actions container resizing functionality
    const actionsResizer = document.getElementById('actions-resizer');
    const actionsContainer = document.getElementById('actions-container');
    
    let startY, startHeight, currentResizer;
    const codeView = document.getElementById("code-view");

// 先抓一次 generatedCode
chrome.storage.local.get(["generatedCode"], (result) => {
    let code = "";

    if(result.generatedCode){
        code = result.generatedCode.join("\n");
    }
    else{
        code = "// No code has been generated yet";
    }

    codeView.textContent = code;
    //hljs.highlightAll(codeView);

    
});

// 監聽 storage 變化 → 即時更新
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.generatedCode) {
        const code = changes.generatedCode.newValue.join("\n");
        codeView.textContent = code;
        //hljs.highlightAll(codeView);

    }

});




    function doDrag(e) {
        if (!currentResizer) return;
        
        const newHeight = startHeight + e.clientY - startY;
        // Prevent it from getting too small
        if (newHeight > 100) {
            currentResizer.container.style.height = newHeight + 'px';
        }
    }
    
    function stopDrag() {
        currentResizer = null;
        document.documentElement.removeEventListener('mousemove', doDrag, false);
        document.documentElement.removeEventListener('mouseup', stopDrag, false);
    }

    let actions = [];
    let currentLanguage = languageSelect.value;

    console.log('Recorder interface loaded');

    // Add a filename input field
    const exportControls = document.createElement('div');
    exportControls.className = 'export-controls';
    exportControls.style.marginTop = '10px';
    exportControls.style.display = 'flex';
    exportControls.style.alignItems = 'center';
    exportControls.style.gap = '10px';
    
    const filenameLabel = document.createElement('label');
    filenameLabel.textContent = 'Filename:';
    filenameLabel.style.fontWeight = 'bold';
    
    const filenameInput = document.createElement('input');
    filenameInput.type = 'text';
    filenameInput.id = 'filename-input';
    filenameInput.value = 'playwright-test';
    filenameInput.style.padding = '6px 10px';
    filenameInput.style.borderRadius = '4px';
    filenameInput.style.border = '1px solid #ccc';
    filenameInput.style.flexGrow = '1';
    
    const extensionSpan = document.createElement('span');
    extensionSpan.id = 'extension-display';
    extensionSpan.textContent = '.js';
    extensionSpan.style.backgroundColor = '#eee';
    extensionSpan.style.padding = '6px 10px';
    extensionSpan.style.borderRadius = '4px';
    extensionSpan.style.fontFamily = 'monospace';
    
    exportControls.appendChild(filenameLabel);
    exportControls.appendChild(filenameInput);
    exportControls.appendChild(extensionSpan);
    
    // Insert the export controls before the script preview
    const scriptPreviewElement = document.querySelector('.script-preview');
    document.body.insertBefore(exportControls, scriptPreviewElement);

    // Immediately disable Stop button
    stopButton.disabled = true;

    // Update file extension when language changes
    function updateExtension() {
        const extensionDisplay = document.getElementById('extension-display');
        switch(currentLanguage) {
            case 'javascript':
                extensionDisplay.textContent = '.js';
                break;
            case 'typescript':
                extensionDisplay.textContent = '.ts';
                break;
            case 'python':
                extensionDisplay.textContent = '.py';
                break;
            case 'java':
                extensionDisplay.textContent = '.java';
                break;
            case 'csharp':
                extensionDisplay.textContent = '.cs';
                break;
        }
    }

    // Language select change handler
    languageSelect.addEventListener('change', function() {
        currentLanguage = languageSelect.value;
        languageIndicator.textContent = languageSelect.options[languageSelect.selectedIndex].text;
        updateExtension();
        updateScriptPreview(actions);
    });
/*
    // Check if recording is already active
    console.log('Checking recording status...');
    chrome.runtime.sendMessage({command: 'getStatus'}, function(response) {
        console.log('Status response:', response);
        if (response && response.isRecording) {
            console.log('Recording is active, updating UI');
            startRecordingUI();
        } else {
            console.log('Not recording');
        }

        // Load any existing recorded actions
        console.log('Loading existing actions...');
        chrome.storage.local.get(['actions'], function(result) {
            console.log('Storage result:', result);
            if (result.actions && result.actions.length > 0) {
                console.log(`Loaded ${result.actions.length} actions`);
                actions = result.actions;
                updateActionsList(actions);
                updateScriptPreview(actions);
                clearButton.disabled = false;
                exportButton.disabled = false;
            } else {
                console.log('No existing actions found');
            }
        });
    });
*/
    startButton.addEventListener('click', function() {
        console.log('Start button clicked');

        chrome.runtime.sendMessage({type: 'START_RECORDING'});
        startRecordingUI();
    });

    stopButton.addEventListener('click', function() {
        console.log('Stop button clicked');
        chrome.runtime.sendMessage({type: 'STOP_RECORDING'});
        stopRecordingUI();

    });

    clearButton.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all recorded actions?')) {
            console.log('Clearing actions');
            chrome.storage.local.set({actions: []}, function() {
                console.log('Actions cleared in storage');
                actions = [];
                actionsDiv.innerHTML = '';
                actionsCountSpan.textContent = '0 actions';
                clearButton.disabled = true;
                exportButton.disabled = false;
                updateScriptPreview(actions);
            });
        }
    });
    /*
    exportButton.addEventListener('click', function() {
        if (actions.length > 0) {
            console.log('Exporting script in', currentLanguage);
            let script;
            let extension;
            let customFilename = document.getElementById('filename-input').value.trim();
            
            // Fallback to default if empty
            if (!customFilename) {
                customFilename = 'playwright-test';
            }
            
            // Remove any file extension the user might have added
            customFilename = customFilename.replace(/\.\w+$/, '');
            
            switch (currentLanguage) {
                case 'javascript':
                    script = getJSCode();
                    console.log("script: ",script);
                    //extension = '.spec.js';
                    break;
                default:
                    script = getJSCode();;
                    ///extension = '.spec.js';
            }

            //const filename = customFilename + extension;

            // Create a blob and download the script
            const filename = `${customFilename}.spec.js`;

            const blob = new Blob([script], { type: "application/javascript" });

            const url = URL.createObjectURL(blob);

            chrome.downloads.download({
                url: url,
                filename: filename,
                saveAs: true
            });
        }
    });


    // Listen for new actions being recorded
    console.log('Setting up action listener');
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        console.log('Received message:', message);
        if (message.type === 'actionsUpdated') {
            console.log('Actions updated:', message.actions);
            actions = message.actions;
            updateActionsList(actions);
            updateScriptPreview(actions);
            clearButton.disabled = false;
            exportButton.disabled = false;
        }
    });

    function startRecordingUI() {
        console.log('Setting UI to recording state');
        startButton.disabled = true;
        stopButton.disabled = false;
        statusDiv.textContent = 'Recording...';
        recordingIndicator.classList.add('active');
    }

    function stopRecordingUI() {
        console.log('Setting UI to stopped state');
        startButton.disabled = false;
        stopButton.disabled = true;
        statusDiv.textContent = 'Not recording';
        recordingIndicator.classList.remove('active');
    }
/*
    function updateActionsList(actions) {
        console.log(`Updating actions list with ${actions.length} actions`);
        actionsDiv.innerHTML = '';
        actionsCountSpan.textContent = actions.length + (actions.length === 1 ? ' action' : ' actions');

        if (actions.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = 'No actions recorded yet. Click "Start Recording" and interact with your web page.';
            emptyMessage.style.padding = '20px';
            emptyMessage.style.color = '#666';
            emptyMessage.style.textAlign = 'center';
            actionsDiv.appendChild(emptyMessage);
            return;
        }

        actions.forEach(function(action, index) {
            const actionElement = document.createElement('div');
            actionElement.className = 'action-item';

            const numberSpan = document.createElement('span');
            numberSpan.className = 'action-number';
            numberSpan.textContent = index + 1;

            const typeSpan = document.createElement('span');
            typeSpan.className = 'action-type';
            typeSpan.textContent = action.type;

            const detailsSpan = document.createElement('span');
            detailsSpan.className = 'action-details';

            if (action.type === 'navigate') {
                detailsSpan.textContent = 'to ';
                const valueSpan = document.createElement('span');
                valueSpan.className = 'action-value';
                valueSpan.textContent = `"${action.value || ''}"`;
                detailsSpan.appendChild(valueSpan);
            } else if (action.selector) {
                detailsSpan.textContent = action.selector;

                if (action.value) {
                    const valueSpan = document.createElement('span');
                    valueSpan.className = 'action-value';
                    valueSpan.textContent = ` "${action.value}"`;
                    detailsSpan.appendChild(valueSpan);
                }
            }

            actionElement.appendChild(numberSpan);
            actionElement.appendChild(typeSpan);
            actionElement.appendChild(detailsSpan);

            actionsDiv.appendChild(actionElement);
        });

        // Auto-scroll to the latest action
        actionsDiv.scrollTop = actionsDiv.scrollHeight;
    }

    function updateScriptPreview(actions) {
        console.log('Updating script preview for', actions.length, 'actions');
        
        if (actions.length > 0) {
            let script;
            switch (currentLanguage) {
                case 'javascript':
                    script = generateJavaScriptScript(actions);
                    break;
                case 'typescript':
                    script = generateTypeScriptScript(actions);
                    break;
                case 'python':
                    script = generatePythonScript(actions);
                    break;
                case 'java':
                    script = generateJavaScript(actions);
                    break;
                case 'csharp':
                    script = generateCSharpScript(actions);
                    break;
                default:
                    script = generateJavaScriptScript(actions);
            }
            scriptTextarea.value = script;
        } else {
            scriptTextarea.value = `// No actions recorded yet\n// Click "Start Recording" and interact with your web page`;
        }
    }

    // Initialize the extension display
    updateExtension();
*/
function getJSCode() {
    return new Promise((resolve) => {
        chrome.storage.local.get(["generatedCode"], (result) => {
            resolve(
                result.generatedCode
                    ? result.generatedCode.join("\n")
                    : "// No code has been generated yet"
            );
        });
    });
}
});


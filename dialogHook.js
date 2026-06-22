(() => {
  if (window.__recorderDialogHookInstalled) return;
  window.__recorderDialogHookInstalled = true;

  const originalAlert = window.alert;
  const originalConfirm = window.confirm;
  const originalPrompt = window.prompt;

  function notify(dialogType, message, extraData = {}) {
    window.postMessage({
      source: "RECORDER_PAGE_HOOK",
      type: "RECORDER_NATIVE_DIALOG",
      dialogType,
      message: String(message ?? ""),
      ...extraData
    }, "*");
  }

  window.alert = function(message) {
    const result = originalAlert.apply(this, arguments);
    notify("alert", message, { result: true });
    return result;
  };

  window.confirm = function(message) {
    const result = originalConfirm.apply(this, arguments);
    notify("confirm", message, { result });
    return result;
  };

  window.prompt = function(message, defaultValue) {
    const result = originalPrompt.apply(this, arguments);
    notify("prompt", message, {
      defaultValue: String(defaultValue ?? ""),
      result
    });
    return result;
  };
})();

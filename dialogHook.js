(() => {
  if (window.__recorderDialogHookInstalled) return;
  window.__recorderDialogHookInstalled = true;

  const originalAlert = window.alert;
  const originalConfirm = window.confirm;
  const originalPrompt = window.prompt;
  const boundGrapesEditors = new WeakSet();

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const message = event.data;
    if (message?.source !== "RECORDER_CONTENT_SCRIPT") return;
    if (message.type !== "RECORDER_ELEMENT_ID_ANALYSIS") return;

    console.log("[Recorder ID Analysis]", message.analysis);
  });

  function notify(dialogType, message, extraData = {}) {
    const payload = {
      source: "RECORDER_PAGE_HOOK",
      type: "RECORDER_NATIVE_DIALOG",
      dialogType,
      message: String(message ?? ""),
      frameUrl: String(window.location?.href || ""),
      ...extraData
    };

    window.postMessage(payload, "*");

    if (window.top && window.top !== window) {
      window.top.postMessage({
        ...payload,
        fromIframe: true
      }, "*");
    }
  }

  function postRecorderPageMessage(type, payload = {}) {
    const message = {
      source: "RECORDER_PAGE_HOOK",
      type,
      frameUrl: String(window.location?.href || ""),
      ...payload
    };

    window.postMessage(message, "*");
    if (window.top && window.top !== window) {
      window.top.postMessage({ ...message, fromIframe: true }, "*");
    }
  }

  function describeElement(element) {
    if (!element || element.nodeType !== 1) return null;

    const attributes = {};
    ["id", "class", "data-gjs-type", "data-type", "role", "aria-label", "title"].forEach((name) => {
      const value = element.getAttribute?.(name);
      if (value !== null && value !== undefined && value !== "") attributes[name] = String(value);
    });

    return {
      tagName: String(element.tagName || "").toLowerCase(),
      attributes,
      text: String(element.innerText || element.textContent || "")
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 120)
    };
  }

  function describeComponent(component) {
    if (!component) return null;

    const get = (name) => {
      try {
        return component.get?.(name);
      } catch (error) {
        return undefined;
      }
    };

    let element = null;
    try {
      element = component.getEl?.() || null;
    } catch (error) {
      element = null;
    }

    return {
      id: String(component.getId?.() || ""),
      cid: String(component.cid || ""),
      type: String(get("type") || ""),
      tagName: String(get("tagName") || element?.tagName || "").toLowerCase(),
      name: String(component.getName?.({ noCustom: false }) || get("name") || ""),
      index: Number.isInteger(component.index?.()) ? component.index() : null,
      element: describeElement(element)
    };
  }

  function buildGrapesDrop(kind, component, parent, index, block = null) {
    const resolvedParent = parent || component?.parent?.() || null;
    const resolvedIndex = Number.isInteger(index)
      ? index
      : (Number.isInteger(component?.index?.()) ? component.index() : null);
    const siblings = resolvedParent?.components?.();
    const previousSibling = resolvedIndex !== null && resolvedIndex > 0
      ? siblings?.at?.(resolvedIndex - 1)
      : null;
    const nextSibling = resolvedIndex !== null
      ? siblings?.at?.(resolvedIndex + 1)
      : null;

    return {
      kind,
      capturedAt: Date.now(),
      index: resolvedIndex,
      blockId: String(block?.getId?.() || block?.id || ""),
      component: describeComponent(component),
      parent: describeComponent(resolvedParent),
      previousSibling: describeComponent(previousSibling),
      nextSibling: describeComponent(nextSibling)
    };
  }

  function bindGrapesEditor(editor) {
    if (!editor || typeof editor.on !== "function" || boundGrapesEditors.has(editor)) return editor;
    boundGrapesEditors.add(editor);

    editor.on("component:drag:end", ({ target, parent, index } = {}) => {
      postRecorderPageMessage("RECORDER_GRAPES_DROP", {
        grapesDrop: buildGrapesDrop("component-move", target, parent, index)
      });
    });

    editor.on("block:drag:stop", (component, block) => {
      if (!component) return;
      postRecorderPageMessage("RECORDER_GRAPES_DROP", {
        grapesDrop: buildGrapesDrop(
          "block-add",
          component,
          component.parent?.(),
          component.index?.(),
          block
        )
      });
    });

    postRecorderPageMessage("RECORDER_GRAPES_READY");
    console.debug("[Recorder][GrapesJS] editor event bridge attached");
    return editor;
  }

  function wrapGrapesInit(grapesjs) {
    if (!grapesjs || typeof grapesjs.init !== "function" || grapesjs.init.__recorderWrapped) return;

    const originalInit = grapesjs.init;
    const wrappedInit = function() {
      return bindGrapesEditor(originalInit.apply(this, arguments));
    };
    wrappedInit.__recorderWrapped = true;
    wrappedInit.__recorderOriginal = originalInit;
    grapesjs.init = wrappedInit;
  }

  function installGrapesHook() {
    let currentGrapes = window.grapesjs;
    wrapGrapesInit(currentGrapes);

    const descriptor = Object.getOwnPropertyDescriptor(window, "grapesjs");
    if (!descriptor || descriptor.configurable) {
      try {
        Object.defineProperty(window, "grapesjs", {
          configurable: true,
          enumerable: descriptor?.enumerable ?? true,
          get() {
            return descriptor?.get ? descriptor.get.call(window) : currentGrapes;
          },
          set(value) {
            if (descriptor?.set) descriptor.set.call(window, value);
            else currentGrapes = value;
            wrapGrapesInit(value);
          }
        });
      } catch (error) {
        console.debug("[Recorder][GrapesJS] unable to install global init hook", error);
      }
    }

    const discoverEditors = () => {
      wrapGrapesInit(window.grapesjs);
      ["editor", "grapesEditor", "gjsEditor"].forEach((key) => bindGrapesEditor(window[key]));
    };

    discoverEditors();
    window.addEventListener("load", discoverEditors, { once: true });
    setTimeout(discoverEditors, 0);
    setTimeout(discoverEditors, 1000);
    setTimeout(discoverEditors, 5000);
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

  installGrapesHook();
})();

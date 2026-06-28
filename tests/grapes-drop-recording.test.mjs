import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

import { PlaywrightCodeGenerator } from "../usecases/PlaywrightCodeGenerator.js";

function createComponent({ id, cid, type = "default", tagName = "div", name = "", parent = null, index = 0 }) {
  const element = {
    nodeType: 1,
    tagName: tagName.toUpperCase(),
    innerText: name,
    textContent: name,
    getAttribute(attribute) {
      if (attribute === "id") return id;
      if (attribute === "data-gjs-type") return type;
      return null;
    }
  };

  return {
    cid,
    getId: () => id,
    get: (property) => ({ type, tagName, name })[property],
    getName: () => name,
    getEl: () => element,
    parent: () => parent,
    index: () => index
  };
}

test("MAIN-world hook captures GrapesJS semantic component and block drops", async () => {
  const messages = [];
  const listeners = new Map();
  const fakeWindow = {
    location: { href: "https://example.test/editor" },
    alert() {},
    confirm() { return true; },
    prompt() { return ""; },
    postMessage(message) { messages.push(message); },
    addEventListener() {}
  };
  fakeWindow.window = fakeWindow;
  fakeWindow.top = fakeWindow;

  const source = await readFile(new URL("../dialogHook.js", import.meta.url), "utf8");
  vm.runInNewContext(source, {
    window: fakeWindow,
    console: { debug() {} },
    setTimeout(callback) { callback(); }
  });

  const editor = {
    on(eventName, callback) {
      const callbacks = listeners.get(eventName) || [];
      callbacks.push(callback);
      listeners.set(eventName, callbacks);
    }
  };
  fakeWindow.grapesjs = { init: () => editor };
  assert.equal(fakeWindow.grapesjs.init(), editor);
  assert.equal(listeners.get("component:drag:end")?.length, 1);
  assert.equal(listeners.get("block:drag:stop")?.length, 1);

  const siblings = [];
  const parent = createComponent({ id: "section", cid: "c-parent", name: "Section" });
  parent.components = () => ({ at: (index) => siblings[index] || null });
  const subtitle = createComponent({
    id: "subtitle",
    cid: "c-subtitle",
    type: "text",
    name: "Subtitle",
    parent,
    index: 0
  });
  const moved = createComponent({
    id: "moved",
    cid: "c-moved",
    name: "Moved block",
    parent,
    index: 1
  });
  siblings.push(subtitle, moved);

  listeners.get("component:drag:end")[0]({ target: moved, parent, index: 1 });
  const componentDrop = messages.find((message) =>
    message.type === "RECORDER_GRAPES_DROP" && message.grapesDrop?.kind === "component-move"
  );
  assert.equal(componentDrop.grapesDrop.index, 1);
  assert.equal(componentDrop.grapesDrop.parent.id, "section");
  assert.equal(componentDrop.grapesDrop.previousSibling.id, "subtitle");

  listeners.get("block:drag:stop")[0](moved, { getId: () => "basic-text" });
  const blockDrop = messages.find((message) =>
    message.type === "RECORDER_GRAPES_DROP" && message.grapesDrop?.kind === "block-add"
  );
  assert.equal(blockDrop.grapesDrop.blockId, "basic-text");
  assert.equal(blockDrop.grapesDrop.index, 1);

  fakeWindow.grapesjs.init();
  assert.equal(listeners.get("component:drag:end")?.length, 1, "same editor must only be bound once");
});

function createGenerator() {
  const generator = new PlaywrightCodeGenerator({}, {}, "page");
  generator._getBestPath = (path) => path;
  generator.mergeActionContextSnapshots = () => {};
  generator._getActionContextPrefix = (_action, field) => field;
  generator._buildLocatorString = (prefix) => `${prefix}Locator`;
  generator.updateUserActionDB = () => {};
  return generator;
}

test("drag code replays the recorded target position", () => {
  const generator = createGenerator();
  const code = generator.dragAndDropCodeSetter(
    { dropPosition: { x: 24.5, y: 39 } },
    { funName: "ByDomPath", obj: {} },
    { funName: "ByDomPath", obj: {} },
    "source-context",
    "target-context"
  );

  assert.equal(
    code,
    "await sourceLocator.dragTo(targetLocator, { targetPosition: { x: 24.5, y: 39 } });"
  );
});

test("drag code remains backward compatible without a recorded position", () => {
  const generator = createGenerator();
  const code = generator.dragAndDropCodeSetter(
    {},
    { funName: "ByDomPath", obj: {} },
    { funName: "ByDomPath", obj: {} },
    "source-context",
    "target-context"
  );

  assert.equal(code, "await sourceLocator.dragTo(targetLocator);");
});

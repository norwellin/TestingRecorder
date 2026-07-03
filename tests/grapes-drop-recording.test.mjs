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

test("locator candidates keep semantic methods and multiple DOM paths", () => {
  const generator = new PlaywrightCodeGenerator({ priSize: 4 }, {}, "page");
  const candidates = {
    0: {
      funName: "ByRole",
      obj: { role: "button", name: "Save", index: 0 }
    },
    1: {
      funName: "ByTitle",
      obj: { title: "Save changes" }
    },
    2: {
      funName: "ByText",
      obj: { text: "Save" }
    },
    3: {
      funName: "ByDomPath",
      obj: {
        csspath: "[data-testid='save']",
        shadowChain: [],
        options: [
          { path: "[data-testid='save']", shadowChain: [] },
          { path: "form > button:nth-of-type(1)", shadowChain: [] }
        ]
      }
    }
  };

  const options = generator._buildLocatorOptions(candidates);
  assert.deepEqual(
    options.map(option => option.method),
    ["ByRole", "ByTitle", "ByText", "ByDomPath", "ByDomPath"]
  );
  assert.equal(options.filter(option => option.recommended).length, 1);
  assert.equal(options[0].recommended, true);
  assert.equal(options[4].data.csspath, "form > button:nth-of-type(1)");
});

test("playwright-injected selectors are converted to semantic locator code", () => {
  const generator = new PlaywrightCodeGenerator({ priSize: 2 }, {}, "page");
  const candidates = {
    0: {
      funName: "ByPlaywright",
      obj: {
        selector: 'internal:role=button[name="Save"i]',
        selectors: [
          'internal:role=button[name="Save"i]',
          'internal:text="Save"i'
        ]
      }
    },
    1: {
      funName: "ByDomPath",
      obj: {
        csspath: ".toolbar > button:first-child",
        shadowChain: [],
        options: [{ path: ".toolbar > button:first-child", shadowChain: [] }]
      }
    }
  };

  const options = generator._buildLocatorOptions(candidates);
  assert.equal(options[0].data.locator, "getByRole('button', { name: 'Save' })");
  assert.equal(options[1].data.locator, "getByText('Save')");
  assert.equal(options[2].data.csspath, ".toolbar > button:first-child");
  assert.equal(
    generator._buildLocatorString("page", candidates[0]),
    "page.getByRole('button', { name: 'Save' })"
  );
});

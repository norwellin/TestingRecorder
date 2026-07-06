import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

import { PlaywrightCodeGenerator } from "../usecases/PlaywrightCodeGenerator.js";
import { DOMParserService } from "../usecases/DOMParserService.js";
import { OuterEventListener } from "../interfaces/OuterEventListener.js";
import { IframeEventListener } from "../interfaces/IframeEventListener.js";
import { RecorderStore } from "../RecorderStore.js";

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

test("recording lifecycle resumes without creating another navigation action", async () => {
  const source = await readFile(new URL("../MainApp.js", import.meta.url), "utf8");
  const startMethod = source.slice(source.indexOf("  start() {"), source.indexOf("  resumeRecording() {"));
  const resumeMethod = source.slice(source.indexOf("  resumeRecording() {"), source.indexOf("  // 🌟 關鍵新增"));

  assert.ok(
    startMethod.indexOf("if (this.hasInitializedRecordingSession) return this.resumeRecording();") <
    startMethod.indexOf('type: "navigate"'),
    "resume guard must run before navigation is generated"
  );
  assert.match(resumeMethod, /setRecordingState\(true, \{ allowHoverPreview: true \}\)/);
  assert.match(resumeMethod, /this\.navigationTracker\.start\(\)/);
  assert.match(resumeMethod, /this\.startDynamicFrameWatcher\(\)/);
});

test("actions created in separate page stores receive globally distinct ids", () => {
  const pageStore = new RecorderStore();
  const popupStore = new RecorderStore();
  const pageAction = pageStore.addAction({ type: "click" });
  const popupAction = popupStore.addAction({ type: "ionSelect" });

  assert.notEqual(pageAction.id, popupAction.id);
  assert.match(pageAction.id, /^action_[a-z0-9]+_[a-z0-9]+_0$/);
  assert.match(popupAction.id, /^action_[a-z0-9]+_[a-z0-9]+_0$/);
});

test("an unknown action id cannot update an unrelated local action by global index", () => {
  const store = new RecorderStore();
  const original = store.addAction({ type: "click", sourceData: "original" });

  const updated = store.updateAction("popup_action_missing", 0, {
    sourceData: "wrongly-overwritten"
  });

  assert.equal(updated, null);
  assert.equal(store.getActions()[0].id, original.id);
  assert.equal(store.getActions()[0].sourceData, "original");
});

test("locator updates prefer the selected row when legacy action ids collide", async () => {
  const source = await readFile(new URL("../test.js", import.meta.url), "utf8");
  const start = source.indexOf("    function findMatchingActionIndex");
  const end = source.indexOf("    function isLocatorSelectActive", start);
  const helper = source.slice(start, end);
  const context = {};

  vm.runInNewContext(
    `${helper}
     globalThis.matched = findMatchingActionIndex(
       [
         { id: "action_0", type: "click" },
         { id: "action_1", type: "popup" },
         { id: "action_0", type: "ionSelect" }
       ],
       { id: "action_0", type: "ionSelect" },
       2
     );`,
    context
  );

  assert.equal(context.matched, 2);
});

test("ion-select selected option is rendered as read-only text", async () => {
  const source = await readFile(new URL("../test.js", import.meta.url), "utf8");
  const start = source.indexOf("    function appendReadOnlyLabeledValue");
  const end = source.indexOf("    function formatDomPathParts", start);
  const helper = source.slice(start, end);
  const createdTags = [];
  const document = {
    createElement(tagName) {
      createdTags.push(tagName);
      return {
        className: "",
        textContent: "",
        children: [],
        appendChild(child) {
          this.children.push(child);
        }
      };
    }
  };
  const parent = {
    children: [],
    appendChild(child) {
      this.children.push(child);
    }
  };
  const context = { document, parent };

  vm.runInNewContext(
    `${helper}
     appendReadOnlyLabeledValue(parent, "選項", "HiveMQ Public (WSS) (hivemq)");`,
    context
  );

  assert.deepEqual(createdTags, ["div", "span", "span"]);
  assert.equal(parent.children.length, 1);
  assert.equal(parent.children[0].children[0].textContent, "選項: ");
  assert.equal(parent.children[0].children[1].textContent, "HiveMQ Public (WSS) (hivemq)");
  assert.equal(parent.children[0].children[1].className, "action-readonly-value");
  assert.equal(createdTags.includes("select"), false);
  assert.equal(createdTags.includes("details"), false);
});

test("target locator selection updates a multi-line drag dropTarget declaration", async () => {
  const source = await readFile(new URL("../test.js", import.meta.url), "utf8");
  const start = source.indexOf("    function buildLocatorSuffix");
  const end = source.indexOf("    async function updateLocatorSelection", start);
  const helpers = source.slice(start, end);
  const context = {};

  vm.runInNewContext(
    `${helpers}
     globalThis.updatedLine = replaceActionLocatorInCodeLine(
       { type: "dragANDdrop" },
       "  const dropTarget = page.locator(\\"iframe#gjsiframe\\").contentFrame().locator(\\"ion-content\\");",
       "target",
       { method: "ByDomPath", data: { csspath: "ion-row#drop-zone", shadowChain: [] } },
       "ByDomPath",
       []
     );`,
    context
  );

  assert.equal(
    context.updatedLine,
    '  const dropTarget = page.locator("iframe#gjsiframe").contentFrame().locator("ion-row#drop-zone");'
  );
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

test("navigation replays the viewport recorded before goto", () => {
  const generator = createGenerator();
  const code = generator.generate({
    type: "navigate",
    url: "https://example.test/large-page",
    viewport: { width: 1920, height: 969 }
  });

  assert.deepEqual(code, [
    "await page.setViewportSize({ width: 1920, height: 969 });",
    "await page.goto('https://example.test/large-page');"
  ]);
});

test("navigation without viewport metadata remains backward compatible", () => {
  const generator = createGenerator();
  assert.equal(
    generator.generate({ type: "navigate", url: "https://example.test/legacy" }),
    "await page.goto('https://example.test/legacy');"
  );
});

test("popup code applies its recorded viewport after the popup is acquired", () => {
  const generator = createGenerator();
  generator.command = {
    code: ["await page.getByRole('button', { name: 'Open' }).click();"]
  };
  const result = generator.generate({
    type: "popup",
    popupId: "popup_123",
    viewport: { width: 900, height: 640 }
  });

  assert.equal(result.isReplace, true);
  assert.deepEqual(result.code, [
    "const [popup_123] = await Promise.all([",
    "  page.waitForEvent('popup'),",
    "  page.getByRole('button', { name: 'Open' }).click()",
    "]);",
    "await popup_123.setViewportSize({ width: 900, height: 640 });"
  ]);
});

test("code view keeps viewport setup before goto", async () => {
  const source = await readFile(new URL("../test.js", import.meta.url), "utf8");
  const start = source.indexOf("    function parseFrameDeclaration");
  const end = source.indexOf("    function escapePathForCode", start);
  const helpers = source.slice(start, end);
  const context = {};

  vm.runInNewContext(
    `${helpers}
     globalThis.ordered = orderPlaywrightCodeBody([
       "await page.setViewportSize({ width: 1920, height: 969 });",
       "await page.goto('https://example.test/large-page');",
       "await page.locator('button').click();"
     ]);`,
    context
  );

  assert.deepEqual(Array.from(context.ordered), [
    "await page.setViewportSize({ width: 1920, height: 969 });",
    "await page.goto('https://example.test/large-page');",
    "await page.locator('button').click();"
  ]);
});

test("drag code converts the recorded target ratios using the current target size", () => {
  const generator = createGenerator();
  const lines = generator.dragAndDropCodeSetter(
    { dropPosition: { x: 24.5, y: 39, xRatio: 0.25, yRatio: 0.6 } },
    { funName: "ByDomPath", obj: {} },
    { funName: "ByDomPath", obj: {} },
    "source-context",
    "target-context"
  );
  const code = lines.join("\n");

  assert.equal(lines[0], "{");
  assert.equal(lines[1], "  const dropTarget = targetLocator;");
  assert.match(code, /await sourceLocator\.scrollIntoViewIfNeeded\(\)/);
  assert.match(code, /await dropTarget\.scrollIntoViewIfNeeded\(\)/);
  assert.match(code, /await dropTarget\.waitFor\(\{ state: 'visible' \}\)/);
  assert.match(code, /const dropSize = await dropTarget\.evaluate/);
  assert.match(code, /dropSize\.width \* 0\.25/);
  assert.match(code, /dropSize\.height \* 0\.6/);
  assert.doesNotMatch(code, /x: 24\.5, y: 39/);
  assert.ok(
    lines.findIndex(line => line.includes("sourceLocator.scrollIntoViewIfNeeded")) <
    lines.findIndex(line => line.includes("dropTarget.scrollIntoViewIfNeeded"))
  );
  assert.ok(
    lines.findIndex(line => line.includes("dropTarget.scrollIntoViewIfNeeded")) <
    lines.findIndex(line => line.includes("const dropSize"))
  );
});

test("absolute drop mode emits recorded coordinates without measuring target size", () => {
  const generator = createGenerator();
  const lines = generator.dragAndDropCodeSetter(
    {
      dropPositionMode: "absolute",
      dropPosition: {
        x: 24.5,
        y: 39,
        xRatio: 0.25,
        yRatio: 0.6,
        scrollState: {
          scope: "document",
          rootTag: "html",
          scrollLeftRatio: 0,
          scrollTopRatio: 0.4
        }
      }
    },
    { funName: "ByDomPath", obj: {} },
    { funName: "ByDomPath", obj: {} },
    "source-context",
    "target-context"
  );
  const code = lines.join("\n");

  assert.match(code, /targetPosition: \{ x: 24\.5, y: 39 \}/);
  assert.doesNotMatch(code, /const dropSize/);
  assert.doesNotMatch(code, /dropSize\./);
  assert.match(code, /scrollTopRatio":0\.4/);
});

test("center drop mode omits targetPosition", () => {
  const generator = createGenerator();
  const code = generator.dragAndDropCodeSetter(
    {
      dropPositionMode: "center",
      dropPosition: { x: 24.5, y: 39, xRatio: 0.25, yRatio: 0.6 }
    },
    { funName: "ByDomPath", obj: {} },
    { funName: "ByDomPath", obj: {} },
    "source-context",
    "target-context"
  );

  assert.equal(code, "await sourceLocator.dragTo(targetLocator);");
  assert.doesNotMatch(code, /targetPosition/);
});

test("center drop mode keeps non-empty recorded scroll restoration", () => {
  const generator = createGenerator();
  const lines = generator.dragAndDropCodeSetter(
    {
      dropPositionMode: "center",
      dropPosition: {
        x: 24.5,
        y: 39,
        xRatio: 0.25,
        yRatio: 0.6,
        scrollState: {
          scope: "element",
          ancestorDepth: 1,
          scrollLeftRatio: 0,
          scrollTopRatio: 0.5
        }
      }
    },
    { funName: "ByDomPath", obj: {} },
    { funName: "ByDomPath", obj: {} },
    "source-context",
    "target-context"
  );
  const code = lines.join("\n");

  assert.match(code, /scrollTopRatio":0\.5/);
  assert.match(code, /await sourceLocator\.dragTo\(dropTarget\);/);
  assert.doesNotMatch(code, /targetPosition/);
  assert.doesNotMatch(code, /const dropSize/);
});

test("drag code restores the recorded scroll-container ratio before calculating the position", () => {
  const generator = createGenerator();
  const lines = generator.dragAndDropCodeSetter(
    {
      dropPosition: {
        xRatio: 0.4,
        yRatio: 0.75,
        scrollState: {
          scope: "element",
          ancestorDepth: 2,
          scrollLeftRatio: 0.1,
          scrollTopRatio: 0.65
        }
      }
    },
    { funName: "ByDomPath", obj: {} },
    { funName: "ByDomPath", obj: {} },
    "source-context",
    "target-context"
  );
  const code = lines.join("\n");

  assert.match(code, /"scope":"element","ancestorDepth":2/);
  assert.match(code, /"scrollLeftRatio":0\.1,"scrollTopRatio":0\.65/);
  assert.match(code, /scroller\.scrollTop =/);
  assert.ok(
    lines.findIndex(line => line.includes("scroller.scrollTop")) <
    lines.findIndex(line => line.includes("dropTarget.scrollIntoViewIfNeeded")),
    "recorded scroll restoration must run before adaptive target scrolling"
  );
});

test("drop positions record the nearest scroll container as ratios", async () => {
  const root = {
    clientWidth: 1000,
    clientHeight: 800,
    scrollWidth: 1000,
    scrollHeight: 2400,
    scrollLeft: 0,
    scrollTop: 300,
    parentElement: null,
    style: { overflow: "visible" }
  };
  const scroller = {
    clientWidth: 300,
    clientHeight: 200,
    scrollWidth: 600,
    scrollHeight: 1000,
    scrollLeft: 30,
    scrollTop: 400,
    parentElement: root,
    style: { overflowX: "auto", overflowY: "auto" }
  };
  const doc = {
    documentElement: root,
    scrollingElement: root,
    defaultView: {
      getComputedStyle(element) {
        return element.style;
      }
    }
  };
  const target = {
    ownerDocument: doc,
    parentElement: scroller,
    clientWidth: 100,
    clientHeight: 50,
    scrollWidth: 100,
    scrollHeight: 50,
    scrollLeft: 0,
    scrollTop: 0,
    style: { overflow: "visible" },
    getBoundingClientRect() {
      return { left: 20, top: 30, width: 100, height: 50 };
    }
  };

  for (const Listener of [OuterEventListener, IframeEventListener]) {
    const listener = Object.create(Listener.prototype);
    const position = await listener.getDropPosition({ clientX: 70, clientY: 55 }, target);

    assert.equal(position.xRatio, 0.5);
    assert.equal(position.yRatio, 0.5);
    assert.deepEqual(position.scrollState, {
      scope: "element",
      ancestorDepth: 1,
      scrollLeftRatio: 0.1,
      scrollTopRatio: 0.5
    });
  }
});

test("document scroll detection uses the root that actually moved", async () => {
  const html = {
    tagName: "HTML",
    clientWidth: 1000,
    clientHeight: 800,
    scrollWidth: 1000,
    scrollHeight: 2000,
    scrollLeft: 0,
    scrollTop: 0
  };
  const body = {
    tagName: "BODY",
    clientWidth: 1000,
    clientHeight: 800,
    scrollWidth: 1000,
    scrollHeight: 2400,
    scrollLeft: 0,
    scrollTop: 800
  };
  const doc = { scrollingElement: html, documentElement: html, body };

  for (const Listener of [OuterEventListener, IframeEventListener]) {
    const listener = Object.create(Listener.prototype);
    const scrollState = await listener.getDropScrollState({ ownerDocument: doc, parentElement: html });
    assert.deepEqual(scrollState, {
      scope: "document",
      rootTag: "body",
      scrollLeftRatio: 0,
      scrollTopRatio: 0.5
    });
  }
});

test("ion-content drops use Ionic's internal scrolling element", async () => {
  const scrollingElement = {
    clientWidth: 300,
    clientHeight: 500,
    scrollWidth: 300,
    scrollHeight: 1500,
    scrollLeft: 0,
    scrollTop: 750
  };
  const doc = { documentElement: {}, scrollingElement: {} };
  const ionContent = {
    ownerDocument: doc,
    parentElement: null,
    closest: selector => selector === "ion-content" ? ionContent : null,
    getScrollElement: async () => scrollingElement,
    getBoundingClientRect: () => ({ left: 10, top: 20, width: 300, height: 500 })
  };
  const child = {
    ownerDocument: doc,
    parentElement: ionContent,
    closest: selector => selector === "ion-content" ? ionContent : child,
    getBoundingClientRect: () => ({ left: 10, top: 400, width: 300, height: 100 })
  };
  const event = { target: child, clientX: 160, clientY: 470 };

  for (const Listener of [OuterEventListener, IframeEventListener]) {
    const listener = Object.create(Listener.prototype);
    const target = listener.getDropTargetElement(event);
    const position = await listener.getDropPosition(event, target);

    assert.equal(target, child);
    assert.equal(position.xRatio, 0.5);
    assert.equal(position.yRatio, 0.7);
    assert.deepEqual(position.scrollState, {
      scope: "ion-content",
      scrollLeftRatio: 0,
      scrollTopRatio: 0.75
    });
  }
});

test("ion-content replay restores its internal scroll before dragTo", () => {
  const generator = createGenerator();
  const lines = generator.dragAndDropCodeSetter(
    {
      dropPosition: {
        xRatio: 0.5,
        yRatio: 0.9,
        scrollState: {
          scope: "ion-content",
          scrollLeftRatio: 0,
          scrollTopRatio: 0.75
        }
      }
    },
    { funName: "ByDomPath", obj: {} },
    { funName: "ByDomPath", obj: {} },
    "source-context",
    "target-context"
  );
  const code = lines.join("\n");

  assert.match(code, /"scope":"ion-content"/);
  assert.match(code, /element\.closest\('ion-content'\)/);
  assert.match(code, /await ionContent\.getScrollElement\(\)/);
  assert.match(code, /await ionContent\.scrollToPoint\(x, y, 0\)/);
  assert.ok(
    lines.findIndex(line => line.includes("scrollToPoint")) <
    lines.findIndex(line => line.includes(".dragTo("))
  );
});

test("a drop at a component's bottom edge keeps the actual component target", () => {
  const parent = {
    matches: () => true,
    closest: selector => selector === "ion-content" ? null : parent
  };
  const child = {
    parentElement: parent,
    matches: selector => selector === "[data-gjs-type]",
    closest: selector => selector === "ion-content" ? null : child,
    getBoundingClientRect: () => ({ top: 100, height: 200 })
  };
  const event = { target: child, clientY: 299 };

  for (const Listener of [OuterEventListener, IframeEventListener]) {
    const listener = Object.create(Listener.prototype);
    assert.equal(listener.getDropTargetElement(event), child);
  }
});

test("drag targets avoid long full-container text locators when a DOM path exists", () => {
  const generator = new PlaywrightCodeGenerator({ priSize: 2 }, {}, "page");
  generator.mergeActionContextSnapshots = () => {};
  generator._getActionContextPrefix = (_action, field) => field;
  generator.updateUserActionDB = () => {};

  const code = generator.dragAndDropCodeSetter(
    {},
    [
      { funName: "ByText", obj: { text: "A".repeat(120) } },
      { funName: "ByDomPath", obj: { csspath: "body > main", shadowChain: [] } }
    ],
    [{ funName: "ByTitle", obj: { title: "Food List" } }],
    "source-context",
    "target-context"
  );

  assert.match(code, /target\.locator\("body > main"\)/);
  assert.doesNotMatch(code, /getByText/);
});

test("drag code keeps fixed coordinates for recordings created before ratios were stored", () => {
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

test("playwright-injected selectors using dynamic IDs are moved to the end", () => {
  const service = new DOMParserService({ mainWindow: {} });
  const ownerDocument = {
    defaultView: {
      CSS: { escape: value => value }
    }
  };
  const target = {
    id: "i123",
    ownerDocument,
    parentElement: null
  };

  assert.deepEqual(
    service.moveDynamicIdSelectorsToEnd(
      ["#i123", 'internal:role=button[name="Save"i]', ".primary-action"],
      target
    ),
    ['internal:role=button[name="Save"i]', ".primary-action", "#i123"]
  );

  target.id = "save";
  assert.deepEqual(
    service.moveDynamicIdSelectorsToEnd(["#save", ".primary-action"], target),
    ["#save", ".primary-action"]
  );
});

test("outer and iframe listeners record Enter against the event target", () => {
  for (const Listener of [OuterEventListener, IframeEventListener]) {
    const target = { nodeType: 1 };
    const dispatched = [];
    let flushedTarget = null;
    const listener = Object.create(Listener.prototype);
    Object.assign(listener, {
      isRecording: true,
      mainDocument: { activeElement: target },
      iframeDocument: { activeElement: target },
      getTextInputEventTarget: () => target,
      flushPendingTextInputRecord: element => { flushedTarget = element; },
      dispatchAction: (...args) => dispatched.push(args)
    });

    listener.keydownHandler({
      key: "Enter",
      keyCode: 13,
      isTrusted: true,
      isComposing: false,
      repeat: false,
      ctrlKey: false,
      altKey: false,
      metaKey: false,
      shiftKey: false,
      target
    });

    assert.equal(flushedTarget, target);
    assert.equal(dispatched.length, 1);
    assert.equal(dispatched[0][0], "keyboard");
    assert.equal(dispatched[0][1], target);
    assert.equal(dispatched[0][3].keyboard, "Enter");
  }
});

test("trusted autofill is ignored while user paste remains recordable", async () => {
  for (const Listener of [OuterEventListener, IframeEventListener]) {
    const target = {
      nodeType: 1,
      tagName: "INPUT",
      value: "autofilled@example.test",
      getAttribute: name => name === "type" ? "text" : null
    };
    let scheduled = 0;
    const listener = Object.create(Listener.prototype);
    Object.assign(listener, {
      isRecording: true,
      mainWindow: {},
      iframeWindow: {},
      domParserService: { getOpenSourcePath: () => ({}) },
      initialInputValues: new WeakMap([[target, ""]]),
      preEditSourcePaths: new WeakMap(),
      lastUserTypedAt: new WeakMap(),
      userEditedInputs: new WeakSet(),
      composingInputs: new WeakSet(),
      getTextInputEventTarget: () => target,
      shouldSuppressSyntheticPageEvent: () => false,
      isRangeInput: () => false,
      isColorInput: () => false,
      debugInputEvent: () => {},
      debugInputTarget: () => {},
      scheduleTextInputRecord: () => { scheduled += 1; }
    });

    listener.beforeInputHandler({
      isTrusted: true,
      inputType: "insertReplacementText",
      target
    });
    listener.inputHandler({
      isTrusted: true,
      inputType: "insertReplacementText",
      isComposing: false,
      target
    });

    assert.equal(listener.userEditedInputs.has(target), false);
    assert.equal(scheduled, 0, "browser autofill must not schedule an input action");

    listener.userEditedInputs.add(target);
    listener.lastUserTypedAt.set(target, Date.now() - 5000);
    listener.inputHandler({
      isTrusted: true,
      inputType: "insertReplacementText",
      isComposing: false,
      target
    });
    assert.equal(scheduled, 0, "expired user intent must not authorize a later autofill event");
    listener.userEditedInputs.delete(target);
    listener.lastUserTypedAt.delete(target);

    listener.keydownHandler({
      key: "v",
      keyCode: 86,
      isTrusted: true,
      isComposing: false,
      repeat: false,
      ctrlKey: true,
      altKey: false,
      metaKey: false,
      shiftKey: false,
      target
    });
    assert.equal(listener.userEditedInputs.has(target), false, "Ctrl+V keydown waits for a paste event");

    listener.pasteHandler({
      isTrusted: true,
      target
    });
    await new Promise(resolve => setTimeout(resolve, 0));

    assert.equal(listener.userEditedInputs.has(target), true);
    assert.equal(scheduled, 1, "trusted paste must schedule an input action");
  }
});

test("trusted typing beforeinput remains recordable", () => {
  for (const Listener of [OuterEventListener, IframeEventListener]) {
    const target = {
      nodeType: 1,
      tagName: "INPUT",
      value: "hello",
      getAttribute: name => name === "type" ? "text" : null
    };
    let scheduled = 0;
    const listener = Object.create(Listener.prototype);
    Object.assign(listener, {
      isRecording: true,
      mainWindow: {},
      iframeWindow: {},
      domParserService: { getOpenSourcePath: () => ({}) },
      initialInputValues: new WeakMap([[target, ""]]),
      preEditSourcePaths: new WeakMap(),
      lastUserTypedAt: new WeakMap(),
      userEditedInputs: new WeakSet(),
      composingInputs: new WeakSet(),
      getTextInputEventTarget: () => target,
      shouldSuppressSyntheticPageEvent: () => false,
      isRangeInput: () => false,
      isColorInput: () => false,
      debugInputEvent: () => {},
      debugInputTarget: () => {},
      scheduleTextInputRecord: () => { scheduled += 1; }
    });

    listener.beforeInputHandler({
      isTrusted: true,
      inputType: "insertText",
      target
    });
    listener.inputHandler({
      isTrusted: true,
      inputType: "insertText",
      isComposing: false,
      target
    });

    assert.equal(listener.userEditedInputs.has(target), true);
    assert.equal(scheduled, 1);
  }
});

test("ion-select records a user selection without recording programmatic changes", () => {
  for (const Listener of [OuterEventListener, IframeEventListener]) {
    const options = [
      { value: "default", textContent: "Default (AIoT)", getAttribute: () => "default" },
      { value: "custom", textContent: "Custom ...", getAttribute: () => "custom" }
    ];
    const target = {
      nodeType: 1,
      tagName: "ION-SELECT",
      value: "custom",
      getAttribute: name => name === "interface" ? "popover" : null,
      hasAttribute: () => false,
      querySelectorAll: selector => selector === "ion-select-option" ? options : []
    };
    const dispatched = [];
    const listener = Object.create(Listener.prototype);
    Object.assign(listener, {
      isRecording: true,
      pendingIonSelectInteractions: new WeakMap(),
      activeIonSelect: null,
      dispatchAction: (...args) => dispatched.push(args)
    });

    listener.ionSelectChangeHandler({
      target,
      detail: { value: "custom" },
      isTrusted: false
    });
    assert.equal(dispatched.length, 0, "programmatic ionChange must be ignored");

    listener.pendingIonSelectInteractions.set(target, Date.now());
    listener.activeIonSelect = target;
    listener.ionSelectChangeHandler({
      target,
      detail: { value: "custom" },
      isTrusted: false
    });

    assert.equal(dispatched.length, 1);
    assert.equal(dispatched[0][0], "ionSelect");
    assert.equal(dispatched[0][1], target);
    assert.deepEqual(dispatched[0][3], {
      selectedValue: "custom",
      selectedText: "Custom ...",
      selectedTexts: ["Custom ..."],
      selectInterface: "popover",
      isMultiple: false
    });
    assert.equal(listener.activeIonSelect, null);
  }
});

test("ion-select popover generates open and option click code", () => {
  const generator = createGenerator();
  generator._getContextPrefix = () => "frame";
  const code = generator.ionSelectSetter(
    {
      selectedValue: "custom",
      selectedText: "Custom ...",
      selectedTexts: ["Custom ..."],
      selectInterface: "popover"
    },
    { funName: "ByDomPath", obj: {} },
    "iframe-context"
  );

  assert.deepEqual(code, [
    "await frameLocator.click();",
    'await frame.locator("ion-popover").locator("ion-radio").filter({ hasText: "Custom ..." }).click();'
  ]);
  assert.doesNotMatch(code.join("\n"), /selectOption/);
  assert.doesNotMatch(code.join("\n"), /getByText/);
  assert.doesNotMatch(code.join("\n"), /getByRole/);
});

test("multi-value ion-select popover targets checkboxes by accessible name", () => {
  const generator = createGenerator();
  generator._getContextPrefix = () => "page";
  const code = generator.ionSelectSetter(
    {
      selectedValue: ["hivemq", "emqx"],
      selectedTexts: ["HiveMQ Public (WSS)", "EMQX Public (WSS)"],
      selectInterface: "popover",
      isMultiple: true
    },
    { funName: "ByDomPath", obj: {} },
    "page"
  );

  assert.deepEqual(code, [
    "await pageLocator.click();",
    'await page.locator("ion-popover").locator("ion-checkbox").filter({ hasText: "HiveMQ Public (WSS)" }).click();',
    'await page.locator("ion-popover").locator("ion-checkbox").filter({ hasText: "EMQX Public (WSS)" }).click();'
  ]);
});

test("ion-select click is reserved for the semantic select action", () => {
  for (const Listener of [OuterEventListener, IframeEventListener]) {
    const target = { nodeType: 1, tagName: "ION-SELECT" };
    const listener = Object.create(Listener.prototype);
    const dispatched = [];
    Object.assign(listener, {
      isRecording: true,
      suppressClickUntil: 0,
      pendingIonSelectInteractions: new WeakMap(),
      activeIonSelect: null,
      shouldSuppressSyntheticPageEvent: () => false,
      getComposedEventTarget: () => target,
      getClickTarget: () => target,
      dispatchAction: (...args) => dispatched.push(args)
    });

    listener.clickHandler({
      isTrusted: true,
      target,
      composedPath: () => [target]
    });

    assert.equal(dispatched.length, 0);
    assert.equal(listener.activeIonSelect, target);
    assert.equal(listener.pendingIonSelectInteractions.has(target), true);
  }
});

test("iframe clicks record their position relative to the selected click target", () => {
  const target = {
    nodeType: 1,
    tagName: "ION-GRID",
    offsetWidth: 200,
    offsetHeight: 120,
    clientWidth: 200,
    clientHeight: 120,
    clientLeft: 0,
    clientTop: 0,
    getBoundingClientRect: () => ({
      left: 100,
      top: 40,
      width: 200,
      height: 120
    })
  };
  const listener = Object.create(IframeEventListener.prototype);
  const dispatched = [];
  Object.assign(listener, {
    isRecording: true,
    suppressClickUntil: 0,
    activeIonSelect: null,
    shouldSuppressSyntheticPageEvent: () => false,
    getClickTarget: () => target,
    describeDebugElement: () => "ion-grid",
    describeDebugRoot: () => "document",
    dispatchAction: (...args) => dispatched.push(args)
  });

  listener.clickHandler({
    isTrusted: true,
    clientX: 130,
    clientY: 90,
    target,
    composedPath: () => [target]
  });

  assert.equal(dispatched.length, 1);
  assert.equal(dispatched[0][0], "click");
  assert.deepEqual(dispatched[0][3].clickPosition, { x: 30, y: 50 });
});

test("iframe click code includes the recorded element-relative position", () => {
  const generator = new PlaywrightCodeGenerator({ priSize: 2 }, {}, "page");
  generator._getBestPath = () => ({ funName: "ByDomPath", obj: {} });
  generator._getContextPrefix = () =>
    'page.locator("iframe#gjsiframe").contentFrame()';
  generator._buildLocatorString = prefix =>
    `${prefix}.locator('ion-grid').nth(1)`;
  generator.updateUserActionDB = () => {};

  const code = generator.clickSetter(
    {
      type: "click",
      clickPosition: { x: 30, y: 50 }
    },
    { funName: "ByDomPath", obj: {} },
    "iframe_1"
  );

  assert.equal(
    code,
    'await page.locator("iframe#gjsiframe").contentFrame().locator(\'ion-grid\').nth(1).click({ position: { x: 30, y: 50 } });'
  );
});

test("keyboard actions use locator.press when a source locator is available", () => {
  const generator = new PlaywrightCodeGenerator({ priSize: 2 }, {}, "page");
  const paths = {
    0: {
      funName: "ByPlaywright",
      obj: {
        selector: 'internal:role=textbox[name="Search"i]',
        selectors: ['internal:role=textbox[name="Search"i]']
      }
    }
  };

  assert.equal(
    generator.keyboardSetter({}, paths, "Enter", "page"),
    "await page.getByRole('textbox', { name: 'Search' }).press(\"Enter\");"
  );
});

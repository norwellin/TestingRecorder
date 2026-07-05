import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

import { PlaywrightCodeGenerator } from "../usecases/PlaywrightCodeGenerator.js";
import { DOMParserService } from "../usecases/DOMParserService.js";
import { OuterEventListener } from "../interfaces/OuterEventListener.js";
import { IframeEventListener } from "../interfaces/IframeEventListener.js";

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

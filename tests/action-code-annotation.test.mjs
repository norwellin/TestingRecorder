import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

async function loadBackgroundContext() {
  const source = await readFile(new URL("../background.js", import.meta.url), "utf8");
  const addListener = () => {};
  const context = vm.createContext({
    chrome: {
      action: { onClicked: { addListener } },
      runtime: { onMessage: { addListener } },
      tabs: {
        onCreated: { addListener },
        onUpdated: { addListener }
      }
    },
    console
  });

  vm.runInContext(source, context);
  return context;
}

test("multi-line drop actions receive one comment at the start of each block", async () => {
  const context = await loadBackgroundContext();
  const sharedLines = [
    "  await dropTarget.evaluate(async (element, state) => {",
    "    const ionContent = element.closest('ion-content');",
    "    if (!ionContent) return;",
    "  }, {\"scope\":\"ion-content\"});",
    "  const dropSize = await dropTarget.evaluate(element => element.getBoundingClientRect());"
  ];
  const firstBlock = [
    "{",
    "  const dropTarget = page.locator('#first');",
    ...sharedLines,
    "  await page.getByTitle('ion-text').dragTo(dropTarget);",
    "}"
  ];
  const secondBlock = [
    "{",
    "  const dropTarget = page.locator('#second');",
    ...sharedLines,
    "  await page.getByTitle('ion-text').dragTo(dropTarget);",
    "}"
  ];
  const actions = [
    {
      type: "dragANDdrop",
      sourceData: "getByTitle('ion-text')",
      targetData: "locator('#first')",
      generatedCodeLines: firstBlock
    },
    {
      type: "dragANDdrop",
      sourceData: "getByTitle('ion-text')",
      targetData: "locator('#second')",
      generatedCodeLines: secondBlock
    }
  ];

  const annotated = context.annotateCodeBodyWithNotes(
    [...firstBlock, ...secondBlock],
    actions
  );
  const comments = Array.from(annotated).filter(line =>
    String(line).startsWith("// Recorded Action")
  );

  assert.equal(comments.length, 2);
  assert.match(comments[0], /Recorded Action #1/);
  assert.match(comments[1], /Recorded Action #2/);
  assert.equal(annotated.indexOf(comments[0]), 0);
  assert.equal(annotated.indexOf(comments[1]), firstBlock.length + 1);
  assert.equal(annotated[annotated.indexOf(comments[0]) + 1], "{");
  assert.equal(annotated[annotated.indexOf(comments[1]) + 1], "{");
});

test("an unmatched multi-line action is not scattered across another block", async () => {
  const context = await loadBackgroundContext();
  const existingBlock = [
    "{",
    "  const dropTarget = page.locator('#existing');",
    "  await dropTarget.evaluate(() => {});",
    "  await source.dragTo(dropTarget);",
    "}"
  ];
  const missingBlock = [
    "{",
    "  const dropTarget = page.locator('#missing');",
    "  await dropTarget.evaluate(() => {});",
    "  await source.dragTo(dropTarget);",
    "}"
  ];

  const annotated = context.annotateCodeBodyWithNotes(existingBlock, [
    { type: "dragANDdrop", generatedCodeLines: existingBlock },
    { type: "dragANDdrop", generatedCodeLines: missingBlock }
  ]);
  const comments = Array.from(annotated).filter(line =>
    String(line).startsWith("// Recorded Action")
  );

  assert.equal(comments.length, 1);
  assert.match(comments[0], /Recorded Action #1/);
});

test("drop positioning modes still receive exactly one comment per action block", async () => {
  const context = await loadBackgroundContext();
  const ratioBlock = [
    "{",
    "  const dropTarget = targetLocator;",
    "  const dropSize = await dropTarget.evaluate(element => element.getBoundingClientRect());",
    "  await sourceLocator.dragTo(dropTarget, { targetPosition: { x: dropSize.width * 0.25, y: dropSize.height * 0.6 } });",
    "}"
  ];
  const absoluteBlock = [
    "{",
    "  const dropTarget = targetLocator;",
    "  await sourceLocator.dragTo(dropTarget, { targetPosition: { x: 24.5, y: 39 } });",
    "}"
  ];
  const centerLine = "await sourceLocator.dragTo(targetLocator);";
  const actions = [
    {
      type: "dragANDdrop",
      dropPositionMode: "ratio",
      generatedCodeLines: ratioBlock
    },
    {
      type: "dragANDdrop",
      dropPositionMode: "absolute",
      generatedCodeLines: absoluteBlock
    },
    {
      type: "dragANDdrop",
      dropPositionMode: "center",
      generatedCodeLines: [centerLine]
    }
  ];

  const annotated = context.annotateCodeBodyWithNotes(
    [...ratioBlock, ...absoluteBlock, centerLine],
    actions
  );
  const comments = Array.from(annotated).filter(line =>
    String(line).startsWith("// Recorded Action")
  );

  assert.equal(comments.length, 3);
  assert.match(comments[0], /Recorded Action #1/);
  assert.match(comments[1], /Recorded Action #2/);
  assert.match(comments[2], /Recorded Action #3/);
  assert.equal(annotated[annotated.indexOf(comments[0]) + 1], "{");
  assert.equal(annotated[annotated.indexOf(comments[1]) + 1], "{");
  assert.equal(annotated[annotated.indexOf(comments[2]) + 1], centerLine);
});

test("popup viewport code is appended to and replaces the complete popup action block", async () => {
  const context = await loadBackgroundContext();
  const popupLines = [
    "const [popup_123] = await Promise.all([",
    "  page.waitForEvent('popup'),",
    "  page.getByRole('button').click()",
    "]);"
  ];
  const nextLines = context.attachPopupViewportToCodeLines(
    popupLines,
    "popup_123",
    { width: 900.8, height: 640.2 }
  );
  const codeBody = context.replaceActionCodeBlock(
    ["await page.goto('https://example.test');", ...popupLines],
    popupLines,
    nextLines
  );

  assert.deepEqual(Array.from(nextLines), [
    ...popupLines,
    "await popup_123.setViewportSize({ width: 900, height: 640 });"
  ]);
  assert.deepEqual(Array.from(codeBody), [
    "await page.goto('https://example.test');",
    ...popupLines,
    "await popup_123.setViewportSize({ width: 900, height: 640 });"
  ]);

  const annotated = context.annotateCodeBodyWithNotes(codeBody, [{
    type: "popup",
    popupId: "popup_123",
    generatedCodeLines: nextLines
  }]);
  const comments = Array.from(annotated).filter(line =>
    String(line).startsWith("// Recorded Action")
  );
  assert.equal(comments.length, 1);
  assert.equal(annotated[annotated.indexOf(comments[0]) + 1], popupLines[0]);
});

test("ion-select multi-line replay receives one action comment", async () => {
  const context = await loadBackgroundContext();
  const ionSelectLines = [
    'await page.locator("#broker-selector").click();',
    'await page.locator("ion-popover").locator("ion-radio").filter({ hasText: "Custom ..." }).click();'
  ];
  const annotated = context.annotateCodeBodyWithNotes(ionSelectLines, [{
    type: "ionSelect",
    sourceData: 'locator("#broker-selector")',
    selectedValue: "custom",
    selectedText: "Custom ...",
    generatedCodeLines: ionSelectLines
  }]);
  const comments = Array.from(annotated).filter(line =>
    String(line).startsWith("// Recorded Action")
  );

  assert.equal(comments.length, 1);
  assert.equal(annotated[0], comments[0]);
  assert.equal(annotated[1], ionSelectLines[0]);
  assert.equal(annotated[2], ionSelectLines[1]);
});

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

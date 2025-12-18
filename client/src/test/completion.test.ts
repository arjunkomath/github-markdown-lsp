import * as vscode from "vscode";
import * as assert from "assert";
import { getDocUri, activate } from "./helper";

suite("Completion", () => {
  const docUri = getDocUri("completion.md");

  test("Completes quote highlights after > [", async () => {
    const expectedLabels = ["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"];
    const completions = await getCompletions(docUri, new vscode.Position(0, 4));

    const highlightCompletions = completions.items.filter((item) =>
      expectedLabels.includes(item.label as string)
    );

    assert.strictEqual(
      highlightCompletions.length,
      5,
      "Should have 5 highlight completions"
    );
    highlightCompletions.forEach((item) => {
      assert.strictEqual(item.kind, vscode.CompletionItemKind.Keyword);
    });
  });

  test("Completes collapsed section tags after <", async () => {
    const completions = await getCompletions(docUri, new vscode.Position(2, 1));

    const detailsItem = completions.items.find(
      (item) => item.label === "details"
    );
    const summaryItem = completions.items.find(
      (item) => item.label === "summary"
    );

    assert.ok(detailsItem, "Should have details completion");
    assert.ok(summaryItem, "Should have summary completion");
    assert.strictEqual(detailsItem.kind, vscode.CompletionItemKind.Keyword);
    assert.strictEqual(summaryItem.kind, vscode.CompletionItemKind.Keyword);
  });

  test("Completes closing tags after </", async () => {
    const completions = await getCompletions(docUri, new vscode.Position(4, 2));

    const detailsItem = completions.items.find(
      (item) => item.label === "details"
    );
    const summaryItem = completions.items.find(
      (item) => item.label === "summary"
    );

    assert.ok(detailsItem, "Should have details completion for closing tag");
    assert.ok(summaryItem, "Should have summary completion for closing tag");
  });

  test("Does not complete highlights on regular lines", async () => {
    const completions = await getCompletions(docUri, new vscode.Position(6, 11));

    const highlightLabels = ["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"];
    const highlightCompletions = completions.items.filter((item) =>
      highlightLabels.includes(item.label as string)
    );

    assert.strictEqual(
      highlightCompletions.length,
      0,
      "Should not have highlight completions on regular text"
    );
  });
});

async function getCompletions(
  docUri: vscode.Uri,
  position: vscode.Position
): Promise<vscode.CompletionList> {
  await activate(docUri);

  return (await vscode.commands.executeCommand(
    "vscode.executeCompletionItemProvider",
    docUri,
    position
  )) as vscode.CompletionList;
}

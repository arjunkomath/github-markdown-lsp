import { TextDocument } from "vscode-languageserver-textdocument";
import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver/node";

export const validateNewlines = (textDocument: TextDocument) => {
  const diagnostics: Diagnostic[] = [];

  const text = textDocument.getText();
  const pattern = /\n{3,}/g;
  let m: RegExpExecArray | null;

  while ((m = pattern.exec(text))) {
    const diagnostic: Diagnostic = {
      severity: DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index + 1),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `Too many newlines in a row.`,
      source: "newline-count-validator",
    };

    diagnostics.push(diagnostic);
  }

  return diagnostics;
};

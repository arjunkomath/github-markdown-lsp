import { TextDocument } from "vscode-languageserver-textdocument";
import {
  CompletionItem,
  CompletionItemKind,
  Diagnostic,
  DiagnosticSeverity,
} from "vscode-languageserver/node";

export const validHighlights = [
  "NOTE",
  "TIP",
  "IMPORTANT",
  "WARNING",
  "CAUTION",
];

export const validateQuoteHighlights = (
  textDocument: TextDocument,
  hasDiagnosticRelatedInformationCapability: boolean
) => {
  const diagnostics: Diagnostic[] = [];

  const text = textDocument.getText();
  const pattern = />\s\[!(.*)\]/g;
  let m: RegExpExecArray | null;

  while ((m = pattern.exec(text))) {
    if (m.length < 2) {
      continue;
    }
    if (validHighlights.includes(m[1])) {
      continue;
    }
    const diagnostic: Diagnostic = {
      severity: DiagnosticSeverity.Error,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `${m[1]} is an invalid highlight.`,
      source: "highlight-validator",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message:
            "Valid highlights are: NOTE, TIP, IMPORTANT, WARNING, CAUTION",
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

  return diagnostics;
};

export const highlightsCompletionTriggers = ["["];

export const highlightsOnCompletion = (
  linePrefix: string
): CompletionItem[] => {
  if (!linePrefix.endsWith("> [")) return [];

  return validHighlights.map((highlight, i) => {
    return {
      label: highlight,
      kind: CompletionItemKind.Keyword,
      data: `highlight-${i}`,
      insertText: `!${highlight}`,
    };
  });
};

export const highlightItemDetails = (
  item: number
): {
  detail: string;
  documentation: string;
} => {
  switch (item) {
    case 0: // NOTE
      return {
        detail: "Inserts a Note block",
        documentation:
          "Use this for adding a note or a side comment that is relevant but not part of the main text.",
      };
    case 1: // TIP
      return {
        detail: "Inserts a Tip block",
        documentation:
          "Use this to provide a tip or a suggestion that could be useful for the reader.",
      };
    case 2: // IMPORTANT
      return {
        detail: "Inserts an Important block",
        documentation:
          "Use this to highlight important information that the reader should not miss.",
      };
    case 3: // WARNING
      return {
        detail: "Inserts a Warning block",
        documentation:
          "Use this to warn the reader about potential pitfalls or important considerations.",
      };
    case 4: // CAUTION
      return {
        detail: "Inserts a Caution block",
        documentation:
          "Use this to warn the reader about potential pitfalls or important considerations.",
      };
    default:
      return {
        detail: "Markdown Highlight",
        documentation: "Inserts a special markdown highlight block.",
      };
  }
};

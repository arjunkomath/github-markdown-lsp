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
  const pattern = />\s\[!([^\]]*)\]/g;
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
  if (!/^>\s+\[$/.test(linePrefix)) return [];

  return validHighlights.map((highlight) => {
    return {
      label: highlight,
      kind: CompletionItemKind.Keyword,
      data: `highlight-${highlight}`,
      insertText: `!${highlight}`,
    };
  });
};

const highlightDetails: Record<string, { detail: string; documentation: string }> = {
  NOTE: {
    detail: "Inserts a Note block",
    documentation:
      "Use this for adding a note or a side comment that is relevant but not part of the main text.",
  },
  TIP: {
    detail: "Inserts a Tip block",
    documentation:
      "Use this to provide a tip or a suggestion that could be useful for the reader.",
  },
  IMPORTANT: {
    detail: "Inserts an Important block",
    documentation:
      "Use this to highlight important information that the reader should not miss.",
  },
  WARNING: {
    detail: "Inserts a Warning block",
    documentation:
      "Use this to warn the reader about potential pitfalls or important considerations.",
  },
  CAUTION: {
    detail: "Inserts a Caution block",
    documentation:
      "Use this to advise extra care in specific situations that could lead to problems.",
  },
};

export const highlightItemDetails = (
  highlight: string
): {
  detail: string;
  documentation: string;
} => {
  return highlightDetails[highlight] ?? {
    detail: "Markdown Highlight",
    documentation: "Inserts a special markdown highlight block.",
  };
};

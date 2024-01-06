import { CompletionItem, CompletionItemKind } from "vscode-languageserver/node";

const validTags = ["details", "summary"];

export const collapsedSectionCompletionTrigger = ["<", "/"];

export const sectionOnCompletion = (linePrefix: string): CompletionItem[] => {
  if (linePrefix !== "<" && linePrefix !== "</") {
    return [];
  }

  return validTags.map((tag, i) => {
    return {
      label: tag,
      kind: CompletionItemKind.Keyword,
      data: `section-tag-${i}`,
      insertText: tag,
    };
  });
};

export const sectionItemDetails = (
  item: number
): {
  detail: string;
  documentation: string;
} => {
  switch (item) {
    case 0: // details
      return {
        detail: "Create a collapsed section with the <details> tag",
        documentation:
          "Any Markdown within the <details> block will be collapsed until the reader clicks > to expand the details.",
      };
    case 1: // summary
      return {
        detail: "Use the <summary> tag to let readers know what is inside",
        documentation:
          "The Markdown inside the <summary> label will be collapsed by default.",
      };
    default:
      return {
        detail: "Organizing information with collapsed sections",
        documentation:
          "You can streamline your Markdown by creating a collapsed section with the <details> tag.",
      };
  }
};

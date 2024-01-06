import {
  createConnection,
  TextDocuments,
  Diagnostic,
  ProposedFeatures,
  InitializeParams,
  DidChangeConfigurationNotification,
  CompletionItem,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  InitializeResult,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";
import {
  highlightItemDetails,
  highlightsCompletionTriggers,
  highlightsOnCompletion,
  validateQuoteHighlights,
} from "./features/quote-highlights";
import { validateNewlines } from "./features/unnecessary-newlines";
import { LspSettings, defaultSettings } from "./settings";
import {
  collapsedSectionCompletionTrigger,
  sectionItemDetails,
  sectionOnCompletion,
} from "./features/collapsed-sections";

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;

  // Does the client support the `workspace/configuration` request?
  // If not, we fall back using global settings.
  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      // Tell the client that this server supports code completion.
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: [
          ...highlightsCompletionTriggers,
          ...collapsedSectionCompletionTrigger,
        ],
      },
    },
  };
  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true,
      },
    };
  }
  return result;
});

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    // Register for all configuration changes.
    connection.client.register(
      DidChangeConfigurationNotification.type,
      undefined
    );
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders((_event) => {
      connection.console.log("Workspace folder change event received.");
    });
  }
});

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
let globalSettings: LspSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<LspSettings>> = new Map();

connection.onDidChangeConfiguration((change) => {
  if (hasConfigurationCapability) {
    // Reset all cached document settings
    documentSettings.clear();
  } else {
    globalSettings = <LspSettings>(
      (change.settings.githubMarkdownLSP || defaultSettings)
    );
  }

  // Revalidate all open text documents
  documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<LspSettings> {
  if (!hasConfigurationCapability) {
    return Promise.resolve(globalSettings);
  }
  let result = documentSettings.get(resource);
  if (!result) {
    result = connection.workspace.getConfiguration({
      scopeUri: resource,
      section: "githubMarkdownLSP",
    });
    documentSettings.set(resource, result);
  }
  return result;
}

// Only keep settings for open documents
documents.onDidClose((e) => {
  documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
  validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  const settings = await getDocumentSettings(textDocument.uri);

  const diagnostics: Diagnostic[] = [
    ...validateQuoteHighlights(
      textDocument,
      hasDiagnosticRelatedInformationCapability
    ),
  ];

  if (settings) {
    const { suppressWarnings } = settings;

    if (!suppressWarnings) {
      diagnostics.push(...validateNewlines(textDocument));
    }
  } else {
    diagnostics.push(...validateNewlines(textDocument));
  }

  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles((_change) => {
  // Monitored files have change in VSCode
  connection.console.log("We received a file change event");
});

// create a completion for the highlight keywords
connection.onCompletion(
  (textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
    // Get the document from the documents manager
    const document = documents.get(textDocumentPosition.textDocument.uri);
    if (!document) return [];

    // Extract the line up to the cursor position
    const linePrefix = document.getText({
      start: { line: textDocumentPosition.position.line, character: 0 },
      end: textDocumentPosition.position,
    });

    const completions = [
      ...highlightsOnCompletion(linePrefix),
      ...sectionOnCompletion(linePrefix),
    ];

    return completions;
  }
);

connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  if (item.data.startsWith("highlight-")) {
    const id = parseInt(item.data.replace("highlight-", ""));
    const { detail, documentation } = highlightItemDetails(id);
    item.detail = detail;
    item.documentation = documentation;
  } else if (item.data.startsWith("section-tag-")) {
    const id = parseInt(item.data.replace("section-tag-", ""));
    const { detail, documentation } = sectionItemDetails(id);
    item.detail = detail;
    item.documentation = documentation;
  }
  return item;
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();

# LSP for GitHub Flavored Markdown

> [!WARNING]
> This is a work in progress. It is not ready for use.

<img src="https://github.com/arjunkomath/github-markdown-lsp/blob/main/docs/demo.jpeg?raw=true" alt="demo"/>

## Structure

```
.
├── client // Language Client
│   ├── src
│   │   ├── test // End to End tests for Language Client / Server
│   │   └── extension.ts // Language Client entry point
├── package.json // The extension manifest.
└── server // Language Server
    └── src
        └── server.ts // Language Server entry point
```

## Setup with Neovim using lspconfig

```lua
local lspconfig = require 'lspconfig'
local configs = require 'lspconfig.configs'

if not configs.ghmdlsp then
  configs.ghmdlsp = {
    default_config = {
      cmd = { "node", "/path-to-your-repo-location/md-lsp/server/out/server.js", "--stdio" },
      root_dir = lspconfig.util.root_pattern('.git'),
      filetypes = { "markdown" },
    },
  }
end

lspconfig.ghmdlsp.setup {}
```

## Running locally

- Run `npm install` in this folder. This installs all necessary npm modules in both the client and server folder
- Open VS Code on this folder.
- Press Ctrl+Shift+B to start compiling the client and server in [watch mode](https://code.visualstudio.com/docs/editor/tasks#:~:text=The%20first%20entry%20executes,the%20HelloWorld.js%20file.).
- Switch to the Run and Debug View in the Sidebar (Ctrl+Shift+D).
- Select `Launch Client` from the drop down (if it is not already).
- Press ▷ to run the launch config (F5).
- In the [Extension Development Host](https://code.visualstudio.com/api/get-started/your-first-extension#:~:text=Then%2C%20inside%20the%20editor%2C%20press%20F5.%20This%20will%20compile%20and%20run%20the%20extension%20in%20a%20new%20Extension%20Development%20Host%20window.) instance of VSCode, open a document in 'markdown' language mode.

# Installing from GitHub

## For End Users

### Quick Start with CLI (No Installation Required!)

The easiest way to try this is using the CLI's remote mode:

```bash
# Clone the repo
git clone https://github.com/scorzo/cloud-cost-calculator-mcp.git
cd cloud-cost-calculator-mcp/cli-client

# Install CLI dependencies and set up API key
npm install
echo "ANTHROPIC_API_KEY=your_key_here" > .env

# Run in remote mode (automatically downloads MCP server from GitHub)
npm start -- --remote
```

This will automatically download and use the latest MCP server from GitHub without any manual setup!

### Install the MCP Server Package

To install the MCP server as a package in your own project:

```bash
npm install github:scorzo/cloud-cost-calculator-mcp#main
```

### Use with Claude Desktop

1. Open your Claude Desktop MCP configuration file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the server:

```json
{
  "mcpServers": {
    "cloud-cost-calculator": {
      "command": "npx",
      "args": ["-y", "@scorzo/cloud-cost-calculator-mcp"]
    }
  }
}
```

3. Restart Claude Desktop

4. The calculator tools will now be available!

## For Developers

### Clone and Build (Local Development)

```bash
git clone https://github.com/scorzo/cloud-cost-calculator-mcp.git
cd cloud-cost-calculator-mcp

# Build MCP server
cd mcp-server
npm install
npm run build

# Build CLI client
cd ../cli-client
npm install
npm run build
echo "ANTHROPIC_API_KEY=your_key" > .env
```

### Run the CLI

**Local Mode** (uses your local MCP server build):
```bash
cd cli-client
npm start
```

**Remote Mode** (uses MCP server from GitHub):
```bash
cd cli-client
npm start -- --remote
```

## Repository Structure

```
cloud-cost-calculator-mcp/
├── mcp-server/          # npm-installable MCP server
│   ├── src/             # TypeScript source
│   ├── dist/            # Compiled JavaScript
│   └── package.json     # npm package config
├── cli-client/          # CLI client with local/remote modes
│   └── src/
└── docs/                # Documentation
```

## Version Pinning

Install a specific version:

```bash
# Latest from main branch (default)
npm install github:scorzo/cloud-cost-calculator-mcp#main

# Specific release tag (when available)
npm install github:scorzo/cloud-cost-calculator-mcp#v1.0.0

# Specific commit
npm install github:scorzo/cloud-cost-calculator-mcp#abc1234
```

## CLI Remote Mode Under the Hood

When you run `npm start -- --remote`, the CLI:

1. Creates a temporary directory
2. Installs the MCP server package from GitHub using npm
3. Locates the installed server executable
4. Connects to it using MCP protocol
5. Cleans up on exit

This makes it perfect for:
- Testing the published package
- Demo purposes
- Running without local setup
- CI/CD environments

## Troubleshooting

### Error: "Cannot find module" (Local Mode)

Make sure the server is built:
```bash
cd mcp-server
npm run build
```

### Error: "Failed to install remote MCP server" (Remote Mode)

Check your internet connection and try again. The CLI will automatically fall back to local mode if remote installation fails.

### Error: "Permission denied"

Try with npx:
```bash
npx -y @scorzo/cloud-cost-calculator-mcp
```

### Check Installation

```bash
npm list @scorzo/cloud-cost-calculator-mcp
```

### Remote Mode Not Working

If `--remote` flag fails:
1. Check internet connectivity
2. Verify GitHub repository is accessible
3. Try clearing npm cache: `npm cache clean --force`
4. Fall back to local mode (default behavior)

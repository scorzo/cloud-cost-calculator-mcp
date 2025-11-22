# Installing from GitHub

## For End Users

### Install the MCP Server

```bash
npm install github:yourusername/mcp-demo#mcp-server
```

Replace `yourusername` with your actual GitHub username.

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
      "args": ["-y", "@yourorg/cloud-cost-calculator-mcp"]
    }
  }
}
```

3. Restart Claude Desktop

4. The calculator tools will now be available!

## For Developers

### Clone and Build

```bash
git clone https://github.com/yourusername/mcp-demo.git
cd mcp-demo

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

```bash
cd cli-client
npm start
```

## Repository Structure

```
mcp-demo/
├── mcp-server/          # npm-installable MCP server
│   ├── src/             # TypeScript source
│   ├── dist/            # Compiled JavaScript
│   └── package.json     # npm package config
├── cli-client/          # Example CLI client
│   └── src/
└── docs/                # Documentation
```

## Version Pinning

Install a specific version:

```bash
# Latest from main branch
npm install github:yourusername/mcp-demo#mcp-server

# Specific release tag
npm install github:yourusername/mcp-demo#v1.0.0:mcp-server

# Specific commit
npm install github:yourusername/mcp-demo#abc1234:mcp-server
```

## Troubleshooting

### Error: "Cannot find module"

Make sure the server is built:
```bash
cd mcp-server
npm run build
```

### Error: "Permission denied"

Try with npx:
```bash
npx -y @yourorg/cloud-cost-calculator-mcp
```

### Check Installation

```bash
npm list @yourorg/cloud-cost-calculator-mcp
```

# CLI Client - Cloud Cost Comparison

TypeScript-based CLI client that provides a conversational interface for cloud cost comparisons using Claude and MCP.

## Features

- Natural language interaction powered by Claude
- Automatic MCP server lifecycle management
- Structured information collection
- Clear cost comparison presentation
- Graceful error handling

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your ANTHROPIC_API_KEY
   ```

3. **Ensure MCP server is set up**
   ```bash
   cd ../mcp-server
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   cd ../cli-client
   ```

## Usage

### Local Mode (Default)

Uses the local MCP server from `../mcp-server/`:

```bash
npm start
```

### Remote Mode

Install and use the MCP server directly from GitHub:

```bash
npm start -- --remote
# or
npm start -- -r
```

This mode will:
- Automatically install the MCP server package from GitHub
- Use the latest version from the repository
- Great for testing the published package without local setup

### What the CLI does

The CLI will:
1. Launch and connect to the MCP server (local or remote)
2. Guide you through providing AWS instance details
3. Calculate cost comparisons
4. Present findings in natural language
5. Clean up and exit gracefully

### Command-Line Options

- `--remote`, `-r`: Use MCP server from GitHub instead of local version
- `--version`, `-V`: Display version information
- `--help`, `-h`: Display help information

## Example Session

```
$ npm start

🌥️  Cloud Cost Comparison Assistant

I'll help you compare your AWS instance costs with our alternative cloud platform.

You: I'm running 3 t3.micro instances in us-east-1, all 24/7

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

```bash
npm start
```

The CLI will:
1. Launch and connect to the MCP server
2. Guide you through providing AWS instance details
3. Calculate cost comparisons
4. Present findings in natural language
5. Clean up and exit gracefully

## Example Session

```
$ npm start

🌥️  Cloud Cost Comparison Assistant

I'll help you compare your AWS instance costs with our alternative cloud platform.

You: I'm running 3 t3.micro instances in us-east-1, all 24/7

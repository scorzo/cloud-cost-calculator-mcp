# Cloud Cost Calculator MCP

A complete Model Context Protocol (MCP) implementation demonstrating cloud cost comparison capabilities through multiple client interfaces. Built entirely with TypeScript/Node.js, this project showcases MCP's power in creating AI-assisted tools with real-world utility.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 Overview

This project provides a complete MCP ecosystem for AWS cost comparison:

1. **MCP Server** - npm-installable MCP server that compares AWS EC2 pricing with alternative cloud providers
2. **CLI Client** - Terminal-based conversational interface with local/remote MCP modes
3. **Web Client** - Universal web-based MCP tester that works with ANY GitHub-hosted MCP server

**Key Innovation:** The web client is a generic MCP testing tool - while it defaults to our cloud cost calculator, you can point it at any GitHub-hosted MCP server to test and interact with it through a modern web UI.

## ✨ Features

### MCP Server
- 💰 **Cost Comparison**: Compare AWS EC2 instance costs with alternative cloud pricing
- 📊 **Detailed Breakdowns**: Per-instance cost analysis with savings percentages
- 🌍 **Multi-Region Support**: us-east-1, us-west-2, eu-west-1
- 📦 **npm Installable**: Publish to GitHub and install via npm
- 🔧 **Two MCP Tools**: 
  - `calculate_instance_savings` - Compare costs and get recommendations
  - `list_supported_instances` - Discover available instance types

### CLI Client
- 💬 **Conversational Interface**: Natural language interaction powered by Claude
- 🔌 **Dual Mode Operation**:
  - **Local Mode**: Use local MCP server during development
  - **Remote Mode**: Auto-install MCP server from GitHub
- 🎯 **Guided Prompts**: Structured information collection
- ⚡ **Fast Iteration**: Perfect for testing MCP server changes

### Web Client (Universal MCP Tester)
- 🌐 **Universal**: Connect to ANY GitHub-hosted MCP server
- 🎨 **Modern UI**: React + Tailwind CSS interface
- 🔍 **Tool Discovery**: Automatically displays available MCP tools
- 💬 **Real-time Chat**: WebSocket-based conversation with Claude
- 🐳 **Containerized**: Full Docker setup with docker-compose
- 🔧 **Pre-configured**: Defaults to cloud-cost-calculator for instant demo
- 📱 **Responsive**: Works on desktop, tablet, and mobile

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                             │
│  ┌──────────────────┐              ┌──────────────────┐     │
│  │   CLI Client     │              │   Web Client     │     │
│  │  (Terminal)      │              │  (Browser UI)    │     │
│  │                  │              │                  │     │
│  │  • Local mode    │              │  • Config panel  │     │
│  │  • Remote mode   │              │  • Chat UI       │     │
│  │  • Claude chat   │              │  • Tool explorer │     │
│  └────────┬─────────┘              └────────┬─────────┘     │
└───────────┼──────────────────────────────────┼──────────────┘
            │                                  │
            │         MCP Protocol             │
            │      (stdio/JSON-RPC)            │
            │                                  │
┌───────────┴──────────────────────────────────┴──────────────┐
│                    MCP Server Layer                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Cloud Cost Calculator MCP Server             │   │
│  │              (TypeScript/Node.js)                    │   │
│  │                                                      │   │
│  │  Tools:                                              │   │
│  │  • calculate_instance_savings                        │   │
│  │  • list_supported_instances                          │   │
│  │                                                      │   │
│  │  Data: Static pricing.json                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Project Structure

```
cloud-cost-calculator-mcp/
├── mcp-server/              # TypeScript MCP Server
│   ├── src/
│   │   ├── index.ts         # MCP server implementation
│   │   ├── calculator.ts    # Cost calculation engine
│   │   ├── data-loader.ts   # Pricing data loader
│   │   └── data/
│   │       └── pricing.json # AWS & alternative pricing
│   ├── package.json         # npm package config
│   └── README.md
│
├── cli-client/              # CLI Client
│   ├── src/
│   │   ├── index.ts         # CLI entry point
│   │   ├── mcp-lifecycle.ts # MCP server lifecycle
│   │   ├── claude-client.ts # Claude integration
│   │   └── types.ts         # TypeScript types
│   ├── package.json
│   └── README.md
│
├── web-client/              # Universal Web Client
│   ├── backend/             # Express API + WebSocket
│   │   ├── src/
│   │   │   ├── services/    # GitHub installer, MCP manager
│   │   │   ├── routes/      # REST API routes
│   │   │   ├── websocket/   # Chat handler
│   │   │   └── server.ts    # Main server
│   │   └── Dockerfile
│   │
│   ├── frontend/            # React UI
│   │   │   ├── components/  # React components
│   │   │   ├── hooks/       # Custom hooks
│   │   │   ├── services/    # API client
│   │   │   └── App.tsx      # Main app
│   │   └── Dockerfile
│   │
│   ├── docker-compose.yml
│   └── README.md
│
└── docs/                    # Documentation
    ├── PRD.md               # Product requirements
    ├── PRD-WEB-CLIENT.md    # Web client PRD
    └── IMPLEMENTATION_PHASES.md
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **Anthropic API Key** ([Get one here](https://console.anthropic.com/))
- **Docker & Docker Compose** (for web client)

### Option 1: Web Client (Recommended) 🌐

The fastest way to get started and test ANY GitHub MCP server:

```bash
# Navigate to web client
cd web-client

# Configure
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Start with Docker
docker-compose up --build

# Open browser
open http://localhost:3000
```

**What you get:**
- Pre-configured to connect to cloud-cost-calculator MCP
- Modern web interface with real-time chat
- Tool discovery and exploration
- Can switch to ANY GitHub MCP server

### Option 2: CLI Client 🖥️

For terminal enthusiasts and rapid development:

```bash
# Build MCP server (if testing locally)
cd mcp-server
npm install && npm run build
cd ..

# Set up CLI client
cd cli-client
npm install && npm run build

# Configure
echo "ANTHROPIC_API_KEY=your_key_here" > .env

# Run in local mode (uses ../mcp-server)
npm start

# OR run in remote mode (installs from GitHub)
npm start -- --remote
```

### Option 3: Use MCP Server Standalone 📦

Install and use the MCP server directly:

```bash
# Install from GitHub
npm install github:scorzo/cloud-cost-calculator-mcp#main

# Use in Claude Desktop
# Edit: ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "cloud-cost": {
      "command": "npx",
      "args": ["-y", "@scorzo/cloud-cost-calculator-mcp"]
    }
  }
}
```

## 💬 Usage Examples

### CLI Client

```
$ npm start

🌥️  Cloud Cost Comparison Assistant

You: I'm running 3 t3.micro instances in us-east-1, all 24/7

[Calling tool: calculate_instance_savings]
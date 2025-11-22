# Product Requirements Document (PRD)
## Universal MCP Web Client

**Version:** 1.0  
**Date:** November 22, 2025  
**Status:** Draft

---

## 1. Executive Summary

This document outlines the requirements for a **universal web-based MCP testing and interaction tool**. Unlike the CLI client which is specific to our cloud cost calculator, this web application allows users to connect to **any GitHub-hosted MCP server** and interact with it through a conversational interface powered by Claude.

The web client consists of two components:

1. **Frontend**: React-based web UI with configuration panel, chat interface, and tool discovery
2. **Backend**: Node.js/Express API that manages MCP server lifecycle, GitHub package installation, and Claude integration

This tool serves multiple purposes:
- **Testing Tool**: Verify GitHub-published MCP packages work correctly
- **Discovery Tool**: Explore what tools an MCP server provides
- **Demo Platform**: Showcase MCP capabilities to potential users
- **Development Aid**: Test MCP servers during development

---

## 2. Goals & Objectives

### Primary Goals
- Create a truly generic MCP client that works with any GitHub-hosted MCP server
- Provide visual interface for MCP discovery and testing
- Demonstrate remote MCP package installation and lifecycle management
- Enable non-technical users to explore MCP capabilities

### Success Criteria
- User can connect to any valid GitHub MCP package
- Available tools are automatically discovered and displayed
- Chat interface successfully calls MCP tools through Claude
- Connection status is clear and error messages are actionable
- Default configuration connects to our cloud-cost-calculator MCP
- Works entirely in containerized environment (Docker)

### Non-Goals (Out of Scope - Phase 1)
- Authentication/user management
- Conversation persistence across sessions
- Multiple simultaneous MCP connections
- MCP server creation/editing tools
- File upload/download for MCP tools
- Production deployment configuration

---

## 3. User Personas

### Persona 1: MCP Developer (Sarah)
**Background:** Building an MCP server and wants to test it
**Goals:** 
- Verify her GitHub-published MCP package installs correctly
- Test tool calling through a real chat interface
- Debug tool responses and error handling
**Pain Points:**
- Setting up CLI testing environments is tedious
- Hard to visualize how end users will interact with her MCP
- Needs quick iteration cycles

### Persona 2: AI Integration Engineer (Marcus)
**Background:** Evaluating MCP servers for integration
**Goals:**
- Explore what tools different MCP servers provide
- Test functionality before committing to integration
- Compare multiple MCP servers side-by-side (future)
**Pain Points:**
- Reading documentation doesn't show actual behavior
- Setting up local environments for each MCP is time-consuming
- Needs hands-on testing before architectural decisions

### Persona 3: Technical Decision Maker (Lisa)
**Background:** Evaluating MCP technology for organization
**Goals:**
- See MCP in action with minimal setup
- Understand capabilities through natural interaction
- Determine if MCP fits use cases
**Pain Points:**
- CLI tools aren't user-friendly for demos
- Needs visual, shareable demonstration
- Limited technical setup capability

---

## 4. User Stories

### User Story 1: Connect to Default MCP
**As a** new user  
**I want to** see the web client connected to a working MCP with default values  
**So that** I can immediately test the system without configuration

**Acceptance Criteria:**
- Web client opens with cloud-cost-calculator MCP config pre-filled
- Single "Connect" button initiates installation and connection
- Status indicator shows: Installing → Connecting → Connected
- Chat interface becomes active when connected
- Available tools are displayed in tools panel

### User Story 2: Connect to Custom GitHub MCP
**As an** MCP developer  
**I want to** input my GitHub repository details  
**So that** I can test my own MCP server

**Acceptance Criteria:**
- Configuration form accepts: GitHub org/user, repo name, branch/tag
- Optional subdirectory path for monorepo packages
- Form validation prevents invalid inputs
- Connect button triggers installation from specified GitHub URL
- Clear error messages if package doesn't exist or isn't valid MCP

### User Story 3: Discover Available Tools
**As a** user exploring an MCP  
**I want to** see what tools the MCP provides  
**So that** I understand its capabilities before chatting

**Acceptance Criteria:**
- Tools panel lists all available MCP tools
- Each tool shows name and description
- Expandable view shows input schema/parameters
- Tools update automatically when new MCP connects
- Clear indication if MCP has no tools

### User Story 4: Chat with Claude Using MCP Tools
**As a** user  
**I want to** have natural conversations where Claude uses MCP tools  
**So that** I can test the MCP's functionality

**Acceptance Criteria:**
- Chat input accepts natural language
- Messages appear in conversation history
- When Claude calls MCP tool, visual indicator shows "[Calling: tool_name]"
- Tool responses appear in chat (via Claude's interpretation)
- Conversation flows naturally with multiple turns
- Chat works only when MCP is connected

### User Story 5: Handle Connection Errors
**As a** user  
**I want to** receive clear feedback when something goes wrong  
**So that** I can fix the issue and retry

**Acceptance Criteria:**
- If GitHub package not found: "Package not found at [URL]"
- If MCP fails to start: "MCP server failed to start: [reason]"
- If connection drops: Chat disables, status shows "Disconnected"
- "Reconnect" button available after errors
- Error messages include actionable next steps

---

## 5. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Frontend)                   │
│                                                         │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐  │
│  │   Config     │  │    Chat     │  │    Tools     │  │
│  │   Panel      │  │  Interface  │  │    Panel     │  │
│  └──────────────┘  └─────────────┘  └──────────────┘  │
│         │                  │                  │         │
│         └──────────────────┴──────────────────┘         │
│                            │                            │
│                   REST API + WebSocket                  │
└────────────────────────────┼────────────────────────────┘
                             │
                    Docker Network
                             │
┌────────────────────────────┼────────────────────────────┐
│                 Backend (Node.js/Express)               │
│                            │                            │
│  ┌─────────────────────────┴──────────────────────┐    │
│  │         API Routes & WebSocket Server          │    │
│  └─────────────────────────┬──────────────────────┘    │
│                            │                            │
│  ┌──────────────┐  ┌──────┴────────┐  ┌─────────────┐ │
│  │   GitHub     │  │  MCP Lifecycle │  │   Claude    │ │
│  │  Installer   │  │    Manager     │  │   Client    │ │
│  └──────────────┘  └───────┬────────┘  └─────────────┘ │
│                            │                            │
└────────────────────────────┼────────────────────────────┘
                             │
                        MCP Protocol
                        (stdio/JSON-RPC)
                             │
┌────────────────────────────┼────────────────────────────┐
│               Dynamically Installed MCP Server          │
│               (from GitHub npm package)                 │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Any MCP Server Implementation           │   │
│  │         (cloud-cost-calculator by default)      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### 5.1 Frontend (React + Tailwind CSS)

**Technology Stack:**
- React 18+ with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Axios for REST API calls
- Native WebSocket API for real-time chat

**Key Components:**

**`ConfigPanel.tsx`**
- GitHub configuration form
- Fields: org/user, repo, branch, subdirectory
- Default values: scorzo/cloud-cost-calculator-mcp/main
- Connect/Disconnect button
- Status indicator component

**`ChatInterface.tsx`**
- Message input area
- Conversation history display
- Message bubbles (user vs assistant styling)
- Tool call indicators
- Loading states
- Auto-scroll to latest message

**`ToolsPanel.tsx`**
- List of available MCP tools
- Tool name + description cards
- Expandable schema viewer
- "No tools available" state
- Refresh capability

**`StatusIndicator.tsx`**
- Visual connection status
- States: Disconnected, Installing, Connecting, Connected, Error
- Color-coded (red/yellow/green)
- Animated during transitions

**`App.tsx`**
- Layout container
- State management for connection status
- WebSocket connection management
- API call orchestration

#### 5.2 Backend (Node.js/Express)

**Technology Stack:**
- Node.js 18+ with TypeScript
- Express.js for REST API
- ws (WebSocket library) for real-time communication
- Reused code from cli-client:
  - MCP lifecycle management
  - Claude API integration
  - Type definitions

**Key Modules:**

**`server.ts`**
- Express app setup
- REST API endpoints
- WebSocket server setup
- CORS configuration
- Error handling middleware

**`github-installer.ts`**
- Install MCP from GitHub using npm
- Parse GitHub URL/config
- Create temporary installation directory
- Locate installed MCP executable
- Version: supports `owner/repo#branch` format
- Cleanup on disconnect

**`mcp-manager.ts`** (adapted from cli-client)
- Spawn MCP server process
- Maintain stdio connection
- Execute tool calls
- Handle server errors/crashes
- Graceful shutdown
- List available tools from MCP

**`claude-client.ts`** (adapted from cli-client)
- Anthropic SDK integration
- Conversation history management
- Tool calling loop
- Stream responses to WebSocket
- Error handling for API failures

**API Endpoints:**

```typescript
POST   /api/mcp/connect
  Body: { owner, repo, branch, subdirectory? }
  Response: { status: "installing" | "connected" | "error", message?, tools? }

POST   /api/mcp/disconnect
  Response: { status: "disconnected" }

GET    /api/mcp/status
  Response: { connected: boolean, tools: Tool[], error?: string }

GET    /api/mcp/tools
  Response: { tools: Tool[] }

WebSocket: /ws/chat
  Client → Server: { type: "message", content: string }
  Server → Client: { type: "message", content: string, role: "user" | "assistant" }
  Server → Client: { type: "tool_call", tool_name: string }
  Server → Client: { type: "error", message: string }
```

#### 5.3 Docker Setup

**Services:**

```yaml
# docker-compose.yml
services:
  backend:
    build: ./backend
    container_name: mcp-web-backend
    env_file: .env
    ports:
      - "3001:3001"
    volumes:
      - /tmp/mcp-installs:/tmp/mcp-installs
    environment:
      - NODE_ENV=development
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    
  frontend:
    build: ./frontend
    container_name: mcp-web-frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      - VITE_API_URL=http://localhost:3001
```

**Volume Mounts:**
- `/tmp/mcp-installs`: Persist MCP installations across backend restarts during development

---

## 6. Functional Requirements

### FR-1: GitHub MCP Configuration
**Priority:** High

- Frontend MUST provide input fields for:
  - GitHub owner/organization (default: "scorzo")
  - Repository name (default: "cloud-cost-calculator-mcp")
  - Branch/tag (default: "main")
  - Optional: Subdirectory path for monorepos
- Form MUST validate inputs before allowing connection
- Configuration MUST be editable when disconnected
- Configuration SHOULD be disabled/read-only when connected

### FR-2: MCP Installation from GitHub
**Priority:** High

- Backend MUST construct valid GitHub npm install URL
- Backend MUST run `npm install github:owner/repo#branch`
- Installation MUST happen in isolated temporary directory
- Backend MUST locate the installed MCP executable
- Backend MUST report installation progress to frontend
- Installation errors MUST be captured and reported clearly

### FR-3: MCP Lifecycle Management
**Priority:** High

- Backend MUST spawn MCP server process after installation
- Backend MUST establish stdio transport connection
- Backend MUST validate connection before marking as "connected"
- Backend MUST handle MCP server crashes gracefully
- Backend MUST clean up MCP process on disconnect
- Backend MUST support reconnection without restart

### FR-4: Tool Discovery
**Priority:** High

- Backend MUST query MCP server for available tools
- Backend MUST retrieve tool schemas (name, description, input_schema)
- Tools MUST be sent to frontend on successful connection
- Frontend MUST display tools in organized panel
- Tool details (schema) MUST be viewable on expand
- Tools list MUST update when switching MCP servers

### FR-5: Chat Interface
**Priority:** High

- Frontend MUST provide text input for messages
- Frontend MUST display conversation history (user + assistant)
- Messages MUST be sent to backend via WebSocket
- Backend MUST forward messages to Claude API
- Claude responses MUST stream back to frontend
- Tool calls MUST be visible in chat (e.g., "[Calling: calculate_savings]")
- Chat MUST be disabled when MCP not connected

### FR-6: Real-Time Communication
**Priority:** High

- WebSocket connection MUST be established on page load
- WebSocket MUST handle reconnection if connection drops
- Messages MUST be delivered in order
- Tool call notifications MUST appear in real-time
- Connection status changes MUST update UI immediately

### FR-7: Status Indication
**Priority:** High

- Frontend MUST show current connection status at all times
- Status MUST include: Disconnected, Installing, Connecting, Connected, Error
- Status MUST update in real-time during connection flow
- Errors MUST display with specific error messages
- Status indicator MUST be visually prominent

### FR-8: Error Handling
**Priority:** High

- GitHub package not found: Clear error message with URL checked
- MCP installation fails: Show npm error output
- MCP server fails to start: Show server error logs
- MCP connection drops: Auto-disconnect, enable reconnect
- Claude API errors: Display in chat, don't crash application
- All errors MUST be user-friendly (no stack traces in UI)

### FR-9: Environment Configuration
**Priority:** Medium

- Anthropic API key MUST come from `.env` file
- API key MUST NOT be exposed to frontend
- Backend API URL MUST be configurable for frontend
- Docker setup MUST work without additional configuration

### FR-10: Default Configuration
**Priority:** Medium

- Web client MUST load with cloud-cost-calculator MCP pre-configured
- User MUST be able to connect with single click
- Default config MUST demonstrate full capabilities
- User SHOULD be able to modify config and reconnect

---

## 7. Non-Functional Requirements

### NFR-1: Performance
- MCP installation time: < 30 seconds for typical package
- MCP connection time: < 3 seconds after installation
- WebSocket message latency: < 100ms (excluding Claude API time)
- Chat response time: < 5 seconds total (including Claude)
- Tool discovery: < 1 second after connection
- Frontend bundle size: < 500KB gzipped

### NFR-2: Reliability
- MCP server crashes MUST NOT crash backend
- WebSocket disconnects MUST NOT lose chat history (current session)
- Multiple rapid reconnections MUST NOT create zombie processes
- Backend MUST clean up all resources on shutdown
- Container restarts MUST NOT leave orphaned MCP processes

### NFR-3: Usability
- User MUST understand how to connect within 30 seconds
- Tool discovery MUST be intuitive (no documentation required)
- Chat interface MUST follow familiar messaging patterns
- Error messages MUST include actionable next steps
- Status indicators MUST use universally understood colors/icons

### NFR-4: Security
- API key MUST be stored securely (server-side only)
- WebSocket connections MUST be validated
- No user input MUST be executed as shell commands
- GitHub URLs MUST be validated before installation
- npm install MUST run with appropriate security flags

### NFR-5: Maintainability
- Code MUST be TypeScript with strict typing
- Components MUST be modular and reusable
- Backend logic MUST be separated from routes
- Frontend state management MUST be clear and predictable
- Docker setup MUST be documented and reproducible

### NFR-6: Accessibility (Basic)
- Interface MUST be keyboard navigable
- Status indicators MUST not rely solely on color
- Form inputs MUST have appropriate labels
- Chat messages MUST be readable by screen readers

---

## 8. User Interface Specifications

### 8.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Universal MCP Tester                          [Status: ●]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─── Configuration Panel ────────────────────────────────┐    │
│  │  GitHub MCP Server                                     │    │
│  │  Owner/Org:  [scorzo                              ]    │    │
│  │  Repository: [cloud-cost-calculator-mcp           ]    │    │
│  │  Branch:     [main                                ]    │    │
│  │  Path:       [                                    ]    │    │
│  │                                    [Connect Button]    │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─── Main Content Area ──────────────┬─── Tools Panel ────┐  │
│  │                                     │                     │  │
│  │  Chat Interface                     │  Available Tools:   │  │
│  │                                     │                     │  │
│  │  ┌──────────────────────────────┐  │  ● calculate_sav... │  │
│  │  │                              │  │    Calculate AWS... │  │
│  │  │  Conversation history        │  │    [Expand ▼]       │  │
│  │  │  appears here...             │  │                     │  │
│  │  │                              │  │  ● list_support...  │  │
│  │  │  Assistant: Based on your... │  │    List support...  │  │
│  │  │                              │  │    [Expand ▼]       │  │
│  │  │  [Calling: calculate_...]    │  │                     │  │
│  │  │                              │  │                     │  │
│  │  │  You: Compare costs for...   │  │                     │  │
│  │  │                              │  │                     │  │
│  │  └──────────────────────────────┘  │                     │  │
│  │                                     │                     │  │
│  │  ┌──────────────────────────────┐  │                     │  │
│  │  │ Type your message...     [>] │  │                     │  │
│  │  └──────────────────────────────┘  │                     │  │
│  └─────────────────────────────────────┴─────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Component Specifications

#### Configuration Panel
- **Style**: Card/panel with light background, rounded corners
- **Layout**: Vertical stack of input fields
- **Fields**: 
  - Text inputs with labels above
  - Placeholder text showing defaults
  - Mono-spaced font for GitHub paths
- **Button**: 
  - Primary action button (blue/green when disconnected)
  - Secondary action (red) when connected ("Disconnect")
  - Disabled during installation/connection
- **Spacing**: Comfortable padding, clear visual grouping

#### Status Indicator
- **Location**: Top-right corner of header
- **States**:
  - 🔴 Disconnected (red circle + text)
  - 🟡 Installing/Connecting (yellow circle, animated pulse)
  - 🟢 Connected (green circle + checkmark)
  - ❌ Error (red X + hover tooltip with error)
- **Style**: Inline with header, always visible

#### Chat Interface
- **Message Bubbles**:
  - User messages: Right-aligned, blue background, white text
  - Assistant messages: Left-aligned, gray background, dark text
  - Tool calls: Center-aligned, italic, smaller text
  - Timestamps: Optional, subtle gray text
- **Input Area**:
  - Full-width text input at bottom
  - Send button on right (or Enter to send)
  - Disabled state when not connected
  - Placeholder: "Type your message..." or "Connect to MCP first..."
- **Scrolling**:
  - Auto-scroll to bottom on new messages
  - Scroll to top to view history
  - Scroll indicator if not at bottom

#### Tools Panel
- **Location**: Right sidebar (25-30% width)
- **Layout**: Vertical list of tool cards
- **Tool Card**:
  - Tool name as heading
  - Short description (truncated if long)
  - Expand/collapse for full schema
  - Light border, subtle shadow
  - Hover effect
- **Empty State**: "No tools available" when not connected
- **Scroll**: Independent scrolling if many tools

### 8.3 Color Scheme (Tailwind CSS)

- **Primary**: Blue-600 (buttons, links, user messages)
- **Secondary**: Gray-700 (text)
- **Success**: Green-500 (connected status)
- **Warning**: Yellow-500 (installing/connecting)
- **Error**: Red-500 (errors, disconnect)
- **Background**: Gray-50 (main bg), White (cards/panels)
- **Text**: Gray-900 (primary), Gray-600 (secondary)

### 8.4 Responsive Design

- **Desktop (>1024px)**: Full layout as shown
- **Tablet (768-1024px)**: Tools panel collapses to modal/drawer
- **Mobile (<768px)**: 
  - Config panel collapses/minimizes after connection
  - Chat takes full screen
  - Tools accessible via bottom sheet or menu

---

## 9. Data Models

### 9.1 GitHub MCP Configuration

```typescript
interface MCPConfig {
  owner: string;        // GitHub owner/org
  repo: string;         // Repository name
  branch: string;       // Branch, tag, or commit
  subdirectory?: string; // Optional path within repo
}
```

### 9.2 Connection Status

```typescript
type ConnectionStatus = 
  | "disconnected"
  | "installing"
  | "connecting"
  | "connected"
  | "error";

interface StatusState {
  status: ConnectionStatus;
  message?: string;      // Error message or status detail
  tools?: MCPTool[];     // Available tools when connected
}
```

### 9.3 MCP Tool Schema

```typescript
interface MCPTool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}
```

### 9.4 Chat Message

```typescript
interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  toolCall?: string;  // Tool name if this is a tool call indicator
}
```

### 9.5 WebSocket Messages

```typescript
// Client → Server
type ClientMessage = {
  type: "message";
  content: string;
};

// Server → Client
type ServerMessage = 
  | { type: "message"; role: "user" | "assistant"; content: string }
  | { type: "tool_call"; tool_name: string }
  | { type: "error"; message: string }
  | { type: "status"; status: ConnectionStatus };
```

---

## 10. User Flows

### 10.1 First-Time User Flow (Happy Path)

1. User opens web app in browser (`http://localhost:3000`)
2. Configuration panel shows defaults:
   - Owner: "scorzo"
   - Repo: "cloud-cost-calculator-mcp"
   - Branch: "main"
3. Status shows: 🔴 Disconnected
4. User clicks "Connect"
5. Status changes to: 🟡 Installing...
6. Backend installs MCP from GitHub (10-20 seconds)
7. Status changes to: 🟡 Connecting...
8. Backend spawns MCP, establishes connection
9. Status changes to: 🟢 Connected
10. Tools panel populates with 2 tools:
    - calculate_instance_savings
    - list_supported_instances
11. Chat input becomes enabled
12. User types: "I have 3 t3.micro instances in us-east-1"
13. Message appears in chat (user bubble, right side)
14. Loading indicator shows
15. Tool call indicator appears: "[Calling: calculate_instance_savings]"
16. Assistant response appears with cost comparison
17. User continues conversation or disconnects

### 10.2 Developer Testing Their Own MCP

1. Developer opens web app
2. Modifies configuration:
   - Owner: "myusername"
   - Repo: "my-mcp-server"
   - Branch: "develop"
3. Clicks "Connect"
4. Installation begins
5. **Error**: Package not found
6. Status shows: ❌ Error with message
7. Developer fixes repo name, clicks "Retry"
8. Installation succeeds
9. MCP connects
10. Tools panel shows developer's tools
11. Developer tests tools via chat
12. Finds a bug, disconnects
13. Pushes fix to GitHub
14. Reconnects to test fix

### 10.3 Error Recovery Flow

1. User connected to MCP, chatting
2. MCP server crashes unexpectedly
3. Backend detects process exit
4. Status updates: ❌ Error "MCP server stopped unexpectedly"
5. Chat input disables
6. "Reconnect" button appears
7. User clicks "Reconnect"
8. System reinstalls and reconnects
9. Chat history preserved in current session
10. User continues conversation

---

## 11. API Specifications

### 11.1 REST Endpoints

#### POST /api/mcp/connect

**Purpose**: Install and connect to GitHub MCP package

**Request Body**:
```json
{
  "owner": "scorzo",
  "repo": "cloud-cost-calculator-mcp",
  "branch": "main",
  "subdirectory": ""
}
```

**Response (Success)**:
```json
{
  "status": "connected",
  "message": "Connected to cloud-cost-calculator-mcp",
  "tools": [
    {
      "name": "calculate_instance_savings",
      "description": "Calculate cost comparison...",
      "input_schema": { ... }
    }
  ]
}
```

**Response (Error)**:
```json
{
  "status": "error",
  "message": "Package not found: github:scorzo/cloud-cost-calculator-mcp#main"
}
```

**Status Codes**:
- 200: Success
- 400: Invalid request body
- 500: Installation or connection failed

---

#### POST /api/mcp/disconnect

**Purpose**: Disconnect and cleanup MCP server

**Response**:
```json
{
  "status": "disconnected",
  "message": "MCP server stopped successfully"
}
```

**Status Codes**:
- 200: Success
- 500: Cleanup failed

---

#### GET /api/mcp/status

**Purpose**: Get current connection status

**Response**:
```json
{
  "connected": true,
  "status": "connected",
  "tools": [ ... ],
  "config": {
    "owner": "scorzo",
    "repo": "cloud-cost-calculator-mcp",
    "branch": "main"
  }
}
```

**Status Codes**:
- 200: Success

---

#### GET /api/mcp/tools

**Purpose**: Get list of available tools from connected MCP

**Response**:
```json
{
  "tools": [
    {
      "name": "calculate_instance_savings",
      "description": "...",
      "input_schema": { ... }
    }
  ]
}
```

**Status Codes**:
- 200: Success
- 503: MCP not connected

---

### 11.2 WebSocket Protocol

**Connection**: `ws://localhost:3001/ws/chat`

**Client → Server Messages**:

```json
{
  "type": "message",
  "content": "Compare 3 t3.micro instances in us-east-1"
}
```

**Server → Client Messages**:

User message echo:
```json
{
  "type": "message",
  "role": "user",
  "content": "Compare 3 t3.micro instances in us-east-1",
  "timestamp": "2025-11-22T10:30:00Z"
}
```

Tool call notification:
```json
{
  "type": "tool_call",
  "tool_name": "calculate_instance_savings"
}
```

Assistant response:
```json
{
  "type": "message",
  "role": "assistant",
  "content": "Based on your configuration...",
  "timestamp": "2025-11-22T10:30:05Z"
}
```

Error:
```json
{
  "type": "error",
  "message": "Failed to call MCP tool: server disconnected"
}
```

Status update:
```json
{
  "type": "status",
  "status": "disconnected",
  "message": "MCP server stopped"
}
```

---

## 12. File Structure

```
web-client/
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConfigPanel.tsx
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ToolsPanel.tsx
│   │   │   ├── ToolCard.tsx
│   │   │   ├── StatusIndicator.tsx
│   │   │   └── Header.tsx
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts
│   │   │   ├── useMCPConnection.ts
│   │   │   └── useChat.ts
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   └── mcp.ts
│   │   ├── services/
│   │   │   ├── github-installer.ts
│   │   │   ├── mcp-manager.ts
│   │   │   └── claude-client.ts
│   │   ├── websocket/
│   │   │   └── chat-handler.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   └── logger.ts
│   │   └── server.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 13. Technical Implementation Notes

### 13.1 Reusing CLI Client Code

**Directly Reusable**:
- `types.ts`: All type definitions
- `mcp-lifecycle.ts`: 90% reusable, minor adaptations for server context
- `claude-client.ts`: Core logic reusable, adapt for WebSocket streaming

**New Code Required**:
- `github-installer.ts`: GitHub package installation logic
- WebSocket server and message handling
- React UI components
- Express API routes

### 13.2 GitHub Installation Strategy

```typescript
// Example implementation sketch
async function installMCPFromGitHub(config: MCPConfig): Promise<string> {
  const { owner, repo, branch, subdirectory } = config;
  
  // Construct GitHub URL
  const githubUrl = `github:${owner}/${repo}#${branch}`;
  
  // Create temp directory
  const tempDir = path.join('/tmp/mcp-installs', `${owner}-${repo}-${branch}`);
  fs.mkdirSync(tempDir, { recursive: true });
  
  // Create package.json
  fs.writeFileSync(
    path.join(tempDir, 'package.json'),
    JSON.stringify({ name: 'temp-mcp', private: true }, null, 2)
  );
  
  // Install package
  execSync(`npm install ${githubUrl}`, { cwd: tempDir });
  
  // Locate executable
  const serverPath = findMCPExecutable(tempDir, repo, subdirectory);
  
  return serverPath;
}
```

### 13.3 WebSocket Communication Pattern

```typescript
// Backend: Handle incoming chat message
ws.on('message', async (data) => {
  const message = JSON.parse(data);
  
  if (message.type === 'message') {
    // Echo user message
    ws.send(JSON.stringify({
      type: 'message',
      role: 'user',
      content: message.content
    }));
    
    // Send to Claude
    const response = await claudeClient.sendMessage(message.content);
    
    // Tool calls are sent separately (via event emitter)
    // Final response sent back
    ws.send(JSON.stringify({
      type: 'message',
      role: 'assistant',
      content: response
    }));
  }
});
```

### 13.4 Docker Networking

- Frontend runs on port 3000
- Backend runs on port 3001
- Frontend configured with `VITE_API_URL=http://localhost:3001`
- Docker Compose creates network for inter-service communication
- Host can access both services via localhost

---

## 14. Testing Strategy

### 14.1 Manual Testing Scenarios

**Scenario 1: Default Connection**
- Load page → verify defaults → click Connect → verify success → test chat

**Scenario 2: Custom GitHub MCP**
- Change config to different MCP → connect → verify tools change

**Scenario 3: Invalid GitHub Package**
- Enter fake repo → connect → verify error message → verify can retry

**Scenario 4: MCP Server Crash**
- Connect → start chat → manually kill MCP process → verify error handling

**Scenario 5: Network Interruption**
- Connect → disconnect network → send message → verify error → reconnect network → verify recovery

### 14.2 Component Testing (Frontend)

- ConfigPanel: Form validation, default values, disabled states
- ChatInterface: Message rendering, auto-scroll, input handling
- ToolsPanel: Tool list rendering, expand/collapse, empty state
- StatusIndicator: All status states, color coding, messages

### 14.3 API Testing (Backend)

- POST /api/mcp/connect: Valid configs, invalid repos, error handling
- POST /api/mcp/disconnect: Cleanup verification
- GET /api/mcp/status: Accurate status reporting
- WebSocket: Message delivery, error propagation, connection stability

---

## 15. Deployment & Operations

### 15.1 Local Development

```bash
# From web-client directory
docker-compose up --build

# Access:
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# WebSocket: ws://localhost:3001/ws/chat
```

### 15.2 Environment Variables

```env
# .env file
ANTHROPIC_API_KEY=sk-ant-xxxxx
NODE_ENV=development
FRONTEND_PORT=3000
BACKEND_PORT=3001
```

### 15.3 Cleanup

- Temporary MCP installations in `/tmp/mcp-installs`
- Should be cleaned up on disconnect
- Periodic cleanup recommended (e.g., on container restart)

---

## 16. Success Metrics

### 16.1 Functional Success

- ✅ Can connect to our default MCP (cloud-cost-calculator)
- ✅ Can connect to any valid GitHub-hosted MCP
- ✅ Tools are discovered and displayed correctly
- ✅ Chat successfully calls MCP tools
- ✅ Error handling works for common failure cases

### 16.2 User Experience

- ✅ User can connect without reading documentation
- ✅ Tool discovery is intuitive and informative
- ✅ Chat feels responsive (< 5 second total latency)
- ✅ Error messages are clear and actionable

### 16.3 Technical

- ✅ Runs in Docker without issues
- ✅ No zombie processes after disconnection
- ✅ WebSocket connections are stable
- ✅ Multiple connect/disconnect cycles work reliably

---

## 17. Future Enhancements (Out of Scope for v1)

### Phase 2 Potential Features

- **Authentication**: User accounts, saved configurations
- **Conversation Persistence**: Save and reload chat history
- **Multi-MCP**: Connect to multiple MCPs simultaneously
- **MCP Marketplace**: Browse and discover public MCPs
- **Tool Testing UI**: Call tools directly without chat
- **Export**: Download conversation transcripts
- **Streaming**: Real-time Claude response streaming
- **Themes**: Dark mode, customizable colors
- **Mobile App**: React Native version

### Advanced Features

- **MCP Analytics**: Track tool usage, performance metrics
- **Version Comparison**: Test multiple MCP versions side-by-side
- **Automated Testing**: Record and replay conversations
- **Collaborative**: Multiple users test same MCP
- **Documentation Generation**: Auto-generate docs from MCP tools

---

## 18. Dependencies

### 18.1 Frontend Dependencies

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "axios": "^1.6.0",
  "tailwindcss": "^3.4.0",
  "vite": "^5.0.0",
  "typescript": "^5.3.0"
}
```

### 18.2 Backend Dependencies

```json
{
  "@anthropic-ai/sdk": "^0.30.0",
  "@modelcontextprotocol/sdk": "^0.5.0",
  "express": "^4.18.0",
  "ws": "^8.16.0",
  "cors": "^2.8.5",
  "dotenv": "^16.4.0",
  "typescript": "^5.3.0"
}
```

---

## 19. Risks & Mitigations

### Risk 1: GitHub Package Installation Failures
**Impact**: Medium  
**Probability**: Medium  
**Mitigation**: 
- Clear error messages with GitHub URL that was attempted
- Validation before installation
- Fallback to cached installation if available

### Risk 2: MCP Server Incompatibility
**Impact**: Medium  
**Probability**: Low  
**Mitigation**:
- Test with multiple MCP implementations
- Graceful error handling for malformed tool schemas
- Document expected MCP structure

### Risk 3: WebSocket Connection Instability
**Impact**: High  
**Probability**: Low  
**Mitigation**:
- Auto-reconnect logic with exponential backoff
- Preserve chat history during reconnection
- Clear UI indication of connection status

### Risk 4: Resource Leaks (Zombie Processes)
**Impact**: Medium  
**Probability**: Medium  
**Mitigation**:
- Robust cleanup on all exit paths
- Process monitoring and timeout
- Container restart clears all state

---

## 20. Open Questions

1. **Should we support private GitHub repositories?**
   - Would require GitHub authentication
   - Adds complexity to v1
   - Recommendation: Public only for v1

2. **Should conversation history persist across page reloads?**
   - Requires backend storage
   - Adds complexity
   - Recommendation: Session-only for v1

3. **Should we rate-limit Claude API calls?**
   - Prevents accidental high costs
   - Adds complexity
   - Recommendation: Basic rate limiting (1 request/sec)

4. **Should we support MCP servers published to npm registry?**
   - Alternative to GitHub installation
   - Simpler installation
   - Recommendation: Add in v1.1 if time permits

5. **How to handle very long conversations?**
   - Claude context limits
   - Performance considerations
   - Recommendation: Warn at 20 messages, offer to reset

---

## 21. Acceptance Criteria

Before considering this feature complete, the following must be verified:

### Must Have
- [ ] User can connect to cloud-cost-calculator MCP with default config
- [ ] User can modify config and connect to different GitHub MCP
- [ ] Available tools are displayed correctly in Tools Panel
- [ ] Chat interface sends messages and receives responses
- [ ] Tool calls are visible in chat flow
- [ ] Connection status is always clear and accurate
- [ ] Error messages are user-friendly and actionable
- [ ] Disconnect cleans up all resources
- [ ] Runs in Docker with single `docker-compose up` command
- [ ] README documents how to use the web client

### Should Have
- [ ] Tool schemas are viewable/expandable
- [ ] WebSocket reconnects automatically on disconnect
- [ ] Multiple connect/disconnect cycles work reliably
- [ ] Chat auto-scrolls to newest messages
- [ ] Form validation prevents invalid GitHub configs
- [ ] Loading states during installation/connection

### Nice to Have
- [ ] Responsive design works on tablet/mobile
- [ ] Keyboard shortcuts (Enter to send, Escape to clear)
- [ ] Tool search/filter in Tools Panel
- [ ] Export chat history button
- [ ] Dark mode toggle

---

## Appendix A: Example MCP Configurations

### Our Cloud Cost Calculator
```
Owner: scorzo
Repo: cloud-cost-calculator-mcp
Branch: main
Subdirectory: (empty)
```

### Hypothetical Other MCPs
```
# File operations MCP
Owner: mcphub
Repo: file-operations-mcp
Branch: main

# Weather data MCP
Owner: weathertech
Repo: weather-mcp
Branch: v2.0.0

# Monorepo example
Owner: bigcorp
Repo: mcp-suite
Branch: main
Subdirectory: packages/database-mcp
```

---

## Appendix B: Wireframe Details

### Connection Flow Wireframe

```
[Initial State]
┌─────────────────────────┐
│ ● Disconnected          │
│                         │
│ GitHub Config:          │
│ [scorzo           ]     │
│ [cloud-cost...    ]     │
│ [main             ]     │
│                         │
│      [Connect]          │
└─────────────────────────┘

[Installing]
┌─────────────────────────┐
│ ◐ Installing...         │
│                         │
│ Installing package from │
│ GitHub...               │
│                         │
│  [████████░░░░] 60%     │
└─────────────────────────┘

[Connected]
┌─────────────────────────┐
│ ● Connected ✓           │
│                         │
│ scorzo/cloud-cost...    │
│                         │
│     [Disconnect]        │
└─────────────────────────┘
```

---

**End of PRD**

---

**Document Control:**
- Version: 1.0
- Last Updated: November 22, 2025
- Author: AI Assistant
- Reviewers: [To be assigned]
- Status: Draft - Pending Review
- Next Review: Before implementation begins


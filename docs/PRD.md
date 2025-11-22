# Product Requirements Document (PRD)
## Cloud Cost Comparison MCP Proof of Concept

**Version:** 1.0  
**Date:** November 21, 2025  
**Status:** Draft

---

## 1. Executive Summary

This document outlines the requirements for a proof-of-concept application demonstrating Model Context Protocol (MCP) functionality through a cloud cost comparison tool. The system consists of two components:

1. **MCP Server**: A Python-based calculator that compares AWS instance pricing against alternative cloud products
2. **CLI Client**: A TypeScript/Node.js conversational interface powered by Claude that collects user input and presents pricing comparisons

The POC demonstrates proper MCP lifecycle management, tool calling patterns, and seamless integration between AI assistants and specialized computational services.

---

## 2. Goals & Objectives

### Primary Goals
- Demonstrate functional MCP server implementation with proper lifecycle management
- Showcase Claude's tool calling capabilities integrated with MCP
- Provide a clear, working example of MCP architecture for future development

### Success Criteria
- User can input AWS instance configurations via natural conversation
- MCP server successfully calculates cost comparisons
- CLI presents findings in clear, natural language
- Server starts automatically, maintains persistent connection, and stops gracefully
- Clean error handling if MCP server fails mid-conversation

### Non-Goals (Out of Scope)
- Production-ready pricing accuracy
- Complex AWS service coverage beyond EC2 instances
- Real-time pricing API integration
- User authentication or data persistence
- Remote/distributed deployment

---

## 3. User Stories

### User Story 1: Initial Cost Comparison
**As a** potential cloud customer  
**I want to** describe my current AWS instance usage  
**So that** I can see how much I might save by switching providers

**Acceptance Criteria:**
- User launches CLI application
- Application guides user through structured questions about AWS instances
- User provides instance types, quantities, regions, usage patterns
- System returns clear comparison showing costs and potential savings

### User Story 2: Conversational Input
**As a** user  
**I want to** provide information through natural conversation  
**So that** I don't need to learn specific command syntax or JSON formats

**Acceptance Criteria:**
- User can describe infrastructure in plain English
- Claude extracts relevant data points from conversation
- System asks clarifying questions when information is missing
- User can revise or add details naturally

### User Story 3: Graceful Error Handling
**As a** user  
**I want to** receive clear error messages if something fails  
**So that** I understand what went wrong and what to do next

**Acceptance Criteria:**
- If MCP server fails, application exits gracefully
- User receives a clear, non-technical error message
- No hanging processes or unclear error states

---

## 4. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────┐
│           CLI Client (TypeScript)           │
│                                             │
│  ┌─────────────┐      ┌─────────────────┐  │
│  │   Claude    │◄────►│  MCP Client     │  │
│  │ Integration │      │  (Lifecycle     │  │
│  │             │      │   Management)   │  │
│  └─────────────┘      └─────────────────┘  │
│                              │              │
└──────────────────────────────┼──────────────┘
                               │
                          MCP Protocol
                          (stdio/JSON-RPC)
                               │
┌──────────────────────────────┼──────────────┐
│                              ▼              │
│  ┌─────────────────────────────────────┐   │
│  │     MCP Server Interface            │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │   Pricing Calculator Engine         │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │   Static Pricing Data Store         │   │
│  │   (JSON/YAML files)                 │   │
│  └─────────────────────────────────────┘   │
│                                             │
│        MCP Server (Python)                  │
└─────────────────────────────────────────────┘
```

### Component Breakdown

#### 4.1 MCP Server (Python)

**Purpose**: Provides pricing calculation as an MCP tool

**Responsibilities:**
- Expose pricing comparison tools via MCP protocol
- Load static pricing data from local files
- Calculate cost comparisons between AWS and alternative cloud
- Return structured comparison reports

**Technology Stack:**
- Python 3.10+
- Official MCP Python SDK
- JSON/YAML for pricing data storage

**MCP Tools to Expose:**
- `calculate_instance_savings`: Compare AWS instance costs to alternative
- `list_supported_instances`: Return available instance types for comparison

**Data Model - Pricing Data:**
```json
{
  "aws_instances": {
    "t3.micro": {
      "hourly_rate": 0.0104,
      "regions": {
        "us-east-1": 0.0104,
        "us-west-2": 0.0104,
        "eu-west-1": 0.0114
      }
    },
    "t3.small": { ... },
    "m5.large": { ... }
  },
  "alternative_cloud_instances": {
    "micro": {
      "hourly_rate": 0.0080,
      "comparable_to": "t3.micro"
    },
    "small": { ... }
  }
}
```

**Output Format:**
```json
{
  "comparison": {
    "aws_monthly_cost": 150.00,
    "alternative_monthly_cost": 115.00,
    "savings_amount": 35.00,
    "savings_percentage": 23.33,
    "breakdown": [
      {
        "instance_type": "t3.micro",
        "quantity": 2,
        "aws_cost": 30.00,
        "alternative_cost": 23.20,
        "savings": 6.80
      }
    ]
  },
  "recommendations": [
    "Consider alternative cloud for dev/staging environments",
    "Potential annual savings: $420"
  ]
}
```

#### 4.2 CLI Client (TypeScript/Node.js)

**Purpose**: User-facing conversational interface with Claude integration

**Responsibilities:**
- Manage MCP server lifecycle (start, maintain connection, stop)
- Integrate with Claude API for conversational interface
- Collect user input through guided prompts
- Make MCP tool calls when pricing comparison is needed
- Present results in natural language

**Technology Stack:**
- TypeScript/Node.js
- Anthropic Claude SDK
- MCP Client SDK (TypeScript)
- CLI framework (Commander.js or similar)

**Key Features:**
- Structured system prompt to guide conversation
- Automatic MCP server spawning on first use
- Persistent connection management
- Graceful shutdown handling (SIGINT, SIGTERM)
- Error handling with user-friendly messages

**Conversation Flow:**
```
1. Welcome message
2. Ask about current AWS setup (guided by system prompt)
   - Instance types (e.g., "t3.micro", "m5.large")
   - Quantities
   - Region
   - Usage hours per month (or 24/7 assumption)
3. Claude recognizes complete information → tool call
4. Make MCP call to calculate_instance_savings
5. Claude presents results conversationally
6. Ask if user wants another comparison
7. Exit gracefully
```

**System Prompt Structure:**
```
You are a cloud cost comparison assistant. Your goal is to:
1. Collect AWS instance configuration details from the user
2. Required information:
   - Instance type(s) (e.g., t3.micro, m5.large)
   - Number of instances
   - AWS region
   - Monthly usage hours (or assume 24/7 if not specified)
3. Once you have complete information, use the calculate_instance_savings tool
4. Present findings clearly with:
   - Current AWS costs
   - Alternative cloud costs
   - Savings amount and percentage
   - Recommendations
5. Ask if they want to compare other configurations
```

---

## 5. Functional Requirements

### FR-1: MCP Server Lifecycle Management
**Priority:** High

- Server MUST start automatically when CLI client launches or first tool call is needed
- Server MUST maintain persistent connection via stdio transport
- Server MUST stop gracefully when CLI client exits
- Connection MUST be validated before tool calls

### FR-2: Pricing Data Storage
**Priority:** High

- Pricing data MUST be stored in local JSON or YAML files
- Data structure MUST include:
  - AWS instance types with hourly rates by region
  - Alternative cloud instance types with hourly rates
  - Mapping between AWS and alternative instance types
- Data MUST be easily editable for testing

### FR-3: User Input Collection
**Priority:** High

- CLI MUST guide user through structured questions
- System prompt MUST direct Claude to collect:
  - Instance type(s)
  - Quantity per instance type
  - AWS region
  - Usage hours (with 730/month default for 24/7)
- User MUST be able to provide information conversationally
- Claude MUST ask clarifying questions for missing information

### FR-4: Cost Calculation
**Priority:** High

- Calculator MUST compute:
  - Total monthly AWS cost
  - Total monthly alternative cloud cost
  - Absolute savings amount
  - Percentage savings
  - Per-instance-type breakdown
- Calculator MUST handle multiple instance types in single comparison
- Calculator MUST apply regional pricing correctly

### FR-5: Result Presentation
**Priority:** High

- Claude MUST present results in natural language
- Output MUST include:
  - Clear cost comparison summary
  - Savings (or additional cost if negative)
  - Breakdown by instance type
  - Recommendations or insights
- Results MUST be easy to understand for non-technical users

### FR-6: Error Handling
**Priority:** High

- IF MCP server fails to start, CLI MUST exit with clear message
- IF MCP server crashes mid-conversation, CLI MUST exit gracefully
- Error messages MUST be user-friendly (avoid stack traces)
- Application MUST clean up server processes on any exit path

### FR-7: Conversation Management
**Priority:** Medium

- User SHOULD be able to perform multiple comparisons in one session
- User SHOULD be able to revise input naturally
- CLI SHOULD provide exit command (e.g., "quit", "exit")

---

## 6. Non-Functional Requirements

### NFR-1: Performance
- MCP server startup time: < 3 seconds
- Tool call response time: < 500ms
- Total conversation latency: < 3 seconds (including Claude API)

### NFR-2: Reliability
- MCP connection must be stable for session duration
- Server crashes must not leave zombie processes
- All resources must be cleaned up on exit

### NFR-3: Usability
- User should understand how to interact within first 30 seconds
- Error messages must be actionable
- No technical jargon in user-facing messages

### NFR-4: Maintainability
- Code must be well-documented
- Pricing data must be easily updatable
- Clear separation between MCP server and CLI client

### NFR-5: Future Extensibility
- Architecture should support publishing MCP server to GitHub
- Code should be structured for adding more AWS services later
- MCP tools should be easily extendable

---

## 7. Technical Specifications

### 7.1 MCP Protocol Details

**Transport:** stdio (standard input/output)  
**Message Format:** JSON-RPC 2.0  
**Tool Registration:** MCP tools list endpoint

### 7.2 File Structure

```
mcp-demo/
├── docs/
│   └── PRD.md
├── mcp-server/           # Python MCP server
│   ├── src/
│   │   ├── __init__.py
│   │   ├── server.py     # MCP server implementation
│   │   ├── calculator.py # Pricing calculation logic
│   │   └── data/
│   │       └── pricing.json  # Static pricing data
│   ├── requirements.txt
│   └── README.md
├── cli-client/           # TypeScript CLI client
│   ├── src/
│   │   ├── index.ts      # Entry point
│   │   ├── mcp-lifecycle.ts  # Server lifecycle management
│   │   ├── claude-client.ts  # Claude API integration
│   │   └── types.ts      # TypeScript types
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
└── README.md             # Project overview
```

### 7.3 Environment Variables

**CLI Client:**
- `ANTHROPIC_API_KEY`: Claude API key (required)
- `MCP_SERVER_PATH`: Path to Python MCP server script (optional, defaults to ../mcp-server)

**MCP Server:**
- No environment variables required (uses local data files)

### 7.4 Dependencies

**Python (MCP Server):**
- `mcp` (official SDK)
- Python 3.10+ standard library

**TypeScript (CLI Client):**
- `@anthropic-ai/sdk`
- `@modelcontextprotocol/sdk`
- `commander` (CLI framework)
- `typescript`
- `tsx` (TypeScript execution)

---

## 8. User Interface Specifications

### 8.1 CLI Interaction Example

```
$ npm run start

🌥️  Cloud Cost Comparison Assistant

I'll help you compare your AWS instance costs with our alternative cloud platform.

To get started, tell me about your current AWS setup. I need to know:
- What instance types you're using (e.g., t3.micro, m5.large)
- How many of each
- Which AWS region
- Usage hours per month (I'll assume 24/7 if you don't specify)

You: I'm running 3 t3.micro instances in us-east-1, all 24/7
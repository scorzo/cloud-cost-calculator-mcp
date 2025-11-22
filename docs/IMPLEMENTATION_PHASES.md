# Implementation Phases
## Cloud Cost Comparison MCP Proof of Concept

**Version:** 1.0  
**Date:** November 21, 2025  
**Estimated Total Duration:** 3-5 days

---

## Overview

This document outlines the implementation phases for building the MCP-based cloud cost comparison proof of concept. Each phase builds upon the previous one, with clear deliverables and success criteria.

---

## Phase 1: Project Foundation & Setup
**Duration:** 0.5 days  
**Priority:** Critical

### Objectives
- Set up project structure
- Initialize both Python and TypeScript projects
- Configure development environment
- Install core dependencies

### Tasks

#### 1.1 Project Structure
- Create root project directory structure
- Set up `mcp-server/` directory for Python component
- Set up `cli-client/` directory for TypeScript component
- Create `.gitignore` for both Python and Node.js
- Create root `README.md` with project overview

#### 1.2 Python MCP Server Setup
- Initialize Python project structure
- Create `requirements.txt` with dependencies:
  - `mcp` (official MCP SDK)
  - Development tools (pytest, black, mypy)
- Set up virtual environment
- Create basic project structure:
  ```
  mcp-server/
  ├── src/
  │   ├── __init__.py
  │   ├── server.py
  │   ├── calculator.py
  │   └── data/
  │       └── pricing.json
  ├── requirements.txt
  └── README.md
  ```

#### 1.3 TypeScript CLI Client Setup
- Initialize Node.js/TypeScript project
- Create `package.json` with dependencies:
  - `@anthropic-ai/sdk`
  - `@modelcontextprotocol/sdk`
  - `commander`
  - `typescript`, `tsx`, `@types/node`
- Configure `tsconfig.json` with appropriate settings
- Create basic project structure:
  ```
  cli-client/
  ├── src/
  │   ├── index.ts
  │   ├── mcp-lifecycle.ts
  │   ├── claude-client.ts
  │   └── types.ts
  ├── package.json
  ├── tsconfig.json
  └── README.md
  ```

#### 1.4 Environment Configuration
- Create `.env.example` file for CLI client
- Document required environment variables:
  - `ANTHROPIC_API_KEY`
  - `MCP_SERVER_PATH` (optional)

### Deliverables
- [ ] Complete project structure
- [ ] All dependencies installed
- [ ] Development environment configured
- [ ] Basic README files in place

### Success Criteria
- `npm install` runs successfully in cli-client
- `pip install -r requirements.txt` runs successfully in mcp-server
- Project structure matches PRD specifications

---

## Phase 2: Static Pricing Data Model
**Duration:** 0.5 days  
**Priority:** High

### Objectives
- Design pricing data schema
- Create sample pricing data for AWS and alternative cloud
- Implement data loading utilities

### Tasks

#### 2.1 Pricing Data Schema Design
- Define JSON structure for pricing data
- Include AWS instance types with regional pricing
- Include alternative cloud instance types with mappings
- Add metadata (last updated, currency, etc.)

#### 2.2 Sample Pricing Data Creation
- Populate `pricing.json` with realistic test data:
  - AWS instances: `t3.micro`, `t3.small`, `t3.medium`, `m5.large`, `m5.xlarge`
  - Regions: `us-east-1`, `us-west-2`, `eu-west-1`
  - Alternative cloud: comparable instance types with 15-30% savings
- Add instance specifications (vCPU, memory) for reference

#### 2.3 Data Loading Module
- Create Python module to load pricing data
- Implement validation for data structure
- Add error handling for missing or malformed data
- Create helper functions to query pricing by instance type and region

### Deliverables
- [ ] Complete pricing data JSON file
- [ ] Data loading utilities
- [ ] Data validation logic

### Success Criteria
- Pricing data covers minimum 5 AWS instance types
- Data includes at least 3 AWS regions
- Loading utilities successfully parse and validate data
- Sample queries return expected pricing values

### Sample Data Structure
```json
{
  "metadata": {
    "version": "1.0",
    "last_updated": "2025-11-21",
    "currency": "USD",
    "unit": "hourly"
  },
  "aws_instances": {
    "t3.micro": {
      "specs": {
        "vcpu": 2,
        "memory_gb": 1
      },
      "pricing": {
        "us-east-1": 0.0104,
        "us-west-2": 0.0104,
        "eu-west-1": 0.0114
      }
    }
  },
  "alternative_cloud": {
    "micro": {
      "comparable_to": ["t3.micro"],
      "specs": {
        "vcpu": 2,
        "memory_gb": 1
      },
      "hourly_rate": 0.0080
    }
  }
}
```

---

## Phase 3: MCP Server Core Implementation
**Duration:** 1 day  
**Priority:** Critical

### Objectives
- Implement MCP server using Python SDK
- Create pricing calculator logic
- Expose MCP tools for cost comparison
- Test server independently

### Tasks

#### 3.1 MCP Server Bootstrap
- Implement basic MCP server using official SDK
- Set up stdio transport
- Implement server initialization and shutdown
- Add logging for debugging

#### 3.2 Calculator Engine
- Create `calculator.py` module
- Implement cost calculation logic:
  - Calculate AWS monthly costs based on instance type, quantity, region, hours
  - Calculate alternative cloud monthly costs
  - Compute savings (absolute and percentage)
  - Generate per-instance breakdown
- Add input validation and error handling

#### 3.3 MCP Tool Definitions
- Define `calculate_instance_savings` tool:
  - Input schema: instance_type, quantity, region, hours_per_month
  - Output: comparison report with costs and savings
- Define `list_supported_instances` tool:
  - Returns available AWS instance types and regions
- Register tools with MCP server

#### 3.4 Testing & Validation
- Create test scripts to invoke tools directly
- Test with various input combinations
- Verify calculation accuracy
- Test error cases (invalid instance type, missing region, etc.)

### Deliverables
- [ ] Functional MCP server
- [ ] Calculator engine with cost comparison logic
- [ ] Two MCP tools registered and working
- [ ] Test scripts demonstrating tool functionality

### Success Criteria
- MCP server starts and accepts stdio connections
- `calculate_instance_savings` returns accurate cost comparisons
- `list_supported_instances` returns complete data
- Server handles invalid inputs gracefully
- All test cases pass

### Tool Call Example
```json
{
  "name": "calculate_instance_savings",
  "arguments": {
    "instances": [
      {
        "type": "t3.micro",
        "quantity": 3,
        "region": "us-east-1",
        "hours_per_month": 730
      }
    ]
  }
}
```

---

## Phase 4: MCP Lifecycle Management
**Duration:** 1 day  
**Priority:** Critical

### Objectives
- Implement MCP server lifecycle management in CLI client
- Handle server startup, connection, and shutdown
- Implement connection persistence
- Add error handling and recovery

### Tasks

#### 4.1 Process Management Module
- Create `mcp-lifecycle.ts` module
- Implement server spawning using Node.js child_process
- Configure stdio transport for MCP communication
- Add server readiness detection

#### 4.2 Connection Management
- Implement MCP client connection
- Add connection validation and health checks
- Handle connection errors gracefully
- Implement reconnection logic (optional for POC)

#### 4.3 Lifecycle Events
- Start server on CLI launch or first tool call
- Maintain persistent connection during session
- Handle graceful shutdown on exit
- Implement signal handlers (SIGINT, SIGTERM)
- Clean up server process on all exit paths

#### 4.4 Error Handling
- Detect server startup failures
- Handle server crashes mid-conversation
- Display user-friendly error messages
- Ensure no zombie processes remain

### Deliverables
- [ ] MCP lifecycle management module
- [ ] Server spawn and shutdown logic
- [ ] Connection validation
- [ ] Comprehensive error handling

### Success Criteria
- Server starts automatically on first use
- Connection persists throughout CLI session
- Server stops cleanly on exit
- No zombie processes after abnormal termination
- User receives clear error messages if server fails

### Lifecycle Flow
```
CLI Start
    ↓
Spawn MCP Server (child process)
    ↓
Wait for Server Ready
    ↓
Establish MCP Connection
    ↓
Validate Tools Available
    ↓
[Session Active]
    ↓
CLI Exit / SIGINT
    ↓
Send Shutdown Signal to Server
    ↓
Wait for Server Termination
    ↓
Clean up Resources
    ↓
Exit
```

---

## Phase 5: Claude Integration
**Duration:** 1 day  
**Priority:** Critical

### Objectives
- Integrate Claude API into CLI client
- Implement tool calling for MCP tools
- Create structured system prompt
- Handle conversation flow

### Tasks

#### 5.1 Claude Client Setup
- Create `claude-client.ts` module
- Initialize Anthropic SDK with API key
- Configure Claude model (claude-3-5-sonnet recommended)
- Set up message history management

#### 5.2 System Prompt Design
- Create comprehensive system prompt:
  - Define assistant role and goals
  - Specify information collection requirements
  - Define tool usage criteria
  - Set output formatting guidelines
- Make prompt configurable for easy iteration

#### 5.3 Tool Integration
- Register MCP tools with Claude
- Map MCP tool definitions to Claude tool format
- Implement tool call handler:
  - Detect tool_use blocks in Claude responses
  - Route tool calls to MCP server
  - Return tool results to Claude
  - Continue conversation with results

#### 5.4 Conversation Flow
- Implement conversation loop
- Handle user input collection
- Process Claude responses (text and tool calls)
- Display assistant messages to user
- Support multi-turn conversations

### Deliverables
- [ ] Claude API integration
- [ ] System prompt implementation
- [ ] Tool calling functionality
- [ ] Conversation loop

### Success Criteria
- Claude successfully connects and responds
- System prompt guides information collection effectively
- Claude recognizes when to call tools
- Tool calls execute via MCP and return results
- Conversation flows naturally

### System Prompt Template
```
You are a cloud cost comparison assistant helping users understand potential savings by migrating from AWS to an alternative cloud platform.

Your role:
1. Collect AWS infrastructure details from the user through natural conversation
2. Required information:
   - Instance type(s) (e.g., t3.micro, m5.large)
   - Number of instances for each type
   - AWS region
   - Monthly usage hours (default to 730 for 24/7 if not specified)
3. Once you have complete information, use the calculate_instance_savings tool
4. Present findings clearly:
   - Current AWS monthly costs
   - Alternative cloud monthly costs
   - Savings amount and percentage
   - Per-instance breakdown
   - Actionable recommendations
5. Ask if they want to compare other configurations

Guidelines:
- Be conversational and helpful
- Ask clarifying questions if information is incomplete
- Present numbers clearly with currency formatting
- Highlight savings percentage prominently
- Provide context for recommendations
```

---

## Phase 6: CLI Interface & User Experience
**Duration:** 0.5 days  
**Priority:** High

### Objectives
- Build polished command-line interface
- Implement welcome messages and guidance
- Add formatting for readability
- Create exit commands

### Tasks

#### 6.1 CLI Entry Point
- Create `index.ts` with main application logic
- Implement welcome message and instructions
- Set up command-line argument parsing (if needed)
- Add version and help commands

#### 6.2 Output Formatting
- Format Claude responses for better readability
- Add visual separators between messages
- Highlight key numbers (costs, savings)
- Use color/styling for emphasis (optional)

#### 6.3 Input Handling
- Implement input prompt
- Handle empty inputs gracefully
- Recognize exit commands ("quit", "exit", Ctrl+C)
- Support multi-line input if needed

#### 6.4 User Guidance
- Display clear instructions on launch
- Provide examples of what to say
- Show loading indicators during API calls
- Confirm actions (e.g., "Calculating costs...")

### Deliverables
- [ ] Complete CLI interface
- [ ] Welcome and help messages
- [ ] Formatted output
- [ ] Exit command handling

### Success Criteria
- User understands what to do within 30 seconds
- Output is easy to read and understand
- Exit commands work reliably
- Application feels polished and professional

---

## Phase 7: End-to-End Integration & Testing
**Duration:** 0.5 days  
**Priority:** Critical

### Objectives
- Test complete flow from user input to results
- Verify all components work together
- Test error scenarios
- Create test scenarios documentation

### Tasks

#### 7.1 Integration Testing
- Test happy path: simple single instance comparison
- Test complex scenarios: multiple instance types
- Test edge cases:
  - Invalid instance type
  - Unsupported region
  - Zero quantity
  - Negative hours
- Test conversation flows:
  - Single comparison and exit
  - Multiple comparisons in one session
  - Revising information mid-conversation

#### 7.2 Error Scenario Testing
- Simulate MCP server failure at startup
- Simulate server crash mid-conversation
- Test with missing API key
- Test with invalid pricing data
- Verify error messages are user-friendly

#### 7.3 Performance Verification
- Measure server startup time
- Measure tool call latency
- Measure end-to-end conversation latency
- Verify against NFR targets from PRD

#### 7.4 Documentation
- Create test scenarios document
- Document known issues or limitations
- Create troubleshooting guide
- Update README files with usage examples

### Deliverables
- [ ] Complete integration testing
- [ ] Error scenario test results
- [ ] Performance measurements
- [ ] Test scenarios documentation

### Success Criteria
- All happy path scenarios work end-to-end
- Error handling works as specified
- Performance meets NFR requirements
- No resource leaks or zombie processes

### Test Scenarios

#### Scenario 1: Simple Comparison
```
User: "I have 2 t3.micro instances in us-east-1 running 24/7"
Expected: Cost comparison with savings calculation
```

#### Scenario 2: Multiple Instance Types
```
User: "I'm running 3 t3.micro and 2 m5.large in us-west-2"
Expected: Combined comparison with per-instance breakdown
```

#### Scenario 3: Information Clarification
```
User: "I have some instances in AWS"
Expected: Claude asks for specific details
```

#### Scenario 4: Multiple Comparisons
```
User: Completes first comparison, then says "How about 5 t3.small in eu-west-1?"
Expected: Second comparison, conversation continues
```

---

## Phase 8: Documentation & Polish
**Duration:** 0.5 days  
**Priority:** Medium

### Objectives
- Complete all documentation
- Add usage examples
- Create demo scenarios
- Prepare for future GitHub publication

### Tasks

#### 8.1 Documentation Completion
- Complete root README with:
  - Project overview
  - Architecture diagram
  - Setup instructions
  - Usage examples
- Complete mcp-server README with:
  - Server details
  - Tool specifications
  - Pricing data format
- Complete cli-client README with:
  - Installation steps
  - Environment variables
  - Usage guide

#### 8.2 Code Documentation
- Add docstrings to Python functions
- Add JSDoc comments to TypeScript functions
- Document complex logic inline
- Add type annotations throughout

#### 8.3 Example Scenarios
- Create example conversation transcripts
- Document sample pricing comparisons
- Add screenshots or terminal recordings (optional)
- Create demo script for presentations

#### 8.4 Future-Proofing
- Structure for GitHub publication:
  - License file (MIT or Apache 2.0)
  - Contributing guidelines
  - Code of conduct
- Add extensibility notes for future enhancements
- Document how to add new instance types
- Document how to add new AWS services

### Deliverables
- [ ] Complete README files
- [ ] Code documentation
- [ ] Example scenarios
- [ ] GitHub-ready repository structure

### Success Criteria
- Anyone can set up and run the project following README
- Code is well-documented and maintainable
- Project is ready for GitHub publication
- Clear path for future extensions

---

## Phase 9: Optional Enhancements
**Duration:** Variable  
**Priority:** Low

These enhancements can be added after the core POC is complete:

### 9.1 Enhanced Pricing Data
- Add more instance types
- Include instance specifications in output
- Add pricing last-updated timestamps
- Support for reserved instance pricing

### 9.2 Additional MCP Tools
- `get_instance_details`: Return specs for instance type
- `list_regions`: Return all supported regions
- `estimate_annual_savings`: Project yearly costs

### 9.3 Output Formats
- Export comparison to JSON file
- Generate markdown report
- Create CSV for spreadsheet import

### 9.4 Conversation Enhancements
- Conversation history persistence
- Save/load comparison sessions
- Compare multiple scenarios side-by-side

### 9.5 Developer Experience
- Add debug mode with verbose logging
- Create development scripts (watch mode, hot reload)
- Add automated tests (unit, integration)
- Set up CI/CD pipeline

---

## Summary Timeline

| Phase | Duration | Blocking? | Key Deliverable |
|-------|----------|-----------|----------------|
| 1. Foundation & Setup | 0.5 days | Yes | Project structure, dependencies |
| 2. Pricing Data Model | 0.5 days | Yes | pricing.json with sample data |
| 3. MCP Server Core | 1 day | Yes | Working MCP server with tools |
| 4. MCP Lifecycle | 1 day | Yes | Server lifecycle management |
| 5. Claude Integration | 1 day | Yes | Tool calling with Claude |
| 6. CLI Interface | 0.5 days | No | Polished user experience |
| 7. Integration Testing | 0.5 days | Yes | End-to-end validation |
| 8. Documentation | 0.5 days | No | Complete docs |
| **Total Core POC** | **3-5 days** | | **Working demonstration** |
| 9. Optional Enhancements | Variable | No | Nice-to-have features |

---

## Risk Mitigation

### Risk 1: MCP SDK Compatibility Issues
**Mitigation:** Use official SDKs from Anthropic/MCP team, follow documentation closely, test early

### Risk 2: Claude Tool Calling Behavior
**Mitigation:** Iterate on system prompt design, test with various phrasings, add explicit tool usage instructions

### Risk 3: Process Management Complexity
**Mitigation:** Start with simple spawn/kill, add sophisticated handling incrementally, test thoroughly

### Risk 4: Pricing Data Accuracy
**Mitigation:** Use approximate values clearly marked as "sample data," focus on POC functionality over exact numbers

---

## Success Metrics

### Technical Success
- [ ] MCP server starts and stops reliably
- [ ] Zero zombie processes
- [ ] Tool calls complete in <500ms
- [ ] End-to-end latency <3 seconds
- [ ] No unhandled exceptions in normal operation

### User Experience Success
- [ ] User can complete comparison in <2 minutes
- [ ] Error messages are clear and actionable
- [ ] Output is easy to understand
- [ ] No confusion about what to input

### Code Quality Success
- [ ] All code documented
- [ ] No hardcoded paths or credentials
- [ ] Clean separation of concerns
- [ ] Ready for GitHub publication

---

## Next Steps After POC

1. **Gather Feedback**: Use POC with real users, collect feedback
2. **Extend Services**: Add RDS, S3, Lambda pricing comparisons
3. **Real API Integration**: Connect to live pricing APIs
4. **Web Interface**: Build web-based version alongside CLI
5. **MCP Registry**: Publish MCP server to official registry
6. **Production Hardening**: Add monitoring, error tracking, analytics

---

**Document Status:** Ready for Implementation  
**Last Updated:** November 21, 2025


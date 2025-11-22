# Cloud Cost Comparison MCP Demo

A proof-of-concept demonstrating Model Context Protocol (MCP) functionality through a cloud cost comparison tool.

## Overview

This project is a fully TypeScript/Node.js implementation consisting of two main components:

1. **MCP Server**: An npm-installable MCP server that compares AWS instance pricing with alternative cloud products
2. **CLI Client**: A conversational interface powered by Claude that collects configuration details and presents cost comparisons

## Architecture

```
┌─────────────────────────────────────────────┐
│           CLI Client (TypeScript)           │
│                                             │
│  ┌─────────────┐      ┌─────────────────┐  │
│  │   Claude    │◄────►│  MCP Client     │  │
│  │ Integration │      │  (Lifecycle     │  │
│  │             │      │   Management)   │  │
│  └─────────────┘      └─────────────────┘  │
└──────────────────────────────┬──────────────┘
                               │
                          MCP Protocol
                          (stdio/JSON-RPC)
                               │
┌──────────────────────────────┴──────────────┐
│         MCP Server (Python)                 │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │   Pricing Calculator Engine         │   │
│  │   Static Pricing Data (JSON)        │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## Features

- **Conversational Interface**: Natural language interaction powered by Claude
- **MCP Integration**: Demonstrates proper MCP server lifecycle management
- **Cost Comparison**: Compares AWS EC2 instance costs with alternative cloud pricing
- **Structured Prompts**: Guided information collection for accurate comparisons
- **Graceful Error Handling**: User-friendly error messages and clean shutdowns

## Project Structure

```
mcp-demo/
├── docs/                     # Documentation
│   ├── PRD.md               # Product Requirements Document
│   └── IMPLEMENTATION_PHASES.md  # Implementation guide
├── mcp-server/              # Python MCP server
│   ├── src/
│   │   ├── server.py        # MCP server implementation
│   │   ├── calculator.py    # Pricing calculation logic
│   │   ├── data_loader.py   # Pricing data loader
│   │   └── data/
│   │       └── pricing.json # Static pricing data
│   ├── requirements.txt
│   └── README.md
├── cli-client/              # TypeScript CLI client
│   ├── src/
│   │   ├── index.ts         # Entry point
│   │   ├── mcp-lifecycle.ts # Server lifecycle management
│   │   ├── claude-client.ts # Claude API integration
│   │   └── types.ts         # TypeScript types
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── test_system.sh           # System test script
├── LICENSE                  # MIT License
└── README.md                # This file
```

## Quick Start

### Prerequisites

- Node.js 18 or higher
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mcp-demo
   ```

2. **Set up MCP Server**
   ```bash
   cd mcp-server
   npm install
   npm run build
   cd ..
   ```

3. **Set up CLI Client**
   ```bash
   cd cli-client
   npm install
   npm run build
   cd ..
   ```

4. **Configure Environment**
   
   Create a `.env` file in the `cli-client` directory:
   ```bash
   cd cli-client
   echo "ANTHROPIC_API_KEY=your_api_key_here" > .env
   cd ..
   ```

5. **Run System Test** (Optional)
   ```bash
   ./test_system.sh
   ```

### Usage

```bash
cd cli-client
npm start
```

The CLI will guide you through providing your AWS instance details and present a cost comparison.

## Example Interaction

```
$ npm start

============================================================
🌥️  Cloud Cost Comparison Assistant
============================================================

I'll help you compare your AWS instance costs with our
alternative cloud platform.

To get started, tell me about your current AWS setup. I need:
  • Instance types (e.g., t3.micro, m5.large)
  • How many of each
  • Which AWS region
  • Usage hours per month (I'll assume 24/7 if not specified)

Type "quit" or "exit" to end the conversation.
Type "help" for more information.

============================================================

You: I'm running 3 t3.micro instances in us-east-1, all 24/7

[Thinking...]
[Calling tool: calculate_instance_savings]

Assistant: Great! Let me calculate the cost comparison for your 3 t3.micro instances.

Based on your AWS configuration:
- **Current AWS Cost**: $22.78/month
- **Alternative Cloud Cost**: $17.52/month
- **Your Savings**: $5.26/month (23.09%)

**Annual Savings**: $63.12

Breakdown:
- 3x t3.micro in us-east-1
  - AWS: $0.0104/hour × 730 hours × 3 = $22.78/month
  - Alternative: $0.0080/hour × 730 hours × 3 = $17.52/month

**Recommendations**:
- Significant savings - ideal for dev/staging environments
- Switching to alternative cloud could save $63.12 annually

Would you like to compare other configurations?

You: quit

Thank you for using Cloud Cost Comparison Assistant!

Shutting down MCP server...
✓ MCP server stopped
```

## Supported Instance Types

### AWS EC2 Instances
- **T3 Family**: t3.micro, t3.small, t3.medium
- **M5 Family**: m5.large, m5.xlarge, m5.2xlarge
- **C5 Family**: c5.large, c5.xlarge

### Regions
- **us-east-1**: US East (N. Virginia)
- **us-west-2**: US West (Oregon)
- **eu-west-1**: Europe (Ireland)

## MCP Server Tools

### calculate_instance_savings

Calculates cost comparison between AWS and alternative cloud instances.

**Input:**
```json
{
  "instances": [
    {
      "type": "t3.micro",
      "quantity": 3,
      "region": "us-east-1",
      "hours_per_month": 730
    }
  ]
}
```

**Output:**
```json
{
  "comparison": {
    "aws_monthly_cost": 22.78,
    "alternative_monthly_cost": 17.52,
    "savings_amount": 5.26,
    "savings_percentage": 23.09,
    "breakdown": [...]
  },
  "recommendations": [...]
}
```

### list_supported_instances

Returns available AWS instance types and regions.

**Output:**
```json
{
  "aws_instances": ["t3.micro", "t3.small", ...],
  "regions": ["us-east-1", "us-west-2", "eu-west-1"],
  "metadata": {...}
}
```

## Testing

Run the system test to verify all components:

```bash
./test_system.sh
```

This will check:
1. Pricing data file exists
2. Python modules load correctly
3. Calculator engine works
4. TypeScript builds successfully

## Troubleshooting

### Error: "MCP server script not found"

**Solution**: Ensure you're running from the `cli-client` directory and the MCP server is set up correctly.

### Error: "Failed to connect to MCP server"

**Possible causes:**
1. MCP server not built
2. Node.js version < 18
3. Dependencies not installed

**Solution:**
```bash
cd mcp-server
npm install
npm run build
```

### Error: "ANTHROPIC_API_KEY environment variable is not set"

**Solution**: Create a `.env` file in `cli-client` directory:
```bash
ANTHROPIC_API_KEY=your_actual_api_key
```

## Development

### Project Structure Philosophy

This project demonstrates clean separation between:
- **MCP Server**: Pure calculation logic, no AI dependencies
- **CLI Client**: Conversation management and user interaction
- **MCP Protocol**: Clean interface between the two

### Adding New Instance Types

Edit `mcp-server/src/data/pricing.json`:

```json
{
  "aws_instances": {
    "your.instance": {
      "specs": {...},
      "pricing": {...}
    }
  },
  "instance_mapping": {
    "your.instance": "alternative-instance"
  }
}
```

### Extending to Other AWS Services

The architecture supports adding other service types:
1. Add new pricing data in `pricing.json`
2. Create new calculator methods in `calculator.py`
3. Register new MCP tools in `server.py`
4. Update Claude system prompt in `claude-client.ts`

## Documentation

- **[PRD](docs/PRD.md)**: Complete product requirements
- **[Implementation Phases](docs/IMPLEMENTATION_PHASES.md)**: Development guide
- **[MCP Server README](mcp-server/README.md)**: Server documentation
- **[CLI Client README](cli-client/README.md)**: Client documentation

## Future Enhancements

- [ ] Add more AWS services (RDS, S3, Lambda)
- [ ] Real-time pricing API integration
- [ ] Web interface alongside CLI
- [ ] Comparison reports export (PDF, CSV)
- [ ] Multi-cloud comparisons (AWS, GCP, Azure)
- [ ] Reserved instance pricing
- [ ] Savings plan recommendations

## Contributing

This is a proof-of-concept project. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Anthropic Claude](https://www.anthropic.com/claude) for conversational AI
- Uses [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) for tool integration
- Inspired by real-world cloud migration scenarios

## Contact

For questions or feedback, please open an issue on GitHub.

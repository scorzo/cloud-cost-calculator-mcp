# MCP Server - Cloud Cost Calculator

TypeScript/Node.js-based MCP server that provides cloud cost comparison tools.

## Features

- **calculate_instance_savings**: Compare AWS instance costs with alternative cloud pricing
- **list_supported_instances**: Get available instance types and regions

## Tools

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
    "aws_monthly_cost": 150.00,
    "alternative_monthly_cost": 115.00,
    "savings_amount": 35.00,
    "savings_percentage": 23.33,
    "breakdown": [...]
  },
  "recommendations": [...]
}
```

### list_supported_instances

Returns available instance types and regions.

**Output:**
```json
{
  "aws_instances": ["t3.micro", "t3.small", ...],
  "regions": ["us-east-1", "us-west-2", ...]
}
```

## Installation

### From GitHub

```bash
npm install github:yourusername/mcp-demo#mcp-server
```

### For Development

```bash
npm install
npm run build
```

## Usage

### As a Standalone Server

```bash
npm start
# or
npx cloud-cost-calculator-mcp
```

### In MCP Clients (e.g., Claude Desktop)

Add to your MCP configuration:

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

### Programmatically

```typescript
import { spawn } from 'child_process';

const server = spawn('node', ['path/to/dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});
```

## Pricing Data

Pricing data is stored in `src/data/pricing.json` and includes:
- AWS instance types with regional pricing
- Alternative cloud instance types with comparable mappings
- Hourly rates in USD


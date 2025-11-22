#!/usr/bin/env node
/**
 * MCP Server for cloud cost comparison.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { PricingDataLoader } from './data-loader.js';
import { CostCalculator, InstanceConfig } from './calculator.js';

// Initialize data loader and calculator
const dataLoader = new PricingDataLoader();
const calculator = new CostCalculator(dataLoader);

// Create MCP server
const server = new Server(
  {
    name: 'cloud-cost-calculator',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
const tools: Tool[] = [
  {
    name: 'calculate_instance_savings',
    description:
      'Calculate cost comparison between AWS instances and alternative cloud instances. Provides detailed breakdown of costs, savings, and recommendations.',
    inputSchema: {
      type: 'object',
      properties: {
        instances: {
          type: 'array',
          description: 'List of AWS instance configurations to compare',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                description: "AWS instance type (e.g., 't3.micro', 'm5.large')",
              },
              quantity: {
                type: 'integer',
                description: 'Number of instances',
                minimum: 1,
              },
              region: {
                type: 'string',
                description:
                  "AWS region (e.g., 'us-east-1', 'us-west-2', 'eu-west-1')",
              },
              hours_per_month: {
                type: 'integer',
                description:
                  'Hours per month (default: 730 for 24/7 operation)',
                minimum: 1,
                maximum: 744,
                default: 730,
              },
            },
            required: ['type', 'quantity', 'region'],
          },
          minItems: 1,
        },
      },
      required: ['instances'],
    },
  },
  {
    name: 'list_supported_instances',
    description:
      'Get a list of supported AWS instance types and regions for cost comparison.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'calculate_instance_savings') {
      const instances = (args as any).instances as InstanceConfig[];
      const result = calculator.calculateInstanceSavings(instances);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'list_supported_instances') {
      const result = calculator.listSupportedInstances();
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Return error as text content so client can handle it
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('Cloud Cost Calculator MCP Server running on stdio');
  console.error(`Loaded ${dataLoader.listSupportedInstances().length} instance types`);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});


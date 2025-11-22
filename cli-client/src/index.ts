#!/usr/bin/env node
/**
 * Cloud Cost Comparison CLI
 * Main entry point for the CLI application.
 */

import * as readline from 'readline';
import * as dotenv from 'dotenv';
import { MCPLifecycleManager } from './mcp-lifecycle.js';
import { ClaudeClient } from './claude-client.js';

// Load environment variables
dotenv.config();

/**
 * Display welcome message
 */
function displayWelcome(): void {
  console.log('\n' + '='.repeat(60));
  console.log('🌥️  Cloud Cost Comparison Assistant');
  console.log('='.repeat(60));
  console.log('\nI\'ll help you compare your AWS instance costs with our');
  console.log('alternative cloud platform.\n');
  console.log('To get started, tell me about your current AWS setup. I need:');
  console.log('  • Instance types (e.g., t3.micro, m5.large)');
  console.log('  • How many of each');
  console.log('  • Which AWS region');
  console.log('  • Usage hours per month (I\'ll assume 24/7 if not specified)\n');
  console.log('Type "quit" or "exit" to end the conversation.');
  console.log('Type "help" for more information.\n');
  console.log('='.repeat(60) + '\n');
}

/**
 * Display help message
 */
function displayHelp(): void {
  console.log('\n' + '-'.repeat(60));
  console.log('Help Information');
  console.log('-'.repeat(60));
  console.log('\nThis tool compares AWS EC2 instance costs with alternative');
  console.log('cloud pricing to help you understand potential savings.\n');
  console.log('Supported Instance Types:');
  console.log('  t3.micro, t3.small, t3.medium');
  console.log('  m5.large, m5.xlarge, m5.2xlarge');
  console.log('  c5.large, c5.xlarge\n');
  console.log('Supported Regions:');
  console.log('  us-east-1 (US East - N. Virginia)');
  console.log('  us-west-2 (US West - Oregon)');
  console.log('  eu-west-1 (Europe - Ireland)\n');
  console.log('Example Usage:');
  console.log('  "I\'m running 3 t3.micro instances in us-east-1"');
  console.log('  "Compare 2 m5.large and 5 t3.small in us-west-2"');
  console.log('  "What about 10 c5.xlarge in eu-west-1, running 12 hours/day"\n');
  console.log('-'.repeat(60) + '\n');
}

/**
 * Create readline interface for user input
 */
function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'You: ',
  });
}

/**
 * Main application logic
 */
async function main(): Promise<void> {
  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is not set.');
    console.error('\nPlease create a .env file with your API key:');
    console.error('  ANTHROPIC_API_KEY=your_api_key_here\n');
    process.exit(1);
  }

  // Get model name from environment or use default
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

  // Initialize MCP manager
  const mcpManager = new MCPLifecycleManager();
  
  // Set up shutdown handlers
  mcpManager.setupShutdownHandlers();

  try {
    // Start MCP server
    await mcpManager.start();

    // Initialize Claude client
    const claudeClient = new ClaudeClient(apiKey, mcpManager, model);

    // Display welcome message
    displayWelcome();

    // Create readline interface
    const rl = createReadlineInterface();

    // Track if we're waiting for Claude response
    let isProcessing = false;

    // Handle user input
    rl.on('line', async (input: string) => {
      const trimmedInput = input.trim();

      // Ignore empty input
      if (!trimmedInput) {
        rl.prompt();
        return;
      }

      // Handle special commands
      if (trimmedInput.toLowerCase() === 'quit' || trimmedInput.toLowerCase() === 'exit') {
        console.log('\nThank you for using Cloud Cost Comparison Assistant!');
        await mcpManager.stop();
        rl.close();
        process.exit(0);
      }

      if (trimmedInput.toLowerCase() === 'help') {
        displayHelp();
        rl.prompt();
        return;
      }

      // Prevent multiple concurrent requests
      if (isProcessing) {
        console.log('Please wait for the current request to complete...');
        return;
      }

      isProcessing = true;

      try {
        // Show thinking indicator
        console.log('\n[Thinking...]');

        // Send message to Claude
        const response = await claudeClient.sendMessage(trimmedInput);

        // Display Claude's response
        console.log(`\nAssistant: ${response}\n`);
      } catch (error) {
        console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
        console.error('\nThe application encountered an error. Please try again or restart.\n');
        
        // If it's an MCP error, suggest restart
        if (error instanceof Error && error.message.includes('MCP')) {
          console.error('MCP server error detected. Exiting...\n');
          await mcpManager.stop();
          process.exit(1);
        }
      } finally {
        isProcessing = false;
        rl.prompt();
      }
    });

    // Handle readline close
    rl.on('close', async () => {
      await mcpManager.stop();
      process.exit(0);
    });

    // Start the conversation
    rl.prompt();
  } catch (error) {
    console.error('\n❌ Failed to start application:', error instanceof Error ? error.message : String(error));
    console.error('\nPlease check that:');
    console.error('  1. Python 3.10+ is installed');
    console.error('  2. MCP server dependencies are installed (cd mcp-server && pip install -r requirements.txt)');
    console.error('  3. The pricing data file exists at mcp-server/src/data/pricing.json\n');
    
    await mcpManager.stop();
    process.exit(1);
  }
}

// Run the application
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});


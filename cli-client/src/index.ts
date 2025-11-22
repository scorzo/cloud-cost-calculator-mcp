#!/usr/bin/env node
/**
 * Cloud Cost Comparison CLI
 * Main entry point for the CLI application.
 */

import * as readline from 'readline';
import * as dotenv from 'dotenv';
import { Command } from 'commander';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { MCPLifecycleManager } from './mcp-lifecycle.js';
import { ClaudeClient } from './claude-client.js';

// Load environment variables
dotenv.config();

/**
 * Install MCP server from GitHub
 */
async function installRemoteServer(): Promise<string> {
  console.log('\n📦 Installing MCP server from GitHub...');
  
  // Create temp directory for the remote server
  const tempDir = path.join(os.tmpdir(), 'cloud-cost-mcp-remote');
  
  // Clean up existing installation
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  
  fs.mkdirSync(tempDir, { recursive: true });
  
  // Create a package.json in temp directory
  const packageJson = {
    name: 'temp-mcp-install',
    version: '1.0.0',
    private: true,
  };
  
  fs.writeFileSync(
    path.join(tempDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  try {
    // Install the MCP server from GitHub
    console.log('   Installing @scorzo/cloud-cost-calculator-mcp from GitHub...');
    execSync(
      'npm install github:scorzo/cloud-cost-calculator-mcp#main',
      {
        cwd: tempDir,
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
    
    // Find the installed server path
    const serverPath = path.join(
      tempDir,
      'node_modules',
      'cloud-cost-calculator-mcp',
      'mcp-server',
      'dist',
      'index.js'
    );
    
    // Verify it exists
    if (!fs.existsSync(serverPath)) {
      // Try alternative path structure
      const altPath = path.join(
        tempDir,
        'node_modules',
        '@scorzo',
        'cloud-cost-calculator-mcp',
        'dist',
        'index.js'
      );
      
      if (fs.existsSync(altPath)) {
        console.log('✓ MCP server installed from GitHub\n');
        return altPath;
      }
      
      throw new Error(`Server not found at expected paths:\n  ${serverPath}\n  ${altPath}`);
    }
    
    console.log('✓ MCP server installed from GitHub\n');
    return serverPath;
  } catch (error) {
    throw new Error(`Failed to install MCP server from GitHub: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Display welcome message
 */
function displayWelcome(useRemote: boolean): void {
  console.log('\n' + '='.repeat(60));
  console.log('🌥️  Cloud Cost Comparison Assistant');
  console.log('='.repeat(60));
  
  if (useRemote) {
    console.log('📦 Mode: Using MCP server from GitHub');
  } else {
    console.log('🔧 Mode: Using local MCP server');
  }
  
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
  // Parse command-line arguments
  const program = new Command();
  
  program
    .name('cloud-cost-cli')
    .description('CLI client for cloud cost comparison using MCP')
    .version('1.0.0')
    .option('-r, --remote', 'Use MCP server from GitHub instead of local version')
    .parse(process.argv);
  
  const options = program.opts();
  const useRemote = options.remote || false;
  
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

  // Install remote server if requested
  let serverPath: string | undefined;
  if (useRemote) {
    try {
      serverPath = await installRemoteServer();
    } catch (error) {
      console.error('\n❌ Failed to install remote MCP server:', error instanceof Error ? error.message : String(error));
      console.error('\nFalling back to local server...\n');
      // serverPath remains undefined, will use default local path
    }
  }

  // Initialize MCP manager
  const mcpManager = new MCPLifecycleManager(serverPath ? { serverPath } : undefined);
  
  // Set up shutdown handlers
  mcpManager.setupShutdownHandlers();

  try {
    // Start MCP server
    await mcpManager.start();

    // Initialize Claude client
    const claudeClient = new ClaudeClient(apiKey, mcpManager, model);

    // Display welcome message
    displayWelcome(useRemote);

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


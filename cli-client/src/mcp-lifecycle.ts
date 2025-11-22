/**
 * MCP Server Lifecycle Management
 * Handles spawning, connecting to, and shutting down the MCP server.
 */

import { spawn, ChildProcess } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { MCPServerConfig, CalculateSavingsArgs, ComparisonResult, SupportedInstances } from './types.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class MCPLifecycleManager {
  private serverProcess: ChildProcess | null = null;
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private isConnected: boolean = false;
  private config: MCPServerConfig;

  constructor(config?: Partial<MCPServerConfig>) {
    // Default configuration - now pointing to TypeScript server
    const defaultServerPath = path.join(__dirname, '../../mcp-server/dist/index.js');
    
    this.config = {
      serverPath: config?.serverPath || defaultServerPath,
      pythonPath: config?.pythonPath,
    };
  }

  /**
   * Start the MCP server and establish connection
   */
  async start(): Promise<void> {
    if (this.isConnected) {
      console.log('MCP server already running');
      return;
    }

    console.log('Starting MCP server...');

    // Find Node executable
    const nodeCmd = await this.findNodeExecutable();
    
    // Verify server script exists
    if (!fs.existsSync(this.config.serverPath)) {
      throw new Error(`MCP server script not found: ${this.config.serverPath}`);
    }

    // Spawn the server process
    this.serverProcess = spawn(nodeCmd, [this.config.serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    // Handle server errors
    this.serverProcess.on('error', (error) => {
      console.error('Failed to start MCP server:', error);
      throw new Error(`Failed to start MCP server: ${error.message}`);
    });

    // Log server stderr for debugging
    this.serverProcess.stderr?.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        console.log(`[MCP Server] ${message}`);
      }
    });

    // Handle unexpected server exit
    this.serverProcess.on('exit', (code, signal) => {
      if (this.isConnected && code !== 0) {
        console.error(`MCP server exited unexpectedly with code ${code}, signal ${signal}`);
        console.error('\nThe MCP server has stopped working. Please restart the application.');
        process.exit(1);
      }
    });

    // Create transport using stdio
    this.transport = new StdioClientTransport({
      command: nodeCmd,
      args: [this.config.serverPath],
    });

    // Create and initialize client
    this.client = new Client(
      {
        name: 'cloud-cost-cli',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    // Connect to the server
    try {
      await this.client.connect(this.transport);
      this.isConnected = true;
      console.log('✓ MCP server connected successfully\n');
    } catch (error) {
      this.cleanup();
      throw new Error(`Failed to connect to MCP server: ${error}`);
    }
  }

  /**
   * Find the appropriate Node executable
   */
  private async findNodeExecutable(): Promise<string> {
    // Use node from PATH
    return 'node';
  }

  /**
   * Call the calculate_instance_savings tool
   */
  async calculateSavings(args: CalculateSavingsArgs): Promise<ComparisonResult> {
    if (!this.client || !this.isConnected) {
      throw new Error('MCP client not connected. Call start() first.');
    }

    try {
      const response = await this.client.callTool({
        name: 'calculate_instance_savings',
        arguments: args as any,
      });

      // Extract text content from response
      const content = response.content as Array<{ type: string; text?: string }>;
      if (!content || content.length === 0) {
        throw new Error('Empty response from MCP server');
      }

      const textContent = content.find((c: { type: string; text?: string }) => c.type === 'text');
      if (!textContent || !textContent.text) {
        throw new Error('No text content in MCP response');
      }

      // Check if response is an error message
      if (textContent.text.startsWith('Error:')) {
        throw new Error(textContent.text);
      }

      // Parse JSON response
      const result = JSON.parse(textContent.text);
      return result as ComparisonResult;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to calculate savings: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Call the list_supported_instances tool
   */
  async listSupportedInstances(): Promise<SupportedInstances> {
    if (!this.client || !this.isConnected) {
      throw new Error('MCP client not connected. Call start() first.');
    }

    try {
      const response = await this.client.callTool({
        name: 'list_supported_instances',
        arguments: {},
      });

      // Extract text content from response
      const content = response.content as Array<{ type: string; text?: string }>;
      if (!content || content.length === 0) {
        throw new Error('Empty response from MCP server');
      }

      const textContent = content.find((c: { type: string; text?: string }) => c.type === 'text');
      if (!textContent || !textContent.text) {
        throw new Error('No text content in MCP response');
      }

      // Check if response is an error message
      if (textContent.text.startsWith('Error:')) {
        throw new Error(textContent.text);
      }

      // Parse JSON response
      const result = JSON.parse(textContent.text);
      return result as SupportedInstances;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to list instances: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Check if server is connected
   */
  isServerConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Stop the MCP server and clean up resources
   */
  async stop(): Promise<void> {
    if (!this.isConnected && !this.serverProcess) {
      return;
    }

    console.log('\nShutting down MCP server...');

    this.cleanup();

    console.log('✓ MCP server stopped');
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    this.isConnected = false;

    // Close client connection
    if (this.client) {
      try {
        this.client.close();
      } catch (error) {
        console.error('Error closing client:', error);
      }
      this.client = null;
    }

    // Kill server process
    if (this.serverProcess) {
      try {
        this.serverProcess.kill('SIGTERM');
        
        // Force kill after timeout
        setTimeout(() => {
          if (this.serverProcess && !this.serverProcess.killed) {
            this.serverProcess.kill('SIGKILL');
          }
        }, 2000);
      } catch (error) {
        console.error('Error killing server process:', error);
      }
      this.serverProcess = null;
    }

    this.transport = null;
  }

  /**
   * Set up graceful shutdown handlers
   */
  setupShutdownHandlers(): void {
    const shutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}, shutting down gracefully...`);
      await this.stop();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    
    // Handle uncaught errors
    process.on('uncaughtException', async (error) => {
      console.error('Uncaught exception:', error);
      await this.stop();
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason) => {
      console.error('Unhandled rejection:', reason);
      await this.stop();
      process.exit(1);
    });
  }
}


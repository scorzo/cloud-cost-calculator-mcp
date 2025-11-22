/**
 * MCP Server Lifecycle Management (adapted for web backend)
 * Handles spawning, connecting to, and shutting down the MCP server.
 */

import { spawn, ChildProcess } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as fs from 'fs';
import { EventEmitter } from 'events';
import { MCPTool } from '../types/index.js';

export class MCPManager extends EventEmitter {
  private serverProcess: ChildProcess | null = null;
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private isConnected: boolean = false;
  private serverPath: string | null = null;

  constructor() {
    super();
  }

  /**
   * Start the MCP server and establish connection
   */
  async start(serverPath: string): Promise<void> {
    if (this.isConnected) {
      console.log('MCP server already running');
      return;
    }

    this.serverPath = serverPath;
    console.log('Starting MCP server...');

    // Verify server script exists
    if (!fs.existsSync(serverPath)) {
      throw new Error(`MCP server script not found: ${serverPath}`);
    }

    // Create transport using stdio
    this.transport = new StdioClientTransport({
      command: 'node',
      args: [serverPath],
    });

    // Create and initialize client
    this.client = new Client(
      {
        name: 'mcp-web-client',
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
      console.log('✓ MCP server connected successfully');
      
      // Emit connected event
      this.emit('connected');
    } catch (error) {
      this.cleanup();
      throw new Error(`Failed to connect to MCP server: ${error}`);
    }
  }

  /**
   * List available tools from the MCP server
   */
  async listTools(): Promise<MCPTool[]> {
    if (!this.client || !this.isConnected) {
      throw new Error('MCP client not connected');
    }

    try {
      const response = await this.client.listTools();
      
      return response.tools.map((tool: any) => ({
        name: tool.name,
        description: tool.description || '',
        input_schema: tool.inputSchema || { type: 'object', properties: {} },
      }));
    } catch (error) {
      console.error('Failed to list tools:', error);
      throw new Error(`Failed to list tools: ${error}`);
    }
  }

  /**
   * Call an MCP tool
   */
  async callTool(toolName: string, args: Record<string, any>): Promise<any> {
    if (!this.client || !this.isConnected) {
      throw new Error('MCP client not connected');
    }

    try {
      const response = await this.client.callTool({
        name: toolName,
        arguments: args,
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
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to call tool ${toolName}: ${error.message}`);
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
   * Get the MCP client instance (for advanced use)
   */
  getClient(): Client | null {
    return this.client;
  }

  /**
   * Stop the MCP server and clean up resources
   */
  async stop(): Promise<void> {
    if (!this.isConnected && !this.serverProcess) {
      return;
    }

    console.log('Shutting down MCP server...');
    this.cleanup();
    console.log('✓ MCP server stopped');
    
    // Emit disconnected event
    this.emit('disconnected');
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
    this.serverPath = null;
  }
}


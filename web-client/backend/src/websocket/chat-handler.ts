/**
 * WebSocket Chat Handler
 * Manages WebSocket connections for real-time chat
 */

import { WebSocket, WebSocketServer } from 'ws';
import { MCPManager } from '../services/mcp-manager.js';
import { ClaudeClient } from '../services/claude-client.js';
import { ClientMessage, ServerMessage } from '../types/index.js';

export class ChatHandler {
  private wss: WebSocketServer;
  private mcpManager: MCPManager;
  private claudeClient: ClaudeClient | null = null;
  private apiKey: string;
  private model: string;

  constructor(wss: WebSocketServer, mcpManager: MCPManager, apiKey: string, model?: string) {
    this.wss = wss;
    this.mcpManager = mcpManager;
    this.apiKey = apiKey;
    this.model = model || 'claude-sonnet-4-20250514';

    this.setupWebSocketServer();
  }

  /**
   * Setup WebSocket server event handlers
   */
  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('Client connected to chat');

      // Initialize Claude client for this connection if MCP is connected
      if (this.mcpManager.isServerConnected()) {
        this.claudeClient = new ClaudeClient(this.apiKey, this.mcpManager, this.model);
        
        // Listen for tool calls
        this.claudeClient.on('tool_call', (toolName: string) => {
          this.sendMessage(ws, {
            type: 'tool_call',
            tool_name: toolName,
          });
        });
      }

      // Handle incoming messages
      ws.on('message', async (data: Buffer) => {
        try {
          const message: ClientMessage = JSON.parse(data.toString());
          await this.handleMessage(ws, message);
        } catch (error) {
          console.error('Error handling message:', error);
          this.sendMessage(ws, {
            type: 'error',
            message: error instanceof Error ? error.message : 'Failed to process message',
          });
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        console.log('Client disconnected from chat');
        // Reset conversation when client disconnects
        if (this.claudeClient) {
          this.claudeClient.resetConversation();
        }
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  /**
   * Handle incoming chat message
   */
  private async handleMessage(ws: WebSocket, message: ClientMessage): Promise<void> {
    if (message.type === 'message') {
      // Check if MCP is connected
      if (!this.mcpManager.isServerConnected()) {
        this.sendMessage(ws, {
          type: 'error',
          message: 'MCP server not connected. Please connect to an MCP server first.',
        });
        return;
      }

      // Initialize Claude client if not already done
      if (!this.claudeClient) {
        this.claudeClient = new ClaudeClient(this.apiKey, this.mcpManager, this.model);
        
        // Listen for tool calls
        this.claudeClient.on('tool_call', (toolName: string) => {
          this.sendMessage(ws, {
            type: 'tool_call',
            tool_name: toolName,
          });
        });
      }

      // Echo user message back
      this.sendMessage(ws, {
        type: 'message',
        role: 'user',
        content: message.content,
        timestamp: new Date().toISOString(),
      });

      try {
        // Send to Claude
        const response = await this.claudeClient.sendMessage(message.content);

        // Send assistant response
        this.sendMessage(ws, {
          type: 'message',
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Claude error:', error);
        this.sendMessage(ws, {
          type: 'error',
          message: error instanceof Error ? error.message : 'Failed to get response from Claude',
        });
      }
    }
  }

  /**
   * Send message to WebSocket client
   */
  private sendMessage(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message: ServerMessage): void {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  /**
   * Reset Claude client (e.g., when MCP disconnects)
   */
  reset(): void {
    if (this.claudeClient) {
      this.claudeClient.resetConversation();
      this.claudeClient = null;
    }
  }
}


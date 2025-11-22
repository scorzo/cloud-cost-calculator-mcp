/**
 * Type definitions for MCP Web Client Frontend
 */

export interface MCPConfig {
  owner: string;
  repo: string;
  branch: string;
  subdirectory?: string;
}

export type ConnectionStatus =
  | 'disconnected'
  | 'installing'
  | 'connecting'
  | 'connected'
  | 'error';

export interface MCPTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface StatusState {
  status: ConnectionStatus;
  message?: string;
  tools?: MCPTool[];
  config?: MCPConfig;
  connected?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolCall?: string;
}

// WebSocket message types
export type ServerMessage =
  | { type: 'message'; role: 'user' | 'assistant'; content: string; timestamp: string }
  | { type: 'tool_call'; tool_name: string }
  | { type: 'error'; message: string }
  | { type: 'status'; status: ConnectionStatus; message?: string };


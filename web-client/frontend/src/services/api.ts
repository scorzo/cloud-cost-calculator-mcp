/**
 * API Service for backend communication
 */

import axios from 'axios';
import { MCPConfig, StatusState, MCPTool } from '../types';

// Use relative URL so nginx can proxy to backend
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const mcpApi = {
  /**
   * Connect to an MCP server from GitHub
   */
  connect: async (config: MCPConfig): Promise<StatusState> => {
    const response = await api.post('/api/mcp/connect', config);
    return response.data;
  },

  /**
   * Disconnect from current MCP server
   */
  disconnect: async (): Promise<StatusState> => {
    const response = await api.post('/api/mcp/disconnect');
    return response.data;
  },

  /**
   * Get current connection status
   */
  getStatus: async (): Promise<StatusState> => {
    const response = await api.get('/api/mcp/status');
    return response.data;
  },

  /**
   * Get available tools from connected MCP
   */
  getTools: async (): Promise<{ tools: MCPTool[] }> => {
    const response = await api.get('/api/mcp/tools');
    return response.data;
  },
};

export default api;


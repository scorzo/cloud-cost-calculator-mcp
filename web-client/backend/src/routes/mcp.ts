/**
 * MCP API Routes
 */

import { Router, Request, Response } from 'express';
import { GitHubInstaller } from '../services/github-installer.js';
import { MCPManager } from '../services/mcp-manager.js';
import { MCPConfig, StatusState } from '../types/index.js';

export function createMCPRoutes(
  installer: GitHubInstaller,
  mcpManager: MCPManager
): Router {
  const router = Router();
  
  let currentConfig: MCPConfig | null = null;
  let currentStatus: StatusState = { status: 'disconnected' };

  /**
   * POST /api/mcp/connect
   * Install and connect to GitHub MCP package
   */
  router.post('/connect', async (req: Request, res: Response) => {
    try {
      const config: MCPConfig = req.body;
      
      // Validate config
      if (!config.owner || !config.repo || !config.branch) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing required fields: owner, repo, branch',
        });
      }

      // Update status
      currentStatus = { status: 'installing', config };
      currentConfig = config;

      // Install MCP from GitHub
      console.log(`Installing MCP: ${config.owner}/${config.repo}#${config.branch}`);
      const serverPath = await installer.install(config);

      // Update status
      currentStatus = { status: 'connecting', config };

      // Start MCP server
      await mcpManager.start(serverPath);

      // Get available tools
      const tools = await mcpManager.listTools();

      // Update status
      currentStatus = {
        status: 'connected',
        config,
        tools,
        message: `Connected to ${config.owner}/${config.repo}`,
      };

      res.json(currentStatus);
    } catch (error) {
      console.error('Connection error:', error);
      
      currentStatus = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        config: currentConfig || undefined,
      };

      res.status(500).json(currentStatus);
    }
  });

  /**
   * POST /api/mcp/disconnect
   * Disconnect and cleanup MCP server
   */
  router.post('/disconnect', async (req: Request, res: Response) => {
    try {
      await mcpManager.stop();
      
      // Cleanup installation if we have config
      if (currentConfig) {
        installer.cleanup(currentConfig);
      }

      currentStatus = { status: 'disconnected' };
      currentConfig = null;

      res.json(currentStatus);
    } catch (error) {
      console.error('Disconnect error:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to disconnect',
      });
    }
  });

  /**
   * GET /api/mcp/status
   * Get current connection status
   */
  router.get('/status', async (req: Request, res: Response) => {
    try {
      const connected = mcpManager.isServerConnected();
      
      // If connected but we don't have tools in status, fetch them
      if (connected && !currentStatus.tools) {
        const tools = await mcpManager.listTools();
        currentStatus.tools = tools;
      }

      res.json({
        ...currentStatus,
        connected,
      });
    } catch (error) {
      console.error('Status error:', error);
      res.json(currentStatus);
    }
  });

  /**
   * GET /api/mcp/tools
   * Get list of available tools from connected MCP
   */
  router.get('/tools', async (req: Request, res: Response) => {
    try {
      if (!mcpManager.isServerConnected()) {
        return res.status(503).json({
          error: 'MCP server not connected',
          tools: [],
        });
      }

      const tools = await mcpManager.listTools();
      res.json({ tools });
    } catch (error) {
      console.error('Tools error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to list tools',
        tools: [],
      });
    }
  });

  return router;
}


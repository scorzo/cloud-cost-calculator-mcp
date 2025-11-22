/**
 * Main Express Server with WebSocket support
 * Universal MCP Web Client Backend
 */

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import * as dotenv from 'dotenv';
import { createServer } from 'http';
import { GitHubInstaller } from './services/github-installer.js';
import { MCPManager } from './services/mcp-manager.js';
import { createMCPRoutes } from './routes/mcp.js';
import { ChatHandler } from './websocket/chat-handler.js';
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config();

// Configuration
const PORT = parseInt(process.env.PORT || '3001', 10);
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

if (!ANTHROPIC_API_KEY) {
  logger.error('ANTHROPIC_API_KEY environment variable is not set');
  process.exit(1);
}

logger.info(`Using Anthropic model: ${ANTHROPIC_MODEL}`);

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Initialize services
const installer = new GitHubInstaller();
const mcpManager = new MCPManager();

// API Routes
app.use('/api/mcp', createMCPRoutes(installer, mcpManager));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mcp_connected: mcpManager.isServerConnected(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Universal MCP Web Client API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      mcp_connect: 'POST /api/mcp/connect',
      mcp_disconnect: 'POST /api/mcp/disconnect',
      mcp_status: 'GET /api/mcp/status',
      mcp_tools: 'GET /api/mcp/tools',
      websocket: 'ws://localhost:3001/ws/chat',
    },
  });
});

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ 
  server,
  path: '/ws/chat',
});

// Initialize chat handler
const chatHandler = new ChatHandler(wss, mcpManager, ANTHROPIC_API_KEY, ANTHROPIC_MODEL);

// Handle MCP disconnection
mcpManager.on('disconnected', () => {
  logger.info('MCP disconnected, resetting chat');
  chatHandler.reset();
  chatHandler.broadcast({
    type: 'status',
    status: 'disconnected',
    message: 'MCP server disconnected',
  });
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down server...');
  
  // Close WebSocket server
  wss.close();
  
  // Stop MCP server
  await mcpManager.stop();
  
  // Close HTTP server
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  
  // Force exit after 5 seconds
  setTimeout(() => {
    logger.error('Forced shutdown');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📡 WebSocket available at ws://localhost:${PORT}/ws/chat`);
  logger.info(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Error handling
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
  shutdown();
});


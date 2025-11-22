/**
 * Main App Component
 * Universal MCP Web Client
 */

import { useState, useCallback } from 'react';
import { ConfigPanel } from './components/ConfigPanel';
import { ChatInterface } from './components/ChatInterface';
import { ToolsPanel } from './components/ToolsPanel';
import { StatusIndicator } from './components/StatusIndicator';
import { useWebSocket } from './hooks/useWebSocket';
import { mcpApi } from './services/api';
import { MCPConfig, ChatMessage, ServerMessage, MCPTool, ConnectionStatus } from './types';

function App() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case 'message':
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: message.role,
            content: message.content,
            timestamp: message.timestamp,
          },
        ]);
        break;

      case 'tool_call':
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'system',
            content: '',
            timestamp: new Date().toISOString(),
            toolCall: message.tool_name,
          },
        ]);
        break;

      case 'error':
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'system',
            content: `Error: ${message.message}`,
            timestamp: new Date().toISOString(),
          },
        ]);
        break;

      case 'status':
        setStatus(message.status);
        if (message.message) {
          setStatusMessage(message.message);
        }
        break;
    }
  }, []);

  const { sendMessage: sendWebSocketMessage, isConnected: wsConnected } =
    useWebSocket(handleWebSocketMessage);

  // Handle MCP connection
  const handleConnect = async (config: MCPConfig) => {
    try {
      setStatus('installing');
      setStatusMessage('Installing MCP from GitHub...');

      const response = await mcpApi.connect(config);
      
      setStatus(response.status);
      setStatusMessage(response.message);
      
      if (response.tools) {
        setTools(response.tools);
      }
      
      // Clear chat history on new connection
      setMessages([]);
    } catch (error) {
      console.error('Connection error:', error);
      setStatus('error');
      setStatusMessage(
        error instanceof Error ? error.message : 'Failed to connect'
      );
    }
  };

  // Handle MCP disconnection
  const handleDisconnect = async () => {
    try {
      await mcpApi.disconnect();
      setStatus('disconnected');
      setStatusMessage(undefined);
      setTools([]);
      setMessages([]);
    } catch (error) {
      console.error('Disconnect error:', error);
      setStatusMessage(
        error instanceof Error ? error.message : 'Failed to disconnect'
      );
    }
  };

  // Handle sending chat message
  const handleSendMessage = useCallback(
    (content: string) => {
      if (wsConnected && status === 'connected') {
        sendWebSocketMessage({ type: 'message', content });
      }
    },
    [wsConnected, status, sendWebSocketMessage]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Universal MCP Tester
            </h1>
            <p className="text-sm text-gray-600">
              Connect to any GitHub-hosted MCP server
            </p>
          </div>
          <StatusIndicator status={status} message={statusMessage} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Configuration */}
          <div className="lg:col-span-1">
            <ConfigPanel
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              status={status}
            />
          </div>

          {/* Middle Column: Chat */}
          <div className="lg:col-span-1 h-[600px]">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isConnected={status === 'connected'}
            />
          </div>

          {/* Right Column: Tools */}
          <div className="lg:col-span-1 h-[600px]">
            <ToolsPanel tools={tools} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 py-4 text-center text-sm text-gray-500">
        <p>
          Universal MCP Web Client • Default:{' '}
          <code className="px-1 py-0.5 bg-gray-200 rounded text-xs">
            scorzo/cloud-cost-calculator-mcp
          </code>
        </p>
      </footer>
    </div>
  );
}

export default App;


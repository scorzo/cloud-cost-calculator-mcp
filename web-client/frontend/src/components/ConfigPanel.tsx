/**
 * Configuration Panel Component
 * GitHub MCP server configuration form
 */

import { useState } from 'react';
import { MCPConfig, ConnectionStatus } from '../types';

interface ConfigPanelProps {
  onConnect: (config: MCPConfig) => void;
  onDisconnect: () => void;
  status: ConnectionStatus;
}

export function ConfigPanel({ onConnect, onDisconnect, status }: ConfigPanelProps) {
  const [config, setConfig] = useState<MCPConfig>({
    owner: 'scorzo',
    repo: 'cloud-cost-calculator-mcp',
    branch: 'main',
    subdirectory: '',
  });

  const isConnected = status === 'connected';
  const isConnecting = status === 'installing' || status === 'connecting';
  const isDisabled = isConnected || isConnecting;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDisabled) {
      onConnect(config);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        GitHub MCP Configuration
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="owner" className="block text-sm font-medium text-gray-700 mb-1">
            Owner / Organization
          </label>
          <input
            id="owner"
            type="text"
            value={config.owner}
            onChange={(e) => setConfig({ ...config, owner: e.target.value })}
            disabled={isDisabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-sm"
            placeholder="scorzo"
            required
          />
        </div>

        <div>
          <label htmlFor="repo" className="block text-sm font-medium text-gray-700 mb-1">
            Repository Name
          </label>
          <input
            id="repo"
            type="text"
            value={config.repo}
            onChange={(e) => setConfig({ ...config, repo: e.target.value })}
            disabled={isDisabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-sm"
            placeholder="cloud-cost-calculator-mcp"
            required
          />
        </div>

        <div>
          <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">
            Branch / Tag
          </label>
          <input
            id="branch"
            type="text"
            value={config.branch}
            onChange={(e) => setConfig({ ...config, branch: e.target.value })}
            disabled={isDisabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-sm"
            placeholder="main"
            required
          />
        </div>

        <div>
          <label htmlFor="subdirectory" className="block text-sm font-medium text-gray-700 mb-1">
            Subdirectory (optional)
          </label>
          <input
            id="subdirectory"
            type="text"
            value={config.subdirectory || ''}
            onChange={(e) => setConfig({ ...config, subdirectory: e.target.value })}
            disabled={isDisabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-sm"
            placeholder="packages/mcp-server"
          />
          <p className="text-xs text-gray-500 mt-1">
            For monorepos only
          </p>
        </div>

        <div className="pt-2">
          {!isConnected ? (
            <button
              type="submit"
              disabled={isConnecting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onDisconnect}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              Disconnect
            </button>
          )}
        </div>
      </form>
    </div>
  );
}


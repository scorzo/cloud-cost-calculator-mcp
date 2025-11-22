/**
 * Tools Panel Component
 * Displays available MCP tools
 */

import { useState } from 'react';
import { MCPTool } from '../types';

interface ToolsPanelProps {
  tools: MCPTool[];
}

function ToolCard({ tool }: { tool: MCPTool }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-md p-3 hover:border-blue-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 text-sm">{tool.name}</h3>
          <p className="text-xs text-gray-600 mt-1">{tool.description}</p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
        >
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Input Schema:</h4>
          <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
            {JSON.stringify(tool.input_schema, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export function ToolsPanel({ tools }: ToolsPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-full overflow-y-auto">
      <h2 className="text-lg font-bold text-gray-800 mb-4">
        Available Tools
      </h2>

      {tools.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No tools available</p>
          <p className="text-xs mt-2">Connect to an MCP server to see available tools</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tools.map((tool) => (
            <ToolCard key={tool.name} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
}


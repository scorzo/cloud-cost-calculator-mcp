/**
 * Status Indicator Component
 * Shows current connection status
 */

import { ConnectionStatus } from '../types';

interface StatusIndicatorProps {
  status: ConnectionStatus;
  message?: string;
}

export function StatusIndicator({ status, message }: StatusIndicatorProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
      case 'installing':
        return 'bg-yellow-500 animate-pulse';
      case 'error':
        return 'bg-red-500';
      case 'disconnected':
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'installing':
        return 'Installing...';
      case 'error':
        return 'Error';
      case 'disconnected':
      default:
        return 'Disconnected';
    }
  };

  return (
    <div className="flex items-center gap-2" title={message}>
      <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
      <span className="text-sm font-medium text-gray-700">
        {getStatusText()}
      </span>
      {message && status === 'error' && (
        <span className="text-xs text-red-600 ml-2" title={message}>
          ⚠️
        </span>
      )}
    </div>
  );
}


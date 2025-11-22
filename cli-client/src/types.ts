/**
 * Type definitions for the CLI client.
 */

/**
 * Instance configuration for cost comparison
 */
export interface InstanceConfig {
  type: string;
  quantity: number;
  region: string;
  hours_per_month?: number;
}

/**
 * Instance breakdown in comparison result
 */
export interface InstanceBreakdown {
  instance_type: string;
  quantity: number;
  region: string;
  hours_per_month: number;
  aws_hourly_rate: number;
  alternative_hourly_rate: number;
  aws_monthly_cost: number;
  alternative_monthly_cost: number;
  savings_amount: number;
  savings_percentage: number;
}

/**
 * Cost comparison result
 */
export interface CostComparison {
  aws_monthly_cost: number;
  alternative_monthly_cost: number;
  savings_amount: number;
  savings_percentage: number;
  breakdown: InstanceBreakdown[];
}

/**
 * Complete comparison result with recommendations
 */
export interface ComparisonResult {
  comparison: CostComparison;
  recommendations: string[];
}

/**
 * Supported instances list
 */
export interface SupportedInstances {
  aws_instances: string[];
  regions: string[];
  metadata: {
    version: string;
    last_updated: string;
    currency: string;
    unit: string;
  };
}

/**
 * MCP tool call arguments for calculate_instance_savings
 */
export interface CalculateSavingsArgs {
  instances: InstanceConfig[];
}

/**
 * MCP server configuration
 */
export interface MCPServerConfig {
  serverPath: string;
  pythonPath?: string;
}


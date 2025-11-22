/**
 * Cost calculation engine for cloud pricing comparisons.
 */

import { PricingDataLoader } from './data-loader.js';

export interface InstanceConfig {
  type: string;
  quantity: number;
  region: string;
  hours_per_month?: number;
}

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

export interface CostComparison {
  aws_monthly_cost: number;
  alternative_monthly_cost: number;
  savings_amount: number;
  savings_percentage: number;
  breakdown: InstanceBreakdown[];
}

export interface ComparisonResult {
  comparison: CostComparison;
  recommendations: string[];
}

export class CostCalculator {
  constructor(private dataLoader: PricingDataLoader) {}

  calculateInstanceSavings(instances: InstanceConfig[]): ComparisonResult {
    // Normalize configurations
    const configs = instances.map(inst => ({
      type: inst.type,
      quantity: inst.quantity,
      region: inst.region,
      hours_per_month: inst.hours_per_month ?? 730,
    }));

    // Validate all configurations
    this.validateConfigurations(configs);

    // Calculate breakdown for each instance type
    const breakdowns: InstanceBreakdown[] = [];
    let totalAwsCost = 0;
    let totalAlternativeCost = 0;

    for (const config of configs) {
      const breakdown = this.calculateInstanceBreakdown(config);
      breakdowns.push(breakdown);
      totalAwsCost += breakdown.aws_monthly_cost;
      totalAlternativeCost += breakdown.alternative_monthly_cost;
    }

    // Calculate total savings
    const totalSavings = totalAwsCost - totalAlternativeCost;
    const totalSavingsPct = totalAwsCost > 0 ? (totalSavings / totalAwsCost) * 100 : 0;

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      totalAwsCost,
      totalAlternativeCost,
      totalSavingsPct
    );

    return {
      comparison: {
        aws_monthly_cost: this.round(totalAwsCost, 2),
        alternative_monthly_cost: this.round(totalAlternativeCost, 2),
        savings_amount: this.round(totalSavings, 2),
        savings_percentage: this.round(totalSavingsPct, 2),
        breakdown: breakdowns,
      },
      recommendations,
    };
  }

  private validateConfigurations(configs: InstanceConfig[]): void {
    for (const config of configs) {
      // Validate instance type
      if (!this.dataLoader.isInstanceSupported(config.type)) {
        const supported = this.dataLoader.listSupportedInstances();
        throw new Error(
          `Unsupported instance type: ${config.type}. Supported types: ${supported.join(', ')}`
        );
      }

      // Validate region
      if (!this.dataLoader.isRegionSupported(config.region)) {
        const supported = this.dataLoader.listSupportedRegions();
        throw new Error(
          `Unsupported region: ${config.region}. Supported regions: ${supported.join(', ')}`
        );
      }

      // Validate quantity
      if (config.quantity <= 0) {
        throw new Error(`Quantity must be positive, got ${config.quantity}`);
      }

      // Validate hours
      const hours = config.hours_per_month ?? 730;
      if (hours <= 0 || hours > 744) {
        throw new Error(`Hours per month must be between 1 and 744, got ${hours}`);
      }
    }
  }

  private calculateInstanceBreakdown(config: InstanceConfig): InstanceBreakdown {
    const hours = config.hours_per_month ?? 730;

    // Get pricing
    const awsHourly = this.dataLoader.getAwsPrice(config.type, config.region);
    const altHourly = this.dataLoader.getAlternativePrice(config.type);

    if (awsHourly === null) {
      throw new Error(`Pricing not found for ${config.type} in ${config.region}`);
    }
    if (altHourly === null) {
      throw new Error(`Alternative pricing not found for ${config.type}`);
    }

    // Calculate monthly costs
    const awsMonthly = awsHourly * hours * config.quantity;
    const altMonthly = altHourly * hours * config.quantity;

    // Calculate savings
    const savings = awsMonthly - altMonthly;
    const savingsPct = awsMonthly > 0 ? (savings / awsMonthly) * 100 : 0;

    return {
      instance_type: config.type,
      quantity: config.quantity,
      region: config.region,
      hours_per_month: hours,
      aws_hourly_rate: this.round(awsHourly, 4),
      alternative_hourly_rate: this.round(altHourly, 4),
      aws_monthly_cost: this.round(awsMonthly, 2),
      alternative_monthly_cost: this.round(altMonthly, 2),
      savings_amount: this.round(savings, 2),
      savings_percentage: this.round(savingsPct, 2),
    };
  }

  private generateRecommendations(
    awsCost: number,
    altCost: number,
    savingsPct: number
  ): string[] {
    const recommendations: string[] = [];

    if (savingsPct > 0) {
      const annualSavings = (awsCost - altCost) * 12;
      recommendations.push(
        `Switching to alternative cloud could save $${this.round(annualSavings, 2).toLocaleString()} annually`
      );

      if (savingsPct > 30) {
        recommendations.push(
          'High savings potential - consider migrating production workloads'
        );
      } else if (savingsPct > 20) {
        recommendations.push('Significant savings - ideal for dev/staging environments');
      } else {
        recommendations.push('Moderate savings - good for non-critical workloads');
      }

      if (awsCost > 1000) {
        recommendations.push(
          'Large infrastructure - consider phased migration approach'
        );
      }
    } else {
      recommendations.push('Current AWS pricing is competitive for your configuration');
    }

    return recommendations;
  }

  listSupportedInstances(): {
    aws_instances: string[];
    regions: string[];
    metadata: any;
  } {
    return {
      aws_instances: this.dataLoader.listSupportedInstances(),
      regions: this.dataLoader.listSupportedRegions(),
      metadata: this.dataLoader.getMetadata(),
    };
  }

  private round(value: number, decimals: number): number {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
}


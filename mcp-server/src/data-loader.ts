/**
 * Data loader for pricing information.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface InstanceSpecs {
  vcpu: number;
  memory_gb: number;
  network_performance: string;
}

export interface InstancePricing {
  specs: InstanceSpecs;
  pricing: Record<string, number>;
}

export interface AlternativeInstance {
  comparable_to: string[];
  specs: InstanceSpecs;
  hourly_rate: number;
  savings_vs_aws?: string;
}

export interface RegionInfo {
  name: string;
  available: boolean;
}

export interface PricingMetadata {
  version: string;
  last_updated: string;
  currency: string;
  unit: string;
  description?: string;
}

export interface PricingData {
  metadata: PricingMetadata;
  aws_instances: Record<string, InstancePricing>;
  alternative_cloud: Record<string, AlternativeInstance>;
  regions: Record<string, RegionInfo>;
  instance_mapping: Record<string, string>;
}

export class PricingDataLoader {
  private data: PricingData;

  constructor(dataFilePath?: string) {
    // Default path: look in src/data relative to the module location
    // This works whether we're running from src/ or dist/
    const defaultPath = join(__dirname, '..', 'src', 'data', 'pricing.json');
    const filePath = dataFilePath || defaultPath;
    
    try {
      const fileContent = readFileSync(filePath, 'utf-8');
      this.data = JSON.parse(fileContent);
      this.validateData();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load pricing data: ${error.message}`);
      }
      throw error;
    }
  }

  private validateData(): void {
    if (!this.data) {
      throw new Error('Pricing data is empty');
    }

    const requiredKeys = ['aws_instances', 'alternative_cloud', 'regions', 'instance_mapping'];
    for (const key of requiredKeys) {
      if (!(key in this.data)) {
        throw new Error(`Missing required key in pricing data: ${key}`);
      }
    }
  }

  getAwsPrice(instanceType: string, region: string): number | null {
    const instanceData = this.data.aws_instances[instanceType];
    if (!instanceData) {
      return null;
    }

    return instanceData.pricing[region] ?? null;
  }

  getAlternativePrice(awsInstanceType: string): number | null {
    const alternativeType = this.data.instance_mapping[awsInstanceType];
    if (!alternativeType) {
      return null;
    }

    const altInstance = this.data.alternative_cloud[alternativeType];
    if (!altInstance) {
      return null;
    }

    return altInstance.hourly_rate;
  }

  getInstanceSpecs(instanceType: string): InstanceSpecs | null {
    const instanceData = this.data.aws_instances[instanceType];
    return instanceData?.specs ?? null;
  }

  listSupportedInstances(): string[] {
    return Object.keys(this.data.aws_instances);
  }

  listSupportedRegions(): string[] {
    return Object.keys(this.data.regions);
  }

  isInstanceSupported(instanceType: string): boolean {
    return instanceType in this.data.aws_instances;
  }

  isRegionSupported(region: string): boolean {
    return region in this.data.regions;
  }

  getMetadata(): PricingMetadata {
    return this.data.metadata;
  }
}


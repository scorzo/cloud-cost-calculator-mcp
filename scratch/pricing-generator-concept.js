/**
 * Alternative Cloud Pricing Generator
 * 
 * Generates a 1:1 pricing structure from AWS data using compact configuration.
 */

// ============================================================
// EXAMPLE CONFIG - This is what the alternative cloud provides
// ============================================================

const exampleConfig = {
  
  // 1. WHAT THEY SUPPORT (use "*" for all, or patterns like "m6i.*")
  supported: {
    instances: ["m6i.*", "c6i.*", "t3.*"],        // Which AWS instances they match
    regions: ["us-east-1", "us-west-2", "eu-west-1", "ap-northeast-1"],
    tiers: ["ondemand", "commitment_1yr", "commitment_3yr"]  // Simplified tier names
  },

  // 2. TIER MAPPING - How AWS tiers map to their tiers
  tier_mapping: {
    "ondemand": "ondemand",
    "commitment_1yr": "sp1yr_all",      // Use AWS's best 1yr rate
    "commitment_3yr": "sp3yr_all"       // Use AWS's best 3yr rate
  },

  // 3. PRICING RULES - How to calculate their price from AWS price
  //    Values are % difference: -20 = 20% cheaper, +10 = 10% more expensive
  //    Rules are applied in order: default → by_tier → by_region → by_instance → specific
  pricing: {
    default: -20,  // Base: 20% cheaper than AWS across the board
    
    by_tier: {
      "ondemand": -25,       // 25% cheaper on on-demand
      "commitment_1yr": -15, // 15% cheaper on 1yr
      "commitment_3yr": -5   // Only 5% cheaper on 3yr (AWS already cheap)
    },
    
    by_region: {
      "us-*": 0,            // No additional adjustment for US
      "eu-*": +3,           // 3% more expensive in EU (additive)
      "ap-*": +5            // 5% more expensive in Asia (additive)
    },
    
    by_instance_family: {
      "c6i": -5,            // Additional 5% off compute-optimized
      "t3": +5              // 5% less discount on burstable
    },

    // Optional: absolute price overrides (takes precedence over everything)
    fixed_prices: {
      // "m6i.xlarge|us-east-1|ondemand": 0.145
    }
  },

  // 4. OPTIONAL: Custom naming
  naming: {
    instances: {
      "m6i.xlarge": "standard-4vcpu-16gb",
      "m6i.2xlarge": "standard-8vcpu-32gb"
      // If not specified, uses AWS name
    },
    regions: {
      "us-east-1": "us-virginia",
      "us-west-2": "us-oregon"
      // If not specified, uses AWS region code
    }
  }
};


// ============================================================
// THE GENERATOR FUNCTION
// ============================================================

function generateAlternativeCloudPricing(awsData, config) {
  const result = {
    metadata: {
      provider: "alternative_cloud",
      generated_from: "aws_pricing",
      generated_at: new Date().toISOString(),
      config_summary: {
        instances: config.supported.instances,
        regions: config.supported.regions,
        tiers: config.supported.tiers,
        base_discount: config.pricing.default + "%"
      }
    },
    instances: {}
  };

  // Get all AWS instances that match the patterns
  const matchedInstances = getMatchingInstances(awsData, config.supported.instances);
  
  for (const [instanceType, instanceData] of Object.entries(matchedInstances)) {
    const spec = instanceData.spec;
    const instanceFamily = instanceType.split('.')[0];
    
    result.instances[instanceType] = {
      alternative_name: config.naming?.instances?.[instanceType] || instanceType,
      specs: { vcpu: spec.core, memory_gb: spec.memory },
      regions: {}
    };

    // Process each supported region
    for (const region of config.supported.regions) {
      if (!instanceData.regions[region]) continue;  // Skip if AWS doesn't offer here
      
      const awsRegionPricing = instanceData.regions[region];
      const altRegionName = config.naming?.regions?.[region] || region;
      
      result.instances[instanceType].regions[region] = {
        alternative_region: altRegionName,
        aws_pricing: {},
        alternative_pricing: {}
      };

      // Process each supported tier
      for (const tier of config.supported.tiers) {
        const awsTierKey = config.tier_mapping[tier];
        const awsPrice = awsRegionPricing[awsTierKey];
        
        if (awsPrice === undefined) continue;

        // Calculate alternative price
        const altPrice = calculatePrice(
          awsPrice,
          instanceType,
          instanceFamily,
          region,
          tier,
          config.pricing
        );

        result.instances[instanceType].regions[region].aws_pricing[tier] = round(awsPrice, 4);
        result.instances[instanceType].regions[region].alternative_pricing[tier] = round(altPrice, 4);
      }
    }
  }

  return result;
}


// ============================================================
// HELPER FUNCTIONS
// ============================================================

function calculatePrice(awsPrice, instanceType, instanceFamily, region, tier, pricingRules) {
  // Check for fixed price override first
  const fixedKey = `${instanceType}|${region}|${tier}`;
  if (pricingRules.fixed_prices?.[fixedKey] !== undefined) {
    return pricingRules.fixed_prices[fixedKey];
  }

  // Start with default discount
  let totalDiscountPct = pricingRules.default || 0;

  // Add tier adjustment (replaces default for that tier)
  if (pricingRules.by_tier?.[tier] !== undefined) {
    totalDiscountPct = pricingRules.by_tier[tier];
  }

  // Add region adjustment (additive)
  const regionPrefix = region.split('-').slice(0, 1)[0] + '-*';  // "us-*" from "us-east-1"
  if (pricingRules.by_region?.[regionPrefix] !== undefined) {
    totalDiscountPct += pricingRules.by_region[regionPrefix];
  } else if (pricingRules.by_region?.[region] !== undefined) {
    totalDiscountPct += pricingRules.by_region[region];
  }

  // Add instance family adjustment (additive)
  if (pricingRules.by_instance_family?.[instanceFamily] !== undefined) {
    totalDiscountPct += pricingRules.by_instance_family[instanceFamily];
  }

  // Apply discount: -20 means multiply by 0.80
  const multiplier = 1 + (totalDiscountPct / 100);
  return awsPrice * multiplier;
}

function getMatchingInstances(awsData, patterns) {
  const result = {};
  
  for (const [family, instances] of Object.entries(awsData)) {
    for (const [instanceType, instanceData] of Object.entries(instances)) {
      if (matchesPattern(instanceType, patterns)) {
        result[instanceType] = instanceData;
      }
    }
  }
  
  return result;
}

function matchesPattern(instanceType, patterns) {
  for (const pattern of patterns) {
    if (pattern === "*") return true;
    if (pattern.endsWith(".*")) {
      const prefix = pattern.slice(0, -2);
      if (instanceType.startsWith(prefix + ".")) return true;
    }
    if (pattern === instanceType) return true;
  }
  return false;
}

function round(value, decimals) {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}


// ============================================================
// TEST IT
// ============================================================

const awsData = require('./aws-ec2-data.json');
const output = generateAlternativeCloudPricing(awsData, exampleConfig);

// Show summary
console.log("Generated pricing for", Object.keys(output.instances).length, "instance types");
console.log("\nSample output for m6i.xlarge in us-east-1:");
console.log(JSON.stringify(output.instances["m6i.xlarge"]?.regions["us-east-1"], null, 2));

console.log("\n\nFull config that was used:");
console.log(JSON.stringify(exampleConfig, null, 2));

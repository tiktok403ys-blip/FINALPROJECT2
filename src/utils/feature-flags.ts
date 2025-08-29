/**
 * Feature Flag System for Casino Application
 * Provides safe toggle for experimental features
 */

import React from 'react';

export interface FeatureFlags {
  enablePerformanceMonitoring: boolean;
  enableABTesting: boolean;
  enableAutoRefresh: boolean;
}

// Default feature flags - start with safe defaults
const DEFAULT_FLAGS: FeatureFlags = {
  enablePerformanceMonitoring: true,
  enableABTesting: false,
  enableAutoRefresh: false,
};

// Environment-based overrides
const getEnvironmentFlags = (): Partial<FeatureFlags> => {
  const env = process.env.NODE_ENV;
  
  switch (env) {
    case 'development':
      return {
        enableABTesting: true,
        enableAutoRefresh: true,
      };
    case 'production':
      return {};
    default:
      return {};
  }
};

// Runtime feature flag management
class FeatureFlagManager {
  private flags: FeatureFlags;
  private listeners: Array<(flags: FeatureFlags) => void> = [];

  constructor() {
    this.flags = {
      ...DEFAULT_FLAGS,
      ...getEnvironmentFlags(),
    };
  }

  getFlag(key: keyof FeatureFlags): boolean {
    return this.flags[key];
  }

  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }

  setFlag(key: keyof FeatureFlags, value: boolean): void {
    this.flags[key] = value;
    this.notifyListeners();
  }

  updateFlags(updates: Partial<FeatureFlags>): void {
    this.flags = { ...this.flags, ...updates };
    this.notifyListeners();
  }

  subscribe(listener: (flags: FeatureFlags) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.flags));
  }

  // A/B Testing support
  getUserVariant(userId?: string): 'control' | 'treatment' {
    if (!this.getFlag('enableABTesting')) {
      return 'control';
    }

    // Simple hash-based A/B testing
    if (userId) {
      const hash = this.simpleHash(userId);
      return hash % 2 === 0 ? 'control' : 'treatment';
    }

    // Fallback to random for anonymous users
    return Math.random() < 0.5 ? 'control' : 'treatment';
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Emergency rollback
  emergencyRollback(): void {
    this.updateFlags({
      enableABTesting: false,
      enableAutoRefresh: false,
    });
    console.warn('Emergency rollback activated - all experimental features disabled');
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagManager();

// React hook for feature flags
export const useFeatureFlag = (flag: keyof FeatureFlags) => {
  const [value, setValue] = React.useState(featureFlags.getFlag(flag));

  React.useEffect(() => {
    const unsubscribe = featureFlags.subscribe((flags) => {
      setValue(flags[flag]);
    });
    return unsubscribe;
  }, [flag]);

  return value;
};

// Utility functions
export const isFeatureEnabled = (flag: keyof FeatureFlags): boolean => {
  return featureFlags.getFlag(flag);
};

export const withFeatureFlag = <T extends any[]>(
  flag: keyof FeatureFlags,
  enabledFn: (...args: T) => any,
  disabledFn: (...args: T) => any
) => {
  return (...args: T) => {
    return isFeatureEnabled(flag) ? enabledFn(...args) : disabledFn(...args);
  };
};
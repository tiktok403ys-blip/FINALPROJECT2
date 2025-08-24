'use client';

import React, { Suspense, lazy, ComponentType, useState, useRef, useEffect } from 'react';
import { LoadingSpinner } from './loading-spinner';

interface CodeSplitterProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  priority?: 'high' | 'medium' | 'low';
}

export function CodeSplitter({
  children,
  fallback = <LoadingSpinner />,
  priority = 'medium'
}: CodeSplitterProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

// Lazy loading wrapper with error boundary
export function withLazyLoading<T extends object>(
  Component: ComponentType<T>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(() =>
    import(`./${Component.name}`).catch(() => ({
      default: () => <div>Failed to load component</div>
    }))
  );

  return function WithLazyLoadingComponent(props: T) {
    return (
      <Suspense fallback={fallback || <LoadingSpinner />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Intersection Observer for progressive loading
export function withProgressiveLoading<T extends object>(
  Component: ComponentType<T>,
  options?: IntersectionObserverInit
) {
  return function ProgressiveLoadingComponent(props: T) {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        {
          rootMargin: '50px',
          threshold: 0.1,
          ...options
        }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      if (isVisible && !isLoaded) {
        // Simulate loading delay for demonstration
        const timer = setTimeout(() => setIsLoaded(true), 100);
        return () => clearTimeout(timer);
      }
    }, [isVisible, isLoaded]);

    if (!isVisible) {
      return <div ref={ref} style={{ minHeight: '200px' }} />;
    }

    if (!isLoaded) {
      return <LoadingSpinner />;
    }

    return <Component {...props} />;
  };
}

// Memory-aware component loader
export function withMemoryAwareness<T extends object>(
  Component: ComponentType<T>,
  memoryThreshold = 50 * 1024 * 1024 // 50MB
) {
  return function MemoryAwareComponent(props: T) {
    const [shouldLoad, setShouldLoad] = useState(true);

    useEffect(() => {
      const checkMemory = () => {
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          const usedMemory = memory.usedJSHeapSize;

          if (usedMemory > memoryThreshold) {
            console.warn('High memory usage detected, consider code splitting');
            // Could implement component unloading here
          }
        }
      };

      checkMemory();
      const interval = setInterval(checkMemory, 10000); // Check every 10s

      return () => clearInterval(interval);
    }, []);

    if (!shouldLoad) {
      return <div>Component unloaded due to high memory usage</div>;
    }

    return <Component {...props} />;
  };
}

// Network-aware component loader
export function withNetworkAwareness<T extends object>(
  Component: ComponentType<T>
) {
  return function NetworkAwareComponent(props: T) {
    const [isOnline, setIsOnline] = useState(true);
    const [connectionType, setConnectionType] = useState('unknown');

    useEffect(() => {
      const updateConnectionStatus = () => {
        setIsOnline(navigator.onLine);

        if ('connection' in navigator) {
          const connection = (navigator as any).connection;
          setConnectionType(connection.effectiveType || 'unknown');
        }
      };

      updateConnectionStatus();

      window.addEventListener('online', updateConnectionStatus);
      window.addEventListener('offline', updateConnectionStatus);

      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection.addEventListener('change', updateConnectionStatus);
      }

      return () => {
        window.removeEventListener('online', updateConnectionStatus);
        window.removeEventListener('offline', updateConnectionStatus);

        if ('connection' in navigator) {
          const connection = (navigator as any).connection;
          connection.removeEventListener('change', updateConnectionStatus);
        }
      };
    }, []);

    // Show simplified version on slow connections
    if (!isOnline || connectionType === 'slow-2g' || connectionType === '2g') {
      return (
        <div className="p-4 text-center">
          <p className="text-sm text-gray-400 mb-2">
            Slow connection detected
          </p>
          <p className="text-xs text-gray-500">
            Loading simplified version...
          </p>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// Bundle analyzer component
export function BundleAnalyzer() {
  const [bundleInfo, setBundleInfo] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'B') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isVisible) {
      // This would typically come from webpack bundle analyzer
      // For demo purposes, we'll simulate bundle data
      setBundleInfo({
        totalSize: '2.4 MB',
        gzippedSize: '756 KB',
        chunks: [
          { name: 'main', size: '1.2 MB', modules: 45 },
          { name: 'vendor', size: '890 KB', modules: 23 },
          { name: 'pages', size: '340 KB', modules: 12 }
        ]
      });
    }
  }, [isVisible]);

  if (!isVisible || !bundleInfo) return null;

  return (
    <div className="fixed top-4 left-4 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg p-4 text-xs font-mono z-50 max-w-md">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Bundle Analyzer</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Total Size:</span>
            <span className="text-white">{bundleInfo.totalSize}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Gzipped:</span>
            <span className="text-green-400">{bundleInfo.gzippedSize}</span>
          </div>
        </div>

        <div className="space-y-1">
          <h4 className="text-primary font-medium">Chunks:</h4>
          {bundleInfo.chunks.map((chunk: any, index: number) => (
            <div key={index} className="bg-black/50 rounded p-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300">{chunk.name}</span>
                <span className="text-white">{chunk.size}</span>
              </div>
              <div className="text-xs text-gray-500">
                {chunk.modules} modules
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-gray-500">
          Press Ctrl+Shift+B to toggle
        </div>
      </div>
    </div>
  );
}

// Performance-aware component wrapper
export function withPerformanceOptimization<T extends object>(
  Component: ComponentType<T>,
  options: {
    lazy?: boolean;
    progressive?: boolean;
    memoryAware?: boolean;
    networkAware?: boolean;
    priority?: 'high' | 'medium' | 'low';
  } = {}
) {
  let EnhancedComponent = Component;

  if (options.networkAware) {
    EnhancedComponent = withNetworkAwareness(EnhancedComponent);
  }

  if (options.memoryAware) {
    EnhancedComponent = withMemoryAwareness(EnhancedComponent);
  }

  if (options.progressive) {
    EnhancedComponent = withProgressiveLoading(EnhancedComponent);
  }

  if (options.lazy) {
    EnhancedComponent = withLazyLoading(EnhancedComponent);
  }

  return function PerformanceOptimizedComponent(props: T) {
    return (
      <CodeSplitter priority={options.priority}>
        <EnhancedComponent {...props} />
      </CodeSplitter>
    );
  };
}
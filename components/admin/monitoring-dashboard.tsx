'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Activity, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

interface DeploymentStatus {
  id: number;
  deployment_name: string;
  status: 'preparing' | 'blue_active' | 'testing' | 'green_active' | 'completed' | 'rolled_back';
  started_at: string;
  completed_at?: string;
  error_message?: string;
  metadata: any;
}

interface FunctionMetrics {
  id: number;
  function_name: string;
  execution_time_ms: number;
  success: boolean;
  error_message?: string;
  executed_at: string;
  user_id?: string;
}

interface HealthCheckResult {
  overall_status: 'healthy' | 'warning' | 'critical';
  functions_checked: number;
  functions_healthy: number;
  average_response_time: number;
  last_check: string;
  details: Array<{
    function_name: string;
    status: 'healthy' | 'error';
    response_time_ms: number;
    error?: string;
  }>;
}

export default function MonitoringDashboard() {
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus[]>([]);
  const [functionMetrics, setFunctionMetrics] = useState<FunctionMetrics[]>([]);
  const [healthCheck, setHealthCheck] = useState<HealthCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const supabase = createClientComponentClient();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch deployment status
      const { data: deployments } = await supabase
        .from('deployment_status')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);
      
      // Fetch function performance metrics
      const { data: metrics } = await supabase
        .from('function_performance_metrics')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(50);
      
      // Run health check
      const { data: healthData } = await supabase
        .rpc('check_tier1_health');
      
      if (deployments) setDeploymentStatus(deployments);
      if (metrics) setFunctionMetrics(metrics);
      if (healthData) setHealthCheck(healthData);
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': case 'healthy': return 'bg-green-500';
      case 'blue_active': case 'green_active': case 'testing': return 'bg-blue-500';
      case 'preparing': return 'bg-yellow-500';
      case 'rolled_back': case 'error': case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'blue_active': case 'green_active': case 'testing': return <Activity className="h-4 w-4" />;
      case 'preparing': return <Clock className="h-4 w-4" />;
      case 'rolled_back': case 'error': case 'critical': return <XCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const calculateSuccessRate = () => {
    if (functionMetrics.length === 0) return 0;
    const successCount = functionMetrics.filter(m => m.success).length;
    return Math.round((successCount / functionMetrics.length) * 100);
  };

  const calculateAverageResponseTime = () => {
    if (functionMetrics.length === 0) return 0;
    const totalTime = functionMetrics.reduce((sum, m) => sum + (m.execution_time_ms || 0), 0);
    return Math.round(totalTime / functionMetrics.length);
  };

  const criticalFunctions = ['is_authenticated_v2', 'is_admin_v2', 'is_owner_v2'];
  const criticalMetrics = functionMetrics.filter(m => criticalFunctions.includes(m.function_name));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Monitoring Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring for Tier 1 security functions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Last updated: {lastRefresh.toLocaleTimeString()}
      </div>

      {/* Health Check Overview */}
      {healthCheck && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(healthCheck.overall_status)}
              System Health Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{healthCheck.overall_status.toUpperCase()}</div>
                <div className="text-sm text-muted-foreground">Overall Status</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{healthCheck.functions_healthy}/{healthCheck.functions_checked}</div>
                <div className="text-sm text-muted-foreground">Functions Healthy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{healthCheck.average_response_time}ms</div>
                <div className="text-sm text-muted-foreground">Avg Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{calculateSuccessRate()}%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Critical Functions Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Critical Functions Performance</CardTitle>
          <CardDescription>
            Authentication, authorization, and ownership verification functions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {criticalFunctions.map(funcName => {
              const recentMetrics = criticalMetrics
                .filter(m => m.function_name === funcName)
                .slice(0, 10);
              const successRate = recentMetrics.length > 0 
                ? Math.round((recentMetrics.filter(m => m.success).length / recentMetrics.length) * 100)
                : 0;
              const avgTime = recentMetrics.length > 0
                ? Math.round(recentMetrics.reduce((sum, m) => sum + (m.execution_time_ms || 0), 0) / recentMetrics.length)
                : 0;
              
              return (
                <div key={funcName} className="p-4 border rounded-lg">
                  <div className="font-medium">{funcName}</div>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Success Rate:</span>
                      <Badge variant={successRate >= 95 ? 'default' : 'destructive'}>
                        {successRate}%
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg Time:</span>
                      <Badge variant={avgTime <= 100 ? 'default' : 'secondary'}>
                        {avgTime}ms
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Calls (10m):</span>
                      <span>{recentMetrics.length}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Deployment Status */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Deployments</CardTitle>
          <CardDescription>
            Blue-green deployment status and history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deploymentStatus.slice(0, 5).map(deployment => (
              <div key={deployment.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(deployment.status)}
                  <div>
                    <div className="font-medium">{deployment.deployment_name}</div>
                    <div className="text-sm text-muted-foreground">
                      Started: {new Date(deployment.started_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(deployment.status)}>
                    {deployment.status}
                  </Badge>
                  {deployment.error_message && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Function Calls */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Function Calls</CardTitle>
          <CardDescription>
            Latest authentication and authorization function executions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {functionMetrics.slice(0, 10).map(metric => (
              <div key={metric.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-3">
                  {metric.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <div>
                    <div className="font-medium text-sm">{metric.function_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(metric.executed_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={metric.execution_time_ms && metric.execution_time_ms > 100 ? 'secondary' : 'default'}>
                    {metric.execution_time_ms || 0}ms
                  </Badge>
                  {metric.error_message && (
                    <Badge variant="destructive">Error</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {healthCheck && healthCheck.overall_status !== 'healthy' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            System health status is {healthCheck.overall_status}. Please check function performance and error logs.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
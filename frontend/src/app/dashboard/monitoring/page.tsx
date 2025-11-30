'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, AlertTriangle, CheckCircle, Clock, TrendingUp, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SLAMetrics {
  p90_ai_message: number;
  p90_verification: number;
  p90_routing: number;
  error_rate: number;
  uptime: number;
  targets: {
    aiMessageP90: number;
    verificationP90: number;
    routingP90: number;
    errorRate: number;
    uptime: number;
  };
}

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState<SLAMetrics | null>(null);
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    fetchDashboardData();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/monitoring/sla/current', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/monitoring/sla/dashboard?days=7', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  const getStatusBadge = (actual: number, target: number, inverse = false) => {
    const isGood = inverse ? actual < target : actual > target;
    return isGood ? (
      <Badge variant="default" className="bg-green-500">
        <CheckCircle className="h-3 w-3 mr-1" />
        Healthy
      </Badge>
    ) : (
      <Badge variant="destructive">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Warning
      </Badge>
    );
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Monitoring</h1>
        <p className="text-muted-foreground">Real-time SLA metrics and performance</p>
      </div>

      {/* SLA Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              AI Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold">{metrics?.p90_ai_message || 0}ms</p>
              <p className="text-xs text-muted-foreground">
                Target: {metrics?.targets.aiMessageP90}ms (P90)
              </p>
              {metrics && getStatusBadge(metrics.p90_ai_message, metrics.targets.aiMessageP90, true)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Verification Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold">{metrics?.p90_verification || 0}ms</p>
              <p className="text-xs text-muted-foreground">
                Target: {metrics?.targets.verificationP90}ms (P90)
              </p>
              {metrics && getStatusBadge(metrics.p90_verification, metrics.targets.verificationP90, true)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Error Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold">{metrics?.error_rate.toFixed(2) || 0}%</p>
              <p className="text-xs text-muted-foreground">
                Target: &lt;{metrics?.targets.errorRate}%
              </p>
              {metrics && getStatusBadge(metrics.error_rate, metrics.targets.errorRate, true)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold">{metrics?.uptime.toFixed(2) || 0}%</p>
              <p className="text-xs text-muted-foreground">
                Target: {metrics?.targets.uptime}%
              </p>
              {metrics && getStatusBadge(metrics.uptime, metrics.targets.uptime)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="response-time">
        <TabsList>
          <TabsTrigger value="response-time">Response Time</TabsTrigger>
          <TabsTrigger value="error-rate">Error Rate</TabsTrigger>
          <TabsTrigger value="uptime">Uptime</TabsTrigger>
        </TabsList>

        <TabsContent value="response-time">
          <Card>
            <CardHeader>
              <CardTitle>AI Response Time (P90) - Last 7 Days</CardTitle>
              <CardDescription>Milliseconds</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="p90_ai" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="error-rate">
          <Card>
            <CardHeader>
              <CardTitle>Error Rate - Last 7 Days</CardTitle>
              <CardDescription>Percentage</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="error_rate" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="uptime">
          <Card>
            <CardHeader>
              <CardTitle>Uptime - Last 7 Days</CardTitle>
              <CardDescription>Percentage</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[99, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="uptime" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* SLA Targets */}
      <Card>
        <CardHeader>
          <CardTitle>SLA Targets (PRD v2)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span>Uptime</span>
              <span className="font-mono">99.9% per month (max 43.2 min downtime)</span>
            </div>
            <div className="flex justify-between items-center">
              <span>AI Message Generation (P90)</span>
              <span className="font-mono">&lt; 1s</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Lead Verification (P90)</span>
              <span className="font-mono">&lt; 500ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Lead Routing (P90)</span>
              <span className="font-mono">&lt; 5s</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Error Rate</span>
              <span className="font-mono">&lt; 0.1%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { ProtectedRoute } from '@/components/admin/protected-route';
import MonitoringDashboard from '@/components/admin/monitoring-dashboard';

export default function MonitoringPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto py-6">
        <MonitoringDashboard />
      </div>
    </ProtectedRoute>
  );
}
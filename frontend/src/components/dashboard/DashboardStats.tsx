'use client';

import React from 'react';
import { StatsCard, Stat } from '@/components/dashboard/StatsCard';

interface DashboardStatsProps {
    stats: Stat[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatsCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          href={stat.href}
          icon={stat.icon}
          description={stat.description}
        />
      ))}
    </div>
  );
};

export default DashboardStats;

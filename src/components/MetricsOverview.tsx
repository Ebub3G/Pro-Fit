
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Weight, Activity, Heart, Dumbbell, TrendingUp, TrendingDown } from 'lucide-react';

const MetricsOverview = () => {
  const metrics = [
    {
      title: 'Current Weight',
      value: '72.5',
      unit: 'kg',
      change: '-0.5',
      trend: 'down',
      icon: Weight,
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Body Fat',
      value: '15.2',
      unit: '%',
      change: '-0.8',
      trend: 'down',
      icon: Activity,
      color: 'green',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Muscle Mass',
      value: '58.3',
      unit: 'kg',
      change: '+0.3',
      trend: 'up',
      icon: Dumbbell,
      color: 'purple',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Weekly Workouts',
      value: '5',
      unit: '/7',
      change: '+2',
      trend: 'up',
      icon: Heart,
      color: 'red',
      gradient: 'from-red-500 to-orange-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <Card key={index} className="glass border border-white/10 hover-lift tech-border group metric-pulse">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 font-mono uppercase tracking-wider">
              {metric.title}
            </CardTitle>
            <div className={`p-2 rounded-lg bg-gradient-to-br ${metric.gradient} bg-opacity-20`}>
              <metric.icon className={`h-4 w-4 text-${metric.color}-400`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <div className={`text-3xl font-bold font-mono bg-gradient-to-r ${metric.gradient} bg-clip-text text-transparent`}>
                {metric.value}
              </div>
              <div className="text-lg text-slate-500 font-mono">{metric.unit}</div>
            </div>
            
            <div className={`flex items-center mt-2 text-sm font-mono`}>
              {metric.trend === 'up' ? (
                <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-blue-400 mr-1" />
              )}
              <span className={metric.trend === 'up' ? 'text-green-400' : 'text-blue-400'}>
                {metric.change} {metric.unit === '/7' ? '' : metric.unit}
              </span>
              <span className="text-slate-500 ml-1">from last week</span>
            </div>
            
            {/* Progress bar */}
            <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${metric.gradient} data-bar`} style={{ width: '75%' }}></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MetricsOverview;

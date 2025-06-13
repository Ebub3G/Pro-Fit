
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
      color: 'text-blue-600'
    },
    {
      title: 'Body Fat',
      value: '15.2',
      unit: '%',
      change: '-0.8',
      trend: 'down',
      icon: Activity,
      color: 'text-green-600'
    },
    {
      title: 'Muscle Mass',
      value: '58.3',
      unit: 'kg',
      change: '+0.3',
      trend: 'up',
      icon: Dumbbell,
      color: 'text-purple-600'
    },
    {
      title: 'Weekly Workouts',
      value: '5',
      unit: '/7',
      change: '+2',
      trend: 'up',
      icon: Heart,
      color: 'text-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </CardTitle>
            <metric.icon className={`h-4 w-4 ${metric.color}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <div className="text-3xl font-bold">
                {metric.value}
              </div>
              <div className="text-lg text-muted-foreground">{metric.unit}</div>
            </div>
            
            <div className="flex items-center mt-2 text-sm">
              {metric.trend === 'up' ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-blue-600 mr-1" />
              )}
              <span className={metric.trend === 'up' ? 'text-green-600' : 'text-blue-600'}>
                {metric.change} {metric.unit === '/7' ? '' : metric.unit}
              </span>
              <span className="text-muted-foreground ml-1">from last week</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MetricsOverview;

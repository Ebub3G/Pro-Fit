
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Weight, Activity, Heart, Dumbbell } from 'lucide-react';

const MetricsOverview = () => {
  const metrics = [
    {
      title: 'Current Weight',
      value: '72.5 kg',
      change: '-0.5 kg',
      trend: 'down',
      icon: Weight,
      color: 'text-blue-600'
    },
    {
      title: 'Body Fat',
      value: '15.2%',
      change: '-0.8%',
      trend: 'down',
      icon: Activity,
      color: 'text-green-600'
    },
    {
      title: 'Muscle Mass',
      value: '58.3 kg',
      change: '+0.3 kg',
      trend: 'up',
      icon: Dumbbell,
      color: 'text-purple-600'
    },
    {
      title: 'Weekly Workouts',
      value: '5/7',
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
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className={`text-xs ${metric.trend === 'up' ? 'text-green-600' : 'text-blue-600'} flex items-center mt-1`}>
              {metric.change} from last week
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MetricsOverview;

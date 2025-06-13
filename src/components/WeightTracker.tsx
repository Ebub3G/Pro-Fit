import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Crown, TrendingUp } from 'lucide-react';
import { useTier } from '@/contexts/TierContext';

const WeightTracker = () => {
  const { isPro, setTier } = useTier();
  const [weight, setWeight] = useState('');
  const [weightData, setWeightData] = useState([
    { date: '2024-05-01', weight: 75.2 },
    { date: '2024-05-08', weight: 74.8 },
    { date: '2024-05-15', weight: 74.1 },
    { date: '2024-05-22', weight: 73.5 },
    { date: '2024-05-29', weight: 72.9 },
    { date: '2024-06-05', weight: 72.5 },
  ]);

  const freeDataLimit = 7; // Show last 7 days for free users
  const displayData = isPro ? weightData : weightData.slice(-freeDataLimit);

  const addWeightEntry = () => {
    if (weight) {
      const today = new Date().toISOString().split('T')[0];
      setWeightData([...weightData, { date: today, weight: parseFloat(weight) }]);
      setWeight('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Weight Progress</CardTitle>
            {!isPro && (
              <Badge variant="outline" className="text-xs">
                Last {freeDataLimit} days
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!isPro && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Limited Historical Data</span>
              </div>
              <p className="text-xs text-amber-700">
                Upgrade to Pro to view complete weight history and advanced analytics.
              </p>
            </div>
          )}
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis 
                domain={['dataMin - 1', 'dataMax + 1']}
                tickFormatter={(value) => `${value} kg`}
              />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value) => [`${value} kg`, 'Weight']}
              />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          
          {!isPro && (
            <div className="mt-4 text-center">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setTier('pro')}
                className="border-amber-200 text-amber-700 hover:bg-amber-50"
              >
                <Crown className="h-3 w-3 mr-1" />
                Upgrade for Full History
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log Weight</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              placeholder="Enter your weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <Button onClick={addWeightEntry} className="w-full">
            Add Weight Entry
          </Button>

          <div className="mt-6">
            <h4 className="font-semibold mb-3">Recent Entries</h4>
            <div className="space-y-2">
              {weightData.slice(-3).reverse().map((entry, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="text-sm text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString()}
                  </span>
                  <span className="font-medium">{entry.weight} kg</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeightTracker;

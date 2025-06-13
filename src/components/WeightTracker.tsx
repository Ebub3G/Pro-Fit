
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Crown, TrendingUp, Scale, Plus } from 'lucide-react';
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

  const freeDataLimit = 7;
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
      <Card className="glass border border-white/10 hover-lift tech-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-mono">
              <Scale className="h-5 w-5 text-blue-400" />
              <span className="gradient-text">Weight Analytics</span>
            </CardTitle>
            {!isPro && (
              <Badge variant="outline" className="text-xs font-mono border-amber-500/30 text-amber-400">
                Last {freeDataLimit} days
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!isPro && (
            <div className="mb-4 p-4 glass border border-amber-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-300 font-mono">Limited Historical Data</span>
              </div>
              <p className="text-xs text-amber-400/70 font-mono">
                Upgrade to Pro to view complete weight history and advanced analytics.
              </p>
            </div>
          )}
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#475569' }}
                />
                <YAxis 
                  domain={['dataMin - 1', 'dataMax + 1']}
                  tickFormatter={(value) => `${value} kg`}
                  tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#475569' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '8px',
                    backdropFilter: 'blur(12px)',
                    color: '#E2E8F0',
                    fontFamily: 'monospace'
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value) => [`${value} kg`, 'Weight']}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fill="url(#weightGradient)"
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5, stroke: '#1E293B' }}
                  activeDot={{ r: 7, fill: '#60A5FA', stroke: '#3B82F6', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {!isPro && (
            <div className="mt-4 text-center">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setTier('pro')}
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 glass font-mono"
              >
                <Crown className="h-3 w-3 mr-1" />
                Upgrade for Full History
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass border border-white/10 hover-lift tech-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono gradient-text">
            <Plus className="h-5 w-5" />
            Log Weight
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weight" className="font-mono text-slate-400">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              placeholder="Enter your weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="glass border-white/10 focus:border-blue-400 font-mono text-lg"
            />
          </div>
          <Button 
            onClick={addWeightEntry} 
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 font-mono neon-glow-blue"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Weight Entry
          </Button>

          <div className="mt-6">
            <h4 className="font-semibold mb-3 font-mono text-slate-300">Recent Entries</h4>
            <div className="space-y-2">
              {weightData.slice(-3).reverse().map((entry, index) => (
                <div key={index} className="flex justify-between items-center p-3 glass border border-white/10 rounded-lg hover-lift">
                  <span className="text-sm text-slate-400 font-mono">
                    {new Date(entry.date).toLocaleDateString()}
                  </span>
                  <span className="font-medium font-mono text-blue-400">{entry.weight} kg</span>
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

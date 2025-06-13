import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Crown, TrendingUp, Scale, Plus } from 'lucide-react';
import { useTier } from '@/contexts/TierContext';
import { useAuth } from '@/contexts/AuthContext'; // New Import
import { supabase } from '@/integrations/supabase/client'; // New Import
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // New Import

const WeightTracker = () => {
  const { isPro, setTier } = useTier();
  const { user } = useAuth(); // Get current user from AuthContext
  const [weight, setWeight] = useState('');
  const queryClient = useQueryClient(); // Initialize query client

  // Function to fetch weight data from Supabase
  const fetchWeightData = async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('user_weights')
      .select('date, weight')
      .eq('user_id', user.id)
      .order('date', { ascending: true }); // Order by date for chart

    if (error) {
      console.error('Error fetching weight data:', error);
      return [];
    }
    return data;
  };

  // React Query hook for fetching data
  const { data: weightData = [], isLoading, isError } = useQuery({
    queryKey: ['weightData', user?.id], // Query key includes user ID for re-fetching on user change
    queryFn: fetchWeightData,
    enabled: !!user, // Only run query if user is logged in
  });

  // Mutation for adding new weight entry
  const addWeightMutation = useMutation({
    mutationFn: async (newWeight: number) => {
      if (!user) throw new Error('User not authenticated.');
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('user_weights')
        .insert({ user_id: user.id, date: today, weight: newWeight })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weightData', user?.id] }); // Invalidate and refetch weight data
      setWeight(''); // Clear input after successful add
    },
    onError: (error) => {
      console.error('Error adding weight entry:', error);
      // You could add a toast notification here
    },
  });

  const handleAddWeightEntry = () => {
    const parsedWeight = parseFloat(weight);
    if (parsedWeight > 0 && user) {
      addWeightMutation.mutate(parsedWeight);
    }
  };

  const freeDataLimit = 7;
  const displayData = isPro ? weightData : weightData.slice(-freeDataLimit);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-muted-foreground">Loading weight data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-destructive">Error loading weight data.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              Weight Analytics
            </CardTitle>
            {!isPro && (
              <Badge variant="outline" className="text-xs">
                Last {freeDataLimit} days
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!isPro && (
            <div className="mb-4 p-4 border border-yellow-500/30 rounded-lg bg-yellow-500/5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-700">Limited Historical Data</span>
              </div>
              <p className="text-xs text-yellow-600">
                Upgrade to Pro to view complete weight history and advanced analytics.
              </p>
            </div>
          )}

          <div className="h-80">
            {displayData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayData}>
                  <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    className="text-xs"
                  />
                  <YAxis
                    domain={['dataMin - 1', 'dataMax + 1']}
                    tickFormatter={(value) => `${value} kg`}
                    className="text-xs"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value) => [`${value} kg`, 'Weight']}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#weightGradient)"
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No weight data logged yet. Add your first entry!
              </div>
            )}
          </div>

          {!isPro && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTier('pro')}
                className="border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/10"
              >
                <Crown className="h-3 w-3 mr-1" />
                Upgrade for Full History
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Log Weight
          </CardTitle>
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
              disabled={addWeightMutation.isPending || !user} // Disable if loading or no user
            />
          </div>
          <Button
            onClick={handleAddWeightEntry}
            className="w-full"
            disabled={addWeightMutation.isPending || !user || !weight} // Disable if loading, no user, or no weight
          >
            {addWeightMutation.isPending ? 'Adding...' : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Weight Entry
              </>
            )}
          </Button>

          <div className="mt-6">
            <h4 className="font-semibold mb-3">Recent Entries</h4>
            <div className="space-y-2">
              {weightData.slice(-3).reverse().map((entry, index) => ( // Display last 3 entries
                <div key={entry.date || index} className="flex justify-between items-center p-3 border rounded-lg">
                  <span className="text-sm text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString()}
                  </span>
                  <span className="font-medium">{entry.weight} kg</span>
                </div>
              ))}
            </div>
            {weightData.length === 0 && (
              <p className="text-muted-foreground text-sm text-center">No recent entries.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeightTracker;

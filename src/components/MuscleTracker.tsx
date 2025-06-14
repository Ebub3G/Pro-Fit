import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const MuscleTracker = () => {
  const { user } = useAuth();
  const [measurements, setMeasurements] = useState({
    chest: '',
    biceps: '',
    waist: '',
    thighs: ''
  });
  const queryClient = useQueryClient();

  // Function to fetch muscle measurement data from Supabase
  const fetchMeasurementsData = async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('user_muscle_measurements')
      .select('date, chest, biceps, waist, thighs')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching muscle measurement data:', error);
      return [];
    }
    return data;
  };

  // React Query hook for fetching data
  const { data: measurementHistory = [], isLoading, isError } = useQuery({
    queryKey: ['muscleMeasurements', user?.id],
    queryFn: fetchMeasurementsData,
    enabled: !!user,
  });

  // Mutation for adding new measurement entry
  const addMeasurementMutation = useMutation({
    mutationFn: async (newEntry: { date: string, chest: number | null, biceps: number | null, waist: number | null, thighs: number | null }) => {
      if (!user) throw new Error('User not authenticated.');
      const { data, error } = await supabase
        .from('user_muscle_measurements')
        .insert({ user_id: user.id, ...newEntry })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['muscleMeasurements', user?.id] });
      setMeasurements({ chest: '', biceps: '', waist: '', thighs: '' });
    },
    onError: (error) => {
      console.error('Error saving measurements:', error);
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setMeasurements(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddMeasurement = () => {
    if (!user) {
      console.warn("User not authenticated for adding measurements.");
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const currentChest = measurements.chest !== '' ? parseFloat(measurements.chest) : (measurementHistory[0]?.chest || null);
    const currentBiceps = measurements.biceps !== '' ? parseFloat(measurements.biceps) : (measurementHistory[0]?.biceps || null);
    const currentWaist = measurements.waist !== '' ? parseFloat(measurements.waist) : (measurementHistory[0]?.waist || null);
    const currentThighs = measurements.thighs !== '' ? parseFloat(measurements.thighs) : (measurementHistory[0]?.thighs || null);

    if (
      (measurements.chest !== '' && !isNaN(currentChest)) ||
      (measurements.biceps !== '' && !isNaN(currentBiceps)) ||
      (measurements.waist !== '' && !isNaN(currentWaist)) ||
      (measurements.thighs !== '' && !isNaN(currentThighs))
    ) {
      addMeasurementMutation.mutate({
        date: today,
        chest: currentChest,
        biceps: currentBiceps,
        waist: currentWaist,
        thighs: currentThighs
      });
    } else {
      console.warn("No valid measurements entered to save.");
    }
  };

  const getChange = (current: number | null, previous: number | null) => {
    if (current === null || previous === null || isNaN(current) || isNaN(previous)) return 'N/A';
    const change = current - previous;
    return change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1);
  };

  const current = measurementHistory[0];
  const previous = measurementHistory[1];

  const measurements_display = [
    { name: 'Chest', value: current?.chest, color: 'text-blue-600' },
    { name: 'Biceps', value: current?.biceps, color: 'text-purple-600' },
    { name: 'Waist', value: current?.waist, color: 'text-green-600' },
    { name: 'Thighs', value: current?.thighs, color: 'text-orange-600' }
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-muted-foreground">Loading muscle measurements...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-destructive">Error loading muscle measurements.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Muscle Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {measurements_display.map((measurement, index) => (
              <div key={index} className="space-y-2">
                <div className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className={`text-2xl font-bold ${measurement.color}`}>
                    {measurement.value !== null && measurement.value !== undefined ? `${measurement.value} cm` : 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {measurement.name}
                  </div>
                  {previous && (
                    <Badge variant="outline" className="mt-2">
                      {getChange(measurement.value,
                        measurement.name === 'Chest' ? previous.chest :
                        measurement.name === 'Biceps' ? previous.biceps :
                        measurement.name === 'Waist' ? previous.waist : previous.thighs
                      )} cm
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Log Measurements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(measurements).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="capitalize">
                  {key} (cm)
                </Label>
                <Input
                  id={key}
                  type="number"
                  step="0.1"
                  placeholder={
                    key === 'chest' ? (measurementHistory[0]?.chest?.toString() || '95.0') :
                    key === 'biceps' ? (measurementHistory[0]?.biceps?.toString() || '35.0') :
                    key === 'waist' ? (measurementHistory[0]?.waist?.toString() || '82.0') :
                    (measurementHistory[0]?.thighs?.toString() || '55.0')
                  }
                  value={value}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  disabled={addMeasurementMutation.isPending || !user}
                />
              </div>
            ))}
          </div>

          <Button
            onClick={handleAddMeasurement}
            className="w-full"
            disabled={addMeasurementMutation.isPending || !user || Object.values(measurements).every(val => val === '')}
          >
            {addMeasurementMutation.isPending ? 'Saving...' : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Save Measurements
              </>
            )}
          </Button>
          {!user && (
            <p className="text-sm text-muted-foreground text-center">Please log in to save your measurements.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MuscleTracker;

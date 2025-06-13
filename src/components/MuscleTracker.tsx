
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Plus } from 'lucide-react';

const MuscleTracker = () => {
  const [measurements, setMeasurements] = useState({
    chest: '',
    biceps: '',
    waist: '',
    thighs: ''
  });

  const [measurementHistory, setMeasurementHistory] = useState([
    {
      date: '2024-06-01',
      chest: 95,
      biceps: 35,
      waist: 82,
      thighs: 55
    },
    {
      date: '2024-05-15',
      chest: 94,
      biceps: 34.5,
      waist: 83,
      thighs: 54.5
    }
  ]);

  const handleInputChange = (field: string, value: string) => {
    setMeasurements(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addMeasurement = () => {
    if (Object.values(measurements).some(val => val !== '')) {
      const today = new Date().toISOString().split('T')[0];
      const newEntry = {
        date: today,
        chest: parseFloat(measurements.chest) || measurementHistory[0]?.chest || 0,
        biceps: parseFloat(measurements.biceps) || measurementHistory[0]?.biceps || 0,
        waist: parseFloat(measurements.waist) || measurementHistory[0]?.waist || 0,
        thighs: parseFloat(measurements.thighs) || measurementHistory[0]?.thighs || 0
      };
      
      setMeasurementHistory([newEntry, ...measurementHistory]);
      setMeasurements({ chest: '', biceps: '', waist: '', thighs: '' });
    }
  };

  const getChange = (current: number, previous: number) => {
    const change = current - previous;
    return change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1);
  };

  const current = measurementHistory[0];
  const previous = measurementHistory[1];

  const measurements_display = [
    { name: 'Chest', value: current?.chest, color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-500/10' },
    { name: 'Biceps', value: current?.biceps, color: 'from-purple-500 to-pink-500', bgColor: 'bg-purple-500/10' },
    { name: 'Waist', value: current?.waist, color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-500/10' },
    { name: 'Thighs', value: current?.thighs, color: 'from-orange-500 to-red-500', bgColor: 'bg-orange-500/10' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="glass border border-white/10 hover-lift tech-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono gradient-text">
            <Dumbbell className="h-5 w-5" />
            Muscle Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {measurements_display.map((measurement, index) => (
              <div key={index} className="space-y-2">
                <div className={`text-center p-4 glass border border-white/10 rounded-lg hover-lift ${measurement.bgColor}`}>
                  <div className={`text-2xl font-bold font-mono bg-gradient-to-r ${measurement.color} bg-clip-text text-transparent`}>
                    {measurement.value} cm
                  </div>
                  <div className="text-sm text-slate-400 font-mono uppercase tracking-wider">
                    {measurement.name}
                  </div>
                  {previous && (
                    <Badge variant="outline" className="mt-2 font-mono border-white/20">
                      {getChange(measurement.value, 
                        measurement.name === 'Chest' ? previous.chest :
                        measurement.name === 'Biceps' ? previous.biceps :
                        measurement.name === 'Waist' ? previous.waist : previous.thighs
                      )} cm
                    </Badge>
                  )}
                  {/* Progress visualization */}
                  <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${measurement.color} data-bar`} style={{ width: '70%' }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass border border-white/10 hover-lift tech-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono gradient-text">
            <Plus className="h-5 w-5" />
            Log Measurements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(measurements).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="font-mono text-slate-400 capitalize">
                  {key} (cm)
                </Label>
                <Input
                  id={key}
                  type="number"
                  step="0.1"
                  placeholder={key === 'chest' ? '95.0' : key === 'biceps' ? '35.0' : key === 'waist' ? '82.0' : '55.0'}
                  value={value}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  className="glass border-white/10 focus:border-purple-400 font-mono"
                />
              </div>
            ))}
          </div>
          
          <Button 
            onClick={addMeasurement} 
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-mono neon-glow-purple"
          >
            <Plus className="h-4 w-4 mr-2" />
            Save Measurements
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MuscleTracker;

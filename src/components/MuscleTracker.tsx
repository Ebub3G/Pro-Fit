
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Measurements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{current?.chest} cm</div>
                <div className="text-sm text-muted-foreground">Chest</div>
                {previous && (
                  <Badge variant="outline" className="mt-1">
                    {getChange(current.chest, previous.chest)} cm
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{current?.biceps} cm</div>
                <div className="text-sm text-muted-foreground">Biceps</div>
                {previous && (
                  <Badge variant="outline" className="mt-1">
                    {getChange(current.biceps, previous.biceps)} cm
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{current?.waist} cm</div>
                <div className="text-sm text-muted-foreground">Waist</div>
                {previous && (
                  <Badge variant="outline" className="mt-1">
                    {getChange(current.waist, previous.waist)} cm
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{current?.thighs} cm</div>
                <div className="text-sm text-muted-foreground">Thighs</div>
                {previous && (
                  <Badge variant="outline" className="mt-1">
                    {getChange(current.thighs, previous.thighs)} cm
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log Measurements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chest">Chest (cm)</Label>
              <Input
                id="chest"
                type="number"
                step="0.1"
                placeholder="95.0"
                value={measurements.chest}
                onChange={(e) => handleInputChange('chest', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="biceps">Biceps (cm)</Label>
              <Input
                id="biceps"
                type="number"
                step="0.1"
                placeholder="35.0"
                value={measurements.biceps}
                onChange={(e) => handleInputChange('biceps', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="waist">Waist (cm)</Label>
              <Input
                id="waist"
                type="number"
                step="0.1"
                placeholder="82.0"
                value={measurements.waist}
                onChange={(e) => handleInputChange('waist', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="thighs">Thighs (cm)</Label>
              <Input
                id="thighs"
                type="number"
                step="0.1"
                placeholder="55.0"
                value={measurements.thighs}
                onChange={(e) => handleInputChange('thighs', e.target.value)}
              />
            </div>
          </div>
          
          <Button onClick={addMeasurement} className="w-full">
            Save Measurements
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MuscleTracker;

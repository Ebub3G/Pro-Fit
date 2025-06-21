
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Zap, Apple, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import LoadingSpinner from '@/components/LoadingSpinner';

const AIPlanGenerator = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [planType, setPlanType] = useState<string>('');

  const generatePlanMutation = useMutation({
    mutationFn: async (type: string) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase.functions.invoke('generate-fitness-plan', {
        body: { planType: type }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Success!',
        description: `Your AI-generated ${planType} plan has been created with daily tasks.`,
      });
      queryClient.invalidateQueries({ queryKey: ['user-plans'] });
      queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
      setPlanType('');
    },
    onError: (error: any) => {
      console.error('Plan generation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate plan. Please make sure your profile is complete.',
        variant: 'destructive',
      });
    },
  });

  const handleGeneratePlan = () => {
    if (!planType) {
      toast({
        title: 'Selection Required',
        description: 'Please select a plan type first.',
        variant: 'destructive',
      });
      return;
    }
    generatePlanMutation.mutate(planType);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <span>AI Plan Generator</span>
        </CardTitle>
        <CardDescription>
          Generate personalized workout and nutrition plans using AI based on your profile and goals.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
            <Activity className="h-5 w-5 text-blue-600" />
            <div className="text-sm">
              <div className="font-medium">Workout Plan</div>
              <div className="text-gray-600">Custom exercises & schedule</div>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
            <Apple className="h-5 w-5 text-green-600" />
            <div className="text-sm">
              <div className="font-medium">Nutrition Plan</div>
              <div className="text-gray-600">Meal ideas & macro targets</div>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg">
            <Zap className="h-5 w-5 text-purple-600" />
            <div className="text-sm">
              <div className="font-medium">Combined Plan</div>
              <div className="text-gray-600">Complete fitness solution</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Plan Type</label>
            <Select value={planType} onValueChange={setPlanType}>
              <SelectTrigger>
                <SelectValue placeholder="Choose what type of plan to generate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="workout">Workout Plan Only</SelectItem>
                <SelectItem value="nutrition">Nutrition Plan Only</SelectItem>
                <SelectItem value="combined">Combined Plan (Workout + Nutrition)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleGeneratePlan}
            disabled={generatePlanMutation.isPending || !planType}
            className="w-full"
          >
            {generatePlanMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" />
                Generating AI Plan...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Generate AI Plan
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-gray-500 mt-4">
          <p>💡 Make sure your profile is complete (height, weight, age, gender, activity level) for the best results.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIPlanGenerator;

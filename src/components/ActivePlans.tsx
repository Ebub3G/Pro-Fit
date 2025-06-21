
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Calendar, Trash2, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface AIPlan {
  id: string;
  plan_type: string;
  title: string;
  description: string | null;
  plan_data: any;
  created_at: string;
  is_active: boolean;
}

const ActivePlans = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plans, isLoading } = useQuery({
    queryKey: ['user-plans', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_ai_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AIPlan[];
    },
    enabled: !!user,
  });

  const deactivatePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from('user_ai_plans')
        .update({ is_active: false })
        .eq('id', planId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Plan Deactivated',
        description: 'The plan has been removed from your active plans.',
      });
      queryClient.invalidateQueries({ queryKey: ['user-plans'] });
      queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
    },
    onError: (error) => {
      console.error('Deactivate plan error:', error);
      toast({
        title: 'Error',
        description: 'Failed to deactivate plan.',
        variant: 'destructive',
      });
    },
  });

  const formatPlanData = (planData: any, planType: string) => {
    if (!planData) return 'No data available';

    let content = [];

    if (planType === 'workout' || planType === 'combined') {
      if (planData.weeklyPlan) {
        content.push(
          <div key="workout" className="mb-4">
            <h4 className="font-semibold mb-2">Weekly Workout Schedule:</h4>
            <div className="space-y-2">
              {Object.entries(planData.weeklyPlan).map(([day, data]: [string, any]) => (
                <div key={day} className="p-2 bg-blue-50 rounded">
                  <div className="font-medium capitalize">{day}: {data.focus}</div>
                  <div className="text-sm text-gray-600">
                    {data.exercises?.length || 0} exercises planned
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
    }

    if (planType === 'nutrition' || planType === 'combined') {
      if (planData.nutritionPlan) {
        content.push(
          <div key="nutrition" className="mb-4">
            <h4 className="font-semibold mb-2">Nutrition Plan:</h4>
            <div className="p-2 bg-green-50 rounded">
              <div className="text-sm">
                <div><strong>Daily Calories:</strong> {planData.nutritionPlan.dailyCalories}</div>
                <div><strong>Hydration:</strong> {planData.nutritionPlan.hydration}</div>
                {planData.nutritionPlan.macros && (
                  <div><strong>Macros:</strong> P: {planData.nutritionPlan.macros.protein}, C: {planData.nutritionPlan.macros.carbs}, F: {planData.nutritionPlan.macros.fat}</div>
                )}
              </div>
            </div>
          </div>
        );
      }
    }

    return content;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>Active AI Plans</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5" />
          <span>Active AI Plans</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!plans || plans.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No active plans found.</p>
            <p className="text-sm">Generate your first AI plan to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <div key={plan.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">{plan.title}</h3>
                    <Badge variant={plan.plan_type === 'combined' ? 'default' : 'secondary'}>
                      {plan.plan_type}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{plan.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {plan.description && (
                            <p className="text-sm text-gray-600">{plan.description}</p>
                          )}
                          {formatPlanData(plan.plan_data, plan.plan_type)}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deactivatePlanMutation.mutate(plan.id)}
                      disabled={deactivatePlanMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {plan.description && (
                  <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                )}
                
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  <span>Created: {new Date(plan.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivePlans;

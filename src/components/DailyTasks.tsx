
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar, Target } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

interface DailyTask {
  id: string;
  title: string;
  description: string | null;
  task_type: 'workout' | 'nutrition' | 'habit';
  is_completed: boolean;
  target_date: string;
}

const DailyTasks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split('T')[0];

  const { data: todayTasks, isLoading } = useQuery({
    queryKey: ['daily-tasks', user?.id, today],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_daily_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('target_date', today)
        .order('task_type');

      if (error) throw error;
      return data as DailyTask[];
    },
    enabled: !!user,
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      const updateData: any = {
        is_completed: completed,
      };
      
      if (completed) {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }

      const { error } = await supabase
        .from('user_daily_tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-tasks', user?.id, today] });
      toast({
        title: 'Task Updated',
        description: 'Your progress has been saved.',
      });
    },
    onError: (error) => {
      console.error('Task update error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task.',
        variant: 'destructive',
      });
    },
  });

  const handleTaskToggle = (taskId: string, completed: boolean) => {
    toggleTaskMutation.mutate({ taskId, completed });
  };

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'workout':
        return 'bg-blue-100 text-blue-800';
      case 'nutrition':
        return 'bg-green-100 text-green-800';
      case 'habit':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const completedTasks = todayTasks?.filter(task => task.is_completed).length || 0;
  const totalTasks = todayTasks?.length || 0;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Today's Tasks</span>
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
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Today's Tasks</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </CardTitle>
        {totalTasks > 0 && (
          <div className="flex items-center space-x-4">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span className="text-sm font-medium text-green-600">
              {completedTasks}/{totalTasks} ({completionPercentage}%)
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!todayTasks || todayTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No tasks for today.</p>
            <p className="text-sm">Generate an AI plan to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayTasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                  task.is_completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <Checkbox
                  checked={task.is_completed}
                  onCheckedChange={(checked) => 
                    handleTaskToggle(task.id, checked as boolean)
                  }
                  disabled={toggleTaskMutation.isPending}
                />
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-sm font-medium ${
                        task.is_completed ? 'line-through text-gray-500' : ''
                      }`}
                    >
                      {task.title}
                    </span>
                    <Badge className={getTaskTypeColor(task.task_type)}>
                      {task.task_type}
                    </Badge>
                  </div>
                  {task.description && (
                    <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                  )}
                </div>

                {task.is_completed && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>
            ))}
          </div>
        )}

        {totalTasks > 0 && completedTasks === totalTasks && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
            <CheckCircle className="h-6 w-6 mx-auto text-green-600 mb-1" />
            <p className="text-sm font-medium text-green-800">
              🎉 Great job! You've completed all your tasks for today!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyTasks;

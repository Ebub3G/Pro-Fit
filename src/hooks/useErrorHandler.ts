
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useErrorHandler = () => {
  const { toast } = useToast();

  const handleError = useCallback((error: unknown, customMessage?: string) => {
    console.error('Error occurred:', error);
    
    let errorMessage = customMessage || 'An unexpected error occurred';
    
    if (error instanceof Error) {
      // Don't expose technical error messages to users
      if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
        errorMessage = 'Please sign in to continue.';
      } else if (error.message.includes('forbidden') || error.message.includes('403')) {
        errorMessage = 'You do not have permission to perform this action.';
      }
    }

    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  }, [toast]);

  return { handleError };
};

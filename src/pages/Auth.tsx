
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Eye, EyeOff, Moon, Sun, Mail, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';

// Define validation schema using Zod
const authSchema = z.object({
  emailOrPhone: z.string().min(1, { message: "Email or phone number is required." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type AuthFormValues = z.infer<typeof authSchema>;

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputType, setInputType] = useState<'email' | 'phone'>('email');

  const { signIn, signUp, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Initialize react-hook-form
  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      emailOrPhone: '',
      password: '',
    },
    mode: "onChange"
  });

  const { register, handleSubmit, formState: { errors }, getValues, reset, watch } = form;

  // Watch the emailOrPhone field to detect if it's email or phone
  const emailOrPhone = watch('emailOrPhone');

  useEffect(() => {
    // Detect if input is email or phone
    const isEmail = emailOrPhone?.includes('@');
    const isPhone = /^\+?[\d\s\-\(\)]+$/.test(emailOrPhone || '');
    
    if (isEmail) {
      setInputType('email');
    } else if (isPhone || emailOrPhone?.startsWith('+')) {
      setInputType('phone');
    }
  }, [emailOrPhone]);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const isValidPhone = (value: string) => {
    // Basic phone validation - should start with + and contain 10-15 digits
    return /^\+[1-9]\d{1,14}$/.test(value.replace(/[\s\-\(\)]/g, ''));
  };

  const onSubmit = async (data: AuthFormValues) => {
    setLoading(true);

    try {
      const isEmail = isValidEmail(data.emailOrPhone);
      const isPhone = isValidPhone(data.emailOrPhone);

      if (!isEmail && !isPhone) {
        toast({
          title: "Invalid Input",
          description: "Please enter a valid email address or phone number (with country code, e.g., +1234567890)",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      let result;
      if (isEmail) {
        result = isLogin
          ? await signIn(data.emailOrPhone, data.password)
          : await signUp(data.emailOrPhone, data.password);
      } else {
        // Handle phone authentication
        if (isLogin) {
          const { error } = await supabase.auth.signInWithPassword({
            phone: data.emailOrPhone,
            password: data.password,
          });
          result = { error };
        } else {
          const { error } = await supabase.auth.signUp({
            phone: data.emailOrPhone,
            password: data.password,
          });
          result = { error };
        }
      }

      if (result.error) {
        toast({
          title: "Authentication Error",
          description: result.error.message,
          variant: "destructive",
        });
      } else if (!isLogin) {
        if (isPhone) {
          toast({
            title: "Account Created",
            description: "Please check your phone for the verification code.",
          });
        } else {
          toast({
            title: "Account Created",
            description: "Please check your email to confirm your account and sign in.",
          });
        }
        setIsLogin(true);
      } else {
        toast({
          title: "Signed In",
          description: "Welcome back to FitTracker.AI!",
        });
      }
    } catch (error) {
      console.error("An unexpected error occurred:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const emailOrPhone = getValues("emailOrPhone");
    if (!emailOrPhone) {
      toast({
        title: "Invalid Input",
        description: "Please enter your email address to reset your password.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidEmail(emailOrPhone)) {
      toast({
        title: "Invalid Email",
        description: "Password reset is only available for email accounts. Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailOrPhone, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Password Reset Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password Reset Email Sent",
          description: `A password reset link has been sent to ${emailOrPhone}. Please check your inbox.`,
        });
      }
    } catch (error) {
      console.error("An unexpected error occurred during password reset:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Activity className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">FitTracker.AI</span>
          </div>
          <CardTitle>{isLogin ? 'Welcome Back' : 'Create Account'}</CardTitle>
          <CardDescription>
            {isLogin ? 'Sign in to your account' : 'Sign up to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailOrPhone">Email or Phone Number</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    {inputType === 'email' ? (
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <Input
                    id="emailOrPhone"
                    type="text"
                    placeholder="Enter email or phone number (+1234567890)"
                    className="pl-10"
                    {...register("emailOrPhone")}
                    aria-invalid={errors.emailOrPhone ? "true" : "false"}
                    disabled={loading}
                  />
                </div>
                {errors.emailOrPhone && (
                  <p className="text-destructive text-sm mt-1">{errors.emailOrPhone.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Use email (user@example.com) or phone with country code (+1234567890)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    {...register("password")}
                    aria-invalid={errors.password ? "true" : "false"}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-destructive text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              {isLogin && (
                <div className="text-right">
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm text-muted-foreground hover:text-primary p-0 h-auto"
                    onClick={handleForgotPassword}
                    disabled={loading}
                  >
                    Forgot password?
                  </Button>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  reset({ emailOrPhone: '', password: '' });
                }}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Circle, AlertCircle, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProfileData {
  height_cm?: number | null;
  age?: number | null;
  gender?: string | null;
  activity_level?: string | null;
  current_weight?: number | null;
  target_weight?: number | null;
  fitness_goal?: string | null;
}

interface ProfileCompletionGuideProps {
  profile: ProfileData | null;
  isLoading?: boolean;
}

const ProfileCompletionGuide: React.FC<ProfileCompletionGuideProps> = ({ profile, isLoading }) => {
  const checks = [
    { key: 'height_cm', label: 'Height', value: profile?.height_cm },
    { key: 'age', label: 'Age', value: profile?.age },
    { key: 'gender', label: 'Gender', value: profile?.gender },
    { key: 'activity_level', label: 'Activity Level', value: profile?.activity_level },
    { key: 'current_weight', label: 'Current Weight', value: profile?.current_weight },
    { key: 'target_weight', label: 'Target Weight', value: profile?.target_weight },
    { key: 'fitness_goal', label: 'Fitness Goal', value: profile?.fitness_goal },
  ];

  const completedChecks = checks.filter(check => check.value !== null && check.value !== undefined && check.value !== 0);
  const missingChecks = checks.filter(check => check.value === null || check.value === undefined || check.value === 0);
  const isProfileComplete = missingChecks.length === 0;

  if (isLoading) {
    return null;
  }

  if (isProfileComplete) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Your profile is complete! You can now generate personalized AI fitness plans.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-orange-800">
          <AlertCircle className="h-5 w-5" />
          <span>Complete Your Profile</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-orange-700 text-sm">
          Complete your profile to get personalized AI fitness and nutrition plans.
        </p>
        
        <div className="space-y-2">
          {checks.map((check) => (
            <div key={check.key} className="flex items-center space-x-2">
              {check.value !== null && check.value !== undefined && check.value !== 0 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-gray-400" />
              )}
              <span className={`text-sm ${check.value !== null && check.value !== undefined && check.value !== 0 ? 'text-green-700' : 'text-gray-600'}`}>
                {check.label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-orange-700">
            {completedChecks.length} of {checks.length} completed
          </span>
          <Link to="/profile">
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
              <User className="h-4 w-4 mr-2" />
              Complete Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCompletionGuide;

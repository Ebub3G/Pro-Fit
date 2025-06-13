
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Lock } from 'lucide-react';
import { useTier } from '@/contexts/TierContext';

interface PremiumFeatureProps {
  children: React.ReactNode;
  feature: string;
  description: string;
}

const PremiumFeature = ({ children, feature, description }: PremiumFeatureProps) => {
  const { isPro, setTier } = useTier();

  if (isPro) {
    return <>{children}</>;
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50 opacity-50" />
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-600" />
            {feature}
          </CardTitle>
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            <Crown className="h-3 w-3 mr-1" />
            PRO
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="space-y-4">
          <p className="text-muted-foreground">{description}</p>
          <Button 
            onClick={() => setTier('pro')} 
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            Upgrade to Pro
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PremiumFeature;

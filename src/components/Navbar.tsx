
import React from 'react';
import { Activity, User, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTier } from '@/contexts/TierContext';

const Navbar = () => {
  const { tier, setTier, isPro } = useTier();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary">FitTracker</span>
          </div>
          <div className="flex items-center space-x-4">
            {isPro ? (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                <Crown className="h-3 w-3 mr-1" />
                PRO
              </Badge>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setTier('pro')}
                className="border-amber-200 text-amber-700 hover:bg-amber-50"
              >
                <Crown className="h-4 w-4 mr-1" />
                Upgrade to Pro
              </Button>
            )}
            <button className="text-muted-foreground hover:text-primary transition-colors">
              <User className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

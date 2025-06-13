
import React from 'react';
import { Activity, User, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTier } from '@/contexts/TierContext';

const Navbar = () => {
  const { tier, setTier, isPro } = useTier();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Activity className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">FitTracker.AI</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {isPro ? (
              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                <Crown className="h-3 w-3 mr-1" />
                PRO
              </Badge>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setTier('pro')}
                className="border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/10"
              >
                <Zap className="h-4 w-4 mr-1" />
                Upgrade
              </Button>
            )}
            
            <button className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-accent">
              <User className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

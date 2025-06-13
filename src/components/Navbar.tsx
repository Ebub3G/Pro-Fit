
import React from 'react';
import { Activity, User, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTier } from '@/contexts/TierContext';

const Navbar = () => {
  const { tier, setTier, isPro } = useTier();

  return (
    <nav className="glass border-b border-white/10 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Activity className="h-8 w-8 text-blue-400 neon-glow-blue" />
              <div className="absolute inset-0 h-8 w-8 text-blue-400 animate-ping opacity-20">
                <Activity className="h-8 w-8" />
              </div>
            </div>
            <span className="text-xl font-bold gradient-text">FitTracker.AI</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {isPro ? (
              <Badge variant="secondary" className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/30 neon-glow-cyan px-3 py-1">
                <Crown className="h-3 w-3 mr-1" />
                <span className="font-mono text-xs">PRO</span>
              </Badge>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setTier('pro')}
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 transition-all duration-300 hover:neon-glow-cyan glass"
              >
                <Zap className="h-4 w-4 mr-1" />
                <span className="font-mono">Upgrade</span>
              </Button>
            )}
            
            <button className="text-slate-400 hover:text-blue-400 transition-all duration-300 p-2 rounded-lg hover:bg-blue-500/10">
              <User className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

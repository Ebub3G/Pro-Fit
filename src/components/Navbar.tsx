
import React from 'react';
import { Link } from 'react-router-dom';
import { User, Crown, Zap, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTier } from '@/contexts/TierContext';
import { useTheme } from '@/contexts/ThemeContext';

const Navbar = () => {
  const { tier, setTier, isPro } = useTier();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <img 
              src={theme === 'dark' 
                ? "/lovable-uploads/6378ad8a-dcef-458a-8023-41ff91393ca8.png" 
                : "/lovable-uploads/8f4b558f-6815-4ad6-bbf6-55f64ea9f79b.png"
              }
              alt="FitTracker.AI Logo"
              className="h-14 w-auto"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

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
            
            <Link to="/profile">
              <button className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-accent">
                <User className="h-6 w-6" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

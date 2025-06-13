
import React, { createContext, useContext, useState } from 'react';

export type UserTier = 'free' | 'pro';

interface TierContextType {
  tier: UserTier;
  setTier: (tier: UserTier) => void;
  isPro: boolean;
}

const TierContext = createContext<TierContextType | undefined>(undefined);

export const TierProvider = ({ children }: { children: React.ReactNode }) => {
  const [tier, setTier] = useState<UserTier>('free');

  return (
    <TierContext.Provider value={{ 
      tier, 
      setTier, 
      isPro: tier === 'pro' 
    }}>
      {children}
    </TierContext.Provider>
  );
};

export const useTier = () => {
  const context = useContext(TierContext);
  if (!context) {
    throw new Error('useTier must be used within a TierProvider');
  }
  return context;
};

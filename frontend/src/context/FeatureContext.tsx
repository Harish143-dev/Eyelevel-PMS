import React, { createContext, useContext, type ReactNode } from 'react';
import { useAppSelector } from '../hooks/useRedux';

// Default all features to true so legacy/solo accounts work,
// explicitly false will be returned by the server if disabled
interface FeatureContextType {
  [key: string]: boolean;
}

const FeatureContext = createContext<FeatureContextType>({});

export const FeatureProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAppSelector((state) => state.auth);
  
  // Get features from the user object via Redux
  const companyFeatures = (user as any)?.company?.features as Record<string, boolean> | undefined;

  // Create a proxy/handler so missing keys default to true
  const features = new Proxy(companyFeatures || {}, {
    get: function(target, prop: string) {
      // If it exists in the company object and is false, return false
      if (target[prop] === false) return false;
      // Default to true for any missing feature
      return true; 
    }
  });

  return (
    <FeatureContext.Provider value={features as FeatureContextType}>
      {children}
    </FeatureContext.Provider>
  );
};

export const useFeature = (key: string): boolean => {
  const features = useContext(FeatureContext);
  return features[key];
};


import React, { createContext, useState, useContext, ReactNode } from 'react';
import { metricExplanations } from '../data/metricExplanations';
import { metricCalculationGenerators } from '../data/metricCalculations';
import ExplanationModal from './ExplanationModal';
import type { Company } from '../types';

interface ExplanationContextType {
  showExplanation: (metricKey: string, company: Company, context?: any, title?: string) => void;
}

const ExplanationContext = createContext<ExplanationContextType | undefined>(undefined);

export const useExplanation = () => {
  const context = useContext(ExplanationContext);
  if (!context) {
    throw new Error('useExplanation must be used within an ExplanationProvider');
  }
  return context;
};

// FIX: Changed component definition to use React.FC for better type safety with children.
export const ExplanationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalData, setModalData] = useState<{ title: string; content: string; calculationLogic: string | null } | null>(null);

  const showExplanation = (metricKey: string, company: Company, context?: any, customTitle?: string) => {
    const content = metricExplanations[metricKey];
    
    // Check if a generator function exists for this key
    const calculationGenerator = metricCalculationGenerators[metricKey];
    const calculation = calculationGenerator ? calculationGenerator(company, context) : null;

    if (content) {
      const title = customTitle || metricKey.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
      setModalData({ title, content, calculationLogic: calculation });
    } else {
        console.warn(`No explanation found for metric key: ${metricKey}`);
    }
  };
  
  const hideExplanation = () => {
    setModalData(null);
  };
  
  const value = { showExplanation };
  
  return (
    <ExplanationContext.Provider value={value}>
      {children}
      <ExplanationModal 
        isOpen={!!modalData}
        onClose={hideExplanation}
        title={modalData?.title || ''}
        explanation={modalData?.content || ''}
        calculationLogic={modalData?.calculationLogic || null}
      />
    </ExplanationContext.Provider>
  );
};
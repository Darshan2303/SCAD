
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import type { TooltipContextType } from '../types';

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

export const useTooltip = () => {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('useTooltip must be used within a TooltipProvider');
  }
  return context;
};

interface TooltipState {
  visible: boolean;
  content: string;
  x: number;
  y: number;
}

export const TooltipProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    content: '',
    x: 0,
    y: 0,
  });

  const showTooltip = useCallback((content: string, rect: DOMRect) => {
    setTooltip({
      visible: true,
      content,
      x: rect.left + rect.width / 2, // Center horizontally
      y: rect.top - 8, // Position above the element
    });
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  const value = { showTooltip, hideTooltip };

  return (
    <TooltipContext.Provider value={value}>
      {children}
      {tooltip.visible && (
        <div
          className="fixed z-[9999] bg-slate-800 text-white text-xs font-semibold py-1.5 px-3 rounded-md shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full transition-opacity duration-200"
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
        >
          {tooltip.content}
        </div>
      )}
    </TooltipContext.Provider>
  );
};


import React from 'react';
import { InfoIcon } from './Icons';

interface ExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  explanation: string;
  calculationLogic: string | null;
}

const ExplanationModal: React.FC<ExplanationModalProps> = ({ isOpen, onClose, title, explanation, calculationLogic }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
            <div className="bg-sky-100 p-2 rounded-lg border border-sky-200"> {/* Softer sky blue */}
                <InfoIcon className="w-6 h-6 text-sky-600"/>
            </div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
        </div>
        <p className="mt-4 text-slate-600 bg-slate-50 p-4 rounded-md border border-slate-200">{explanation}</p> {/* Darker text, softer background/border */}
        
        {calculationLogic && (
          <div className="mt-4">
              <h3 className="font-semibold text-slate-700">How It's Calculated</h3>
              <div className="mt-2 text-slate-600 bg-slate-50 p-4 rounded-md border border-slate-200"> {/* Darker text, softer background/border */}
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: calculationLogic }}></div>
              </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="py-2 px-4 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExplanationModal;
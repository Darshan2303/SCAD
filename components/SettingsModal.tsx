

import React, { useState, useEffect } from 'react';
import { SettingsIcon, CheckCircleIcon, AlertTriangleIcon, KeyIcon } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentApiKey: string | null;
  onApiKeySave: (key: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentApiKey, onApiKeySave }) => {
  const [localApiKey, setLocalApiKey] = useState(currentApiKey || '');

  useEffect(() => {
      setLocalApiKey(currentApiKey || '');
  }, [currentApiKey, isOpen]);

  if (!isOpen) return null;

  const isApiKeySet = !!currentApiKey;

  const handleSave = () => {
    onApiKeySave(localApiKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg m-4 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-2 rounded-lg border border-slate-200">
                <SettingsIcon className="w-6 h-6 text-slate-600"/>
            </div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Settings</h2>
        </div>
        
        <div className="mt-6 space-y-4">
            <h3 className="font-semibold text-slate-700">Gemini API Key Configuration</h3>
            
            <div className={`p-4 rounded-md border flex items-start gap-3 ${
                isApiKeySet 
                ? 'bg-emerald-50 border-emerald-200' 
                : 'bg-amber-50 border-amber-200'
            }`}>
                {isApiKeySet ? (
                    <CheckCircleIcon className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                ) : (
                    <AlertTriangleIcon className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                )}
                <div>
                    <p className={`font-semibold ${isApiKeySet ? 'text-emerald-800' : 'text-amber-800'}`}>
                        {isApiKeySet ? 'Gemini API Key is Active' : 'Gemini API Key Not Set'}
                    </p>
                    <p className={`text-sm mt-1 ${isApiKeySet ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {isApiKeySet 
                            ? 'AI-powered features like company analysis from Excel are enabled.'
                            : 'AI-powered features are disabled. Please enter your API key below.'
                        }
                    </p>
                </div>
            </div>

            <div>
                <label htmlFor="api-key-input" className="block text-sm font-medium text-slate-600">
                    Enter your API Key
                </label>
                <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <KeyIcon className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                        id="api-key-input"
                        type="password"
                        value={localApiKey}
                        onChange={(e) => setLocalApiKey(e.target.value)}
                        placeholder="Enter your Gemini API Key"
                        className="shadow-sm block w-full rounded-md border-slate-300 pl-10 pr-4 py-2 focus:border-sky-500 focus:ring-sky-500"
                    />
                </div>
            </div>

             <div className="text-sm text-amber-700 bg-amber-50 p-3 rounded-md border border-amber-200 space-y-1">
                <p>
                    <strong>Security Notice:</strong> Your API key will be stored in your browser's session storage. It will be cleared when you close this tab.
                </p>
                 <p>
                    For production environments, it is strongly recommended to use environment variables instead.
                </p>
            </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onClose} className="py-2 px-4 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300">
            Cancel
          </button>
          <button onClick={handleSave} className="py-2 px-4 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700">
            Save and Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
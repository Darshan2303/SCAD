

import React from 'react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md animate-scale-in" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <p className="mt-2 text-slate-600">{message}</p> 
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="py-2 px-4 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300">
            Cancel
          </button>
          <button onClick={onConfirm} className="py-2 px-4 bg-rose-500 text-white font-semibold rounded-lg hover:bg-rose-600"> 
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
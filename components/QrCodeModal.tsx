

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import type { Dispatch } from '../types';
import { QrCodeIcon, FileDownloadIcon } from './Icons';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispatch: Dispatch;
}

const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose, dispatch }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen && dispatch.qrCodePayload) {
      QRCode.toDataURL(dispatch.qrCodePayload, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 256,
      })
        .then(url => {
          setQrCodeDataUrl(url);
        })
        .catch(err => {
          console.error("Failed to generate QR code", err);
          setQrCodeDataUrl('');
        });
    }
  }, [isOpen, dispatch.qrCodePayload]);

  const handleDownload = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a');
      link.href = qrCodeDataUrl;
      link.download = `${dispatch.id}-qrcode.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm m-4 text-center" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col items-center gap-3">
            <div className="bg-slate-100 p-2 rounded-lg border border-slate-200">
                <QrCodeIcon className="w-6 h-6 text-slate-600"/>
            </div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Dispatch QR Code</h2>
        </div>
        <div className="my-6 p-4 bg-slate-50 border rounded-lg h-[288px] flex items-center justify-center">
            {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="Dispatch QR Code" style={{ height: "256px", width: "256px" }} />
            ) : (
                <p>Generating QR Code...</p>
            )}
        </div>
        <div className="text-left space-y-2 text-sm bg-slate-50 p-3 rounded-md border">
            <p><strong>ID:</strong> <span className="font-mono text-xs">{dispatch.id}</span></p>
            <p><strong>Item:</strong> {dispatch.itemName} ({dispatch.quantity.toLocaleString()} units)</p>
            <p><strong>Payload:</strong> <code className="text-xs break-all">{dispatch.qrCodePayload}</code></p>
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={onClose} className="py-2 px-4 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700">
            Close
          </button>
          <button onClick={handleDownload} className="py-2 px-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" disabled={!qrCodeDataUrl}>
            <FileDownloadIcon className="w-5 h-5" /> Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default QrCodeModal;
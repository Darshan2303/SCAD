

import React, { useState } from 'react';
import type { Transport, Company, Dispatch, CurrentUser } from '../types';
import { TruckIcon, QrCodeIcon } from './Icons';
import QrCodeModal from './QrCodeModal';

interface TransportDashboardProps {
  transport: Transport;
  company: Company;
  dispatch: React.Dispatch<any>;
  currentUser: CurrentUser;
}

const DispatchRow: React.FC<{ dispatchItem: Dispatch, onUpdateStatus: (id: string, status: Dispatch['status']) => void, onShowQr: () => void, company: Company }> = ({ dispatchItem, onUpdateStatus, onShowQr, company }) => {
    const fromNode = dispatchItem.fromType === 'supplier' 
        ? company.data.suppliers.find(s => s.id === dispatchItem.fromId)?.name
        : company.data.warehouses.find(w => w.id === dispatchItem.fromId)?.name;
    
    const toNode = dispatchItem.toType === 'warehouse' 
        ? company.data.warehouses.find(w => w.id === dispatchItem.toId)?.name
        : company.data.customers.find(c => c.id === dispatchItem.toId)?.name;

    const getStatusChip = (status: Dispatch['status']) => {
        const baseClass = "px-2 py-0.5 text-xs font-semibold rounded-full";
        switch (status) {
            case 'CREATED': return <span className={`${baseClass} bg-blue-100 text-blue-800`}>Awaiting Pickup</span>;
            case 'PICKED_UP': return <span className={`${baseClass} bg-orange-100 text-orange-800`}>Picked Up</span>;
            case 'IN_TRANSIT': return <span className={`${baseClass} bg-yellow-100 text-yellow-800`}>In Transit</span>;
            case 'DELIVERED_TO_WAREHOUSE':
            case 'DELIVERED_TO_CONSUMER':
                return <span className={`${baseClass} bg-green-100 text-green-800`}>Delivered</span>;
            default: return <span className={`${baseClass} bg-slate-100 text-slate-800`}>{status}</span>;
        }
    };
    
    const canPickUp = dispatchItem.status === 'CREATED';
    const canSetInTransit = dispatchItem.status === 'PICKED_UP';

    return (
        <tr className="border-b border-slate-200/80 last:border-b-0 even:bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <td className="p-3 font-mono text-xs text-slate-500">{dispatchItem.id}</td>
            <td className="p-3 font-semibold text-slate-700">{dispatchItem.itemName}</td>
            <td className="p-3 text-slate-600">{fromNode}</td>
            <td className="p-3 text-slate-600">{toNode}</td>
            <td className="p-3">{getStatusChip(dispatchItem.status)}</td>
            <td className="p-3">
                <div className="flex items-center justify-end gap-2">
                    <button onClick={onShowQr} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200">
                        <QrCodeIcon className="w-5 h-5" />
                    </button>
                    {canPickUp && (
                        <button onClick={() => onUpdateStatus(dispatchItem.id, 'PICKED_UP')} className="text-xs font-semibold bg-orange-500 text-white px-2 py-1 rounded-md hover:bg-orange-600">
                            Pick Up
                        </button>
                    )}
                    {canSetInTransit && (
                         <button onClick={() => onUpdateStatus(dispatchItem.id, 'IN_TRANSIT')} className="text-xs font-semibold bg-yellow-500 text-white px-2 py-1 rounded-md hover:bg-yellow-600">
                            In Transit
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};

const TransportDashboard: React.FC<TransportDashboardProps> = ({ transport, company, dispatch, currentUser }) => {
    const [qrCodeModalData, setQrCodeModalData] = useState<Dispatch | null>(null);

    const assignedDispatches = company.data.dispatches.filter(d => d.transportId === transport.id);

    const handleUpdateStatus = (dispatchId: string, newStatus: Dispatch['status']) => {
        if (!currentUser) return;
        dispatch({ type: 'UPDATE_DISPATCH_STATUS', payload: { 
            companyId: company.id, 
            dispatchId, 
            newStatus,
            actor: { actorId: currentUser.id, actorName: currentUser.name, actorRole: currentUser.role }
        }});
    };

    return (
        <>
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-4xl font-extrabold text-slate-800 flex items-center gap-4 tracking-tight">
                        <div className="bg-gray-200 p-3 rounded-lg border border-gray-300 shadow-sm">
                            <TruckIcon className="w-8 h-8 text-gray-700" />
                        </div>
                        <span>Transport Portal ({transport.name})</span>
                    </h2>
                </div>
                
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-700 mb-4">Assigned Dispatches</h3>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/80">
                                <tr className="border-b-2 border-slate-200">
                                    <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">Dispatch ID</th>
                                    <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">Item</th>
                                    <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">From</th>
                                    <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">To</th>
                                    <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">Status</th>
                                    <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignedDispatches.map(d => (
                                    <DispatchRow key={d.id} dispatchItem={d} onUpdateStatus={handleUpdateStatus} onShowQr={() => setQrCodeModalData(d)} company={company} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {qrCodeModalData && (
                <QrCodeModal 
                    isOpen={!!qrCodeModalData}
                    onClose={() => setQrCodeModalData(null)}
                    dispatch={qrCodeModalData}
                />
            )}
        </>
    );
};

export default TransportDashboard;


import React, { useState, useMemo } from 'react';
import type { Supplier, Company, Dispatch, CurrentUser } from '../types';
import { PlusIcon, QrCodeIcon } from './Icons';
import QrCodeModal from './QrCodeModal';

interface SupplierOperationsProps {
  supplier: Supplier;
  company: Company;
  dispatch: React.Dispatch<any>;
  currentUser: CurrentUser;
}

const InfoCard: React.FC<{ title: string, value: string | number, children: React.ReactNode }> = ({ title, value, children }) => (
    <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 text-slate-600 rounded-md">{children}</div>
            <div>
                <div className="text-xs text-slate-500">{title}</div>
                <div className="font-bold text-lg text-slate-800">{value}</div>
            </div>
        </div>
    </div>
);

const DispatchRow: React.FC<{ dispatch: Dispatch, onShowQr: () => void, company: Company }> = ({ dispatch, onShowQr, company }) => {
    const getStatusChip = (status: Dispatch['status']) => {
        const baseClass = "px-2 py-0.5 text-xs font-semibold rounded-full";
        switch (status) {
            case 'CREATED': return <span className={`${baseClass} bg-blue-100 text-blue-800`}>Created</span>;
            case 'PICKED_UP':
            case 'IN_TRANSIT': return <span className={`${baseClass} bg-yellow-100 text-yellow-800`}>In Transit</span>;
            case 'DELIVERED_TO_WAREHOUSE': return <span className={`${baseClass} bg-green-100 text-green-800`}>Delivered</span>;
            default: return <span className={`${baseClass} bg-slate-100 text-slate-800`}>{status}</span>;
        }
    };

    return (
        <tr className="border-b border-slate-200/80 last:border-b-0 even:bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <td className="p-3 font-mono text-xs text-slate-500">{dispatch.id}</td>
            <td className="p-3 font-semibold text-slate-700">{dispatch.itemName}</td>
            <td className="p-3 font-mono text-slate-600">{dispatch.quantity.toLocaleString()}</td>
            <td className="p-3 text-slate-600">{company.data.warehouses.find(w => w.id === dispatch.toId)?.name}</td>
            <td className="p-3">{getStatusChip(dispatch.status)}</td>
            <td className="p-3 text-right">
                <button onClick={onShowQr} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200">
                    <QrCodeIcon className="w-5 h-5" />
                </button>
            </td>
        </tr>
    )
};

const SupplierOperations: React.FC<SupplierOperationsProps> = ({ supplier, company, dispatch, currentUser }) => {
    const [itemName, setItemName] = useState(company.data.items[0]?.name || '');
    const [quantity, setQuantity] = useState(100);
    const [destinationId, setDestinationId] = useState(company.data.warehouses[0]?.id || '');
    const [qrCodeModalData, setQrCodeModalData] = useState<Dispatch | null>(null);
    
    const supplierDispatches = company.data.dispatches.filter(d => d.fromId === supplier.id);
    
    const burnRateStats = useMemo(() => {
        const totalDispatched = supplierDispatches.reduce((sum, d) => sum + d.quantity, 0);
        const utilization = supplier.supplyCapacity > 0 ? (totalDispatched / (supplier.supplyCapacity * 30)) * 100 : 0; // Assuming 30 days for utilization
        return {
            totalDispatched,
            utilization: Math.min(100, utilization), // Cap at 100
        };
    }, [supplierDispatches, supplier.supplyCapacity]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemName || quantity <= 0 || !destinationId || !currentUser) return;
        
        const selectedItem = company.data.items.find(i => i.name === itemName);
        if(!selectedItem) return;

        const newDispatchId = `disp-${Date.now()}`;
        const newDispatch: Dispatch = {
            id: newDispatchId,
            type: 'SUPPLY',
            status: 'CREATED',
            itemId: selectedItem.id,
            itemName: selectedItem.name,
            quantity: Number(quantity),
            fromId: supplier.id,
            fromType: 'supplier',
            toId: destinationId,
            toType: 'warehouse',
            transportId: company.data.transportPersonnel[0]?.id, // Auto-assign for simplicity
            isQrScanned: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            qrCodePayload: JSON.stringify({
                v: 1,
                id: newDispatchId,
                from: supplier.id,
                to: destinationId,
                item: selectedItem.id,
                qty: Number(quantity),
                typ: 'SUPPLY'
            }),
            logs: [{
                actorId: currentUser.id,
                actorName: currentUser.name,
                actorRole: currentUser.role,
                action: 'Dispatch Created',
                timestamp: new Date().toISOString()
            }]
        };

        dispatch({ type: 'CREATE_DISPATCH', payload: { companyId: company.id, dispatch: newDispatch }});
        setQrCodeModalData(newDispatch);
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                 <InfoCard title="Total Supply Capacity" value={`${supplier.supplyCapacity.toLocaleString()} units/day`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                </InfoCard>
                 <InfoCard title="Total Units Dispatched" value={burnRateStats.totalDispatched.toLocaleString()}>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM16 4a1 1 0 00-1-1h-1l-3 4h3a1 1 0 011 1v4.5h1.5a.5.5 0 01.5.5v1.5a.5.5 0 01-.5.5H16a1 1 0 00-1-1v-4a1 1 0 00-1-1h-1V4z" /></svg>
                </InfoCard>
                 <InfoCard title="Capacity Utilization (30d)" value={`${burnRateStats.utilization.toFixed(1)}%`}>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                </InfoCard>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
                <h3 className="text-lg font-bold text-slate-700 mb-4">Create New Supply Dispatch</h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-slate-600">Item</label>
                        <select value={itemName} onChange={e => setItemName(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500">
                            {company.data.items.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600">Quantity (units)</label>
                        <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min="1" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600">Destination</label>
                        <select value={destinationId} onChange={e => setDestinationId(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500">
                            {company.data.warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="bg-orange-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2">
                        <PlusIcon /> Create & Get QR
                    </button>
                </form>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                 <h3 className="text-lg font-bold text-slate-700 mb-4">Your Dispatch History</h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-slate-50/80">
                            <tr className="border-b-2 border-slate-200">
                                <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">Dispatch ID</th>
                                <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">Item</th>
                                <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">Quantity</th>
                                <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">Destination</th>
                                <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">Status</th>
                                <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider text-right">QR</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplierDispatches.map(d => (
                                <DispatchRow key={d.id} dispatch={d} company={company} onShowQr={() => setQrCodeModalData(d)} />
                            ))}
                        </tbody>
                    </table>
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

export default SupplierOperations;
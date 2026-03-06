

import React, { useState } from 'react';
import type { Warehouse, Company, Dispatch, CurrentUser } from '../types';
import { PlusIcon, QrCodeIcon } from './Icons';
import QrCodeModal from './QrCodeModal';
import ScannerModal from './ScannerModal';
import UpcomingDeliveries from './UpcomingDeliveries';
// FIX: Updated import for PredictionPanel to correctly reference its default export.
import PredictionPanel from './PredictionPanel';

interface WarehouseOperationsProps {
  warehouse: Warehouse;
  company: Company;
  dispatch: React.Dispatch<any>;
  currentUser: CurrentUser;
}

const DispatchRow: React.FC<{ dispatch: Dispatch, onShowQr: () => void, company: Company }> = ({ dispatch, onShowQr, company }) => {
    const fromNode = dispatch.fromType === 'supplier' 
        ? company.data.suppliers.find(s => s.id === dispatch.fromId)?.name
        : company.data.warehouses.find(w => w.id === dispatch.fromId)?.name;
    
    const toNode = dispatch.toType === 'warehouse' 
        ? company.data.warehouses.find(w => w.id === dispatch.toId)?.name
        : company.data.customers.find(c => c.id === dispatch.toId)?.name;

    const getStatusChip = (status: Dispatch['status']) => {
        const baseClass = "px-2 py-0.5 text-xs font-semibold rounded-full";
        switch (status) {
            case 'CREATED': return <span className={`${baseClass} bg-blue-100 text-blue-800`}>Awaiting Pickup</span>;
            case 'PICKED_UP':
            case 'IN_TRANSIT': return <span className={`${baseClass} bg-yellow-100 text-yellow-800`}>In Transit</span>;
            case 'DELIVERED_TO_WAREHOUSE': return <span className={`${baseClass} bg-green-100 text-green-800`}>Received</span>;
            case 'DELIVERED_TO_CONSUMER': return <span className={`${baseClass} bg-purple-100 text-purple-800`}>Delivered</span>;
            default: return <span className={`${baseClass} bg-slate-100 text-slate-800`}>{status}</span>;
        }
    };

    return (
        <tr className="border-b border-slate-200/80 last:border-b-0 even:bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <td className="p-3 font-mono text-xs text-slate-500">{dispatch.id}</td>
            <td className="p-3 font-semibold text-slate-700">{dispatch.itemName}</td>
            <td className="p-3 font-mono text-slate-600">{dispatch.quantity.toLocaleString()}</td>
            <td className="p-3 text-slate-600">{fromNode}</td>
            <td className="p-3 text-slate-600">{toNode}</td>
            <td className="p-3">{getStatusChip(dispatch.status)}</td>
            <td className="p-3 text-right">
                <button onClick={onShowQr} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200">
                    <QrCodeIcon className="w-5 h-5" />
                </button>
            </td>
        </tr>
    )
};

const CreateOutboundModal: React.FC<{ isOpen: boolean, onClose: () => void, onSubmit: (data: any) => void, warehouse: Warehouse, company: Company }> = ({ isOpen, onClose, onSubmit, warehouse, company }) => {
    const availableItems = warehouse.storage.filter(i => i.quantity > 0);
    const [itemId, setItemId] = useState(availableItems[0]?.itemId || '');
    const [quantity, setQuantity] = useState(1);
    const [destinationId, setDestinationId] = useState(company.data.customers[0]?.id || '');
    const maxQuantity = warehouse.storage.find(i => i.itemId === itemId)?.quantity || 1;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ itemId, quantity, destinationId });
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-slate-800">Create Outbound Delivery</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-600">Item</label>
                        <select value={itemId} onChange={e => setItemId(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500">
                            {availableItems.map(item => <option key={item.itemId} value={item.itemId}>{item.itemName} ({item.quantity.toLocaleString()} available)</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-600">Quantity</label>
                        <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min="1" max={maxQuantity} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600">Destination Customer</label>
                        <select value={destinationId} onChange={e => setDestinationId(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500">
                            {company.data.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300">Cancel</button>
                        <button type="submit" className="py-2 px-4 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600">Create & Get QR</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const WarehouseOperations: React.FC<WarehouseOperationsProps> = ({ warehouse, company, dispatch, currentUser }) => {
    const [qrCodeModalData, setQrCodeModalData] = useState<Dispatch | null>(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isOutboundModalOpen, setIsOutboundModalOpen] = useState(false);
    
    const warehouseDispatches = company.data.dispatches.filter(d => d.fromId === warehouse.id || d.toId === warehouse.id);

    const handleInboundScan = (payload: string) => {
        try {
            const data = JSON.parse(payload);
            const targetDispatch = company.data.dispatches.find(d => d.id === data.id);
            if (data.typ !== 'SUPPLY' || data.to !== warehouse.id) return alert("Error: Invalid QR code for this warehouse.");
            if (!targetDispatch || targetDispatch.isQrScanned) return alert("Error: QR Code is invalid or already scanned.");
            if (!currentUser) return;
            
            dispatch({ type: 'PROCESS_INBOUND_SCAN', payload: { 
                companyId: company.id,
                dispatch: targetDispatch,
                actor: { actorId: currentUser.id, actorName: currentUser.name, actorRole: currentUser.role }
            }});
            setIsScannerOpen(false);
        } catch(e) { alert("Failed to parse QR code."); }
    };
    
    const handleCreateOutbound = (data: { itemId: string, quantity: number, destinationId: string }) => {
        const { itemId, quantity, destinationId } = data;
        const item = company.data.items.find(i => i.id === itemId);
        if (!item || !currentUser) return;

        const newDispatchId = `disp-${Date.now()}`;
        const newDispatch: Dispatch = {
            id: newDispatchId, type: 'DELIVERY', status: 'CREATED', itemId: item.id, itemName: item.name,
            quantity: Number(quantity), fromId: warehouse.id, fromType: 'warehouse', toId: destinationId, toType: 'customer',
            transportId: company.data.transportPersonnel[0]?.id, isQrScanned: false, createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            qrCodePayload: JSON.stringify({ v: 1, id: newDispatchId, from: warehouse.id, to: destinationId, item: item.id, qty: Number(quantity), typ: 'DELIVERY' }),
            logs: [{ actorId: currentUser.id, actorName: currentUser.name, actorRole: currentUser.role, action: 'Outbound Delivery Created', timestamp: new Date().toISOString() }]
        };

        dispatch({
            type: 'PROCESS_OUTBOUND_CREATION',
            payload: { companyId: company.id, dispatch: newDispatch, actor: { actorId: currentUser.id, actorName: currentUser.name, actorRole: currentUser.role } }
        });
        setIsOutboundModalOpen(false);
        setQrCodeModalData(newDispatch);
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center gap-4">
                     <button onClick={() => setIsScannerOpen(true)} className="w-full bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2 text-lg">
                       <QrCodeIcon className="w-6 h-6"/> Scan Inbound Shipment
                    </button>
                    <button onClick={() => setIsOutboundModalOpen(true)} className="w-full bg-orange-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2 text-lg">
                       <PlusIcon className="w-6 h-6" /> Create Outbound Delivery
                    </button>
                </div>
                 <div className="space-y-6">
                    <PredictionPanel warehouse={warehouse} company={company} />
                </div>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-1">
                    <UpcomingDeliveries entity={warehouse} company={company} />
                </div>
                 <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-700 mb-4">Current Inventory</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {warehouse.storage.map(item => (
                            <div key={item.itemId} className="flex justify-between items-center bg-slate-50 p-2 rounded-md">
                                <span className="font-semibold text-slate-700">{item.itemName}</span>
                                <span className="font-mono text-slate-800 font-bold">{item.quantity.toLocaleString()} units</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                 <h3 className="text-lg font-bold text-slate-700 mb-4">Dispatch History</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-slate-50/80">
                            <tr className="border-b-2 border-slate-200">
                                <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">ID</th>
                                <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">Item</th>
                                <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">Qty</th>
                                <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">From</th>
                                <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">To</th>
                                <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">Status</th>
                                <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider text-right">QR</th>
                            </tr>
                        </thead>
                        <tbody>
                            {warehouseDispatches.map(d => (
                                <DispatchRow key={d.id} dispatch={d} company={company} onShowQr={() => setQrCodeModalData(d)} />
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>
            {qrCodeModalData && <QrCodeModal isOpen={!!qrCodeModalData} onClose={() => setQrCodeModalData(null)} dispatch={qrCodeModalData} />}
            <ScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScan={handleInboundScan} role="warehouse" />
            <CreateOutboundModal isOpen={isOutboundModalOpen} onClose={() => setIsOutboundModalOpen(false)} onSubmit={handleCreateOutbound} warehouse={warehouse} company={company} />
        </>
    );
};

export default WarehouseOperations;

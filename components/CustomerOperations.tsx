

import React, { useState, useMemo } from 'react';
import type { Customer, Company, Dispatch, CurrentUser } from '../types';
import { QrCodeIcon } from './Icons';
import ScannerModal from './ScannerModal';
import UpcomingDeliveries from './UpcomingDeliveries';

interface CustomerOperationsProps {
  customer: Customer;
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

const DeliveryRow: React.FC<{ dispatch: Dispatch, company: Company }> = ({ dispatch, company }) => {
    const fromNode = company.data.warehouses.find(w => w.id === dispatch.fromId)?.name || 'Unknown';
    
    const getStatusChip = (status: Dispatch['status']) => {
        const baseClass = "px-2 py-0.5 text-xs font-semibold rounded-full";
        switch (status) {
            case 'CREATED': return <span className={`${baseClass} bg-blue-100 text-blue-800`}>Awaiting Pickup</span>;
            case 'PICKED_UP':
            case 'IN_TRANSIT': return <span className={`${baseClass} bg-yellow-100 text-yellow-800`}>In Transit</span>;
            case 'DELIVERED_TO_CONSUMER': return <span className={`${baseClass} bg-green-100 text-green-800`}>Delivered</span>;
            default: return <span className={`${baseClass} bg-slate-100 text-slate-800`}>{status}</span>;
        }
    };
    
    return (
        <tr className="border-b border-slate-200/80 last:border-b-0 even:bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <td className="p-3 font-mono text-xs text-slate-500">{dispatch.id}</td>
            <td className="p-3 font-semibold text-slate-700">{dispatch.itemName}</td>
            <td className="p-3 font-mono text-slate-600">{dispatch.quantity.toLocaleString()}</td>
            <td className="p-3 text-slate-600">{fromNode}</td>
            <td className="p-3">{getStatusChip(dispatch.status)}</td>
             <td className="p-3 text-slate-500 text-sm">{new Date(dispatch.updatedAt).toLocaleDateString()}</td>
        </tr>
    );
};


const CustomerOperations: React.FC<CustomerOperationsProps> = ({ customer, company, dispatch, currentUser }) => {
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    
    const customerDeliveries = company.data.dispatches.filter(d => d.toId === customer.id && d.type === 'DELIVERY');
    const totalUnitsReceived = useMemo(() => 
        customerDeliveries
            .filter(d => d.status === 'DELIVERED_TO_CONSUMER')
            .reduce((sum, d) => sum + d.quantity, 0),
        [customerDeliveries]
    );

    const handleScan = (payload: string) => {
        try {
            const data = JSON.parse(payload);
            if(data.typ !== 'DELIVERY' || data.to !== customer.id) return alert("Error: Invalid QR code for this delivery.");
            const targetDispatch = company.data.dispatches.find(d => d.id === data.id);
            if (!targetDispatch || targetDispatch.isQrScanned) return alert("Error: QR Code is invalid or already scanned.");
            if (!currentUser) return;
            
            dispatch({ type: 'UPDATE_DISPATCH_STATUS', payload: {
                companyId: company.id,
                dispatchId: data.id,
                newStatus: 'DELIVERED_TO_CONSUMER',
                actor: { actorId: currentUser.id, actorName: currentUser.name, actorRole: currentUser.role }
            }});
            setIsScannerOpen(false);
        } catch (e) { alert("Failed to parse QR code."); }
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <InfoCard title="Daily Demand (Burn Rate)" value={`${customer.demand.toLocaleString()} units/day`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM4.343 5.757a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM4 10a1 1 0 01-1 1H2a1 1 0 110-2h1a1 1 0 011 1zM10 16a6 6 0 100-12 6 6 0 000 12zM10 14a4 4 0 110-8 4 4 0 010 8z" /></svg>
                </InfoCard>
                <InfoCard title="Total Units Received" value={totalUnitsReceived.toLocaleString()}>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1  0 001-1v-1h-5v2zm0-4h5V8h-5v2zM4 8h5v2H4V8z" clipRule="evenodd" /></svg>
                </InfoCard>
            </div>
            <div className="mb-8">
                <UpcomingDeliveries entity={customer} company={company} />
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-700">Your Delivery History</h3>
                    <button onClick={() => setIsScannerOpen(true)} className="bg-orange-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2">
                        <QrCodeIcon className="w-5 h-5"/> Scan Delivery
                    </button>
                </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/80">
                            <tr className="border-b-2 border-slate-200">
                                <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">Delivery ID</th>
                                <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">Item</th>
                                <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">Quantity</th>
                                <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">From</th>
                                <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">Status</th>
                                <th className="p-3 text-sm font-semibold text-slate-600 tracking-wider">Last Update</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customerDeliveries.map(d => <DeliveryRow key={d.id} dispatch={d} company={company} />)}
                        </tbody>
                    </table>
                 </div>
            </div>
            <ScannerModal 
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={handleScan}
                role="customer"
            />
        </>
    );
};

export default CustomerOperations;
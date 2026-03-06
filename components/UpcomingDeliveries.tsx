

import React, { useMemo } from 'react';
import type { Company, Customer, Warehouse, Dispatch } from '../types';
import { TruckIcon } from './Icons';

interface UpcomingDeliveriesProps {
    entity: Warehouse | Customer;
    company: Company;
}

// A simple utility to format the time difference.
const formatDistanceToNow = (etaDate: Date): string => {
    const now = new Date();
    const diffMs = etaDate.getTime() - now.getTime();
    if (diffMs < 0) return "Arrived";

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
        return `in ~${diffHours}h ${diffMinutes}m`;
    }
    return `in ~${diffMinutes}m`;
};


const UpcomingDeliveries: React.FC<UpcomingDeliveriesProps> = ({ entity, company }) => {
    const upcoming = useMemo(() => {
        return company.data.dispatches
            .filter(d => d.toId === entity.id && (d.status === 'IN_TRANSIT' || d.status === 'PICKED_UP'))
            .map(d => {
                const connection = company.data.connections.find(c => c.from === d.fromId && c.to === d.toId);
                if (!connection) return null;

                const lastLog = d.logs[d.logs.length - 1];
                const startTime = new Date(lastLog.timestamp);
                const eta = new Date(startTime.getTime() + connection.transitTime * 60 * 60 * 1000);
                
                return { ...d, eta };
            })
            .filter(d => d !== null)
            .sort((a, b) => a!.eta.getTime() - b!.eta.getTime()) as (Dispatch & { eta: Date })[];
    }, [entity.id, company.data.dispatches, company.data.connections]);

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><TruckIcon className="w-5 h-5 text-slate-500" /> Upcoming Deliveries</h3>
            {upcoming.length > 0 ? (
                 <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {upcoming.map(d => (
                         <div key={d.id} className="flex justify-between items-center bg-sky-50 p-3 rounded-md border border-sky-100">
                            <div>
                                <p className="font-semibold text-sky-800">{d.itemName}</p>
                                <p className="text-xs text-sky-700">{d.quantity.toLocaleString()} units from {company.data.suppliers.find(s=>s.id === d.fromId)?.name || company.data.warehouses.find(w=>w.id === d.fromId)?.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg text-sky-900">{formatDistanceToNow(d.eta)}</p>
                                <p className="text-xs text-sky-600">{d.eta.toLocaleTimeString()}</p>
                            </div>
                         </div>
                    ))}
                 </div>
            ) : (
                <div className="text-center py-8 text-slate-500">
                    <p>No inbound shipments currently in transit.</p>
                </div>
            )}
        </div>
    );
};

export default UpcomingDeliveries;
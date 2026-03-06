

import React from 'react';
import type { Company, Supplier, Dispatch } from '../types';
// FIX: Added missing ClockIcon and ResilienceIcon to imports.
import { SupplierIcon, ClockIcon, ResilienceIcon } from './Icons';

interface SupplierDetailViewProps {
    company: Company;
    supplier: Supplier;
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

const SupplierDetailView: React.FC<SupplierDetailViewProps> = ({ company, supplier }) => {
    const dispatches = company.data.dispatches.filter(d => d.fromId === supplier.id);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InfoCard title="Supply Capacity" value={`${supplier.supplyCapacity.toLocaleString()} u/day`}>
                    <SupplierIcon className="w-5 h-5" />
                </InfoCard>
                <InfoCard title="Average Delay" value={`${supplier.averageDelayHours.toFixed(1)} hrs`}>
                     <ClockIcon className="h-5 w-5" />
                </InfoCard>
                 <InfoCard title="Resilience Score" value={supplier.resilienceScore}>
                     <ResilienceIcon className="h-5 w-5" />
                </InfoCard>
            </div>
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-700 mb-4">Dispatch History</h3>
                <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/80 sticky top-0">
                            <tr className="border-b-2 border-slate-200">
                                <th className="p-3 text-sm font-semibold text-slate-600">Item</th>
                                <th className="p-3 text-sm font-semibold text-slate-600">Quantity</th>
                                <th className="p-3 text-sm font-semibold text-slate-600">Destination</th>
                                <th className="p-3 text-sm font-semibold text-slate-600">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dispatches.map(d => (
                                <tr key={d.id} className="border-b border-slate-200/80 last:border-b-0 even:bg-slate-50/50">
                                    <td className="p-3 font-semibold text-slate-700">{d.itemName}</td>
                                    <td className="p-3 font-mono text-slate-600">{d.quantity.toLocaleString()}</td>
                                    <td className="p-3 text-slate-600">{company.data.warehouses.find(w => w.id === d.toId)?.name}</td>
                                    <td className="p-3 text-slate-600 capitalize">{d.status.replace(/_/g, ' ').toLowerCase()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
        </div>
    );
};

export default SupplierDetailView;
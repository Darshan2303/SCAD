

import React from 'react';
import type { Company, Customer, Dispatch } from '../types';
import { CustomerIcon } from './Icons';

interface CustomerDetailViewProps {
    company: Company;
    customer: Customer;
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

const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({ company, customer }) => {
    const deliveries = company.data.dispatches.filter(d => d.toId === customer.id && d.type === 'DELIVERY');

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InfoCard title="Daily Demand" value={`${customer.demand.toLocaleString()} u/day`}>
                    <CustomerIcon className="w-5 h-5" />
                </InfoCard>
                <div className="md:col-span-2 bg-white p-4 rounded-lg border shadow-sm">
                    <div className="text-xs text-slate-500">Item Requirements</div>
                    <div className="font-semibold text-slate-800 flex flex-wrap gap-x-2 gap-y-1 mt-1">
                        {customer.requirements.map(req => <span key={req} className="bg-slate-100 px-2 py-0.5 rounded-full text-sm">{req}</span>)}
                    </div>
                </div>
            </div>
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-700 mb-4">Delivery History</h3>
                <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/80 sticky top-0">
                            <tr className="border-b-2 border-slate-200">
                                <th className="p-3 text-sm font-semibold text-slate-600">Item</th>
                                <th className="p-3 text-sm font-semibold text-slate-600">Quantity</th>
                                <th className="p-3 text-sm font-semibold text-slate-600">From</th>
                                <th className="p-3 text-sm font-semibold text-slate-600">Status</th>
                                <th className="p-3 text-sm font-semibold text-slate-600">Last Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deliveries.map(d => (
                                <tr key={d.id} className="border-b border-slate-200/80 last:border-b-0 even:bg-slate-50/50">
                                    <td className="p-3 font-semibold text-slate-700">{d.itemName}</td>
                                    <td className="p-3 font-mono text-slate-600">{d.quantity.toLocaleString()}</td>
                                    <td className="p-3 text-slate-600">{company.data.warehouses.find(w => w.id === d.fromId)?.name}</td>
                                    <td className="p-3 text-slate-600 capitalize">{d.status.replace(/_/g, ' ').toLowerCase()}</td>
                                    <td className="p-3 text-slate-500 text-sm">{new Date(d.updatedAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
        </div>
    );
};

export default CustomerDetailView;
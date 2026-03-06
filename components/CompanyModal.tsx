

import React, { useState } from 'react';
import type { Company, ScenarioData } from '../types';

interface CompanyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (newCompany: Company) => void;
}

const CompanyModal: React.FC<CompanyModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !description) return;

        const initialData: ScenarioData = {
            networkName: `${name} Network`,
            networkMetrics: { 
                otif: { value: 100, target: 95 }, 
                orderCycleTime: { value: 0, target: 24 }, 
                orderAccuracy: { value: 100, target: 99 }, 
                // FIX: Removed 'pickingProductivity' as it does not exist in the 'Metrics' type.
                dockToStockTime: { value: 0, target: 8 },
                costPerOrder: { value: 0, target: 150, labor: 0, packaging: 0, shipping: 0 },
                inventoryTurnover: { value: 0, target: 10, stockoutRate: 0, overstockRate: 0, shrinkageRate: 0 },
                pickingSpeed: { value: 0, target: 35 },
                packingEfficiency: { value: 100, target: 97 },
                dispatchTimeliness: { value: 100, target: 95 }
            },
            resilienceScore: 100,
            suppliers: [],
            warehouses: [],
            customers: [],
            transportPersonnel: [],
            connections: [],
            items: [],
            dispatches: [],
        };

        const newCompany: Company = {
            id: `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
            name,
            description,
            data: structuredClone(initialData),
        };

        onSubmit(newCompany);
        // Reset form
        setName('');
        setDescription('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg animate-scale-in" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-slate-800">Create New Company</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600">Company Name</label> 
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-300 focus:ring-sky-300/50"
                            placeholder="e.g., Quantum Logistics"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600">Description</label> 
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            rows={3}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-300 focus:ring-sky-300/50"
                            placeholder="A brief description of this supply chain network."
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300">Cancel</button>
                        <button type="submit" className="py-2 px-4 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600">Create Company</button> 
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CompanyModal;
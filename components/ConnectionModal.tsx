

import React, { useState, useEffect } from 'react';
import type { Connection, Company } from '../types';
// FIX: Imported Node from the centralized types.ts file.
import type { Node } from '../types';

interface ConnectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (connectionData: Connection) => void;
    initialData: Connection;
    company: Company;
}

const ConnectionModal: React.FC<ConnectionModalProps> = ({ isOpen, onClose, onSubmit, initialData, company }) => {
    const [formData, setFormData] = useState<Connection>(initialData);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };
    
    const allNodes: Node[] = [...company.data.suppliers, ...company.data.warehouses, ...company.data.customers];
    const fromNode = allNodes.find(n => n.id === initialData.from);
    const toNode = allNodes.find(n => n.id === initialData.to);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-slate-800">Edit Connection</h2>
                <p className="mb-4 text-slate-600 bg-slate-100 p-3 rounded-md"> 
                    Editing connection from <strong>{fromNode?.name}</strong> to <strong>{toNode?.name}</strong>.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600">Transit Time (hours)</label>
                            <input
                                type="number"
                                name="transitTime"
                                value={formData.transitTime}
                                onChange={handleChange}
                                required
                                min="1"
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-300 focus:ring-sky-300/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600">Capacity (units/day)</label>
                            <input
                                type="number"
                                name="capacity"
                                value={formData.capacity}
                                onChange={handleChange}
                                required
                                min="0"
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-300 focus:ring-sky-300/50"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300">Cancel</button>
                        <button type="submit" className="py-2 px-4 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600">Save</button> 
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ConnectionModal;
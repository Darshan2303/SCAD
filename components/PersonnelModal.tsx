

import React, { useState, useEffect } from 'react';
import type { Transport } from '../types';

interface PersonnelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (transportData: Transport) => void;
    initialData: Transport;
}

const inputClass = "block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm";

const PersonnelModal: React.FC<PersonnelModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState<Transport>(initialData);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalData = { ...formData };
        
        // If credentials are submitted as empty strings, treat them as unset (delete the property).
        // This prevents storing empty strings for credentials in the database.
        // A blank password field on edit will now correctly remove the password.
        if (finalData.username === '') delete finalData.username;
        if (finalData.password === '') delete finalData.password;
    
        onSubmit(finalData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-slate-800">Edit Personnel</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600">Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputClass} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600">Username</label>
                            <input type="text" name="username" value={formData.username || ''} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600">Password</label>
                            <input type="password" name="password" value={formData.password || ''} onChange={handleChange} className={inputClass} placeholder="Leave blank to keep unchanged" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300">Cancel</button>
                        <button type="submit" className="py-2 px-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PersonnelModal;
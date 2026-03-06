

import React, { useState, useEffect } from 'react';
// FIX: Corrected imports for Node and NodeType to point to the centralized types.ts file.
import type { Node, NodeType, Supplier, Warehouse, Customer, Company, StorageItem } from '../types';

interface NodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (nodeData: Node, connections?: { suppliers: string[], customers: string[] }) => void;
    nodeType: NodeType;
    initialData?: Node;
    company: Company;
}

const defaultSupplier: Supplier = { id: '', name: '', location: { x: 10, y: 50 }, supplyCapacity: 5000, materialsSupplied: [], averageDelayHours: 1, deliveryTimeVariance: 1, resilienceScore: 100 };
const defaultWarehouse: Warehouse = { id: '', name: '', location: { x: 40, y: 50 }, inventoryLevel: 20000, metrics: { otif: { value: 95, target: 95 }, orderCycleTime: { value: 24, target: 24 }, orderAccuracy: { value: 99, target: 99 }, dockToStockTime: { value: 8, target: 8 }, costPerOrder: { value: 140, target: 140, labor: 70, packaging: 20, shipping: 50 }, inventoryTurnover: { value: 0, target: 9, stockoutRate: 0, overstockRate: 0, shrinkageRate: 0 }, pickingSpeed: { value: 0, target: 35 }, packingEfficiency: { value: 97, target: 97 }, dispatchTimeliness: { value: 95, target: 95 } }, storage: [], dispatchedLast24h: 5000, dispatchDelayHours: 0, resilienceScore: 100, workforce: { active: 0, onTrack: 0 }, efficiency: { picksPerHour: 0, errorRate: 0, rework: 0, overtime: 0 } };
const defaultCustomer: Customer = { id: '', name: '', location: { x: 85, y: 50 }, demand: 5000, requirements: [], currentOrder: { id: '', status: 'Pending' } };

const inputClass = "block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-300 focus:ring-sky-300/50 sm:text-sm"; 

const NodeModal: React.FC<NodeModalProps> = ({ isOpen, onClose, onSubmit, nodeType, initialData, company }) => {
    const [formData, setFormData] = useState<any>(initialData || {});
    const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
    const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
    const [storageItems, setStorageItems] = useState<StorageItem[]>([]);
    const [stringLists, setStringLists] = useState({ materialsSupplied: '', requirements: '' });

    useEffect(() => {
        if (isOpen) {
            let data = initialData;
            if (!data) {
                const baseData = {
                    'supplier': defaultSupplier,
                    'warehouse': defaultWarehouse,
                    'customer': defaultCustomer,
                }[nodeType];
                data = { ...baseData, id: `${nodeType}-${Date.now()}`};
            }
            setFormData(data);

            if (nodeType === 'warehouse' && data) {
                const whData = data as Warehouse;
                setStorageItems(whData.storage || []);
                const incoming = company.data.connections.filter(c => c.to === data.id).map(c => c.from);
                const outgoing = company.data.connections.filter(c => c.from === data.id).map(c => c.to);
                setSelectedSuppliers(incoming);
                setSelectedCustomers(outgoing);
            }
            if (nodeType === 'supplier' && data) {
                const supData = data as Supplier;
                setStringLists(prev => ({ ...prev, materialsSupplied: (supData.materialsSupplied || []).join(', ') }));
            }
             if (nodeType === 'customer' && data) {
                const custData = data as Customer;
                setStringLists(prev => ({ ...prev, requirements: (custData.requirements || []).join(', ') }));
            }
        } else {
             // Reset state on close
            setStorageItems([]);
            setStringLists({ materialsSupplied: '', requirements: '' });
        }
    }, [isOpen, initialData, nodeType, company]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.currentTarget;
        if (name === 'materialsSupplied' || name === 'requirements') {
            setStringLists(prev => ({...prev, [name]: value}));
        } else {
            const isNumberInput = e.currentTarget instanceof HTMLInputElement && e.currentTarget.type === 'number';
            setFormData((prev: any) => ({ ...prev, [name]: isNumberInput ? parseFloat(value) || 0 : value }));
        }
    };
    
    const handleStorageChange = (index: number, field: 'itemId' | 'itemName' | 'quantity', value: string | number) => {
        const newItems = [...storageItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setStorageItems(newItems);
    };
    const handleAddItem = () => setStorageItems([...storageItems, { itemId: `item-${Date.now()}`, itemName: '', quantity: 0 }]);
    const handleRemoveItem = (index: number) => setStorageItems(storageItems.filter((_, i) => i !== index));

    const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        // FIX: Explicitly type `option` as `HTMLOptionElement` to resolve TypeScript error.
        const selectedOptions = Array.from(e.currentTarget.selectedOptions, (option: HTMLOptionElement) => option.value);
        setter(selectedOptions);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalData = {...formData};

        // If credentials are submitted as empty strings, treat them as unset (delete the property).
        // This ensures "no credentials" is not stored as empty strings in the database.
        if (finalData.username === '') delete finalData.username;
        if (finalData.password === '') delete finalData.password;

        if (nodeType === 'warehouse') {
            finalData.storage = storageItems;
            finalData.inventoryLevel = storageItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
            onSubmit(finalData as Node, { suppliers: selectedSuppliers, customers: selectedCustomers });
        } else {
            if (nodeType === 'supplier') {
                finalData.materialsSupplied = stringLists.materialsSupplied.split(',').map(s => s.trim()).filter(Boolean);
            }
            if (nodeType === 'customer') {
                finalData.requirements = stringLists.requirements.split(',').map(s => s.trim()).filter(Boolean);
            }
            onSubmit(finalData as Node);
        }
    };
    
    const title = `${initialData ? 'Edit' : 'Add'} ${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}`;

    const renderCredentialsForm = () => (
         <div className="bg-slate-50 p-3 rounded-md border border-slate-100"> 
            <h4 className="text-sm font-bold text-slate-700 mb-2">Login Credentials</h4>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-600">Username</label>
                    <input type="text" name="username" value={formData.username || ''} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-600">Password</label>
                    <input type="password" name="password" value={formData.password || ''} onChange={handleChange} className={inputClass} placeholder="Leave blank to keep unchanged" />
                </div>
            </div>
             <p className="text-xs text-slate-500 mt-2">Set a username and password for this entity to log in to their dashboard.</p>
        </div>
    );

    const renderSupplierForm = () => (
        <>
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-600">Supply Capacity (u/day)</label>
                    <input type="number" name="supplyCapacity" value={formData.supplyCapacity || ''} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600">Average Delay (hrs)</label>
                    <input type="number" step="0.5" name="averageDelayHours" value={formData.averageDelayHours || ''} onChange={handleChange} className={inputClass} />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-600">Materials Supplied (Item IDs)</label>
                <textarea name="materialsSupplied" value={stringLists.materialsSupplied} onChange={handleChange} rows={2} className={inputClass} placeholder="item-eb, item-ch, etc."></textarea>
                <p className="text-xs text-slate-500 mt-1">Enter a comma-separated list of Item IDs supplied.</p>
            </div>
            {renderCredentialsForm()}
        </>
    );

    const renderWarehouseForm = () => (
        <>
             <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Inventory Details</label>
                 <div className="space-y-2 max-h-40 overflow-y-auto pr-2 bg-slate-50 p-2 rounded-md border border-slate-100"> 
                    {storageItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <input type="text" placeholder="Item ID" value={item.itemId} onChange={(e) => handleStorageChange(index, 'itemId', e.currentTarget.value)} className={inputClass} />
                            <input type="text" placeholder="Item Name" value={item.itemName} onChange={(e) => handleStorageChange(index, 'itemName', e.currentTarget.value)} className={inputClass} />
                            <input type="number" placeholder="Quantity" value={item.quantity} onChange={(e) => handleStorageChange(index, 'quantity', parseInt(e.currentTarget.value))} className={`${inputClass} w-32`} />
                            <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-rose-500 hover:bg-rose-100 rounded-md">&times;</button> 
                        </div>
                    ))}
                </div>
                <button type="button" onClick={handleAddItem} className="mt-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700">+ Add Item</button> 
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-600">Connected Suppliers</label>
                 <select multiple value={selectedSuppliers} onChange={(e) => handleMultiSelectChange(e, setSelectedSuppliers)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-300 focus:ring-sky-300/50 h-28"> 
                     {company.data.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple.</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-600">Connected Customers</label>
                 <select multiple value={selectedCustomers} onChange={(e) => handleMultiSelectChange(e, setSelectedCustomers)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-300 focus:ring-sky-300/50 h-28"> 
                     {company.data.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple.</p>
            </div>
            {renderCredentialsForm()}
        </>
    );

    const renderCustomerForm = () => (
        <>
             <div>
                <label className="block text-sm font-medium text-slate-600">Daily Demand (u/day)</label>
                <input type="number" name="demand" value={formData.demand || ''} onChange={handleChange} className={inputClass} />
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-600">Item Requirements</label>
                <textarea name="requirements" value={stringLists.requirements} onChange={handleChange} rows={2} className={inputClass} placeholder="Engine Blocks, Microchips, etc."></textarea>
                 <p className="text-xs text-slate-500 mt-1">Enter a comma-separated list of required items.</p>
            </div>
            {renderCredentialsForm()}
        </>
    );


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-slate-800">{title}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600">Name</label>
                        <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required className={inputClass} />
                    </div>
                    {nodeType === 'supplier' && renderSupplierForm()}
                    {nodeType === 'warehouse' && renderWarehouseForm()}
                    {nodeType === 'customer' && renderCustomerForm()}
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300">Cancel</button>
                        <button type="submit" className="py-2 px-4 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600">Save</button> 
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NodeModal;
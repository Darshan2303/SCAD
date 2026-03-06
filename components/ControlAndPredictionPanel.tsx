

import React, { useMemo, useState } from 'react';
import type { Company, Warehouse, CostMetric, Transport, CurrentUser } from '../types';
import { SupplierIcon, WarehouseIcon, CustomerIcon, TruckIcon, EditIcon } from './Icons';
// FIX: Updated import for PredictionPanel to correctly reference its default export.
import PredictionPanel from './PredictionPanel';
import PersonnelModal from './PersonnelModal';

interface ControlAndPredictionPanelProps {
  company: Company;
  dispatch: React.Dispatch<any>;
  currentUser: CurrentUser;
}

const PersonnelManager: React.FC<{ company: Company, dispatch: React.Dispatch<any> }> = ({ company, dispatch }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPersonnel, setSelectedPersonnel] = useState<Transport | null>(null);

    const handleEdit = (personnel: Transport) => {
        setSelectedPersonnel(personnel);
        setIsModalOpen(true);
    };

    const handleSubmit = (transportData: Transport) => {
        dispatch({ type: 'UPDATE_TRANSPORT_NODE', payload: { companyId: company.id, transportData } });
        setIsModalOpen(false);
        setSelectedPersonnel(null);
    };

    return (
        <>
            <div className="space-y-4 md:col-span-2">
                <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2 tracking-tight"><TruckIcon className="w-6 h-6 text-slate-700" /> Transport Personnel</h4> 
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm"> 
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {company.data.transportPersonnel.map(person => (
                            <div key={person.id} className="bg-slate-50 p-3 rounded-md border border-slate-200 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-slate-800">{person.name}</p>
                                    <p className="text-xs text-slate-500 font-mono">{person.username}</p>
                                </div>
                                <button onClick={() => handleEdit(person)} className="p-2 rounded-md hover:bg-slate-200">
                                    <EditIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {isModalOpen && selectedPersonnel && (
                <PersonnelModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleSubmit}
                    initialData={selectedPersonnel}
                />
            )}
        </>
    );
};

const ControlAndPredictionPanel: React.FC<ControlAndPredictionPanelProps> = ({ company, dispatch, currentUser }) => {
    
    const onUpdate = (updatedData: Partial<Company['data']>) => {
        dispatch({
            type: 'UPDATE_COMPANY_DATA',
            payload: { companyId: company.id, updatedData }
        });
    };
    
    const handleWarehouseChange = (id: string, field: string, value: any) => {
        const updatedWarehouses = company.data.warehouses.map(wh => {
            if (wh.id !== id) return wh;
            
            const newWh = structuredClone(wh);
            const parts = field.split('.');
            if (parts.length === 2) {
                const [category, subField] = parts;
                if(category === 'efficiency' && subField in newWh.efficiency) (newWh.efficiency as any)[subField] = value;
                if(category === 'workforce' && subField in newWh.workforce) (newWh.workforce as any)[subField] = value;
                if(category === 'cost' && subField in newWh.metrics.costPerOrder) (newWh.metrics.costPerOrder as any)[subField] = value;
            } else if (field in newWh) (newWh as any)[field] = value;
            return newWh;
        });
        onUpdate({ warehouses: updatedWarehouses });
    };

    const handleSupplierChange = (id: string, field: string, value: any) => {
        const updatedSuppliers = company.data.suppliers.map(s => s.id === id ? { ...s, [field]: value } : s );
        onUpdate({ suppliers: updatedSuppliers });
    };

    const handleCustomerChange = (id: string, value: any) => {
        const updatedCustomers = company.data.customers.map(c => c.id === id ? { ...c, demand: value } : c );
        onUpdate({ customers: updatedCustomers });
    };

    const sliderClass = `w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer 
        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
        [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md 
        [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-sky-400 
        [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-white 
        [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-2 
        [&::-moz-range-thumb]:border-sky-400`; 
    const inputClass = "mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-300 focus:ring-sky-300/50 sm:text-sm"; 


    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            <div className="md:col-span-2 lg:col-span-2 bg-slate-50 p-6 rounded-xl border border-slate-100"> 
                <h3 className="text-2xl font-bold text-slate-800 mb-1 tracking-tight">Live Network Controls</h3> 
                <p className="text-slate-600 max-w-2xl">Adjust parameters below to simulate changes and see their impact across the dashboard in real-time. This is a powerful way to conduct 'what-if' analysis.</p> 
            </div>
            
            <div className="space-y-4">
                <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2 tracking-tight"><WarehouseIcon className="w-6 h-6 text-amber-600"/> Warehouses</h4> 
                {company.data.warehouses.map(wh => (
                    <div key={wh.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm"> 
                        <strong className="font-bold text-slate-700">{wh.name}</strong>
                        <div className="mt-2 space-y-3">
                            <div>
                                <div className="flex justify-between items-center text-sm"><label className="font-medium text-slate-600">Inventory Level</label><span className="font-mono font-semibold text-emerald-600">{wh.inventoryLevel.toLocaleString()} units</span></div>
                                <input type="range" min="5000" max="50000" step="500" value={wh.inventoryLevel} onChange={(e) => handleWarehouseChange(wh.id, 'inventoryLevel', parseInt(e.target.value))} className={sliderClass}/>
                            </div>
                             <div>
                                <div className="flex justify-between items-center text-sm"><label className="font-medium text-slate-600">Active Workforce</label><span className="font-mono font-semibold text-emerald-600">{wh.workforce.active}</span></div>
                                <input type="range" min="0" max="200" step="1" value={wh.workforce.active} onChange={(e) => handleWarehouseChange(wh.id, 'workforce.active', parseInt(e.target.value))} className={sliderClass}/>
                            </div>
                             <div>
                                <div className="flex justify-between items-center text-sm"><label className="font-medium text-slate-600">Picks per Hour</label><span className="font-mono font-semibold text-emerald-600">{wh.efficiency.picksPerHour}</span></div>
                                <input type="range" min="0" max="100" step="1" value={wh.efficiency.picksPerHour} onChange={(e) => handleWarehouseChange(wh.id, 'efficiency.picksPerHour', parseInt(e.target.value))} className={sliderClass}/>
                            </div>
                             <div className="grid grid-cols-3 gap-2">
                                <div><label className="block text-xs font-medium text-slate-500">Labor Cost</label><input type="number" value={wh.metrics.costPerOrder.labor} onChange={(e) => handleWarehouseChange(wh.id, 'cost.labor', parseInt(e.target.value))} className={inputClass} /></div>
                                <div><label className="block text-xs font-medium text-slate-500">Packaging</label><input type="number" value={wh.metrics.costPerOrder.packaging} onChange={(e) => handleWarehouseChange(wh.id, 'cost.packaging', parseInt(e.target.value))} className={inputClass} /></div>
                                <div><label className="block text-xs font-medium text-slate-500">Shipping</label><input type="number" value={wh.metrics.costPerOrder.shipping} onChange={(e) => handleWarehouseChange(wh.id, 'cost.shipping', parseInt(e.target.value))} className={inputClass} /></div>
                             </div>
                        </div>
                        <PredictionPanel warehouse={wh} company={company} />
                    </div>
                ))}
            </div>
            
            <div className="space-y-4">
                <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2 tracking-tight"><SupplierIcon className="w-6 h-6 text-sky-600" /> Suppliers</h4> 
                {company.data.suppliers.map(sup => (
                    <div key={sup.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm"> 
                        <strong className="font-bold text-slate-700">{sup.name}</strong>
                        <div className="mt-2 space-y-2">
                            <div className="flex justify-between items-center text-sm"><label className="font-medium text-slate-600">Average Delay</label><span className="font-mono font-semibold text-emerald-600">{sup.averageDelayHours.toFixed(1)} hrs</span></div>
                            <input type="range" min="0" max="24" step="0.5" value={sup.averageDelayHours} onChange={(e) => handleSupplierChange(sup.id, 'averageDelayHours', parseFloat(e.target.value))} className={sliderClass} />
                        </div>
                         <div className="mt-4 space-y-2">
                            <div className="flex justify-between items-center text-sm"><label className="font-medium text-slate-600">Supply Capacity</label><span className="font-mono font-semibold text-emerald-600">{sup.supplyCapacity.toLocaleString()} u/day</span></div>
                            <input type="range" min="1000" max="15000" step="100" value={sup.supplyCapacity} onChange={(e) => handleSupplierChange(sup.id, 'supplyCapacity', parseInt(e.target.value))} className={sliderClass} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="space-y-4 md:col-span-2">
                <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2 tracking-tight"><CustomerIcon className="w-6 h-6 text-violet-600" /> Customers</h4> 
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {company.data.customers.map(cust => (
                        <div key={cust.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm"> 
                            <strong className="font-bold text-slate-700">{cust.name}</strong>
                            <div className="mt-2 space-y-2">
                                <div className="flex justify-between items-center text-sm"><label className="font-medium text-slate-600">Daily Demand</label><span className="font-mono font-semibold text-emerald-600">{cust.demand.toLocaleString()} u/day</span></div>
                                <input type="range" min="1000" max="15000" step="100" value={cust.demand} onChange={(e) => handleCustomerChange(cust.id, parseInt(e.target.value))} className={sliderClass} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {currentUser?.role === 'admin' && <PersonnelManager company={company} dispatch={dispatch} />}
        </div>
    );
};

export default ControlAndPredictionPanel;
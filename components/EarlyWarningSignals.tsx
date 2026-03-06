

import React, { useState, useMemo } from 'react';
import type { Company } from '../types';
import { AlertTriangleIcon, CheckCircleIcon } from './Icons';
import type { DetailedForecast } from './ForecastView'; 

interface EarlyWarningSignalsProps {
  company: Company;
  forecastData: DetailedForecast[];
}

const sliderClass = `w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer 
    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
    [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md 
    [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-sky-400 
    [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-white 
    [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-2 
    [&::-moz-range-thumb]:border-sky-400`; 

const EarlyWarningSignals: React.FC<EarlyWarningSignalsProps> = ({ company, forecastData }) => {
    const [varianceThreshold, setVarianceThreshold] = useState(2); // days
    const [depletionThreshold, setDepletionThreshold] = useState(14); // days

    const alerts = useMemo(() => {
        const supplierAlerts = company.data.suppliers
            .filter(s => s.deliveryTimeVariance > varianceThreshold)
            .map(s => ({
                id: s.id,
                name: s.name,
                type: 'Supplier Variance',
                message: `High delivery time variance: ${s.deliveryTimeVariance.toFixed(1)} days (threshold: ${varianceThreshold} days)`,
            }));

        const inventoryAlerts: { id: string; name: string; type: string; message: string }[] = [];
        forecastData.forEach(warehouseForecast => {
            warehouseForecast.itemForecasts.forEach(itemForecast => {
                const stockout = itemForecast.data.find(d => d.inventory === 0);
                if (stockout && stockout.day <= depletionThreshold) {
                    inventoryAlerts.push({
                        id: `${warehouseForecast.warehouseId}-${itemForecast.itemName}`,
                        name: `${warehouseForecast.warehouseName} - ${itemForecast.itemName}`,
                        type: 'Inventory Depletion',
                        message: `Projected to stock out in ${stockout.day} days (threshold: ${depletionThreshold} days)`,
                    });
                }
            });
        });

        return [...supplierAlerts, ...inventoryAlerts];
    }, [company.data.suppliers, forecastData, varianceThreshold, depletionThreshold]);

    return (
        <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 shadow-inner mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6"> 
            <div className="lg:col-span-1">
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Early Warning Signals</h3> 
                <p className="text-sm text-slate-600 mt-1">Configure thresholds to detect leading indicators of risk.</p> 
                <div className="mt-4 space-y-4">
                    <div>
                        <div className="flex justify-between items-center text-sm">
                            <label className="font-medium text-slate-600">Delivery Variance Threshold</label> 
                            <span className="font-mono font-semibold text-sky-600">{varianceThreshold.toFixed(1)} days</span>
                        </div>
                        <input
                            type="range"
                            min="0.5"
                            max="7"
                            step="0.5"
                            value={varianceThreshold}
                            onChange={(e) => setVarianceThreshold(parseFloat(e.target.value))}
                            className={sliderClass}
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center text-sm">
                            <label className="font-medium text-slate-600">Inventory Depletion Threshold</label> 
                            <span className="font-mono font-semibold text-sky-600">{depletionThreshold} days</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="30"
                            step="1"
                            value={depletionThreshold}
                            onChange={(e) => setDepletionThreshold(parseInt(e.target.value))}
                            className={sliderClass}
                        />
                    </div>
                </div>
            </div>
            <div className="lg:col-span-2 bg-white p-4 rounded-lg border border-slate-100"> 
                 <h4 className="font-semibold text-slate-700 mb-3">Active Alerts</h4>
                 {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center h-full text-emerald-700 p-4 bg-emerald-50/70 rounded-md"> 
                        <CheckCircleIcon className="w-10 h-10 mb-2" />
                        <p className="font-semibold">All systems normal.</p>
                        <p className="text-sm">No early warnings detected based on current thresholds.</p>
                    </div>
                 ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {alerts.map(alert => (
                            <div key={alert.id} className="p-3 bg-rose-100/80 rounded-md border border-rose-200/80 flex items-start gap-3"> 
                                <AlertTriangleIcon className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" /> 
                                <div>
                                    <p className="font-bold text-sm text-rose-800">{alert.name} <span className="font-medium opacity-70">({alert.type})</span></p> 
                                    <p className="text-xs text-rose-700">{alert.message}</p> 
                                </div>
                            </div>
                        ))}
                    </div>
                 )}
            </div>
        </div>
    );
};

export default EarlyWarningSignals;